import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesFor } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import type { TxType } from "@/lib/finance/types";
import { todayIso } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

export function TransactionFormDialog() {
  const open = useFinanceStore((s) => s.formOpen);
  const editingId = useFinanceStore((s) => s.editingId);
  const closeForm = useFinanceStore((s) => s.closeForm);
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const editing = transactions.find((t) => t.id === editingId);

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayIso());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setDescription(editing.description);
      setCategory(editing.category);
      setDate(editing.date);
      setAccountId(editing.accountId);
      setNotes(editing.notes ?? "");
    } else {
      setType("expense");
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(todayIso());
      setAccountId(accounts[0]?.id ?? "");
      setNotes("");
    }
  }, [open, editing, accounts]);

  const cats = categoriesFor(type);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000_000 || !description.trim() || !category) {
      toast.error("Fill a valid amount, description, and category.");
      return;
    }
    const payload = {
      amount: Math.round(n * 100) / 100,
      type,
      description: description.trim().slice(0, 80),
      category,
      date,
      accountId: accountId || accounts[0]?.id || "acc_checking",
      notes: notes.trim() || undefined,
    };
    if (editing) {
      updateTransaction(editing.id, payload);
      toast.success("Transaction updated");
    } else {
      addTransaction(payload);
      toast.success("Added to ledger");
    }
    closeForm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? closeForm() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Logged privately on this device.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory("");
                }}
                className={
                  type === t
                    ? t === "income"
                      ? "h-11 rounded-xl bg-income text-primary-foreground text-sm font-medium"
                      : "h-11 rounded-xl bg-expense text-destructive-foreground text-sm font-medium"
                    : "h-11 rounded-xl border border-border text-sm text-muted-foreground"
                }
              >
                {t === "income" ? "Income" : "Expense"}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="amount text-lg"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Whole Foods, salary, rent…"
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save" : "Add to ledger"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
