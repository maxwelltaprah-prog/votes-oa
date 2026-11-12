# Employee Nomination Portal

Employees sign in with **email + telephone number (as password)** and nominate themselves or a colleague.
Admins sign in separately and see ranked results (Top 3 / 5 / 10 / All) with total votes.

Built with Next.js (App Router), Supabase (Postgres) and deployable on Vercel.

## How it works

- **Nomination form:** nominator name (read-only), Myself / Someone else, searchable nominee dropdown (all employees), business (Corporate, Grains, Pasta, Rice) and justification. The confirmation screen shows the nominee's name with the justification.
- **Rules:** one nomination per employee (enforced in the database). Each nomination = 1 vote for the nominee.
- **Admin:** Top 3 / 5 / 10 / All, filter by business, expand a nominee to read every justification, export to CSV. Ties share a rank, and everyone tied at the cut-off is shown.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
3. From **Project Settings → API**, copy the Project URL and the **service_role** key.

### 2. Local environment
```bash
npm install
cp .env.example .env.local     # then fill in the three values
```
`SESSION_SECRET` can be generated with `openssl rand -base64 32`.

### 3. Load employees
- **Sample data (for testing):** `npm run seed`  (e.g. login `ada.okafor@example.com` / `08030000001`)
- **Your real list:** `npm run template` creates `employees-template.xlsx`. Fill in Name, Email, Telephone, then run:
  ```bash
  npm run import -- path/to/employees.xlsx
  ```
  Re-running updates existing people (matched by email) and adds new ones.

### 4. Create the admin
```bash
npm run create-admin -- admin@yourcompany.com 'a-strong-password'
```

### 5. Run locally
```bash
npm run dev
```
Employees: http://localhost:3000, Admin: http://localhost:3000/admin/login

## Deploy to Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` under **Settings → Environment Variables**.
3. Deploy. (Run the seed/import/create-admin scripts from your own machine; they talk to the same Supabase project.)

## Security notes
- Telephone numbers are stored only as bcrypt hashes. The employee list shown in the dropdown exposes names only, never emails or phones.
- A telephone number is a weak password: it's easy to guess or find out. This portal limits repeated failed logins, but on Vercel that limit is per server instance and best-effort. For stronger protection, consider adding a one-time code sent by email, or an extra field such as an employee ID.
- The service-role key is used only inside server API routes. Row Level Security is enabled with no public policies, so the public anon key cannot read or write anything.
- Nothing stops an employee from sharing their login with a colleague, so treat results as a popularity signal, not an audit.

## Files
```
app/page.tsx                 employee sign-in
app/nominate/page.tsx        nomination form + confirmation
app/admin/login, app/admin   admin sign-in and results dashboard
app/api/*                    login, logout, me, employees, nominate, admin/results
lib/                         auth (signed cookie), supabase client, phone normaliser
scripts/                     template, import, seed, create-admin
supabase/schema.sql          tables, constraints, RLS
```
