-- Run once in Supabase > SQL Editor BEFORE (or right after) deploying the "Function" field.
-- Adds the Function chosen on each nomination: Finance, HR/Admin, IT or MATS.
-- Existing nominations keep an empty value; every new nomination must have one (enforced by the app).

alter table public.nominations
  add column if not exists business_function text;

alter table public.nominations
  drop constraint if exists nominations_business_function_check;

alter table public.nominations
  add constraint nominations_business_function_check
  check (business_function is null or business_function in ('Finance', 'HR/Admin', 'IT', 'MATS'));
