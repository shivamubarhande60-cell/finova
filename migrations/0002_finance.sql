-- FINOVA finance schema
-- All finance records are scoped to a Better Auth user.

create table if not exists "finance_account" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "kind" text not null check ("kind" in ('checking', 'savings', 'cash')),
  "opening_balance" numeric(14,2) not null default 0,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);

create index if not exists "finance_account_user_id_idx"
  on "finance_account" ("user_id");


create table if not exists "transaction" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "account_id" text not null references "finance_account" ("id") on delete cascade,
  "amount" numeric(14,2) not null,
  "type" text not null check ("type" in ('income', 'expense')),
  "description" text not null,
  "category" text not null,
  "date" date not null,
  "notes" text,
  "recurring_id" text,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);

create index if not exists "transaction_user_id_idx"
  on "transaction" ("user_id");

create index if not exists "transaction_account_id_idx"
  on "transaction" ("account_id");

create index if not exists "transaction_date_idx"
  on "transaction" ("date");


create table if not exists "budget" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "category" text not null,
  "amount" numeric(14,2) not null,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);

create index if not exists "budget_user_id_idx"
  on "budget" ("user_id");


create table if not exists "goal" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "name" text not null,
  "target" numeric(14,2) not null,
  "saved" numeric(14,2) not null default 0,
  "deadline" date,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);

create index if not exists "goal_user_id_idx"
  on "goal" ("user_id");


create table if not exists "recurring" (
  "id" text not null primary key,
  "user_id" text not null references "user" ("id") on delete cascade,
  "account_id" text not null references "finance_account" ("id") on delete cascade,
  "description" text not null,
  "amount" numeric(14,2) not null,
  "type" text not null check ("type" in ('income', 'expense')),
  "category" text not null,
  "cadence" text not null check ("cadence" in ('weekly', 'monthly')),
  "next_date" date not null,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);

create index if not exists "recurring_user_id_idx"
  on "recurring" ("user_id");


create table if not exists "finance_settings" (
  "user_id" text not null primary key references "user" ("id") on delete cascade,
  "currency" text not null default 'INR'
    check ("currency" in ('USD', 'INR', 'EUR', 'GBP')),
  "display_name" text not null default 'Ankit',
  "onboarded" boolean not null default false,
  "created_at" timestamptz default current_timestamp not null,
  "updated_at" timestamptz default current_timestamp not null
);