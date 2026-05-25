// Mock data + Malaysian MOH NCD thresholds + simple in-memory store
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Status = "green" | "amber" | "red";

export interface Reading {
  id: string;
  date: string; // ISO
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  glucoseType?: "fasting" | "postmeal";
  hba1c?: number;
  totalCholesterol?: number;
  ldl?: number;
  triglycerides?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  waist?: number;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  times: string[]; // ["08:00", "20:00"]
}

export interface MedDoseLog {
  id: string;
  medId: string;
  date: string; // YYYY-MM-DD
  time: string;
  taken: boolean;
}

export interface Appointment {
  id: string;
  doctor: string;
  clinic: string;
  type: "gov" | "private";
  specialty: string;
  date: string; // ISO date
  time: string;
  reason: string;
  concern: string;
  status: "upcoming" | "completed" | "cancelled";
  notes?: {
    diagnosis: string;
    result: string;
    plan: string;
    nextFollowUp: string;
  };
}

// ---- THRESHOLDS (Malaysian MOH) ----
export function bpStatus(sys: number, dia: number): { status: Status; label: string } {
  if (sys >= 140 || dia >= 90) return { status: "red", label: "Stage 2 Hypertension" };
  if (sys >= 130 || dia >= 80) return { status: "amber", label: "Stage 1 Hypertension" };
  return { status: "green", label: "Normal" };
}
export function hba1cStatus(v: number): { status: Status; label: string } {
  if (v >= 6.5) return { status: "red", label: "Diabetic Range" };
  if (v >= 5.7) return { status: "amber", label: "Prediabetes" };
  return { status: "green", label: "Normal" };
}
export function totalCholStatus(v: number): { status: Status; label: string } {
  if (v >= 6.2) return { status: "red", label: "High" };
  if (v >= 5.2) return { status: "amber", label: "Borderline High" };
  return { status: "green", label: "Desirable" };
}
export function bmiStatus(v: number): { status: Status; label: string } {
  if (v >= 25) return { status: "red", label: "Obese (Asian)" };
  if (v >= 23) return { status: "amber", label: "Overweight (Asian)" };
  if (v >= 18.5) return { status: "green", label: "Normal" };
  return { status: "amber", label: "Underweight" };
}
export function waistStatus(v: number, gender: "Male" | "Female" = "Male"): { status: Status; label: string } {
  const t = gender === "Male" ? 90 : 80;
  if (v >= t) return { status: "red", label: "Abdominal Obesity Risk" };
  return { status: "green", label: "Healthy" };
}
export function glucoseStatus(v: number, type: "fasting" | "postmeal"): { status: Status; label: string } {
  if (type === "fasting") {
    if (v >= 7.0) return { status: "red", label: "Diabetic Range" };
    if (v >= 5.6) return { status: "amber", label: "Prediabetes" };
    return { status: "green", label: "Normal" };
  }
  if (v >= 11.1) return { status: "red", label: "Diabetic Range" };
  if (v >= 7.8) return { status: "amber", label: "Prediabetes" };
  return { status: "green", label: "Normal" };
}
export function ldlStatus(v: number, diabetic = false): { status: Status; label: string } {
  const target = diabetic ? 1.4 : 4.1;
  if (v >= target) return { status: "red", label: diabetic ? "Above diabetic target" : "High" };
  return { status: "green", label: "On target" };
}

// ---- MOCK USER ----
export const MOCK_USER = {
  name: "Ahmad bin Razali",
  age: 52,
  gender: "Male" as const,
  ethnicity: "Malay" as const,
  conditions: ["Type 2 Diabetes", "Stage 2 Hypertension"],
};

// ---- MOCK STORE ----
const todayISO = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

const seedReadings = (): Reading[] => {
  const out: Reading[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const drift = Math.sin(i / 4) * 4;
    const sys = Math.round(140 + drift + (Math.random() * 4 - 2));
    const dia = Math.round(88 + drift / 2 + (Math.random() * 3 - 1.5));
    out.push({
      id: `r${i}`,
      date: d.toISOString(),
      systolic: sys,
      diastolic: dia,
      glucose: Number((7.4 + Math.sin(i / 3) * 0.6 + (Math.random() * 0.3 - 0.15)).toFixed(1)),
      glucoseType: "fasting",
      weight: Number((78 + Math.sin(i / 5) * 0.4).toFixed(1)),
      height: 169,
      bmi: 27.4,
      waist: 94,
    });
  }
  // Add latest snapshot with HbA1c + cholesterol
  out[out.length - 1] = {
    ...out[out.length - 1],
    systolic: 142, diastolic: 90,
    hba1c: 7.2, totalCholesterol: 5.9, ldl: 3.4, triglycerides: 2.0,
  };
  return out;
};

const seedMeds: Medication[] = [
  { id: "m1", name: "Metformin", dose: "500mg", frequency: "Twice daily", times: ["08:00", "20:00"] },
  { id: "m2", name: "Amlodipine", dose: "5mg", frequency: "Once daily", times: ["08:00"] },
];

const seedAppointments: Appointment[] = [
  {
    id: "a1",
    doctor: "Dr. Siti Aminah Binti Yusof",
    clinic: "Klinik Kesihatan Chow Kit",
    type: "gov",
    specialty: "Family Medicine",
    date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    time: "10:00 AM",
    reason: "Follow-up",
    concern: "Hypertension follow-up",
    status: "upcoming",
  },
  {
    id: "a2",
    doctor: "Dr. Rajesh Kumar",
    clinic: "Klinik Pakar Mediviron PJ",
    type: "private",
    specialty: "Internal Medicine",
    date: "2026-05-03",
    time: "11:30 AM",
    reason: "Lab result review",
    concern: "Diabetes check",
    status: "completed",
    notes: {
      diagnosis: "Type 2 Diabetes — suboptimal control",
      result: "HbA1c 7.2% (target <7.0%)",
      plan: "Continue Metformin, increase exercise, recheck in 3 months",
      nextFollowUp: "29 May 2026",
    },
  },
  {
    id: "a3",
    doctor: "Dr. Lim Wei Ling",
    clinic: "Columbia Asia Hospital PJ",
    type: "private",
    specialty: "Endocrinology",
    date: "2026-02-14",
    time: "2:30 PM",
    reason: "First visit",
    concern: "General NCD",
    status: "completed",
    notes: {
      diagnosis: "Metabolic syndrome confirmed",
      result: "BP 148/94, Total Chol 6.1",
      plan: "Initiated Amlodipine 5mg, lifestyle counseling",
      nextFollowUp: "3 May 2026",
    },
  },
];

interface StoreShape {
  readings: Reading[];
  meds: Medication[];
  doseLog: MedDoseLog[];
  appointments: Appointment[];
  reminderSettings: {
    medication: boolean;
    appointment: boolean;
    dailyLog: boolean;
    weekly: boolean;
  };
  addReading: (r: Omit<Reading, "id" | "date"> & { date?: string }) => void;
  addMed: (m: Omit<Medication, "id">) => void;
  removeMed: (id: string) => void;
  updateMed: (id: string, m: Partial<Medication>) => void;
  setDoseTaken: (medId: string, time: string, taken: boolean) => void;
  addAppointment: (a: Omit<Appointment, "id">) => Appointment;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  setReminders: (s: Partial<StoreShape["reminderSettings"]>) => void;
  latest: () => Reading;
}

const StoreCtx = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [readings, setReadings] = useState<Reading[]>(() => seedReadings());
  const [meds, setMeds] = useState<Medication[]>(seedMeds);
  const [doseLog, setDoseLog] = useState<MedDoseLog[]>([
    { id: "d1", medId: "m1", date: today(), time: "08:00", taken: true },
    { id: "d2", medId: "m2", date: today(), time: "08:00", taken: true },
  ]);
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments);
  const [reminderSettings, setReminderSettings] = useState({
    medication: true, appointment: true, dailyLog: true, weekly: true,
  });

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ncd-store-v1");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.readings) setReadings(p.readings);
        if (p.meds) setMeds(p.meds);
        if (p.doseLog) setDoseLog(p.doseLog);
        if (p.appointments) setAppointments(p.appointments);
        if (p.reminderSettings) setReminderSettings(p.reminderSettings);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("ncd-store-v1", JSON.stringify({
        readings, meds, doseLog, appointments, reminderSettings,
      }));
    } catch {}
  }, [readings, meds, doseLog, appointments, reminderSettings]);

  const value: StoreShape = {
    readings, meds, doseLog, appointments, reminderSettings,
    latest: () => {
      // most recent reading with merged latest values
      const merged: Reading = { id: "latest", date: todayISO() };
      [...readings].sort((a, b) => +new Date(a.date) - +new Date(b.date)).forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
          if (v !== undefined && k !== "id" && k !== "date") (merged as any)[k] = v;
        });
      });
      return merged;
    },
    addReading: (r) => setReadings(prev => [...prev, { ...r, id: `r${Date.now()}`, date: r.date ?? todayISO() } as Reading]),
    addMed: (m) => setMeds(prev => [...prev, { ...m, id: `m${Date.now()}` }]),
    removeMed: (id) => setMeds(prev => prev.filter(m => m.id !== id)),
    updateMed: (id, m) => setMeds(prev => prev.map(x => x.id === id ? { ...x, ...m } : x)),
    setDoseTaken: (medId, time, taken) => setDoseLog(prev => {
      const d = today();
      const existing = prev.find(x => x.medId === medId && x.date === d && x.time === time);
      if (existing) return prev.map(x => x === existing ? { ...x, taken } : x);
      return [...prev, { id: `d${Date.now()}`, medId, date: d, time, taken }];
    }),
    addAppointment: (a) => {
      const created: Appointment = { ...a, id: `a${Date.now()}` };
      setAppointments(prev => [...prev, created]);
      return created;
    },
    updateAppointment: (id, a) => setAppointments(prev => prev.map(x => x.id === id ? { ...x, ...a } : x)),
    setReminders: (s) => setReminderSettings(prev => ({ ...prev, ...s })),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

export function statusColors(s: Status) {
  if (s === "green") return "bg-success/15 text-success border-success/30";
  if (s === "amber") return "bg-warning/15 text-warning-foreground border-warning/40";
  return "bg-danger/15 text-danger border-danger/30";
}
export function statusDot(s: Status) {
  if (s === "green") return "bg-success";
  if (s === "amber") return "bg-warning";
  return "bg-danger";
}
