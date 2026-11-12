-- Run once in Supabase > SQL Editor.
-- Admins are now employees with is_admin = true. They sign in with email + date of birth like everyone else,
-- and can add or remove other admins from the /admin page.
--
-- The old separate "admins" table (email + password) is no longer used by the app. It is left in place
-- so nothing is deleted; you can drop it with:  drop table if exists public.admins;

alter table public.employees add column if not exists is_admin boolean not null default false;

-- First admins:
update public.employees
   set is_admin = true
 where email in ('audrey.achaw@olamagri.com', 'maxwell.taprah@olamagri.com');

-- Check: should list the two people above.
select name, email, is_admin from public.employees where is_admin order by name;
