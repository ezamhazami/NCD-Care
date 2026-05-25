import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

interface AIInput {
  mode: "chat" | "jargon" | "risk";
  messages?: { role: "user" | "assistant"; content: string }[];
  term?: string;
  riskInputs?: Record<string, unknown>;
}

const CARABOT_SYSTEM =
  "You are CaraBot, a friendly AI health assistant for Malaysian NCD patients. You help users understand diabetes (thresholds: HbA1c ≥6.5%, FBG ≥7.0 mmol/L), hypertension (Stage 2: ≥140/90 mmHg), and high cholesterol (Total Chol ≥5.2 mmol/L, LDL ≥4.1 mmol/L). You know Malaysian clinical guidelines from MOH Malaysia. Give practical, empathetic advice in simple English. Always recommend seeing a real doctor for serious concerns. Never prescribe specific drug doses. Keep replies under 180 words.";

async function callGateway(body: Record<string, unknown>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway not configured");
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add funds in Settings → Workspace → Usage.");
    throw new Error(`AI error ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

export const aiCall = createServerFn({ method: "POST" })
  .inputValidator((d: AIInput) => d)
  .handler(async ({ data }) => {
    if (data.mode === "chat") {
      const json = await callGateway({
        model: MODEL,
        max_tokens: 500,
        messages: [
          { role: "system", content: CARABOT_SYSTEM },
          ...(data.messages ?? []),
        ],
      });
      return { text: json.choices?.[0]?.message?.content ?? "" };
    }

    if (data.mode === "jargon") {
      const json = await callGateway({
        model: MODEL,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly Malaysian health assistant. Explain medical terms in simple English a patient with no medical background understands. Keep it under 80 words. Always include one practical example.",
          },
          { role: "user", content: `Explain: ${data.term}` },
        ],
      });
      return { text: json.choices?.[0]?.message?.content ?? "" };
    }

    if (data.mode === "risk") {
      const json = await callGateway({
        model: MODEL,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are a clinical risk assessment tool following Malaysian MOH and Framingham Risk Score guidelines.",
          },
          {
            role: "user",
            content: `Assess this patient's 10-year risk for diabetes, hypertension, and high cholesterol. Patient: ${JSON.stringify(data.riskInputs)}.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "risk_assessment",
              description: "Return a structured 10-year NCD risk assessment.",
              parameters: {
                type: "object",
                properties: {
                  diabetes: {
                    type: "object",
                    properties: {
                      risk: { type: "string", enum: ["Low", "Moderate", "High"] },
                      reason: { type: "string" },
                      tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
                    },
                    required: ["risk", "reason", "tips"],
                  },
                  hypertension: {
                    type: "object",
                    properties: {
                      risk: { type: "string", enum: ["Low", "Moderate", "High"] },
                      reason: { type: "string" },
                      tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
                    },
                    required: ["risk", "reason", "tips"],
                  },
                  cholesterol: {
                    type: "object",
                    properties: {
                      risk: { type: "string", enum: ["Low", "Moderate", "High"] },
                      reason: { type: "string" },
                      tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
                    },
                    required: ["risk", "reason", "tips"],
                  },
                },
                required: ["diabetes", "hypertension", "cholesterol"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "risk_assessment" } },
      });

      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (call?.function?.arguments) {
        try {
          return { result: JSON.parse(call.function.arguments) };
        } catch {
          return { result: null, raw: call.function.arguments };
        }
      }
      return { result: null, raw: json.choices?.[0]?.message?.content };
    }

    throw new Error("Unknown mode");
  });
