import { startOfMonth, endOfMonth, subMonths, subDays, startOfYear, parseISO } from "date-fns";
import { categoryGroup } from "./categories";
import type { Account, Budget, Goal, Period, Recurring, Transaction } from "./types";
import { isoDate, todayIso } from "../utils";

export function inPeriod(dateIso: string, period: Period, now = new Date()) {
  const d = parseISO(dateIso);
  if (Number.isNaN(d.getTime())) return false;
  switch (period) {
    case "this-month":
      return d >= startOfMonth(now) && d <= endOfMonth(now);
    case "last-month": {
      const last = subMonths(now, 1);
      return d >= startOfMonth(last) && d <= endOfMonth(last);
    }
    case "30d":
      return d >= subDays(now, 30) && d <= now;
    case "90d":
      return d >= subDays(now, 90) && d <= now;
    case "ytd":
      return d >= startOfYear(now) && d <= now;
    case "all":
      return true;
  }
}

export function filterPeriod(txs: Transaction[], period: Period) {
  return txs.filter((t) => inPeriod(t.date, period));
}

export function sumBy(txs: Transaction[], type: Transaction["type"]) {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

export function accountBalance(account: Account, txs: Transaction[]) {
  const related = txs.filter((t) => t.accountId === account.id);
  const income = sumBy(related, "income");
  const expense = sumBy(related, "expense");
  return account.openingBalance + income - expense;
}

export function netWorth(accounts: Account[], txs: Transaction[]) {
  return accounts.reduce((s, a) => s + accountBalance(a, txs), 0);
}

export function categoryTotals(txs: Transaction[], type: Transaction["type"]) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function monthlySeries(txs: Transaction[], months = 6, now = new Date()) {
  const buckets: { key: string; label: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(startOfMonth(now), i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    buckets.push({ key, label, income: 0, expense: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const t of txs) {
    const key = t.date.slice(0, 7);
    const i = index.get(key);
    if (i === undefined) continue;
    if (t.type === "income") buckets[i].income += t.amount;
    else buckets[i].expense += t.amount;
  }
  return buckets;
}

export function budgetRows(budgets: Budget[], txs: Transaction[], period: Period = "this-month") {
  const scoped = filterPeriod(txs, period).filter((t) => t.type === "expense");
  return budgets
    .map((b) => {
      const spent = scoped
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.amount <= 0 ? 0 : (spent / b.amount) * 100;
      return { ...b, spent, remaining: b.amount - spent, pct };
    })
    .sort((a, b) => b.pct - a.pct);
}

export function split503020(txs: Transaction[]) {
  const income = sumBy(txs, "income");
  const expenses = txs.filter((t) => t.type === "expense");
  const need = expenses.filter((t) => categoryGroup(t.category) === "need").reduce((s, t) => s + t.amount, 0);
  const want = expenses.filter((t) => categoryGroup(t.category) === "want").reduce((s, t) => s + t.amount, 0);
  const save = Math.max(0, income - sumBy(txs, "expense")) +
    expenses.filter((t) => categoryGroup(t.category) === "save").reduce((s, t) => s + t.amount, 0);
  return {
    income,
    need,
    want,
    save,
    needPct: income ? (need / income) * 100 : 0,
    wantPct: income ? (want / income) * 100 : 0,
    savePct: income ? (save / income) * 100 : 0,
  };
}

export function savingsRate(income: number, expense: number) {
  if (income <= 0) return 0;
  return ((income - expense) / income) * 100;
}

export function monthlyBurn(txs: Transaction[], now = new Date()) {
  const last30 = txs.filter((t) => inPeriod(t.date, "30d", now) && t.type === "expense");
  return last30.reduce((s, t) => s + t.amount, 0);
}

export function runwayMonths(worth: number, burn: number) {
  if (burn <= 0) return Infinity;
  return worth / burn;
}

export function upcomingRecurring(items: Recurring[], days = 21) {
  const today = todayIso();
  const limit = isoDate(subDays(new Date(), -days));
  return [...items]
    .filter((r) => r.nextDate >= today && r.nextDate <= limit)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

export function advanceRecurringDate(nextDate: string, cadence: Recurring["cadence"]) {
  const d = parseISO(nextDate);
  if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return isoDate(d);
}

export function goalProgress(goal: Goal) {
  if (goal.target <= 0) return 0;
  return Math.min(100, (goal.saved / goal.target) * 100);
}

export function financialPulse(
  savingsRatePct: number,
  rows: { pct: number }[],
  runway: number,
) {
  const over = rows.filter((b) => b.pct > 100).length;
  const near = rows.filter((b) => b.pct > 85 && b.pct <= 100).length;
  if (over >= 2 || savingsRatePct < 0) {
    return { label: "Stressed", detail: "Cash flow is under pressure this period.", tone: "expense" as const };
  }
  if (savingsRatePct >= 18 && over === 0 && (Number.isFinite(runway) ? runway >= 3 : true)) {
    return { label: "Healthy", detail: "On track this month.", tone: "income" as const };
  }
  if (near || over === 1) {
    return { label: "Watch", detail: "A budget is close to the line.", tone: "warn" as const };
  }
  return { label: "Steady", detail: "No acute leaks detected.", tone: "income" as const };
}


export function compactSnapshot(input: {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: Recurring[];
  period: Period;
  currency: string;
  name: string;
}) {
  const scoped = filterPeriod(input.transactions, input.period);
  const income = sumBy(scoped, "income");
  const expense = sumBy(scoped, "expense");
  const worth = netWorth(input.accounts, input.transactions);
  const cats = categoryTotals(scoped, "expense").slice(0, 6);
  const budgets = budgetRows(input.budgets, input.transactions).map((b) => ({
    category: b.category,
    limit: b.amount,
    spent: Math.round(b.spent * 100) / 100,
    pct: Math.round(b.pct),
  }));
  const recent = [...input.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 18)
    .map((t) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
    }));
  return {
    person: input.name,
    currency: input.currency,
    period: input.period,
    netWorth: Math.round(worth * 100) / 100,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    cashFlow: Math.round((income - expense) * 100) / 100,
    savingsRate: Math.round(savingsRate(income, expense)),
    topCategories: cats,
    budgets,
    goals: input.goals.map((g) => ({
      name: g.name,
      saved: g.saved,
      target: g.target,
      deadline: g.deadline,
    })),
    upcomingBills: upcomingRecurring(input.recurring).map((r) => ({
      description: r.description,
      amount: r.amount,
      nextDate: r.nextDate,
      type: r.type,
    })),
    recent,
  };
}

export function toCsv(txs: Transaction[]) {
  const header = "Date,Type,Category,Description,Amount,AccountId,Notes";
  const rows = [...txs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) =>
      [t.date, t.type, csv(t.category), csv(t.description), t.amount.toFixed(2), t.accountId, csv(t.notes ?? "")].join(
        ",",
      ),
    );
  return [header, ...rows].join("\n");
}

function csv(value: string) {
  const safe = /^[=+\-@|\t]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

export function fromCsv(text: string, fallbackAccountId: string): Omit<Transaction, "id">[] {
  if (text.length > 1_000_000) return [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2 || lines.length > 9000) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const iDate = idx("date");
  const iType = idx("type");
  const iCat = idx("category");
  const iDesc = idx("description");
  const iAmt = idx("amount");
  const iNotes = idx("notes");
  const out: Omit<Transaction, "id">[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const amount = Number(String(cols[iAmt] ?? "").replace(/,/g, ""));
    const type = (cols[iType] ?? "expense").toLowerCase() === "income" ? "income" : "expense";
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) continue;
    if (out.length >= 8000) break;
    const description = String(cols[iDesc] || "Imported")
      .replace(/^['=+\-@|\t]+/, "")
      .replace(/[<>]/g, "")
      .slice(0, 80);
    out.push({
      date: /^\d{4}-\d{2}-\d{2}$/.test(cols[iDate] ?? "") ? cols[iDate]!.slice(0, 10) : todayIso(),
      type,
      category: String(cols[iCat] || "Other").replace(/[<>]/g, "").slice(0, 40),
      description: description || "Imported",
      amount: Math.round(amount * 100) / 100,
      accountId: fallbackAccountId,
      notes: iNotes >= 0 ? String(cols[iNotes] ?? "").replace(/^['=+\-@|\t]+/, "").slice(0, 160) : undefined,
    });
  }
  return out;
}

function splitCsvLine(line: string) {
  const cols: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      cols.push(cur);
      cur = "";
    } else cur += ch;
  }
  cols.push(cur);
  return cols;
}
