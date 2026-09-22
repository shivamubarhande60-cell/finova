import { todayIso } from "../utils";
import { CATEGORIES, categoriesFor } from "./categories";
import type { TxType } from "./types";

export interface ParsedCapture {
  amount: number;
  type: TxType;
  description: string;
  category: string;
  date: string;
  notes?: string;
  confidence: number;
}

const INCOME_HINT = /salary|paycheck|invoice|freelance|deposit|refund|paid me|client paid|dividend|bonus/i;

export function localParse(text: string): ParsedCapture | null {
  const raw = text.trim();
  if (!raw) return null;
  const amountMatch = raw.match(/(?:\$|₹|€|£)?\s*(\d+(?:[.,]\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(",", ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const type: TxType = INCOME_HINT.test(raw) ? "income" : "expense";
  const lower = raw.toLowerCase();
  const hit = CATEGORIES.filter((c) => c.type === type).find((c) =>
    lower.includes(c.name.toLowerCase().split(" ")[0]!),
  );
  const keywordMap: Array<[RegExp, string]> = [
    [/rent|mortgage|landlord/i, "Housing"],
    [/grocery|groceries|whole foods|trader|market|aldi|lidl/i, "Groceries"],
    [/uber|lyft|metro|gas|fuel|parking|transit/i, "Transport"],
    [/netflix|spotify|icloud|prime|subscription/i, "Subscriptions"],
    [/coffee|starbucks|blue bottle/i, "Coffee"],
    [/dinner|lunch|restaurant|bar|pizza|takeout/i, "Dining"],
    [/amazon|store|clothes|shopping/i, "Shopping"],
    [/flight|hotel|airbnb|trip/i, "Travel"],
    [/gym|pharmacy|doctor|dentist|hospital/i, "Healthcare"],
    [/electric|water|internet|wifi|utility/i, "Utilities"],
    [/salary|paycheck/i, "Salary"],
    [/freelance|invoice|client/i, "Freelance"],
  ];
  let category = hit?.name ?? (type === "income" ? "Other income" : "Other");
  for (const [re, name] of keywordMap) {
    if (re.test(raw) && categoriesFor(type).includes(name)) {
      category = name;
      break;
    }
  }

  let date = todayIso();
  if (/yesterday/i.test(raw)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().slice(0, 10);
  }

  const description = raw
    .replace(amountMatch[0], "")
    .replace(/\b(yesterday|today|paid|spent|for|on|at)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || (type === "income" ? "Income" : "Expense");

  return { amount, type, description, category, date, confidence: 0.45 };
}
