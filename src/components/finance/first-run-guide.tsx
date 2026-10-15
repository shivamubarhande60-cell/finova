import { ArrowRight, Check, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useFinanceStore } from "@/lib/finance/store";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function FirstRunGuide() {
  const user = useCurrentUser();
  const transactions = useFinanceStore((state) => state.transactions);
  const budgets = useFinanceStore((state) => state.budgets);
  const goals = useFinanceStore((state) => state.goals);
  const openForm = useFinanceStore((state) => state.openForm);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const storageKey = user ? `finova-setup-dismissed:${user.id}` : null;
  const done = [transactions.length > 0, budgets.length > 0, goals.length > 0];
  const progress = done.filter(Boolean).length;

  useEffect(() => {
    setDismissed(storageKey ? localStorage.getItem(storageKey) === "1" : true);
    setReady(true);
  }, [storageKey]);

  if (!ready || !user || dismissed || progress === done.length) return null;

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  return (
    <section className="first-run-guide" aria-labelledby="first-run-title">
      <div className="first-run-heading">
        <div>
          <p className="first-run-kicker">A good place to start</p>
          <h2 id="first-run-title">Set up your money desk</h2>
          <p>Three small steps make your dashboard useful from day one.</p>
        </div>
        <div className="first-run-progress">
          <span>{progress} of 3 complete</span>
          <Progress value={(progress / 3) * 100} aria-label={`${progress} of 3 setup steps complete`} />
        </div>
      </div>
      <div className="first-run-steps">
        <div className={done[0] ? "first-run-step is-done" : "first-run-step is-current"}>
          <span className="first-run-number">{done[0] ? <Check /> : "01"}</span>
          <div><h3>Record your first transaction</h3><p>Add income or a recent expense to start your ledger.</p></div>
          <Button size="sm" variant={done[0] ? "outline" : "default"} onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> Add transaction
          </Button>
        </div>
        <div className={done[1] ? "first-run-step is-done" : "first-run-step"}>
          <span className="first-run-number">{done[1] ? <Check /> : "02"}</span>
          <div><h3>Set a spending limit</h3><p>Choose a monthly budget for one category.</p></div>
          <Button asChild size="sm" variant="outline"><Link to="/budgets">Create budget <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className={done[2] ? "first-run-step is-done" : "first-run-step"}>
          <span className="first-run-number">{done[2] ? <Check /> : "03"}</span>
          <div><h3>Name a savings goal</h3><p>Give your next milestone a target and a date.</p></div>
          <Button asChild size="sm" variant="outline"><Link to="/goals">Add a goal <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </div>
      <button type="button" className="first-run-dismiss" onClick={dismiss}>Skip setup</button>
    </section>
  );
}