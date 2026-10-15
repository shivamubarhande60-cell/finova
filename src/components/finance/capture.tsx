import { useState } from "react";
import { ArrowRight, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseCaptureFn } from "@/lib/ai/grok";
import { localParse, type ParsedCapture } from "@/lib/finance/parse";
import { prettyDate } from "@/lib/finance/format";
import { useFinanceStore } from "@/lib/finance/store";
import { Money } from "./money";
import { toast } from "@/components/ui/sonner";

export function CaptureBar() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedCapture | null>(null);
  const [source, setSource] = useState<"grok" | "local" | null>(null);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const accounts = useFinanceStore((s) => s.accounts);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await parseCaptureFn({ data: { text } });
      if (res.ok) {
        setParsed(res.parsed);
        setSource(res.source);
      }
      else {
        const local = localParse(text);
        if (local) {
          setParsed(local);
          setSource("local");
        }
        else toast.error(res.error);
      }
    } catch {
      const local = localParse(text);
      if (local) {
        setParsed(local);
        setSource("local");
      }
      else toast.error("Could not interpret that.");
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (!parsed) return;
    addTransaction({
      amount: parsed.amount,
      type: parsed.type,
      description: parsed.description,
      category: parsed.category,
      date: parsed.date,
      accountId: accounts[0]?.id ?? "acc_checking",
      notes: parsed.notes,
    });
    toast.success("Captured");
    setParsed(null);
    setSource(null);
    setText("");
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Quick capture</p>
          {parsed && source ? <span className={`ai-source ${source === "grok" ? "is-live" : ""}`}>{source === "grok" ? "Grok AI" : "On-device"}</span> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
            placeholder="Paid 64 for dinner at Barra yesterday"
            className="h-11 min-h-11 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={() => void run()} disabled={busy || !text.trim()}>
            <ScanText className="h-4 w-4" />
            {busy ? "Reading…" : "Interpret"}
          </Button>
        </div>
        {parsed ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{parsed.description}</p>
              <p className="text-xs text-muted-foreground">
                {parsed.type} · {parsed.category} · {prettyDate(parsed.date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Money
                value={parsed.type === "expense" ? -parsed.amount : parsed.amount}
                signed
                className="text-lg font-semibold"
              />
              <Button size="sm" variant="outline" onClick={() => setParsed(null)}>
                Discard
              </Button>
              <Button size="sm" onClick={accept}>
                Add
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
