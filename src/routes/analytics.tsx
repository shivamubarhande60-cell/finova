import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/finance/page-header";
import { PeriodSelect } from "@/components/finance/period-select";
import { CashflowChart, CategoryBars } from "@/components/finance/charts";
import { CountMoney } from "@/components/finance/count-money";
import { Money } from "@/components/finance/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLedger } from "@/lib/finance/use-ledger";
import { periodLabel } from "@/lib/finance/format";
import { RevealDash } from "@/components/motion/lift";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const ledger = useLedger();
  const { split } = ledger;

  return (
    <div className="dash-scene mx-auto max-w-6xl">
      <PageHeader
        kicker="Analytics"
        title="The shape of the month"
        description={`${periodLabel(ledger.period)}. 50/30/20 is a compass, not a verdict.`}
        actions={<div className="w-full min-[700px]:w-auto"><PeriodSelect /></div>}
      />

      <RevealDash className="mb-6 grid min-w-0 gap-3 sm:grid-cols-3">
        <Stat label="Income" value={ledger.income} />
        <Stat label="Spend" value={ledger.expense} expense />
        <Stat label="Savings rate" text={`${ledger.savingsRate.toFixed(0)}%`} />
      </RevealDash>

      <RevealDash className="mb-6 grid min-w-0 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Six-month cash flow</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart data={ledger.series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
          </CardHeader>
          <CardContent>
            {ledger.categories.length ? (
              <CategoryBars data={ledger.categories} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No expenses in view.</p>
            )}
          </CardContent>
        </Card>
      </RevealDash>

      <RevealDash className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>50 / 30 / 20</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <RuleRow label="Needs · 50%" actual={split.needPct} target={50} amount={split.need} />
            <RuleRow label="Wants · 30%" actual={split.wantPct} target={30} amount={split.want} />
            <RuleRow label="Saved · 20%" actual={split.savePct} target={20} amount={split.save} />
          </CardContent>
        </Card>
      </RevealDash>

      <Card>
        <CardHeader>
          <CardTitle>Category table</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {ledger.categories.map((c) => (
            <div key={c.name} className="flex items-center justify-between py-3 text-sm">
              <span>{c.name}</span>
              <Money value={c.value} className="font-medium" />
            </div>
          ))}
          {ledger.categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing to break down.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RuleRow({
  label,
  actual,
  target,
  amount,
}: {
  label: string;
  actual: number;
  target: number;
  amount: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="amount text-muted-foreground">
          {actual.toFixed(0)}% · <Money value={amount} />
        </span>
      </div>
      <Progress value={Math.min(100, actual)} className="h-1.5" />
      <p className="mt-1 text-xs text-muted-foreground">Target {target}%</p>
    </div>
  );
}

function Stat({
  label,
  value,
  text,
  expense,
}: {
  label: string;
  value?: number;
  text?: string;
  expense?: boolean;
}) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display mt-2 text-2xl">
        {text ?? <CountMoney value={value ?? 0} tone={expense ? "expense" : undefined} />}
      </p>
    </div>
  );
}