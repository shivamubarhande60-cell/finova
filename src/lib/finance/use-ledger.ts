import { useMemo } from "react";
import {
  accountBalance,
  budgetRows,
  categoryTotals,
  compactSnapshot,
  filterPeriod,
  financialPulse,
  monthlyBurn,
  monthlySeries,
  netWorth,
  runwayMonths,
  savingsRate,
  split503020,
  sumBy,
  upcomingRecurring,
} from "./compute";
import { useFinanceStore } from "./store";

export function useLedger() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const recurring = useFinanceStore((s) => s.recurring);
  const period = useFinanceStore((s) => s.period);
  const settings = useFinanceStore((s) => s.settings);

  return useMemo(() => {
    const scoped = filterPeriod(transactions, period);
    const income = sumBy(scoped, "income");
    const expense = sumBy(scoped, "expense");
    const worth = netWorth(accounts, transactions);
    const burn = monthlyBurn(transactions);
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const rows = budgetRows(budgets, transactions);
    const rate = savingsRate(income, expense);
    const runway = runwayMonths(worth, burn);
    return {
      accounts,
      transactions: sorted,
      budgets,
      goals,
      recurring,
      period,
      settings,
      scoped,
      income,
      expense,
      flow: income - expense,
      worth,
      savingsRate: rate,
      burn,
      runway,
      series: monthlySeries(transactions),
      categories: categoryTotals(scoped, "expense"),
      budgetRows: rows,
      pulse: financialPulse(rate, rows, runway),
      split: split503020(scoped),
      upcoming: upcomingRecurring(recurring),
      balances: accounts.map((a) => ({ ...a, balance: accountBalance(a, transactions) })),
      snapshot: compactSnapshot({
        accounts,
        transactions,
        budgets,
        goals,
        recurring,
        period,
        currency: settings.currency,
        name: settings.displayName,
      }),
    };
  }, [accounts, transactions, budgets, goals, recurring, period, settings]);
}
