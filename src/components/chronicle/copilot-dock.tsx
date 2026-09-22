import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { advisorChatFn } from "@/lib/ai/grok";
import { useLedger } from "@/lib/finance/use-ledger";
import { toast } from "@/components/ui/sonner";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Where did most of my money go?",
  "Am I over budget anywhere?",
  "How are my goals tracking?",
  "What should I cut this week?",
];

export function CopilotDock({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ledger = useLedger();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const snapshot = JSON.stringify(ledger.snapshot);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await advisorChatFn({ data: { snapshot, messages: next } });
      if (res.ok) setMessages([...next, { role: "assistant", content: res.text }]);
      else toast.error(res.error);
    } catch {
      toast.error("Copilot is unreachable right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2 text-xl">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart finance copilot
          </SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-xs text-muted-foreground">
          Uses your live ledger. Works offline; optionally connects to AI when configured.
        </p>
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="grid gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-left text-sm hover:border-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-4 rounded-2xl border border-border bg-card px-3 py-2 text-sm whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
            ))
          )}
          {busy ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading your books…
            </p>
          ) : null}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your money"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
