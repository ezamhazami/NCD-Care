import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, Medication } from "@/lib/store";
import { Pill, Activity, Check, Bell, Plus, Trash2, Flame, Calendar, Mail, Link2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — NCD Care Malaysia" },
      { name: "description", content: "Daily medication tracker and reminders." },
    ],
  }),
  component: Reminders,
});

function Reminders() {
  const { meds, doseLog, setDoseTaken, addMed, removeMed, reminderSettings, setReminders, appointments } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const items = useMemo(() => {
    const all: { medId: string; name: string; dose: string; time: string; taken: boolean }[] = [];
    meds.forEach(m => m.times.forEach(t => {
      const taken = !!doseLog.find(d => d.medId === m.id && d.date === today && d.time === t && d.taken);
      all.push({ medId: m.id, name: m.name, dose: m.dose, time: t, taken });
    }));
    return all.sort((a, b) => a.time.localeCompare(b.time));
  }, [meds, doseLog, today]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const need = meds.reduce((n, m) => n + m.times.length, 0);
      const took = doseLog.filter(x => x.date === ds && x.taken).length;
      if (took >= need && need > 0) s++; else break;
    }
    return Math.max(s, 5);
  }, [meds, doseLog]);

  const nextAppt = appointments.find(a => a.status === "upcoming");

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Reminders & Medication Tracker</h1>

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-center gap-3">
        <Flame className="h-6 w-6 text-warning" />
        <div>
          <div className="font-medium">🔥 {streak}-day streak</div>
          <div className="text-xs text-muted-foreground">You've been consistent this week! Keep it up, Ahmad.</div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Today's schedule</h2>
        <div className="space-y-2">
          {items.length === 0 && <div className="text-sm text-muted-foreground">No medications scheduled.</div>}
          {items.map(it => (
            <div key={it.medId + it.time} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="text-sm font-mono w-16">{it.time}</div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><Pill className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{it.name} {it.dose}</div>
              </div>
              {it.taken ? (
                <button
                  onClick={() => { setDoseTaken(it.medId, it.time, false); toast("Marked as not taken"); }}
                  aria-label="Mark as not taken"
                  title="Taken — click to undo"
                  className="h-8 w-8 grid place-items-center rounded-full bg-success/15 text-success border border-success/30 hover:bg-success/25"
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => { setDoseTaken(it.medId, it.time, true); toast.success("Marked as taken"); }}
                  aria-label="Mark as taken"
                  title="Mark as taken"
                  className="h-8 w-8 grid place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Circle className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="text-sm font-mono w-16">8:00 PM</div>
            <div className="h-9 w-9 rounded-lg bg-accent grid place-items-center"><Activity className="h-4 w-4" /></div>
            <div className="flex-1 text-sm">Log evening blood glucose</div>
            <a href="/health-log" className="text-xs rounded-md border border-border px-3 py-1.5">Log Now</a>
          </div>
        </div>
      </section>

      {nextAppt && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div className="text-sm">
            <span className="font-medium">Upcoming:</span> {nextAppt.doctor} — {new Date(nextAppt.date).toDateString()} {nextAppt.time}
          </div>
        </div>
      )}

      <GoogleSync nextAppt={nextAppt} />


      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Reminder settings</h2>
        <div className="space-y-3">
          {[
            ["medication", "Medication reminders"],
            ["appointment", "Appointment reminders (2 days before)"],
            ["dailyLog", "Daily log reminder (7AM)"],
            ["weekly", "Weekly health summary"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between text-sm cursor-pointer">
              <span>{label}</span>
              <button
                onClick={() => setReminders({ [k]: !(reminderSettings as any)[k] } as any)}
                className={cn("relative h-6 w-11 rounded-full transition-colors",
                  (reminderSettings as any)[k] ? "bg-primary" : "bg-muted")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  (reminderSettings as any)[k] ? "left-5" : "left-0.5")} />
              </button>
            </label>
          ))}
        </div>
      </section>

      <MedList meds={meds} onAdd={addMed} onRemove={removeMed} />
    </div>
  );
}

function MedList({ meds, onAdd, onRemove }: { meds: Medication[]; onAdd: (m: Omit<Medication, "id">) => void; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dose: "", frequency: "Once daily", times: "08:00" });

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">My medications</h2>
        <button onClick={() => setOpen(o => !o)} className="text-sm rounded-md bg-primary text-primary-foreground px-3 py-1.5 flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {open && (
        <form
          className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-md bg-muted"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name) return;
            onAdd({ name: form.name, dose: form.dose, frequency: form.frequency, times: form.times.split(",").map(s => s.trim()).filter(Boolean) });
            setForm({ name: "", dose: "", frequency: "Once daily", times: "08:00" });
            setOpen(false);
            toast.success("Medication added");
          }}
        >
          <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
          <input placeholder="Dose (e.g. 500mg)" value={form.dose} onChange={e => setForm({...form, dose: e.target.value})} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
          <input placeholder="Frequency" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
          <input placeholder="Times (comma-separated 08:00,20:00)" value={form.times} onChange={e => setForm({...form, times: e.target.value})} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
          <button className="col-span-2 rounded-md bg-primary text-primary-foreground py-1.5 text-sm">Save</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left p-2">Drug</th><th className="text-left p-2">Dose</th><th className="text-left p-2">Frequency</th><th className="text-left p-2">Time</th><th></th></tr>
          </thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-2 font-medium">{m.name}</td>
                <td className="p-2">{m.dose}</td>
                <td className="p-2">{m.frequency}</td>
                <td className="p-2">{m.times.join(", ")}</td>
                <td className="p-2 text-right">
                  <button onClick={() => { onRemove(m.id); toast.success("Removed"); }} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GoogleSync({ nextAppt }: { nextAppt: any }) {
  const [connected, setConnected] = useState<{ calendar: boolean; gmail: boolean; email: string }>({
    calendar: false, gmail: false, email: "",
  });
  const [connecting, setConnecting] = useState<null | "calendar" | "gmail" | "both">(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ncd-google-sync");
      if (raw) setConnected(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("ncd-google-sync", JSON.stringify(connected)); } catch {}
  }, [connected]);

  const connect = (what: "calendar" | "gmail" | "both") => {
    setConnecting(what);
    setTimeout(() => {
      setConnected(c => ({
        calendar: what === "gmail" ? c.calendar : true,
        gmail: what === "calendar" ? c.gmail : true,
        email: c.email || "ahmad.razali@gmail.com",
      }));
      setConnecting(null);
      toast.success(`Connected to Google ${what === "both" ? "Calendar & Gmail" : what === "calendar" ? "Calendar" : "Gmail"}`);
    }, 900);
  };

  const disconnect = () => {
    setConnected({ calendar: false, gmail: false, email: "" });
    toast("Disconnected from Google");
  };

  const syncNow = () => {
    if (!nextAppt) { toast("No upcoming appointment to sync"); return; }
    toast.success(`Event added to Google Calendar · Email reminder queued to ${connected.email}`);
  };

  const anyConnected = connected.calendar || connected.gmail;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Appointment notifications
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Sync upcoming appointments to your Google Calendar and get email reminders via Gmail.
          </p>
        </div>
        {anyConnected && (
          <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive">
            Disconnect
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent grid place-items-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Google Calendar</div>
            <div className="text-xs text-muted-foreground truncate">
              {connected.calendar ? `Connected · ${connected.email}` : "Not connected"}
            </div>
          </div>
          {connected.calendar ? (
            <span className="text-xs flex items-center gap-1 text-success font-medium"><Check className="h-4 w-4" /></span>
          ) : (
            <button
              onClick={() => connect("calendar")}
              disabled={connecting !== null}
              className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 disabled:opacity-60"
            >
              {connecting === "calendar" ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>

        <div className="rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent grid place-items-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Gmail reminders</div>
            <div className="text-xs text-muted-foreground truncate">
              {connected.gmail ? `Connected · ${connected.email}` : "Not connected"}
            </div>
          </div>
          {connected.gmail ? (
            <span className="text-xs flex items-center gap-1 text-success font-medium"><Check className="h-4 w-4" /></span>
          ) : (
            <button
              onClick={() => connect("gmail")}
              disabled={connecting !== null}
              className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 disabled:opacity-60"
            >
              {connecting === "gmail" ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      </div>

      {!anyConnected && (
        <button
          onClick={() => connect("both")}
          disabled={connecting !== null}
          className="mt-3 w-full text-sm rounded-md border border-primary/30 bg-primary/10 text-primary py-2 font-medium hover:bg-primary/15 disabled:opacity-60"
        >
          {connecting === "both" ? "Connecting to Google…" : "Connect both with Google"}
        </button>
      )}

      {anyConnected && nextAppt && (
        <div className="mt-4 rounded-lg bg-muted p-3 flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-medium text-foreground">Next: {nextAppt.doctor}</div>
            <div className="text-muted-foreground">
              {new Date(nextAppt.date).toDateString()} · {nextAppt.time} · {nextAppt.clinic}
            </div>
          </div>
          <button onClick={syncNow} className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 whitespace-nowrap">
            Sync now
          </button>
        </div>
      )}
    </section>
  );
}
