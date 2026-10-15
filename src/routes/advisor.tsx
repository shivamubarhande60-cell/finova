import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { advisorChatFn, findLeaksFn, monthlyBriefFn, suggestBudgetsFn } from "@/lib/ai/grok";
import { useLedger } from "@/lib/finance/use-ledger";
import { useFinanceStore } from "@/lib/finance/store";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisor")({ component: AdvisorPage });

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Where is the money actually going?",
  "Can I afford a $2,400 trip in six months?",
  "What should I cut this month?",
  "How healthy is the emergency fund?",
];

function AdvisorPage() {
  const ledger = useLedger();
  const addBudget = useFinanceStore((s) => s.addBudget);
  const budgets = useFinanceStore((s) => s.budgets);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [leaks, setLeaks] = useState<string | null>(null);
  const [source, setSource] = useState<"grok" | "local" | null>(null);
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
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSource(res.source);
      setMessages([...next, { role: "assistant", content: res.text }]);
    } catch {
      toast.error("Advisor is unreachable.");
    } finally {
      setBusy(false);
    }
  };

  const runBrief = async () => {
    setBusy(true);
    try {
      const res = await monthlyBriefFn({ data: { snapshot } });
      setSource(res.source);
      setBrief(res.text);
    } catch {
      toast.error("Could not write the brief.");
    } finally {
      setBusy(false);
    }
  };

  const runLeaks = async () => {
    setBusy(true);
    try {
      const res = await findLeaksFn({ data: { snapshot } });
      setSource(res.source);
      setLeaks(res.text);
    } catch {
      toast.error("Could not scan for leaks.");
    } finally {
      setBusy(false);
    }
  };

  const runBudgets = async () => {
    setBusy(true);
    try {
      const res = await suggestBudgetsFn({ data: { snapshot } });
      setSource(res.source);
      const jsonText = res.text.replace(/^```json\s*|\s*```$/g, "");
      const parsed = JSON.parse(jsonText) as {
        note?: string;
        items?: { category: string; amount: number; reason: string }[];
      };
      const items = parsed.items ?? [];
      let added = 0;
      for (const item of items) {
        if (!item.category || !item.amount) continue;
        if (budgets.some((b) => b.category === item.category)) continue;
        addBudget({ category: item.category, amount: Math.round(item.amount) });
        added++;
      }
      toast.success(added ? `Added ${added} envelopes` : parsed.note || "No new envelopes");
    } catch {
      toast.error("Could not propose budgets.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash-scene mx-auto max-w-3xl">
      <PageHeader
        kicker="Copilot"
        title="What would you like to understand?"
        description="Answers use your ledger only when you ask. Local insights are available if live AI is offline."
      />

      <div className={`copilot-mode ${source === "grok" ? "is-live" : ""}`} aria-live="polite">
        <span />
        {source === "grok" ? "Live Grok" : source === "local" ? "On-device insights" : "AI mode appears after your first request"}
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <Button variant="outline" disabled={busy} onClick={() => void runBrief()}>
          Monthly brief
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void runLeaks()}>
          Find leaks
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void runBudgets()}>
          Suggest envelopes
        </Button>
      </div>

      {brief ? (
        <Card className="mb-4">
          <CardContent className="whitespace-pre-wrap p-5 text-sm leading-relaxed">{brief}</CardContent>
        </Card>
      ) : null}
      {leaks ? (
        <Card className="mb-4">
          <CardContent className="whitespace-pre-wrap p-5 text-sm leading-relaxed">{leaks}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex min-h-64 flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-end gap-2">
                <p className="text-sm text-muted-foreground">Try one of these, or write your own.</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => void ask(p)}
                      className="rounded-full border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto rounded-2xl bg-secondary px-4 py-3"
                      : "text-foreground",
                  )}
                >
                  {m.content}
                </div>
              ))
            )}
            {busy ? <p className="text-xs text-muted-foreground">Reading the ledger…</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="Ask about cash flow, a purchase, or a goal"
              className="h-11 min-h-11 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button disabled={busy || !input.trim()} onClick={() => void ask(input)}>
              Ask
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
