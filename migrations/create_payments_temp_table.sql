-- Create payments_temp table for Razorpay verification flow
create table if not exists public.payments_temp (
    id uuid not null default gen_random_uuid(),
    payment_id text not null,
    order_id text not null,
    whatsapp_number text,
    amount numeric,
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint payments_temp_pkey primary key (id),
    constraint payments_temp_payment_id_key unique (payment_id)
);

-- Enable RLS
alter table public.payments_temp enable row level security;

-- Policies
-- Admin/Service Role can do anything
create policy "Enable all access for service role"
on public.payments_temp
for all
to service_role
using (true)
with check (true);

-- Allow public insert (if needed by weird edge cases, but our code uses admin client so service_role is enough.
-- However, just in case `createClient()` (anon) was used somewhere else, we might adding anon insert,
-- but sticking to service_role policy is safer and our code NOW uses supabaseAdmin for this.)
