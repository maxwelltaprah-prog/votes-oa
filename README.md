# Employee Nomination Portal

Employees sign in with **email + date of birth, DD/MM/YYYY (as password)** and nominate themselves or a colleague.
Admins are employees with admin rights. They sign in the same way (email + date of birth), see ranked results (Top 3 / 5 / 10 / All) with total votes, and can add or remove other admins.

Built with Next.js (App Router), Supabase (Postgres) and deployable on Vercel.

## How it works

- **Nomination form:** nominator name (read-only), Myself / Someone else, searchable nominee dropdown (all employees), business (Corporate, Grains, Pasta, Rice), department (Marketing, Administration, Communications, Health Safety and Environment (HSE), Engineering, Procurement, Finance, Legal, HR/Admin, IT, Logistics / Warehouse, MATS, Shipping, Port Operations, Sales, Supply Chain, Sustainability) and justification. The confirmation screen shows the nominee's name with the justification.
- **Rules:** one nomination per employee (enforced in the database). Each nomination = 1 vote for the nominee.
- **Admin:** Top 3 / 5 / 10 / All, filter by business and department, expand a nominee to read every justification, export to CSV. Ties share a rank, and everyone tied at the cut-off is shown.
- **Managing admins:** on the admin page, search any employee and click **Make admin**, or **Remove** an existing admin. You can't remove yourself, so there is always at least one admin. Removal takes effect immediately.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
   - **Already ran an earlier version?** Run `supabase/migrations/002_phone_to_dob.sql` (renames `phone_hash` to `dob_hash`, then re-import your employee file so everyone's password becomes their date of birth), then `supabase/migrations/003_employee_admins.sql` (adds the `is_admin` flag and makes the first admins; edit the two emails in it first), then `supabase/migrations/004_add_function.sql` (adds the prior Function field), followed by `supabase/migrations/005_department.sql` (renames it to Department and updates the allowed values).
3. From **Project Settings → API**, copy the Project URL and the **service_role** key.

### 2. Local environment
```bash
npm install
cp .env.example .env.local     # then fill in the three values
```
`SESSION_SECRET` can be generated with `openssl rand -base64 32`.

### 3. Load employees
- **Sample data (for testing):** `npm run seed`  (e.g. login `ada.okafor@example.com` / `05/03/1990`)
- **Your real list:** use `employees-template.xlsx` (or `npm run template` to regenerate it). Columns: **Full Name, Date of Birth (DD/MM/YYYY), Email ID**. Then run:
  ```bash
  npm run import -- path/to/employees.xlsx
  ```
  Re-running updates existing people (matched by email) and adds new ones.

### 4. Make the first admin(s)
Admins are employees, so import the employee list first. Then either edit the emails in `supabase/migrations/003_employee_admins.sql` and run it in the SQL Editor, or:
```bash
npm run make-admin -- someone@yourcompany.com          # add --remove to take rights away
```
After that, admins can add more admins from the admin page.

### 5. Run locally
```bash
npm run dev
```
Employees: http://localhost:3000, Admin: http://localhost:3000/admin/login

## Deploy to Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` under **Settings → Environment Variables**.
3. Deploy. (Run the seed/import/make-admin scripts from your own machine, or use the SQL files, since they talk to the same Supabase project.)

## Security notes
- Dates of birth are stored only as bcrypt hashes. The employee list shown in the dropdown exposes names only, never emails or dates of birth.
- A date of birth is a weak password: colleagues often know it, and there are only a few thousand plausible dates for a working-age person. This portal limits repeated failed logins, but on Vercel that limit is per server instance and best-effort. For stronger protection, consider adding a one-time code sent by email, or an extra field such as an employee ID.
- Dates are read day-first (DD/MM/YYYY). `05/03/1990` is 5 March 1990, and `05031990` and `5-3-1990` are accepted too.
- The service-role key is used only inside server API routes. Row Level Security is enabled with no public policies, so the public anon key cannot read or write anything.
- Admin access has the same password as a normal login (the date of birth), and admins can read every justification and add other admins. Keep the admin list short. If you need stronger protection for admins, add a one-time email code or a separate admin password.
- Nothing stops an employee from sharing their login with a colleague, so treat results as a popularity signal, not an audit.

## Files
```
app/page.tsx                 employee sign-in
app/nominate/page.tsx        nomination form + confirmation
app/admin/login, app/admin   admin sign-in and results dashboard
app/api/*                    login, logout, me, employees, nominate, admin/results, admin/admins
lib/                         auth (signed cookie + admin check), shared login, supabase client, date-of-birth normaliser
scripts/                     template, import, seed, make-admin
supabase/schema.sql          tables, constraints, RLS
supabase/migrations/         upgrade scripts for databases created with an older version
```
