-- Run this once in Supabase > SQL Editor (fresh install).
-- Already have the tables from an earlier version? Run the files in supabase/migrations/ instead
-- (002_phone_to_dob.sql, then 003_employee_admins.sql).

create extension if not exists "pgcrypto";

-- Employees who can log in and be nominated.
-- The date of birth (login password) is NEVER stored in plain text: only a bcrypt hash.
-- is_admin: admins sign in the same way as everyone else (email + date of birth) and can open /admin.
create table if not exists employees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null check (email = lower(email)),
  dob_hash      text not null,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint employees_email_key unique (email)
);

-- One nomination per employee (enforced by the unique constraint on nominator_id).
create table if not exists nominations (
  id            uuid primary key default gen_random_uuid(),
  nominator_id  uuid not null references employees(id) on delete cascade,
  nominee_id    uuid not null references employees(id) on delete cascade,
  is_self       boolean not null,
  business      text not null check (business in ('Corporate', 'Grains', 'Pasta', 'Rice')),
  justification text not null check (char_length(justification) between 10 and 2000),
  created_at    timestamptz not null default now(),
  constraint one_nomination_per_employee unique (nominator_id),
  constraint self_flag_matches check (is_self = (nominator_id = nominee_id))
);
create index if not exists nominations_nominee_idx on nominations (nominee_id);

-- Lock the tables down. The app talks to Supabase only from the server using the service role key,
-- which bypasses RLS. With RLS on and no policies, the public anon key can read/write nothing.
alter table employees   enable row level security;
alter table nominations enable row level security;
