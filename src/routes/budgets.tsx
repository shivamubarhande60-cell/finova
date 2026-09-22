import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/finance/page-header";
import { Money } from "@/components/finance/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import { useLedger } from "@/lib/finance/use-ledger";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/budgets")({ component: BudgetsPage });

function BudgetsPage() {
  const { budgetRows } = useLedger();
  const addBudget = useFinanceStore((s) => s.addBudget);
  const updateBudget = useFinanceStore((s) => s.updateBudget);
  const deleteBudget = useFinanceStore((s) => s.deleteBudget);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const save = () => {
    const n = Number(amount);
    if (!category || !Number.isFinite(n) || n <= 0) {
      toast.error("Choose a category and amount.");
      return;
    }
    if (editId) updateBudget(editId, { category, amount: n });
    else addBudget({ category, amount: n });
    setOpen(false);
    setEditId(null);
    setCategory("");
    setAmount("");
    toast.success("Budget saved");
  };

  return (
    <div className="dash-scene mx-auto max-w-3xl">
      <PageHeader
        kicker="Budgets"
        title="Envelopes"
        description="Monthly ceilings against this month’s spend. Over 100% is a leak, not a moral failing."
        actions={<Button onClick={() => setOpen(true)}>New envelope</Button>}
      />
      <div className="grid gap-3">
        {budgetRows.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{b.category}</p>
                  <p className="text-xs text-muted-foreground">
                    <Money value={b.spent} /> of <Money value={b.amount} />
                  </p>
                </div>
                <p className={cn("amount text-sm font-semibold", b.pct > 100 ? "text-expense" : b.pct > 80 ? "text-warn" : "text-income")}>
                  {b.pct.toFixed(0)}%
                </p>
              </div>
              <Progress value={Math.min(100, b.pct)} className="h-2" />
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditId(b.id);
                    setCategory(b.category);
                    setAmount(String(b.amount));
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteBudget(b.id)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {budgetRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No envelopes yet.</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit envelope" : "New envelope"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Monthly limit</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
