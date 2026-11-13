-- Rename the nomination Function field to Department and update its allowed values.
-- Existing nominations and their department values are preserved.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'nominations' and column_name = 'business_function'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'nominations' and column_name = 'department'
  ) then
    alter table public.nominations rename column business_function to department;
  end if;
end $$;

alter table public.nominations
  drop constraint if exists nominations_business_function_check;

alter table public.nominations
  drop constraint if exists nominations_department_check;

alter table public.nominations
  add constraint nominations_department_check
  check (department is null or department in (
    'Marketing', 'Administration', 'Communications', 'Health Safety and Environment (HSE)',
    'Engineering', 'Procurement', 'Finance', 'Legal', 'HR/Admin', 'IT', 'Logistics / Warehouse',
    'MATS', 'Shipping', 'Port Operations', 'Sales', 'Supply Chain', 'Sustainability'
  ));
