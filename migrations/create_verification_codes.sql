create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_verification_codes_email on public.verification_codes(email);

-- Enable RLS (though mostly accessed via Service Role, good practice)
alter table public.verification_codes enable row level security;

-- Policies (We likely access this via API (admin or service role), so maybe just allow service role)
-- But if client accesses? No, verify API does.
