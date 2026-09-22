import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/finance/format";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

const CHART = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  const currency = useFinanceStore((s) => s.settings.currency);
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="amount">
          {p.name}: {money(p.value, currency)}
        </p>
      ))}
    </div>
  );
}

export function Sparkline({
  data,
  color = "rgb(255 255 255 / 0.9)",
}: {
  data: number[];
  color?: string;
}) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-12 w-[5.5rem] shrink-0 sm:h-14 sm:w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={color}
            fillOpacity={0.22}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({
  data,
  className,
}: {
  data: { label: string; income: number; expense: number }[];
  className?: string;
}) {
  return (
    <div className={cn("h-40 w-full min-w-0 sm:h-56", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.28}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Spend"
            stroke="#fb923c"
            fill="#fb923c"
            fillOpacity={0.2}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowBars({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  return (
    <div className="h-40 w-full min-w-0 sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="income" name="Income" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Spend" fill="var(--color-warn)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBars({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.slice(0, 6);
  return (
    <div className="h-48 w-full min-w-0 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="value" name="Spend" radius={[0, 6, 6, 0]}>
            {rows.map((_, i) => (
              <Cell key={i} fill={CHART[i % CHART.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const rows = data.slice(0, 5);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} stroke="none">
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART[i % CHART.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART[i % CHART.length] }} />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="text-muted-foreground">{total ? Math.round((r.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
