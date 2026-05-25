import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiCall } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string }

const STARTERS = [
  "Is my BP of 142/90 dangerous?",
  "What does HbA1c 7.2% mean?",
  "Foods to avoid with high cholesterol?",
  "When should I go to the ER?",
];

export function CaraBot({ open, onClose, embedded = false }: { open?: boolean; onClose?: () => void; embedded?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi Ahmad! I'm CaraBot 🤖 — your NCD companion. Ask me about your numbers, medications, or lifestyle." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const callAI = useServerFn(aiCall);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res: any = await callAI({ data: { mode: "chat", messages: next } });
      setMessages([...next, { role: "assistant", content: res.text || "(no response)" }]);
    } catch (e: any) {
      toast.error(e.message ?? "AI error");
      setMessages([...next, { role: "assistant", content: "Sorry, I'm having trouble responding right now." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!embedded && !open) return null;

  const body = (
    <div className={cn("flex flex-col bg-card", embedded ? "h-full rounded-lg border border-border" : "h-full")}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold">C</div>
          <div>
            <div className="text-sm font-semibold">CaraBot</div>
            <div className="text-xs text-muted-foreground">AI health assistant</div>
          </div>
        </div>
        {!embedded && onClose && (
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-2xl px-3 py-2.5">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        {messages.length <= 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-border bg-background hover:bg-accent px-3 py-1.5">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 p-3 border-t border-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CaraBot anything…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-md bg-primary text-primary-foreground p-2 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="fixed inset-0 z-40 md:inset-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] md:rounded-xl md:shadow-2xl md:border md:border-border overflow-hidden bg-card">
      {body}
    </div>
  );
}
