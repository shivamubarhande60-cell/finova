import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "../utils";
import { buildDemoLedger } from "./seed";
import { advanceRecurringDate } from "./compute";
import { LIMITS, sanitizeAmount, sanitizeDate, sanitizeText } from "./sanitize";
import type {
  Account,
  Budget,
  Currency,
  Goal,
  Period,
  Recurring,
  Settings,
  Transaction,
} from "./types";

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: Recurring[];
  settings: Settings;
  period: Period;
  formOpen: boolean;
  editingId: string | null;
  setPeriod: (period: Period) => void;
  setName: (displayName: string) => void;
  setCurrency: (currency: Currency) => void;
  openForm: (id?: string) => void;
  closeForm: () => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addMany: (txs: Omit<Transaction, "id">[]) => void;
  addBudget: (b: Omit<Budget, "id">) => void;
  updateBudget: (id: string, patch: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeGoal: (id: string, amount: number) => void;
  addRecurring: (r: Omit<Recurring, "id">) => void;
  deleteRecurring: (id: string) => void;
  logRecurring: (id: string) => void;
  loadDemo: () => void;
  resetEmpty: () => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
}

const demo = buildDemoLedger();

const emptySettings: Settings = {
  currency: "INR",
  displayName: "Ankit",
  onboarded: true,
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...demo,
      settings: emptySettings,
      period: "this-month",
      formOpen: false,
      editingId: null,
      setPeriod: (period) => set({ period }),
      setName: (displayName) =>
        set({ settings: { ...get().settings, displayName: sanitizeText(displayName, 40) } }),
      setCurrency: (currency) =>
        set({ settings: { ...get().settings, currency } }),
      openForm: (id) => set({ formOpen: true, editingId: id ?? null }),
      closeForm: () => set({ formOpen: false, editingId: null }),
      addTransaction: (tx) => {
        const amount = sanitizeAmount(tx.amount);
        if (amount == null) return;
        const next = {
          ...tx,
          id: uid("tx"),
          amount,
          description: sanitizeText(tx.description, 80) || "Expense",
          category: sanitizeText(tx.category, 40) || "Other",
          date: sanitizeDate(tx.date),
          notes: tx.notes ? sanitizeText(tx.notes, 160) : undefined,
        };
        set({ transactions: [next, ...get().transactions].slice(0, LIMITS.MAX_TX) });
      },
      updateTransaction: (id, patch) =>
        set({
          transactions: get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),
      deleteTransaction: (id) =>
        set({ transactions: get().transactions.filter((t) => t.id !== id) }),
      addMany: (txs) =>
        set({
          transactions: [
            ...txs.slice(0, LIMITS.MAX_TX).map((t) => ({
              ...t,
              id: uid("tx"),
              amount: sanitizeAmount(t.amount) ?? 0,
              description: sanitizeText(t.description, 80) || "Imported",
              category: sanitizeText(t.category, 40) || "Other",
              date: sanitizeDate(t.date),
              notes: t.notes ? sanitizeText(t.notes, 160) : undefined,
            })).filter((t) => t.amount > 0),
            ...get().transactions,
          ].slice(0, LIMITS.MAX_TX),
        }),
      addBudget: (b) => set({ budgets: [...get().budgets, { ...b, id: uid("bd") }] }),
      updateBudget: (id, patch) =>
        set({
          budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }),
      deleteBudget: (id) => set({ budgets: get().budgets.filter((b) => b.id !== id) }),
      addGoal: (g) => set({ goals: [...get().goals, { ...g, id: uid("gl") }] }),
      updateGoal: (id, patch) =>
        set({
          goals: get().goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }),
      deleteGoal: (id) => set({ goals: get().goals.filter((g) => g.id !== id) }),
      contributeGoal: (id, amount) =>
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g,
          ),
        }),
      addRecurring: (r) =>
        set({ recurring: [...get().recurring, { ...r, id: uid("rc") }] }),
      deleteRecurring: (id) =>
        set({ recurring: get().recurring.filter((r) => r.id !== id) }),
      logRecurring: (id) => {
        const item = get().recurring.find((r) => r.id === id);
        if (!item) return;
        get().addTransaction({
          amount: item.amount,
          type: item.type,
          description: item.description,
          category: item.category,
          date: item.nextDate,
          accountId: item.accountId,
          recurringId: item.id,
        });
        set({
          recurring: get().recurring.map((r) =>
            r.id === id ? { ...r, nextDate: advanceRecurringDate(r.nextDate, r.cadence) } : r,
          ),
        });
      },
      loadDemo: () => {
        const next = buildDemoLedger();
        set({
          ...next,
          settings: { ...get().settings, onboarded: true, displayName: get().settings.displayName || "Ankit" },
        });
      },
      resetEmpty: () =>
        set({
          accounts: [
            { id: "acc_checking", name: "Everyday", kind: "checking", openingBalance: 0 },
            { id: "acc_savings", name: "Reserve", kind: "savings", openingBalance: 0 },
            { id: "acc_cash", name: "Wallet", kind: "cash", openingBalance: 0 },
          ],
          transactions: [],
          budgets: [],
          goals: [],
          recurring: [],
          settings: { ...get().settings, onboarded: true },
        }),
      exportJson: () => {
        const { accounts, transactions, budgets, goals, recurring, settings } = get();
        return JSON.stringify(
          { accounts, transactions, budgets, goals, recurring, settings },
          null,
          2,
        );
      },
      importJson: (raw) => {
        try {
          if (raw.length > 2_000_000) return false;
          const data = JSON.parse(raw) as Partial<FinanceState>;
          if (!Array.isArray(data.transactions)) return false;
          const currency = data.settings?.currency;
          set({
            accounts: Array.isArray(data.accounts) ? data.accounts.slice(0, 20) : get().accounts,
            transactions: data.transactions.slice(0, LIMITS.MAX_TX),
            budgets: Array.isArray(data.budgets) ? data.budgets.slice(0, LIMITS.MAX_LIST) : [],
            goals: Array.isArray(data.goals) ? data.goals.slice(0, LIMITS.MAX_LIST) : [],
            recurring: Array.isArray(data.recurring) ? data.recurring.slice(0, LIMITS.MAX_LIST) : [],
            settings: {
              ...get().settings,
              displayName: sanitizeText(data.settings?.displayName ?? get().settings.displayName, 40),
              currency: currency === "USD" || currency === "EUR" || currency === "GBP" || currency === "INR" ? currency : get().settings.currency,
              onboarded: true,
            },
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "finova-ledger-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        accounts: s.accounts,
        transactions: s.transactions,
        budgets: s.budgets,
        goals: s.goals,
        recurring: s.recurring,
        settings: s.settings,
        period: s.period,
      }),
    },
  ),
);
