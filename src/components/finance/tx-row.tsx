import { Pencil, Trash2 } from "lucide-react";
import { prettyDateShort } from "@/lib/finance/format";
import type { Transaction } from "@/lib/finance/types";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { Money } from "./money";
import { Button } from "@/components/ui/button";

export function TxRow({
  tx,
  compact,
}: {
  tx: Transaction;
  compact?: boolean;
}) {
  const openForm = useFinanceStore((s) => s.openForm);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const accounts = useFinanceStore((s) => s.accounts);
  const account = accounts.find((a) => a.id === tx.accountId)?.name;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          tx.type === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense",
        )}
      >
        {tx.description.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {prettyDateShort(tx.date)} · {tx.category}
          {account ? ` · ${account}` : ""}
        </p>
      </div>
      <Money
        value={tx.type === "expense" ? -tx.amount : tx.amount}
        signed
        className="text-sm font-semibold"
      />
      {compact ? null : (
        <div className="hidden shrink-0 sm:flex">
          <Button size="icon" variant="ghost" onClick={() => openForm(tx.id)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteTransaction(tx.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
