import { money } from "@/lib/finance/format";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

export function Money({
  value,
  signed,
  className,
  tone,
}: {
  value: number;
  signed?: boolean;
  className?: string;
  tone?: "income" | "expense" | "neutral";
}) {
  const currency = useFinanceStore((s) => s.settings.currency);
  const resolved =
    tone ?? (signed ? (value > 0 ? "income" : value < 0 ? "expense" : "neutral") : "neutral");
  return (
    <span
      className={cn(
        "amount",
        resolved === "income" && "text-income",
        resolved === "expense" && "text-expense",
        className,
      )}
    >
      {money(value, currency, { sign: signed })}
    </span>
  );
}
