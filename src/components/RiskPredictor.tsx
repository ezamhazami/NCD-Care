import { useState } from "react";
import { X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiCall } from "@/lib/ai.functions";
import { MOCK_USER, useStore, statusColors, Status } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RiskResult {
  diabetes: { risk: "Low" | "Moderate" | "High"; reason: string; tips: string[] };
  hypertension: { risk: "Low" | "Moderate" | "High"; reason: string; tips: string[] };
  cholesterol: { risk: "Low" | "Moderate" | "High"; reason: string; tips: string[] };
}

const riskToStatus = (r: "Low" | "Moderate" | "High"): Status =>
  r === "Low" ? "green" : r === "Moderate" ? "amber" : "red";

export function RiskPredictor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { latest } = useStore();
  const r = latest();
  const [form, setForm] = useState({
    age: MOCK_USER.age,
    gender: MOCK_USER.gender,
    ethnicity: MOCK_USER.ethnicity,
    bmi: r.bmi ?? 27.4,
    waist: r.waist ?? 94,
    smoker: "No",
    family: [] as string[],
    exercise: "1-2x/week",
    income: "M40",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const callAI = useServerFn(aiCall);

  if (!open) return null;

  const toggleFamily = (v: string) =>
    setForm(f => ({ ...f, family: f.family.includes(v) ? f.family.filter(x => x !== v) : [...f.family, v] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const res: any = await callAI({ data: { mode: "risk", riskInputs: form } });
      if (res.result) setResult(res.result as RiskResult);
      else toast.error("Could not parse risk result");
    } catch (e: any) {
      toast.error(e.message ?? "AI error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Disease Risk Predictor</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md"><X className="h-5 w-5" /></button>
        </div>

        {!result && (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age">
                <input type="number" value={form.age} onChange={e => setForm({...form, age: +e.target.value})} className="input" />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} className="input">
                  <option>Male</option><option>Female</option>
                </select>
              </Field>
              <Field label="Ethnicity">
                <select value={form.ethnicity} onChange={e => setForm({...form, ethnicity: e.target.value as any})} className="input">
                  <option>Malay</option><option>Chinese</option><option>Indian</option><option>Other</option>
                </select>
              </Field>
              <Field label="BMI">
                <input type="number" step="0.1" value={form.bmi} onChange={e => setForm({...form, bmi: +e.target.value})} className="input" />
              </Field>
              <Field label="Waist (cm)">
                <input type="number" value={form.waist} onChange={e => setForm({...form, waist: +e.target.value})} className="input" />
              </Field>
              <Field label="Smoker">
                <select value={form.smoker} onChange={e => setForm({...form, smoker: e.target.value})} className="input">
                  <option>No</option><option>Yes</option>
                </select>
              </Field>
              <Field label="Exercise">
                <select value={form.exercise} onChange={e => setForm({...form, exercise: e.target.value})} className="input">
                  <option>Never</option><option>1-2x/week</option><option>3+x/week</option>
                </select>
              </Field>
              <Field label="Household income">
                <select value={form.income} onChange={e => setForm({...form, income: e.target.value})} className="input">
                  <option value="B40">B40 (&lt;RM4,849)</option>
                  <option value="M40">M40</option>
                  <option value="T20">T20</option>
                </select>
              </Field>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Family history</div>
              <div className="flex flex-wrap gap-2">
                {["Diabetes", "Hypertension", "Heart disease", "Stroke"].map(v => (
                  <label key={v} className={cn(
                    "text-xs rounded-full border px-3 py-1.5 cursor-pointer",
                    form.family.includes(v) ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  )}>
                    <input type="checkbox" className="hidden" checked={form.family.includes(v)} onChange={() => toggleFamily(v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full rounded-md bg-primary text-primary-foreground py-2.5 font-medium disabled:opacity-60">
              {loading ? "Assessing risk…" : "Assess My Risk"}
            </button>
          </form>
        )}

        {result && (
          <div className="p-5 space-y-3">
            {(["diabetes", "hypertension", "cholesterol"] as const).map(k => {
              const r = result[k];
              const s = riskToStatus(r.risk);
              return (
                <div key={k} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{k}</div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", statusColors(s))}>{r.risk} Risk</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{r.reason}</p>
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                    {r.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              );
            })}
            <button onClick={() => setResult(null)} className="w-full rounded-md border border-border py-2 text-sm">
              Try different inputs
            </button>
          </div>
        )}

        <style>{`.input{width:100%;border:1px solid var(--color-input);background:var(--color-background);border-radius:8px;padding:8px 10px;font-size:14px}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
