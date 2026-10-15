import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  sanitizeAmount,
  sanitizeDate,
  sanitizeText,
} from "@/lib/finance/sanitize";
import type {
  Account,
  Budget,
  Currency,
  Goal,
  Recurring,
  Settings,
  Transaction,
} from "@/lib/finance/types";

const currencies = new Set<Currency>(["USD", "INR", "EUR", "GBP"]);
const accountKinds = new Set<Account["kind"]>([
  "checking",
  "savings",
  "cash",
]);
const txTypes = new Set<Transaction["type"]>(["income", "expense"]);
const cadences = new Set<Recurring["cadence"]>(["weekly", "monthly"]);

function cleanId(value: unknown) {
  const id = String(value ?? "").trim();
  return id.length > 0 && id.length <= 100 ? id : null;
}

function cleanCurrency(value: unknown): Currency {
  return currencies.has(value as Currency) ? (value as Currency) : "INR";
}

/**
 * Load the complete finance snapshot for the authenticated user.
 *
 * IMPORTANT:
 * Every query is scoped by context.userId.
 */
export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const userId = context.userId;

    const [
      accountRows,
      transactionRows,
      budgetRows,
      goalRows,
      recurringRows,
      settingsRows,
    ] = await Promise.all([
      sql<AccountRow>`
        select
          id,
          name,
          kind,
          opening_balance
        from finance_account
        where user_id = ${userId}
        order by created_at asc
      `,

      sql<TransactionRow>`
        select
          id,
          amount,
          type,
          description,
          category,
          date,
          account_id,
          notes,
          recurring_id
        from transaction
        where user_id = ${userId}
        order by date desc, created_at desc
        limit 8000
      `,

      sql<BudgetRow>`
        select id, category, amount
        from budget
        where user_id = ${userId}
        order by created_at asc
      `,

      sql<GoalRow>`
        select id, name, target, saved, deadline
        from goal
        where user_id = ${userId}
        order by created_at asc
      `,

      sql<RecurringRow>`
        select
          id,
          description,
          amount,
          type,
          category,
          cadence,
          next_date,
          account_id
        from recurring
        where user_id = ${userId}
        order by next_date asc
      `,

      sql<SettingsRow>`
        select currency, display_name, onboarded
        from finance_settings
        where user_id = ${userId}
        limit 1
      `,
    ]);

    const settingsRow = settingsRows[0];

    return {
      accounts: accountRows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
        openingBalance: Number(row.opening_balance),
      })),

      transactions: transactionRows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        type: row.type,
        description: row.description,
        category: row.category,
        date: row.date,
        accountId: row.account_id,
        notes: row.notes ?? undefined,
        recurringId: row.recurring_id ?? undefined,
      })),

      budgets: budgetRows.map((row) => ({
        id: row.id,
        category: row.category,
        amount: Number(row.amount),
      })),

      goals: goalRows.map((row) => ({
        id: row.id,
        name: row.name,
        target: Number(row.target),
        saved: Number(row.saved),
        deadline: row.deadline ?? undefined,
      })),

      recurring: recurringRows.map((row) => ({
        id: row.id,
        description: row.description,
        amount: Number(row.amount),
        type: row.type,
        category: row.category,
        cadence: row.cadence,
        nextDate: row.next_date,
        accountId: row.account_id,
      })),

      settings: {
        currency: cleanCurrency(settingsRow?.currency),
        displayName: settingsRow?.display_name ?? "Ankit",
        onboarded: Boolean(settingsRow?.onboarded),
      },
    };
  });

export const saveAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Omit<Account, "id"> & { id?: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    const name = sanitizeText(data.name, 80);
    const openingBalance = sanitizeAmount(
      data.openingBalance,
      1_000_000_000,
    ) ?? 0;

    if (!name) throw new Error("Account name is required");
    if (!accountKinds.has(data.kind)) throw new Error("Invalid account type");

    const sql = await getSql();

    if (id) {
      const rows = await sql<AccountRow>`
        update finance_account
        set
          name = ${name},
          kind = ${data.kind},
          opening_balance = ${openingBalance},
          updated_at = current_timestamp
        where id = ${id}
          and user_id = ${context.userId}
        returning id, name, kind, opening_balance
      `;

      if (!rows[0]) throw new Error("Account not found");
      return {
        id: rows[0].id,
        name: rows[0].name,
        kind: rows[0].kind,
        openingBalance: Number(rows[0].opening_balance),
      };
    }

    const newId = crypto.randomUUID();

    const rows = await sql<AccountRow>`
      insert into finance_account
        (id, user_id, name, kind, opening_balance)
      values
        (${newId}, ${context.userId}, ${name}, ${data.kind}, ${openingBalance})
      returning id, name, kind, opening_balance
    `;

    return {
      id: rows[0]!.id,
      name: rows[0]!.name,
      kind: rows[0]!.kind,
      openingBalance: Number(rows[0]!.opening_balance),
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    if (!id) throw new Error("Invalid account");

    const sql = await getSql();

    await sql`
      delete from finance_account
      where id = ${id}
        and user_id = ${context.userId}
    `;

    return { ok: true };
  });

export const saveTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (
      input: Omit<Transaction, "id"> & {
        id?: string;
      },
    ) => input,
  )
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    const amount = sanitizeAmount(data.amount);

    if (amount == null) throw new Error("Invalid transaction amount");

    const description =
      sanitizeText(data.description, 80) || "Expense";
    const category =
      sanitizeText(data.category, 40) || "Other";
    const date = sanitizeDate(data.date);
    const accountId = cleanId(data.accountId);

    if (!accountId) throw new Error("Account is required");
    if (!txTypes.has(data.type)) throw new Error("Invalid transaction type");

    const notes = data.notes
      ? sanitizeText(data.notes, 160)
      : null;

    const recurringId = data.recurringId
      ? cleanId(data.recurringId)
      : null;

    const sql = await getSql();

    // Verify that the account belongs to the authenticated user.
    const account = await sql<{ id: string }>`
      select id
      from finance_account
      where id = ${accountId}
        and user_id = ${context.userId}
      limit 1
    `;

    if (!account[0]) throw new Error("Account not found");

    if (id) {
      const rows = await sql<TransactionRow>`
        update transaction
        set
          amount = ${amount},
          type = ${data.type},
          description = ${description},
          category = ${category},
          date = ${date},
          account_id = ${accountId},
          notes = ${notes},
          recurring_id = ${recurringId},
          updated_at = current_timestamp
        where id = ${id}
          and user_id = ${context.userId}
        returning
          id,
          amount,
          type,
          description,
          category,
          date,
          account_id,
          notes,
          recurring_id
      `;

      if (!rows[0]) throw new Error("Transaction not found");

      return transactionFromRow(rows[0]);
    }

    const newId = crypto.randomUUID();

    const rows = await sql<TransactionRow>`
      insert into transaction
        (
          id,
          user_id,
          account_id,
          amount,
          type,
          description,
          category,
          date,
          notes,
          recurring_id
        )
      values
        (
          ${newId},
          ${context.userId},
          ${accountId},
          ${amount},
          ${data.type},
          ${description},
          ${category},
          ${date},
          ${notes},
          ${recurringId}
        )
      returning
        id,
        amount,
        type,
        description,
        category,
        date,
        account_id,
        notes,
        recurring_id
    `;

    return transactionFromRow(rows[0]!);
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    if (!id) throw new Error("Invalid transaction");

    const sql = await getSql();

    await sql`
      delete from transaction
      where id = ${id}
        and user_id = ${context.userId}
    `;

    return { ok: true };
  });

export const saveBudget = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: Omit<Budget, "id"> & { id?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    const category = sanitizeText(data.category, 40);
    const amount = sanitizeAmount(data.amount);

    if (!category) throw new Error("Budget category is required");
    if (amount == null) throw new Error("Invalid budget amount");

    const sql = await getSql();

    if (id) {
      const rows = await sql<BudgetRow>`
        update budget
        set
          category = ${category},
          amount = ${amount},
          updated_at = current_timestamp
        where id = ${id}
          and user_id = ${context.userId}
        returning id, category, amount
      `;

      if (!rows[0]) throw new Error("Budget not found");

      return {
        id: rows[0].id,
        category: rows[0].category,
        amount: Number(rows[0].amount),
      };
    }

    const newId = crypto.randomUUID();

    const rows = await sql<BudgetRow>`
      insert into budget
        (id, user_id, category, amount)
      values
        (${newId}, ${context.userId}, ${category}, ${amount})
      returning id, category, amount
    `;

    return {
      id: rows[0]!.id,
      category: rows[0]!.category,
      amount: Number(rows[0]!.amount),
    };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    if (!id) throw new Error("Invalid budget");

    const sql = await getSql();

    await sql`
      delete from budget
      where id = ${id}
        and user_id = ${context.userId}
    `;

    return { ok: true };
  });

export const saveGoal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: Omit<Goal, "id"> & { id?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    const name = sanitizeText(data.name, 80);
    const target = sanitizeAmount(data.target);
    const saved = sanitizeAmount(data.saved ?? 0) ?? 0;
    const deadline = data.deadline ? sanitizeDate(data.deadline) : null;

    if (!name) throw new Error("Goal name is required");
    if (target == null) throw new Error("Invalid goal target");
    if (saved > target) throw new Error("Saved amount exceeds target");

    const sql = await getSql();

    if (id) {
      const rows = await sql<GoalRow>`
        update goal
        set
          name = ${name},
          target = ${target},
          saved = ${saved},
          deadline = ${deadline},
          updated_at = current_timestamp
        where id = ${id}
          and user_id = ${context.userId}
        returning id, name, target, saved, deadline
      `;

      if (!rows[0]) throw new Error("Goal not found");

      return goalFromRow(rows[0]);
    }

    const newId = crypto.randomUUID();

    const rows = await sql<GoalRow>`
      insert into goal
        (id, user_id, name, target, saved, deadline)
      values
        (${newId}, ${context.userId}, ${name}, ${target}, ${saved}, ${deadline})
      returning id, name, target, saved, deadline
    `;

    return goalFromRow(rows[0]!);
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    if (!id) throw new Error("Invalid goal");

    const sql = await getSql();

    await sql`
      delete from goal
      where id = ${id}
        and user_id = ${context.userId}
    `;

    return { ok: true };
  });

export const saveRecurring = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: Omit<Recurring, "id"> & { id?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    const accountId = cleanId(data.accountId);
    const description = sanitizeText(data.description, 80);
    const amount = sanitizeAmount(data.amount);
    const category = sanitizeText(data.category, 40);
    const nextDate = sanitizeDate(data.nextDate);

    if (!accountId) throw new Error("Account is required");
    if (!description) throw new Error("Description is required");
    if (amount == null) throw new Error("Invalid recurring amount");
    if (!category) throw new Error("Category is required");
    if (!txTypes.has(data.type)) throw new Error("Invalid transaction type");
    if (!cadences.has(data.cadence)) throw new Error("Invalid cadence");

    const sql = await getSql();

    const account = await sql<{ id: string }>`
      select id
      from finance_account
      where id = ${accountId}
        and user_id = ${context.userId}
      limit 1
    `;

    if (!account[0]) throw new Error("Account not found");

    if (id) {
      const rows = await sql<RecurringRow>`
        update recurring
        set
          description = ${description},
          amount = ${amount},
          type = ${data.type},
          category = ${category},
          cadence = ${data.cadence},
          next_date = ${nextDate},
          account_id = ${accountId},
          updated_at = current_timestamp
        where id = ${id}
          and user_id = ${context.userId}
        returning
          id,
          description,
          amount,
          type,
          category,
          cadence,
          next_date,
          account_id
      `;

      if (!rows[0]) throw new Error("Recurring item not found");

      return recurringFromRow(rows[0]);
    }

    const newId = crypto.randomUUID();

    const rows = await sql<RecurringRow>`
      insert into recurring
        (
          id,
          user_id,
          account_id,
          description,
          amount,
          type,
          category,
          cadence,
          next_date
        )
      values
        (
          ${newId},
          ${context.userId},
          ${accountId},
          ${description},
          ${amount},
          ${data.type},
          ${category},
          ${data.cadence},
          ${nextDate}
        )
      returning
        id,
        description,
        amount,
        type,
        category,
        cadence,
        next_date,
        account_id
    `;

    return recurringFromRow(rows[0]!);
  });

export const deleteRecurring = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = cleanId(data.id);
    if (!id) throw new Error("Invalid recurring item");

    const sql = await getSql();

    await sql`
      delete from recurring
      where id = ${id}
        and user_id = ${context.userId}
    `;

    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Settings) => input)
  .handler(async ({ data, context }) => {
    const currency = cleanCurrency(data.currency);
    const displayName =
      sanitizeText(data.displayName, 40) || "Ankit";
    const onboarded = Boolean(data.onboarded);

    const sql = await getSql();

    const rows = await sql<SettingsRow>`
      insert into finance_settings
        (
          user_id,
          currency,
          display_name,
          onboarded
        )
      values
        (
          ${context.userId},
          ${currency},
          ${displayName},
          ${onboarded}
        )
      on conflict (user_id)
      do update set
        currency = excluded.currency,
        display_name = excluded.display_name,
        onboarded = excluded.onboarded,
        updated_at = current_timestamp
      returning currency, display_name, onboarded
    `;

    const row = rows[0]!;

    return {
      currency: cleanCurrency(row.currency),
      displayName: row.display_name,
      onboarded: Boolean(row.onboarded),
    };
  });


export const seedFinanceData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      accounts: Account[];
      transactions: Transaction[];
      budgets: Budget[];
      goals: Goal[];
      recurring: Recurring[];
      settings: Settings;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();

    // Never overwrite existing finance data.
    const existingAccounts = await sql<{ id: string }>`
      select id
      from finance_account
      where user_id = ${context.userId}
      limit 1
    `;

    if (existingAccounts.length > 0) {
      return { seeded: false };
    }

    const accountIdMap = new Map<string, string>();
    const recurringIdMap = new Map<string, string>();

    // 1. Accounts
    for (const account of data.accounts.slice(0, 20)) {
      const name = sanitizeText(account.name, 80);
      const openingBalance =
        sanitizeAmount(account.openingBalance, 1_000_000_000) ?? 0;

      if (!name) throw new Error("Invalid account name");
      if (!accountKinds.has(account.kind)) {
        throw new Error("Invalid account type");
      }

      const newId = crypto.randomUUID();

      await sql`
        insert into finance_account
          (id, user_id, name, kind, opening_balance)
        values
          (
            ${newId},
            ${context.userId},
            ${name},
            ${account.kind},
            ${openingBalance}
          )
      `;

      accountIdMap.set(account.id, newId);
    }

    // 2. Recurring items
    for (const item of data.recurring.slice(0, 200)) {
      const accountId = accountIdMap.get(item.accountId);

      if (!accountId) {
        throw new Error(
          `Recurring item "${item.description}" references an unknown account`,
        );
      }

      const description = sanitizeText(item.description, 80);
      const amount = sanitizeAmount(item.amount);
      const category = sanitizeText(item.category, 40);

      if (!description || amount == null || !category) {
        throw new Error("Invalid recurring data");
      }

      if (!txTypes.has(item.type)) {
        throw new Error("Invalid recurring transaction type");
      }

      if (!cadences.has(item.cadence)) {
        throw new Error("Invalid recurring cadence");
      }

      const newId = crypto.randomUUID();

      await sql`
        insert into recurring
          (
            id,
            user_id,
            account_id,
            description,
            amount,
            type,
            category,
            cadence,
            next_date
          )
        values
          (
            ${newId},
            ${context.userId},
            ${accountId},
            ${description},
            ${amount},
            ${item.type},
            ${category},
            ${item.cadence},
            ${sanitizeDate(item.nextDate)}
          )
      `;

      recurringIdMap.set(item.id, newId);
    }

    // 3. Transactions
    for (const transaction of data.transactions.slice(0, 8000)) {
      const accountId = accountIdMap.get(transaction.accountId);

      if (!accountId) {
        throw new Error(
          `Transaction "${transaction.description}" references an unknown account`,
        );
      }

      const amount = sanitizeAmount(transaction.amount);
      const description =
        sanitizeText(transaction.description, 80) || "Expense";
      const category =
        sanitizeText(transaction.category, 40) || "Other";

      if (amount == null) {
        throw new Error("Invalid transaction amount");
      }

      if (!txTypes.has(transaction.type)) {
        throw new Error("Invalid transaction type");
      }

      const recurringId = transaction.recurringId
        ? recurringIdMap.get(transaction.recurringId) ?? null
        : null;

      await sql`
        insert into transaction
          (
            id,
            user_id,
            account_id,
            amount,
            type,
            description,
            category,
            date,
            notes,
            recurring_id
          )
        values
          (
            ${crypto.randomUUID()},
            ${context.userId},
            ${accountId},
            ${amount},
            ${transaction.type},
            ${description},
            ${category},
            ${sanitizeDate(transaction.date)},
            ${transaction.notes ? sanitizeText(transaction.notes, 160) : null},
            ${recurringId}
          )
      `;
    }

    // 4. Budgets
    for (const budget of data.budgets.slice(0, 200)) {
      const category = sanitizeText(budget.category, 40);
      const amount = sanitizeAmount(budget.amount);

      if (!category || amount == null) {
        throw new Error("Invalid budget data");
      }

      await sql`
        insert into budget
          (id, user_id, category, amount)
        values
          (
            ${crypto.randomUUID()},
            ${context.userId},
            ${category},
            ${amount}
          )
      `;
    }

    // 5. Goals
    for (const goal of data.goals.slice(0, 200)) {
      const name = sanitizeText(goal.name, 80);
      const target = sanitizeAmount(goal.target);
      const saved = sanitizeAmount(goal.saved ?? 0) ?? 0;

      if (!name || target == null) {
        throw new Error("Invalid goal data");
      }

      if (saved > target) {
        throw new Error("Saved amount exceeds goal target");
      }

      await sql`
        insert into goal
          (id, user_id, name, target, saved, deadline)
        values
          (
            ${crypto.randomUUID()},
            ${context.userId},
            ${name},
            ${target},
            ${saved},
            ${goal.deadline ? sanitizeDate(goal.deadline) : null}
          )
      `;
    }

    // 6. Settings
    const currency = cleanCurrency(data.settings.currency);
    const displayName =
      sanitizeText(data.settings.displayName, 40) || "Ankit";

    await sql`
      insert into finance_settings
        (user_id, currency, display_name, onboarded)
      values
        (
          ${context.userId},
          ${currency},
          ${displayName},
          ${Boolean(data.settings.onboarded)}
        )
      on conflict (user_id)
      do update set
        currency = excluded.currency,
        display_name = excluded.display_name,
        onboarded = excluded.onboarded,
        updated_at = current_timestamp
    `;

    return { seeded: true };
  });

type AccountRow = {
  id: string;
  name: string;
  kind: Account["kind"];
  opening_balance: number | string;
};

type TransactionRow = {
  id: string;
  amount: number | string;
  type: Transaction["type"];
  description: string;
  category: string;
  date: string;
  account_id: string;
  notes: string | null;
  recurring_id: string | null;
};

type BudgetRow = {
  id: string;
  category: string;
  amount: number | string;
};

type GoalRow = {
  id: string;
  name: string;
  target: number | string;
  saved: number | string;
  deadline: string | null;
};

type RecurringRow = {
  id: string;
  description: string;
  amount: number | string;
  type: Recurring["type"];
  category: string;
  cadence: Recurring["cadence"];
  next_date: string;
  account_id: string;
};

type SettingsRow = {
  currency: string;
  display_name: string;
  onboarded: boolean;
};

function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    description: row.description,
    category: row.category,
    date: row.date,
    accountId: row.account_id,
    notes: row.notes ?? undefined,
    recurringId: row.recurring_id ?? undefined,
  };
}

function goalFromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    target: Number(row.target),
    saved: Number(row.saved),
    deadline: row.deadline ?? undefined,
  };
}

function recurringFromRow(row: RecurringRow): Recurring {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    cadence: row.cadence,
    nextDate: row.next_date,
    accountId: row.account_id,
  };
}