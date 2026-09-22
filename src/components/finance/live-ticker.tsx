import { useReducedMotion } from "motion/react";
import { useFinanceStore } from "@/lib/finance/store";
import { Money } from "./money";

export function LiveTicker() {
  const reduce = useReducedMotion();
  const transactions = useFinanceStore((s) => s.transactions);
  const items = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 10);

  if (!items.length) return null;

  const chips = (dup: boolean) =>
    items.map((tx) => (
      <span
        key={`${dup ? "b" : "a"}-${tx.id}`}
        className="inline-flex items-center gap-2 px-5 text-sm"
      >
        <span className="live-dot" />
        <span className="text-muted-foreground">{tx.category}</span>
        <span className="max-w-40 truncate">{tx.description}</span>
        <Money
          value={tx.type === "expense" ? -tx.amount : tx.amount}
          signed
          className="text-sm font-semibold"
        />
      </span>
    ));

  if (reduce) {
    return (
      <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card/70 px-3 py-2.5 backdrop-blur-md">
        <div className="flex flex-wrap gap-y-2">{chips(false)}</div>
      </div>
    );
  }

  return (
    <div className="ticker mb-0 overflow-hidden rounded-2xl border border-border bg-card/70 py-2.5 backdrop-blur-md" aria-label="Latest transactions">
      <div className="ticker-track">
        <div className="flex shrink-0">{chips(false)}</div>
        <div className="flex shrink-0" aria-hidden>
          {chips(true)}
        </div>
      </div>
    </div>
  );
}
