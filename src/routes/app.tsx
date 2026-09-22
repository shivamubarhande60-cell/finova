import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { CaptureBar } from "@/components/finance/capture";
import { CashflowChart, Sparkline } from "@/components/finance/charts";
import { CountMoney } from "@/components/finance/count-money";
import { Money } from "@/components/finance/money";
import { PeriodSelect } from "@/components/finance/period-select";
import { CopilotDock } from "@/components/chronicle/copilot-dock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { periodLabel, prettyDate } from "@/lib/finance/format";
import { filterPeriod, goalProgress, sumBy } from "@/lib/finance/compute";
import { useLedger } from "@/lib/finance/use-ledger";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({ component: Overview });

const KPI_TONES = ["kpi-blue", "kpi-amber", "kpi-violet", "kpi-green"] as const;
const DOT = ["bg-sky-400", "bg-orange-400", "bg-violet-400"] as const;

function Overview() {
  const ledger = useLedger();
  const openForm = useFinanceStore((s) => s.openForm);
  const transactions = useFinanceStore((s) => s.transactions);
  const [copilot, setCopilot] = useState(false);

  const lastMonth = useMemo(() => {
    const scoped = filterPeriod(transactions, "last-month");
    return { income: sumBy(scoped, "income"), expense: sumBy(scoped, "expense") };
  }, [transactions]);

  const lastNet = lastMonth.income - lastMonth.expense;
  const incomeDelta = lastMonth.income ? ((ledger.income - lastMonth.income) / lastMonth.income) * 100 : 0;
  const expenseDelta = lastMonth.expense ? ((ledger.expense - lastMonth.expense) / lastMonth.expense) * 100 : 0;
  const netDelta = lastNet ? ((ledger.flow - lastNet) / Math.abs(lastNet)) * 100 : 0;

  const spark = {
    net: ledger.series.map((s) => s.income - s.expense),
    in: ledger.series.map((s) => s.income),
    out: ledger.series.map((s) => s.expense),
    save: ledger.series.map((s) => (s.income ? ((s.income - s.expense) / s.income) * 100 : 0)),
  };

  const kpis = [
    { label: "Net this period", value: ledger.flow, delta: netDelta, spark: spark.net, percent: false },
    { label: "Income", value: ledger.income, delta: incomeDelta, spark: spark.in, percent: false },
    { label: "Spend", value: ledger.expense, delta: expenseDelta, spark: spark.out, percent: false },
    { label: "Savings rate", value: ledger.savingsRate, delta: netDelta, spark: spark.save, percent: true },
  ];

  const table = ledger.transactions.slice(0, 6);
  const activity = ledger.transactions.slice(0, 5);
  const accounts = useFinanceStore((s) => s.accounts);

  return (
    <div className="aura-dash">
      <div className="aura-kpis">
        {kpis.map((k, i) => (
          <div key={k.label} className={cn("kpi-tile", KPI_TONES[i])}>
            <div className="min-w-0">
              <p className="text-xs text-white/75">{k.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {k.percent ? (
                  <span className="amount">{Math.round(k.value)}%</span>
                ) : (
                  <CountMoney value={k.value} className="text-white" />
                )}
              </p>
              <p className="mt-1 text-xs text-white/80">
                {k.delta >= 0 ? "+" : ""}
                {k.delta.toFixed(1)}%
              </p>
            </div>
            <Sparkline data={k.spark} />
          </div>
        ))}
      </div>

      <Card className="aura-chart">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Cash flow</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{periodLabel(ledger.period)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400" /> Spend
            </span>
            <PeriodSelect />
          </div>
        </CardHeader>
        <CardContent>
          <CashflowChart data={ledger.series} />
        </CardContent>
      </Card>

      <Card className="aura-activity">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link to="/ledger" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((tx, i) => (
            <div key={tx.id} className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white", DOT[i % DOT.length])}>
                {tx.description.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{tx.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {prettyDate(tx.date)} · {tx.category}
                </p>
              </div>
              <Money
                value={tx.type === "expense" ? -tx.amount : tx.amount}
                signed
                className="text-sm font-medium"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="aura-table">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ledger</CardTitle>
          <Link to="/ledger" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Open all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="aura-grid">
            <thead>
              <tr>
                <th>ID</th>
                <th>Payee</th>
                <th className="hidden sm:table-cell">Date</th>
                <th>Type</th>
                <th>Total</th>
                <th className="hidden md:table-cell">Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {table.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId)?.name ?? "—";
                return (
                  <tr key={tx.id}>
                    <td className="text-muted-foreground">#{tx.id.slice(-4)}</td>
                    <td className="max-w-[10rem] truncate font-medium">{tx.description}</td>
                    <td className="hidden text-muted-foreground sm:table-cell">{prettyDate(tx.date)}</td>
                    <td>
                      <span className={cn("status-pill", tx.type === "income" ? "status-in" : "status-out")}>
                        {tx.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td>
                      <Money value={tx.type === "expense" ? -tx.amount : tx.amount} signed className="text-sm" />
                    </td>
                    <td className="hidden text-muted-foreground md:table-cell">{account}</td>
                    <td>
                      <button type="button" className="text-xs text-primary" onClick={() => openForm(tx.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="aura-goals">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Goals in progress</CardTitle>
          <Link to="/goals" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {ledger.goals.slice(0, 4).map((g) => (
            <div key={g.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[1fr_7rem_5rem]">
              <p className="truncate text-sm font-medium">{g.name}</p>
              <p className="hidden text-right text-xs text-muted-foreground sm:block">
                <Money value={g.saved} /> / <Money value={g.target} />
              </p>
              <p className="text-right text-xs text-muted-foreground">{goalProgress(g).toFixed(0)}%</p>
              <Progress value={goalProgress(g)} className="col-span-2 h-1.5 sm:col-span-3" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="aura-capture">
        <CaptureBar />
      </div>

      <div className="aura-ask flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Copilot
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Ask what you can cut this month.</p>
        </div>
        <Button onClick={() => setCopilot(true)}>Ask</Button>
      </div>

      <CopilotDock open={copilot} onOpenChange={setCopilot} />
    </div>
  );
}
