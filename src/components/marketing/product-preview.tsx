import { CashflowChart, Sparkline } from "@/components/finance/charts";
import { money, prettyDate } from "@/lib/finance/format";
import { useLedger } from "@/lib/finance/use-ledger";
import { cn } from "@/lib/utils";

const KPI = ["kpi-blue", "kpi-amber", "kpi-violet", "kpi-green"] as const;

export function ProductPreview() {
  const ledger = useLedger();
  const spark = {
    net: ledger.series.map((s) => s.income - s.expense),
    in: ledger.series.map((s) => s.income),
    out: ledger.series.map((s) => s.expense),
    save: ledger.series.map((s) => (s.income ? ((s.income - s.expense) / s.income) * 100 : 0)),
  };
  const tiles = [
    { label: "Net", value: money(ledger.flow, ledger.settings.currency), spark: spark.net },
    { label: "Income", value: money(ledger.income, ledger.settings.currency), spark: spark.in },
    { label: "Spend", value: money(ledger.expense, ledger.settings.currency), spark: spark.out },
    { label: "Saved", value: `${Math.round(ledger.savingsRate)}%`, spark: spark.save },
  ];
  const rows = ledger.transactions.slice(0, 4);

  return (
    <div className="desk-window">
      <aside className="desk-rail">
        <p className="flex items-center gap-2 px-3 py-4 text-xs font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] text-primary-foreground">
            F
          </span>
          FINOVA
        </p>
        {["Overview", "Analytics", "Ledger", "Budgets", "Goals"].map((item, i) => (
          <p
            key={item}
            className={cn(
              "mx-2 rounded-md px-3 py-2 text-xs",
              i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            {item}
          </p>
        ))}
      </aside>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 hidden h-8 items-center rounded-md border border-border bg-secondary/60 px-3 text-xs text-muted-foreground sm:flex">
          Search
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <div key={t.label} className={cn("kpi-tile min-h-[4.75rem] px-3 py-2.5", KPI[i])}>
              <div className="min-w-0">
                <p className="text-[10px] text-white/75">{t.label}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">{t.value}</p>
              </div>
              <div className="hidden sm:block">
                <Sparkline data={t.spark} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-medium">Cash flow</p>
            <CashflowChart data={ledger.series} className="!h-28 sm:!h-36" />
          </div>
          <div className="hidden rounded-xl border border-border bg-card p-3 lg:block">
            <p className="text-xs font-medium">Recent activity</p>
            <div className="mt-3 space-y-2.5">
              {rows.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {tx.description}
                    <span className="mt-0.5 block text-[10px]">{prettyDate(tx.date)}</span>
                  </span>
                  <span className="amount shrink-0">
                    {money(tx.type === "expense" ? -tx.amount : tx.amount, ledger.settings.currency, {
                      sign: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
