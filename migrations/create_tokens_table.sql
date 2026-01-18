create table if not exists instructor_tokens (
    user_id uuid references auth.users primary key,
    refresh_token text,
    access_token text,
    updated_at timestamptz default now()
);

alter table instructor_tokens enable row level security;

-- Policy: Only User can insert/update their own (via app logic? No, callback runs on server).
-- Actually, we use Service Role in callback usually?
-- Or current user?
-- If Callback uses `createClient()` (cookie based), it acts as User.
-- So User needs permission to INSERT/UPDATE their own token.

create policy "Users can manage their own tokens"
on instructor_tokens
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Service Role has full access by default (bypass RLS).
