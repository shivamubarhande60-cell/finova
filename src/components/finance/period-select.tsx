import { PERIODS, periodLabel } from "@/lib/finance/format";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Period } from "@/lib/finance/types";

export function PeriodSelect() {
  const period = useFinanceStore((s) => s.period);
  const setPeriod = useFinanceStore((s) => s.setPeriod);
  return (
    <>
      <div className="w-full min-[700px]:hidden">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {periodLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden max-w-full min-[700px]:flex gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>
    </>
  );
}
