import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { aiCall } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Disease — NCD Care Malaysia" },
      { name: "description", content: "Learn about diabetes, hypertension, and high cholesterol with MOH reference tables." },
    ],
  }),
  component: Discover,
});

interface Disease {
  key: string;
  title: string;
  emoji: string;
  what: string;
  table: { headers: string[]; rows: string[][] };
  note?: string;
  symptoms: string[];
  risks: string[];
  tips: string[];
}

const DISEASES: Disease[] = [
  {
    key: "diabetes",
    title: "Diabetes (Type 2)",
    emoji: "🩸",
    what: "A chronic condition where the body cannot use insulin properly, causing high blood glucose. Common among Malaysian adults — over 1 in 5 has diabetes.",
    table: {
      headers: ["Test", "Normal", "Prediabetes", "Diabetes"],
      rows: [
        ["HbA1c", "<5.7%", "5.7–6.4%", "≥6.5%"],
        ["Fasting Blood Glucose", "<5.6 mmol/L", "5.6–6.9 mmol/L", "≥7.0 mmol/L"],
        ["Post-meal (2hr) Glucose", "<7.8 mmol/L", "7.8–11.0 mmol/L", "≥11.1 mmol/L"],
      ],
    },
    symptoms: ["Frequent urination", "Excessive thirst", "Unexplained weight loss", "Blurred vision", "Slow-healing wounds"],
    risks: ["Family history", "BMI ≥23 (Asian)", "Sedentary lifestyle", "Age ≥40", "High blood pressure"],
    tips: ["Choose brown rice over white rice", "Walk 30 min/day", "Limit kuih and sweet drinks", "Take medications consistently"],
  },
  {
    key: "hypertension",
    title: "Hypertension (High BP)",
    emoji: "❤️",
    what: "Sustained high blood pressure that damages arteries over time. Often silent — only diagnosed through regular checks.",
    table: {
      headers: ["Stage", "Systolic", "Diastolic"],
      rows: [
        ["Normal", "<130", "<80"],
        ["Stage 1", "130–139", "80–89"],
        ["Stage 2", "≥140", "≥90"],
      ],
    },
    note: "Diagnosis requires elevated readings at 2 separate clinic visits.",
    symptoms: ["Usually none", "Sometimes: headaches, dizziness, nosebleeds (severe cases)"],
    risks: ["High salt intake", "Obesity", "Smoking", "Alcohol", "Stress", "Family history"],
    tips: ["Reduce salt (<5g/day)", "Limit processed foods", "Exercise 150 min/week", "Sleep 7–8 hours"],
  },
  {
    key: "cholesterol",
    title: "High Cholesterol",
    emoji: "🧈",
    what: "Excess cholesterol — especially LDL — builds up in blood vessels, raising heart attack and stroke risk.",
    table: {
      headers: ["Marker", "Target", "High"],
      rows: [
        ["Total Cholesterol", "<5.2 mmol/L", "≥5.2 mmol/L"],
        ["LDL-C (general)", "<4.1 mmol/L", "≥4.1 mmol/L"],
        ["LDL-C (with diabetes)", "<1.4 mmol/L", "higher"],
        ["Triglycerides", "<1.7 mmol/L", "≥1.7 mmol/L"],
      ],
    },
    note: "LDL targets drop significantly if patient has diabetes or heart disease.",
    symptoms: ["Usually none — diagnosed by blood test"],
    risks: ["Diet high in saturated fat", "Obesity", "Diabetes", "Sedentary lifestyle", "Genetics"],
    tips: ["Eat oats, oily fish, nuts", "Reduce santan & deep-fried food", "Plant sterols", "Statin therapy when prescribed"],
  },
];

const EXAMPLE_TERMS = ["HbA1c", "LDL-C", "Systolic", "Troponin", "ABPM", "FRS Score"];

function Discover() {
  const [open, setOpen] = useState<string | null>("diabetes");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const callAI = useServerFn(aiCall);

  const explain = async (t: string) => {
    if (!t.trim() || loading) return;
    setLoading(true); setAnswer("");
    try {
      const res: any = await callAI({ data: { mode: "jargon", term: t } });
      setAnswer(res.text || "");
    } catch (e: any) {
      toast.error(e.message ?? "AI error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Discover Disease</h1>
        <p className="text-sm text-muted-foreground mt-1">Plain-language guides aligned with Malaysian MOH thresholds.</p>
      </div>

      <div className="space-y-3">
        {DISEASES.map((d) => {
          const isOpen = open === d.key;
          return (
            <div key={d.key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : d.key)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <span className="font-semibold">{d.title}</span>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 space-y-4 border-t border-border">
                  <div>
                    <h3 className="text-sm font-medium mt-3 mb-1">What is it?</h3>
                    <p className="text-sm text-muted-foreground">{d.what}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Diagnostic thresholds</h3>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>{d.table.headers.map(h => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {d.table.rows.map((row, i) => (
                            <tr key={i} className="border-t border-border">
                              {row.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {d.note && <div className="text-xs text-muted-foreground mt-2">ℹ️ {d.note}</div>}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Section title="Symptoms" items={d.symptoms} />
                    <Section title="Risk factors" items={d.risks} />
                    <Section title="Management tips" items={d.tips} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Jargon explainer */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Jargon Explainer</h2>
        <p className="text-sm text-muted-foreground mt-1">Paste any medical term or lab abbreviation and CaraBot will explain it simply.</p>

        <form onSubmit={(e) => { e.preventDefault(); explain(term); }} className="mt-4 flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. HbA1c, LDL-C, Systolic…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button disabled={loading || !term.trim()} className="rounded-md bg-primary text-primary-foreground p-2 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_TERMS.map(t => (
            <button key={t} onClick={() => { setTerm(t); explain(t); }} className="text-xs rounded-full border border-border bg-background hover:bg-accent px-3 py-1.5">
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        )}
        {answer && !loading && (
          <div className="mt-4 rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <div className="text-xs text-primary font-medium mb-1">✨ Explained by CaraBot</div>
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
