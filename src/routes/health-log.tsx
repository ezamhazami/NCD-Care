import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, Reading, bpStatus, hba1cStatus, totalCholStatus, bmiStatus, glucoseStatus, statusColors } from "@/lib/store";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/health-log")({
  head: () => ({
    meta: [
      { title: "Health Log — NCD Care Malaysia" },
      { name: "description", content: "Log readings and view 30-day trends with MOH reference bands." },
    ],
  }),
  component: HealthLog,
});

const initial = {
  systolic: "", diastolic: "", glucose: "", glucoseType: "fasting" as "fasting" | "postmeal",
  hba1c: "", totalCholesterol: "", ldl: "", triglycerides: "",
  weight: "", height: "169", waist: "",
  date: new Date().toISOString().slice(0, 16),
};

type Metric = "bp" | "glucose" | "hba1c" | "weight" | "totalCholesterol";

function HealthLog() {
  const { readings, addReading } = useStore();
  const [form, setForm] = useState(initial);
  const [metric, setMetric] = useState<Metric>("bp");
  const [scanning, setScanning] = useState(false);

  const scanDevice = () => {
    setScanning(true);
    setTimeout(() => {
      // Simulated OCR from a home BP/glucose monitor
      const sys = 138 + Math.floor(Math.random() * 8);
      const dia = 86 + Math.floor(Math.random() * 6);
      const glu = (6.8 + Math.random() * 1.2).toFixed(1);
      const wt = (77 + Math.random() * 2).toFixed(1);
      const waist = 92 + Math.floor(Math.random() * 4);
      setForm(f => ({
        ...f,
        systolic: String(sys),
        diastolic: String(dia),
        glucose: glu,
        glucoseType: "fasting",
        weight: wt,
        height: "169",
        waist: String(waist),
      }));
      setScanning(false);
      toast.success("Scan complete — values filled from device");
    }, 1400);
  };


  const bmi = form.weight && form.height ? +(+form.weight / Math.pow(+form.height / 100, 2)).toFixed(1) : null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r: any = { date: new Date(form.date).toISOString() };
    const num = (s: string) => s === "" ? undefined : Number(s);
    r.systolic = num(form.systolic); r.diastolic = num(form.diastolic);
    r.glucose = num(form.glucose); r.glucoseType = form.glucoseType;
    r.hba1c = num(form.hba1c);
    r.totalCholesterol = num(form.totalCholesterol);
    r.ldl = num(form.ldl); r.triglycerides = num(form.triglycerides);
    r.weight = num(form.weight); r.height = num(form.height);
    r.waist = num(form.waist);
    if (bmi) r.bmi = bmi;
    Object.keys(r).forEach(k => r[k] === undefined && delete r[k]);
    addReading(r);
    toast.success("Reading saved");
    setForm(initial);
  };

  const last10 = [...readings].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 10);

  const chartData = useMemo(() => {
    return [...readings].sort((a, b) => +new Date(a.date) - +new Date(b.date)).map(r => ({
      day: new Date(r.date).toLocaleDateString("en-MY", { day: "numeric", month: "short" }),
      systolic: r.systolic, diastolic: r.diastolic,
      glucose: r.glucose, hba1c: r.hba1c,
      weight: r.weight, totalCholesterol: r.totalCholesterol,
    }));
  }, [readings]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Health Log</h1>

      <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Log a new reading</h2>
          <button
            type="button"
            onClick={scanDevice}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/15 disabled:opacity-60"
            title="Scan device display with camera"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Scan device"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Systolic (mmHg)" v={form.systolic} on={v => setForm({...form, systolic: v})} type="number" />
          <Input label="Diastolic (mmHg)" v={form.diastolic} on={v => setForm({...form, diastolic: v})} type="number" />
          <Input label="Glucose (mmol/L)" v={form.glucose} on={v => setForm({...form, glucose: v})} type="number" step="0.1" />
          <label className="text-sm">
            <div className="text-xs text-muted-foreground mb-1">Glucose type</div>
            <select value={form.glucoseType} onChange={e => setForm({...form, glucoseType: e.target.value as any})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="fasting">Fasting</option>
              <option value="postmeal">Post-meal (2hr)</option>
            </select>
          </label>
          <Input label="HbA1c (%)" v={form.hba1c} on={v => setForm({...form, hba1c: v})} type="number" step="0.1" />
          <Input label="Total Chol (mmol/L)" v={form.totalCholesterol} on={v => setForm({...form, totalCholesterol: v})} type="number" step="0.1" />
          <Input label="LDL-C (mmol/L)" v={form.ldl} on={v => setForm({...form, ldl: v})} type="number" step="0.1" />
          <Input label="Triglycerides (mmol/L)" v={form.triglycerides} on={v => setForm({...form, triglycerides: v})} type="number" step="0.1" />
          <Input label="Weight (kg)" v={form.weight} on={v => setForm({...form, weight: v})} type="number" step="0.1" />
          <Input label="Height (cm)" v={form.height} on={v => setForm({...form, height: v})} type="number" />
          <Input label="Waist (cm)" v={form.waist} on={v => setForm({...form, waist: v})} type="number" />
          <label className="text-sm">
            <div className="text-xs text-muted-foreground mb-1">Date/time</div>
            <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        {bmi && <div className="text-sm">Auto BMI: <span className="font-medium">{bmi}</span></div>}
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Save Reading</button>
      </form>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Trend (last 30 days)</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {([
            ["bp", "Blood Pressure"],
            ["glucose", "Glucose"],
            ["hba1c", "HbA1c"],
            ["totalCholesterol", "Cholesterol"],
            ["weight", "Weight"],
          ] as [Metric, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setMetric(k)} className={cn(
              "text-xs rounded-full border px-3 py-1.5",
              metric === k ? "bg-primary text-primary-foreground border-primary" : "border-border"
            )}>{l}</button>
          ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.9 0.01 220)" strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} interval={4} />
              <YAxis fontSize={10} domain={getDomain(metric)} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: 12 }} />
              {getBands(metric)}
              {metric === "bp" && <>
                <Line type="monotone" dataKey="systolic" stroke="oklch(0.55 0.12 200)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="diastolic" stroke="oklch(0.6 0.22 25)" strokeWidth={2} dot={false} />
              </>}
              {metric === "glucose" && <Line type="monotone" dataKey="glucose" stroke="oklch(0.55 0.12 200)" strokeWidth={2} dot={false} />}
              {metric === "hba1c" && <Line type="monotone" dataKey="hba1c" stroke="oklch(0.55 0.12 200)" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
              {metric === "totalCholesterol" && <Line type="monotone" dataKey="totalCholesterol" stroke="oklch(0.55 0.12 200)" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
              {metric === "weight" && <Line type="monotone" dataKey="weight" stroke="oklch(0.55 0.12 200)" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Recent readings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">BP</th>
                <th className="text-left p-2">Glucose</th>
                <th className="text-left p-2">HbA1c</th>
                <th className="text-left p-2">Total Chol</th>
                <th className="text-left p-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {last10.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2 text-xs">{new Date(r.date).toLocaleDateString("en-MY")}</td>
                  <td className="p-2">{r.systolic && r.diastolic ? <Pill status={bpStatus(r.systolic, r.diastolic).status}>{r.systolic}/{r.diastolic}</Pill> : "—"}</td>
                  <td className="p-2">{r.glucose ? <Pill status={glucoseStatus(r.glucose, r.glucoseType ?? "fasting").status}>{r.glucose}</Pill> : "—"}</td>
                  <td className="p-2">{r.hba1c ? <Pill status={hba1cStatus(r.hba1c).status}>{r.hba1c}%</Pill> : "—"}</td>
                  <td className="p-2">{r.totalCholesterol ? <Pill status={totalCholStatus(r.totalCholesterol).status}>{r.totalCholesterol}</Pill> : "—"}</td>
                  <td className="p-2">{r.weight ? `${r.weight} kg` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Pill({ status, children }: { status: any; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusColors(status))}>{children}</span>;
}

function Input({ label, v, on, type, step }: { label: string; v: string; on: (s: string) => void; type?: string; step?: string }) {
  return (
    <label className="text-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <input type={type ?? "text"} step={step} value={v} onChange={e => on(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </label>
  );
}

function getDomain(m: Metric): [number, number] {
  if (m === "bp") return [60, 180];
  if (m === "glucose") return [4, 12];
  if (m === "hba1c") return [4, 10];
  if (m === "totalCholesterol") return [3, 8];
  return [60, 100];
}

function getBands(m: Metric) {
  const g = "oklch(0.68 0.16 155 / 12%)";
  const a = "oklch(0.78 0.16 75 / 14%)";
  const r = "oklch(0.6 0.22 25 / 12%)";
  if (m === "bp") return <>
    <ReferenceArea y1={0} y2={130} fill={g} ifOverflow="hidden" />
    <ReferenceArea y1={130} y2={140} fill={a} ifOverflow="hidden" />
    <ReferenceArea y1={140} y2={200} fill={r} ifOverflow="hidden" />
  </>;
  if (m === "glucose") return <>
    <ReferenceArea y1={0} y2={5.6} fill={g} />
    <ReferenceArea y1={5.6} y2={7} fill={a} />
    <ReferenceArea y1={7} y2={20} fill={r} />
  </>;
  if (m === "hba1c") return <>
    <ReferenceArea y1={0} y2={5.7} fill={g} />
    <ReferenceArea y1={5.7} y2={6.5} fill={a} />
    <ReferenceArea y1={6.5} y2={15} fill={r} />
  </>;
  if (m === "totalCholesterol") return <>
    <ReferenceArea y1={0} y2={5.2} fill={g} />
    <ReferenceArea y1={5.2} y2={6.2} fill={a} />
    <ReferenceArea y1={6.2} y2={10} fill={r} />
  </>;
  return null;
}
