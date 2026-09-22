import type { NeedWantSave, TxType } from "./types";

export interface CategoryDef {
  name: string;
  type: TxType;
  group: NeedWantSave;
}

export const CATEGORIES: CategoryDef[] = [
  { name: "Salary", type: "income", group: "save" },
  { name: "Freelance", type: "income", group: "save" },
  { name: "Investments", type: "income", group: "save" },
  { name: "Refunds", type: "income", group: "save" },
  { name: "Other income", type: "income", group: "save" },
  { name: "Housing", type: "expense", group: "need" },
  { name: "Groceries", type: "expense", group: "need" },
  { name: "Utilities", type: "expense", group: "need" },
  { name: "Transport", type: "expense", group: "need" },
  { name: "Healthcare", type: "expense", group: "need" },
  { name: "Insurance", type: "expense", group: "need" },
  { name: "Education", type: "expense", group: "need" },
  { name: "Dining", type: "expense", group: "want" },
  { name: "Coffee", type: "expense", group: "want" },
  { name: "Shopping", type: "expense", group: "want" },
  { name: "Entertainment", type: "expense", group: "want" },
  { name: "Subscriptions", type: "expense", group: "want" },
  { name: "Travel", type: "expense", group: "want" },
  { name: "Personal care", type: "expense", group: "want" },
  { name: "Gifts", type: "expense", group: "want" },
  { name: "Savings transfer", type: "expense", group: "save" },
  { name: "Other", type: "expense", group: "need" },
];

export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === "income").map(
  (c) => c.name,
);
export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === "expense").map(
  (c) => c.name,
);

export function categoryGroup(name: string): NeedWantSave {
  return CATEGORIES.find((c) => c.name === name)?.group ?? "need";
}

export function categoriesFor(type: TxType) {
  return CATEGORIES.filter((c) => c.type === type).map((c) => c.name);
}
