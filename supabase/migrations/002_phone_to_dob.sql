-- Run once in Supabase > SQL Editor if you already created the tables with the telephone-password version.
-- Renames employees.phone_hash to dob_hash. Nominations are not touched.
--
-- IMPORTANT: the old values are hashes of telephone numbers, so nobody can log in until you
-- re-import the employee file (npm run import -- file.xlsx). The import overwrites the hashes
-- with date-of-birth hashes, matched by email.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'employees' and column_name = 'phone_hash'
  ) then
    alter table public.employees rename column phone_hash to dob_hash;
  end if;
end $$;
