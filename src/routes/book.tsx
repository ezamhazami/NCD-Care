import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — NCD Care Malaysia" },
      { name: "description", content: "Book NCD appointments at Malaysian government and private clinics." },
    ],
  }),
  component: BookPage,
});

const CONCERNS = ["Diabetes check", "Hypertension follow-up", "Cholesterol screening", "General NCD", "Heart risk assessment"];

interface Doctor {
  id: string;
  name: string;
  clinic: string;
  type: "gov" | "private";
  specialty: string;
  rating: number;
  price: string;
  availability: string;
}
const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Siti Aminah Binti Yusof", clinic: "Klinik Kesihatan Chow Kit", type: "gov", specialty: "Family Medicine", rating: 4.8, price: "FREE", availability: "Tomorrow 9AM" },
  { id: "d2", name: "Dr. Rajesh Kumar", clinic: "Klinik Pakar Mediviron PJ", type: "private", specialty: "Internal Medicine", rating: 4.7, price: "RM 80", availability: "3 slots left today" },
  { id: "d3", name: "Dr. Lim Wei Ling", clinic: "Columbia Asia Hospital PJ", type: "private", specialty: "Endocrinology", rating: 4.9, price: "RM 150", availability: "Next: Thursday" },
];

const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"];
const REASONS = ["First visit", "Follow-up", "Lab result review", "Medication refill", "Urgent concern"];

function BookPage() {
  const { addAppointment } = useStore();
  const [step, setStep] = useState(1);
  const [concern, setConcern] = useState("");
  const [filter, setFilter] = useState<"all" | "gov" | "private" | "today">("all");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("Follow-up");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const filteredDoctors = DOCTORS.filter(d =>
    filter === "all" ? true :
    filter === "gov" ? d.type === "gov" :
    filter === "private" ? d.type === "private" :
    d.availability.toLowerCase().includes("today")
  );

  const checklist = (() => {
    const c = concern.toLowerCase();
    if (c.includes("diabetes")) return ["Fast 8 hours before the visit", "Bring your glucose log", "Note any symptoms (thirst, fatigue)"];
    if (c.includes("hypertension")) return ["Avoid caffeine 30 min before", "Sit quietly 5 min before BP reading", "Bring your BP log"];
    if (c.includes("cholesterol")) return ["Fast 9–12 hours before lab draw", "Bring previous lipid profile if any"];
    if (c.includes("heart")) return ["Avoid heavy meal beforehand", "Wear loose top for ECG"];
    return ["Bring NRIC and existing prescriptions", "Note your top 3 questions"];
  })();

  const confirm = () => {
    if (!doctor || !time) return;
    const created = addAppointment({
      doctor: doctor.name, clinic: doctor.clinic, type: doctor.type, specialty: doctor.specialty,
      date, time, reason, concern, status: "upcoming",
    });
    setBookingId(created.id);
    toast.success("Appointment booked!");
  };

  if (bookingId) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
          <div className="h-14 w-14 rounded-full bg-success text-success-foreground grid place-items-center mx-auto">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold mt-3">Booking Confirmed</h2>
          <p className="text-sm text-muted-foreground mt-1">Booking ID: <span className="font-mono">{bookingId.toUpperCase()}</span></p>
          <div className="text-left mt-5 space-y-2 text-sm bg-card rounded-lg border border-border p-4">
            <Row k="Doctor" v={doctor!.name} />
            <Row k="Clinic" v={doctor!.clinic} />
            <Row k="Date" v={new Date(date).toDateString()} />
            <Row k="Time" v={time} />
            <Row k="Reason" v={reason} />
            <Row k="Concern" v={concern} />
          </div>
          <Link to="/follow-up" className="inline-flex mt-5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm">View my appointments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Book Appointment</h1>
      <Stepper step={step} />

      {step === 1 && (
        <Card title="1. Select your concern">
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map(c => (
              <button key={c} onClick={() => setConcern(c)} className={cn(
                "rounded-full border px-4 py-2 text-sm",
                concern === c ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"
              )}>{c}</button>
            ))}
          </div>
          <NavBtns canNext={!!concern} onNext={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card title="2. Choose doctor / clinic">
          <div className="flex flex-wrap gap-2 mb-3">
            {(["all", "gov", "private", "today"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "rounded-full border px-3 py-1.5 text-xs capitalize",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border"
              )}>{f === "gov" ? "Government" : f === "today" ? "Available Today" : f}</button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredDoctors.map(d => (
              <button key={d.id} onClick={() => setDoctor(d)} className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                doctor?.id === d.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.clinic} · {d.specialty}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" /> {d.rating} · {d.availability}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                      d.type === "gov" ? "bg-success/15 text-success" : "bg-accent text-accent-foreground")}>
                      {d.type === "gov" ? "Gov" : "Private"}
                    </div>
                    <div className="text-sm font-semibold mt-1">{d.price}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <NavBtns canBack onBack={() => setStep(1)} canNext={!!doctor} onNext={() => setStep(3)} />
        </Card>
      )}

      {step === 3 && (
        <Card title="3. Pick date & time">
          <label className="block text-sm">
            <div className="text-xs text-muted-foreground mb-1">Date</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">Time</div>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(t => (
                <button key={t} onClick={() => setTime(t)} className={cn(
                  "rounded-md border px-3 py-1.5 text-sm",
                  time === t ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"
                )}>{t}</button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1">Reason</div>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <NavBtns canBack onBack={() => setStep(2)} canNext={!!time} onNext={() => setStep(4)} />
        </Card>
      )}

      {step === 4 && doctor && (
        <Card title="4. Confirm & summary">
          <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
            <Row k="Concern" v={concern} />
            <Row k="Doctor" v={doctor.name} />
            <Row k="Clinic" v={doctor.clinic} />
            <Row k="Date" v={new Date(date).toDateString()} />
            <Row k="Time" v={time} />
            <Row k="Reason" v={reason} />
            <Row k="Fee" v={doctor.price} />
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">📋 Pre-visit checklist</div>
            <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
              {checklist.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <NavBtns canBack onBack={() => setStep(3)} confirmLabel="Confirm Booking" onConfirm={confirm} />
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const total = 4;
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function NavBtns({ canBack, onBack, canNext, onNext, confirmLabel, onConfirm }: {
  canBack?: boolean; onBack?: () => void; canNext?: boolean; onNext?: () => void;
  confirmLabel?: string; onConfirm?: () => void;
}) {
  return (
    <div className="flex justify-between gap-2 mt-5">
      {canBack ? <button onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm">Back</button> : <div />}
      {confirmLabel ? (
        <button onClick={onConfirm} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">{confirmLabel}</button>
      ) : (
        <button onClick={onNext} disabled={!canNext} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">Next</button>
      )}
    </div>
  );
}
