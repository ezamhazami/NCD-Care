import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MOCK_USER, useStore, bpStatus, hba1cStatus, totalCholStatus, bmiStatus, waistStatus,
  statusColors, statusDot, Status,
} from "@/lib/store";
import { Activity, Calendar, Bell, MessageSquare, Plus, ShieldAlert } from "lucide-react";
import { RiskPredictor } from "@/components/RiskPredictor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NCD Care Malaysia" },
      { name: "description", content: "Your daily NCD overview with MOH-aligned health status." },
    ],
  }),
  component: Dashboard,
});

interface StatCard {
  title: string;
  value: string;
  unit?: string;
  status: Status;
  label: string;
  subtitle?: string;
}

function StatusCard({ c }: { c: StatCard }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-muted-foreground">{c.title}</div>
        <span className={cn("h-2 w-2 rounded-full mt-1.5", statusDot(c.status))} />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-semibold tabular-nums">{c.value}</div>
        {c.unit && <div className="text-sm text-muted-foreground">{c.unit}</div>}
      </div>
      {c.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{c.subtitle}</div>}
      <div className={cn("mt-3 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", statusColors(c.status))}>
        {c.label}
      </div>
    </div>
  );
}

function Dashboard() {
  const { latest, appointments, meds, doseLog } = useStore();
  const r = latest();
  const [riskOpen, setRiskOpen] = useState(false);

  const bp = bpStatus(r.systolic ?? 142, r.diastolic ?? 90);
  const a1c = hba1cStatus(r.hba1c ?? 7.2);
  const chol = totalCholStatus(r.totalCholesterol ?? 5.9);
  const bmi = bmiStatus(r.bmi ?? 27.4);
  const waist = waistStatus(r.waist ?? 94, MOCK_USER.gender);

  const cards: StatCard[] = [
    { title: "Blood Pressure", value: `${r.systolic ?? 142}/${r.diastolic ?? 90}`, unit: "mmHg", status: bp.status, label: bp.label },
    { title: "HbA1c", value: `${r.hba1c ?? 7.2}`, unit: "%", status: a1c.status, label: a1c.label, subtitle: "Target <7.0%" },
    { title: "Total Cholesterol", value: `${r.totalCholesterol ?? 5.9}`, unit: "mmol/L", status: chol.status, label: chol.label },
    { title: "BMI", value: `${r.bmi ?? 27.4}`, status: bmi.status, label: bmi.label, subtitle: "Asian threshold" },
    { title: "Waist", value: `${r.waist ?? 94}`, unit: "cm", status: waist.status, label: waist.label, subtitle: "Men ≥90cm risk" },
  ];

  const upcoming = appointments.find(a => a.status === "upcoming");

  // today reminders
  const today = new Date().toISOString().slice(0, 10);
  const todayDoses = meds.flatMap(m => m.times.map(t => ({
    medId: m.id, name: m.name, dose: m.dose, time: t,
    taken: !!doseLog.find(d => d.medId === m.id && d.date === today && d.time === t && d.taken),
  })));
  const pending = todayDoses.filter(d => !d.taken).length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Welcome back</div>
        <h1 className="text-2xl md:text-3xl font-semibold mt-1">Salam, {MOCK_USER.name.split(" ")[0]} 👋</h1>
        <div className="text-sm text-muted-foreground mt-1">
          {MOCK_USER.conditions.join(" · ")}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => <StatusCard key={c.title} c={c} />)}
      </div>

      {/* Risk banner */}
      <button
        onClick={() => setRiskOpen(true)}
        className="w-full text-left rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent p-4 hover:from-primary/15 transition-colors flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium">Check My Risk</div>
          <div className="text-sm text-muted-foreground">AI-powered 10-year NCD risk assessment (MOH + Framingham)</div>
        </div>
        <div className="text-sm text-primary font-medium">Start →</div>
      </button>

      {/* Upcoming */}
      {upcoming && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent grid place-items-center text-accent-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Next appointment</div>
                <div className="font-medium">{upcoming.doctor} · {upcoming.time}</div>
                <div className="text-xs text-muted-foreground">{upcoming.clinic} · {new Date(upcoming.date).toDateString()}</div>
              </div>
            </div>
            <Link to="/follow-up" className="text-sm text-primary hover:underline">View →</Link>
          </div>
        </div>
      )}

      {/* Today reminders strip */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Today's reminders</div>
          <Link to="/reminders" className="text-xs text-primary">Manage</Link>
        </div>
        {pending === 0 ? (
          <div className="text-sm text-muted-foreground">All caught up for today 🎉</div>
        ) : (
          <div className="text-sm">
            <span className="font-medium">{pending} pending</span>
            <span className="text-muted-foreground"> · Tap Reminders to mark them done</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/health-log" className="rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors flex items-center gap-3">
          <Plus className="h-5 w-5 text-primary" />
          <div className="font-medium">Log Reading</div>
        </Link>
        <Link to="/book" className="rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div className="font-medium">Book Appointment</div>
        </Link>
        <Link to="/assistant" className="rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div className="font-medium">Ask CaraBot</div>
        </Link>
      </div>

      <RiskPredictor open={riskOpen} onClose={() => setRiskOpen(false)} />
    </div>
  );
}
