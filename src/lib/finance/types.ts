export type Currency = "USD" | "INR" | "EUR" | "GBP";

export type TxType = "income" | "expense";

export type AccountKind = "checking" | "savings" | "cash";

export type Period = "this-month" | "last-month" | "30d" | "90d" | "ytd" | "all";

export type NeedWantSave = "need" | "want" | "save";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  description: string;
  category: string;
  date: string;
  accountId: string;
  notes?: string;
  recurringId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
}

export interface Recurring {
  id: string;
  description: string;
  amount: number;
  type: TxType;
  category: string;
  cadence: "weekly" | "monthly";
  nextDate: string;
  accountId: string;
}

export interface Settings {
  currency: Currency;
  displayName: string;
  onboarded: boolean;
}

export interface LedgerSnapshot {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: Recurring[];
  settings: Settings;
}
