import type { Account, Budget, Goal, Recurring, Transaction } from "./types";

function monthDate(monthsAgo: number, day: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function futureDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function txId(monthsAgo: number, day: number, description: string) {
  return `tx-${monthsAgo}-${day}-${description.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`;
}

export function buildDemoLedger() {
  const checking: Account = {
    id: "acc_checking",
    name: "Everyday",
    kind: "checking",
    openingBalance: 31800,
  };
  const savings: Account = {
    id: "acc_savings",
    name: "Reserve",
    kind: "savings",
    openingBalance: 62450,
  };
  const cash: Account = {
    id: "acc_cash",
    name: "Wallet",
    kind: "cash",
    openingBalance: 2200,
  };
  const accounts = [checking, savings, cash];

  const txs: Transaction[] = [];
  const add = (
    monthsAgo: number,
    day: number,
    type: Transaction["type"],
    amount: number,
    description: string,
    category: string,
    accountId = checking.id,
  ) => {
    const date = monthDate(monthsAgo, day);
    if (!date) return;
    txs.push({
      id: txId(monthsAgo, day, description),
      amount,
      type,
      description,
      category,
      date,
      accountId,
    });
  };

  for (const m of [0, 1, 2, 3, 4]) {
    const jitter = (n: number, spread = 0.08) =>
      Math.round(n * (1 + ((m * 17) % 7) * 0.01 - spread / 2) * 100) / 100;
    add(m, 1, "income", jitter(64000, 0), "Northwind salary", "Salary");
    add(m, 1, "expense", 19200, "Rent — Oak & Pine", "Housing");
    add(m, 2, "expense", jitter(880), "Whole Foods", "Groceries");
    add(m, 3, "expense", 320, "Metro card", "Transport");
    add(m, 4, "expense", jitter(65, 0.2), "Blue Tokai Coffee", "Coffee", cash.id);
    add(m, 5, "expense", 480, "River Gym", "Healthcare");
    add(m, 6, "expense", 649, "Netflix", "Subscriptions");
    add(m, 8, "expense", jitter(610), "Trader Joe's", "Groceries");
    add(m, 9, "expense", jitter(280), "Uber downtown", "Transport");
    add(m, 11, "expense", jitter(540), "Dinner at Barra", "Dining");
    add(m, 12, "expense", jitter(460), "Shell", "Transport");
    add(m, 14, "expense", jitter(340), "Farmers market", "Groceries", cash.id);
    add(m, 16, "expense", jitter(420), "Cut & Co", "Personal care");
    add(m, 18, "expense", 119, "Spotify Premium", "Subscriptions");
    add(m, 19, "expense", jitter(170), "Lunch — Hearth", "Dining");
    add(m, 20, "expense", jitter(910), "City Electric", "Utilities");
    add(m, 21, "expense", jitter(280), "Bookshop", "Shopping");
    if (m === 0 || m === 2) add(m, 10, "income", 14500, "Studio invoice — Lumen", "Freelance");
    if (m === 1) add(m, 22, "expense", 1860, "Weekend in Hudson", "Travel");
    if (m === 2) add(m, 7, "expense", 2400, "New running shoes", "Shopping");
    if (m === 3) add(m, 15, "income", 3200, "Tax refund", "Refunds");
    add(m, 27, "expense", jitter(720), "Pharmacy & household", "Healthcare");
  }

  add(0, 7, "expense", 399, "Amazon — desk lamp", "Shopping");
  add(0, 13, "expense", 224, "CVS", "Healthcare");
  add(0, 15, "expense", 1249, "Zepto groceries", "Groceries");
  add(0, 17, "expense", 85, "Coffee cart", "Coffee", cash.id);
  add(0, 22, "expense", 480, "Dinner with Maya", "Dining");

  const budgets: Budget[] = [
    { id: "bd_housing", category: "Housing", amount: 19200 },
    { id: "bd_groceries", category: "Groceries", amount: 4200 },
    { id: "bd_dining", category: "Dining", amount: 2200 },
    { id: "bd_transport", category: "Transport", amount: 1800 },
    { id: "bd_subs", category: "Subscriptions", amount: 900 },
    { id: "bd_shopping", category: "Shopping", amount: 1600 },
    { id: "bd_utilities", category: "Utilities", amount: 1200 },
  ];

  const goals: Goal[] = [
    {
      id: "gl_emergency",
      name: "Emergency fund",
      target: 75000,
      saved: 45200,
      deadline: `${new Date().getFullYear()}-12-31`,
    },
    {
      id: "gl_kyoto",
      name: "Japan 2027",
      target: 120000,
      saved: 62400,
      deadline: `${new Date().getFullYear() + 1}-03-15`,
    },
    {
      id: "gl_monitors",
      name: "Studio monitors",
      target: 8900,
      saved: 3100,
    },
  ];

  const recurring: Recurring[] = [
    {
      id: "rc_rent",
      description: "Rent — Oak & Pine",
      amount: 19200,
      type: "expense",
      category: "Housing",
      cadence: "monthly",
      nextDate: futureDate(8),
      accountId: checking.id,
    },
    {
      id: "rc_salary",
      description: "Northwind salary",
      amount: 64000,
      type: "income",
      category: "Salary",
      cadence: "monthly",
      nextDate: futureDate(8),
      accountId: checking.id,
    },
    {
      id: "rc_netflix",
      description: "Netflix",
      amount: 649,
      type: "expense",
      category: "Subscriptions",
      cadence: "monthly",
      nextDate: futureDate(1),
      accountId: checking.id,
    },
    {
      id: "rc_spotify",
      description: "Spotify Premium",
      amount: 119,
      type: "expense",
      category: "Subscriptions",
      cadence: "monthly",
      nextDate: futureDate(4),
      accountId: checking.id,
    },
    {
      id: "rc_gym",
      description: "Adobe Creative Cloud",
      amount: 1675,
      type: "expense",
      category: "Subscriptions",
      cadence: "monthly",
      nextDate: futureDate(12),
      accountId: checking.id,
    },
  ];

  return { accounts, transactions: txs, budgets, goals, recurring };
}
