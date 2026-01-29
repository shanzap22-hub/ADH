# DATABASE SETUP REQUIRED ⚠️

The "Failed" error you are seeing during onboarding is because the database table for OTP verification (`verification_codes`) is missing in Supabase.

Please follow these steps to fix it immediately:

1.  Log in to your **Supabase Dashboard**.
2.  Go to the **SQL Editor** (icon on the left sidebar).
3.  Click **"New Query"**.
4.  Copy and Paste the following SQL code:

```sql
create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.verification_codes enable row level security;

-- Optional: Add policy to allow service role full access (default behavior but good to be explicit)
create policy "Service role can do everything"
on public.verification_codes
using ( true )
with check ( true );
```

5.  Click **"Run"** (bottom right).
6.  Once you see "Success", go back to your app and try again. It should work perfectly! ✅
