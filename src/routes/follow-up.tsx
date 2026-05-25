import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, Appointment } from "@/lib/store";
import { Calendar, ChevronDown, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/follow-up")({
  head: () => ({
    meta: [
      { title: "Follow-Up — NCD Care Malaysia" },
      { name: "description", content: "Upcoming and past appointments with post-visit notes." },
    ],
  }),
  component: FollowUp,
});

function FollowUp() {
  const { appointments, updateAppointment } = useStore();
  const sorted = [...appointments].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const upcoming = sorted.filter(a => a.status === "upcoming");
  const past = sorted.filter(a => a.status !== "upcoming");
  const [openNotes, setOpenNotes] = useState<Appointment | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Follow-Up</h1>
        <Link to="/book" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm">+ New</Link>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
            No upcoming appointments. <Link to="/book" className="text-primary">Book one →</Link>
          </div>
        ) : upcoming.map(a => (
          <UpcomingCard key={a.id} a={a}
            onCancel={() => { updateAppointment(a.id, { status: "cancelled" }); toast.success("Appointment cancelled"); }}
            onReschedule={() => toast.info("Use Book → wizard to reschedule")}
          />
        ))}
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Past</h2>
        <div className="space-y-2">
          {past.map(a => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{a.doctor}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.date).toDateString()} · {a.concern}</div>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full",
                  a.status === "completed" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                  {a.status}
                </span>
              </div>
              {a.notes && (
                <button onClick={() => setOpenNotes(a)} className="mt-3 text-sm text-primary hover:underline">
                  View Post-Visit Notes →
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {openNotes && openNotes.notes && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpenNotes(null)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Post-Visit Notes</h2>
              <button onClick={() => setOpenNotes(null)} className="p-1 hover:bg-accent rounded-md"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Field k="Doctor" v={openNotes.doctor} />
              <Field k="Date" v={new Date(openNotes.date).toDateString()} />
              <Field k="Diagnosis" v={openNotes.notes.diagnosis} />
              <Field k="Result" v={openNotes.notes.result} />
              <Field k="Plan" v={openNotes.notes.plan} />
              <Field k="Next follow-up" v={openNotes.notes.nextFollowUp} />
              <button
                onClick={() => toast.success("Summary downloaded (mock)")}
                className="mt-2 w-full rounded-md border border-border py-2 text-sm flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function UpcomingCard({ a, onCancel, onReschedule }: { a: Appointment; onCancel: () => void; onReschedule: () => void }) {
  const [openChecklist, setOpenChecklist] = useState(false);
  const c = a.concern.toLowerCase();
  const checklist = c.includes("diabetes") ? ["Fast 8 hours before", "Bring glucose log", "Note symptoms"]
    : c.includes("hypertension") ? ["Avoid caffeine 30 min before", "Sit quietly 5 min before BP", "Bring BP log"]
    : ["Bring NRIC", "List your questions"];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Calendar className="h-5 w-5" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium">{a.doctor}</div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Upcoming</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {new Date(a.date).toDateString()} · {a.time} · {a.concern}
          </div>
          <div className="text-xs text-muted-foreground">{a.clinic}</div>
        </div>
      </div>
      <button onClick={() => setOpenChecklist(o => !o)} className="mt-3 text-sm flex items-center gap-1 text-primary">
        Pre-visit checklist <ChevronDown className={cn("h-4 w-4 transition-transform", openChecklist && "rotate-180")} />
      </button>
      {openChecklist && (
        <ul className="mt-2 text-sm list-disc pl-5 text-muted-foreground space-y-1">
          {checklist.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={onReschedule} className="flex-1 rounded-md border border-border py-1.5 text-sm">Reschedule</button>
        <button onClick={onCancel} className="flex-1 rounded-md border border-destructive/30 text-destructive py-1.5 text-sm">Cancel</button>
      </div>
    </div>
  );
}
