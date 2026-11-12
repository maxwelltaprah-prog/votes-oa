-- Run this once in Supabase > SQL Editor.

create extension if not exists "pgcrypto";

-- Employees who can log in and be nominated.
-- The telephone number is NEVER stored in plain text: only a bcrypt hash (used as the login password).
create table if not exists employees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null check (email = lower(email)),
  phone_hash    text not null,
  created_at    timestamptz not null default now(),
  constraint employees_email_key unique (email)
);

-- Admin accounts (separate email + password).
create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (email = lower(email)),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  constraint admins_email_key unique (email)
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
alter table admins      enable row level security;
alter table nominations enable row level security;
