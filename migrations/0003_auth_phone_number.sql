-- Better Auth phone-number plugin fields.
alter table "user" add column if not exists "phoneNumber" text;
alter table "user" add column if not exists "phoneNumberVerified" boolean not null default false;

create unique index if not exists "user_phoneNumber_unique_idx"
  on "user" ("phoneNumber")
  where "phoneNumber" is not null;