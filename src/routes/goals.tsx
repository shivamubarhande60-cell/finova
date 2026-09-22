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
import { goalProgress } from "@/lib/finance/compute";
import { useFinanceStore } from "@/lib/finance/store";
import { useLedger } from "@/lib/finance/use-ledger";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/goals")({ component: GoalsPage });

function GoalsPage() {
  const { goals } = useLedger();
  const addGoal = useFinanceStore((s) => s.addGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);
  const contributeGoal = useFinanceStore((s) => s.contributeGoal);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contrib, setContrib] = useState<Record<string, string>>({});

  const save = () => {
    const t = Number(target);
    const s = Number(saved || 0);
    if (!name.trim() || !Number.isFinite(t) || t <= 0) {
      toast.error("Name and target are required.");
      return;
    }
    addGoal({ name: name.trim(), target: t, saved: s, deadline: deadline || undefined });
    setOpen(false);
    setName("");
    setTarget("");
    setSaved("");
    setDeadline("");
    toast.success("Goal added");
  };

  return (
    <div className="dash-scene mx-auto max-w-3xl">
      <PageHeader
        kicker="Goals"
        title="Named futures"
        description="Emergency fund, a trip, a tool. Put a number on it and watch the bar move."
        actions={<Button onClick={() => setOpen(true)}>New goal</Button>}
      />
      <div className="grid gap-3">
        {goals.map((g) => {
          const pct = goalProgress(g);
          return (
            <Card key={g.id}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Money value={g.saved} /> of <Money value={g.target} />
                      {g.deadline ? ` · by ${g.deadline}` : ""}
                    </p>
                  </div>
                  <p className="amount text-sm font-semibold text-income">{pct.toFixed(0)}%</p>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    inputMode="decimal"
                    placeholder="Amount"
                    value={contrib[g.id] ?? ""}
                    onChange={(e) => setContrib({ ...contrib, [g.id]: e.target.value })}
                    className="sm:max-w-36"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const n = Number(contrib[g.id]);
                      if (!Number.isFinite(n) || n === 0) return;
                      contributeGoal(g.id, n);
                      setContrib({ ...contrib, [g.id]: "" });
                      toast.success(n > 0 ? "Added to goal" : "Adjusted");
                    }}
                  >
                    Contribute
                  </Button>
                  <Button variant="ghost" onClick={() => deleteGoal(g.id)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No goals yet.</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency fund" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Target</Label>
                <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Already saved</Label>
                <Input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
