-- Drop existing policies to fix role issue
drop policy if exists "Admins can insert redirects" on public.redirects;
drop policy if exists "Admins can update redirects" on public.redirects;
drop policy if exists "Admins can delete redirects" on public.redirects;

-- Create new policies allowing both 'admin' and 'super_admin'
create policy "Admins can insert redirects"
  on public.redirects for insert
  with check (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'super_admin')
    )
  );

create policy "Admins can update redirects"
  on public.redirects for update
  using (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'super_admin')
    )
  );

create policy "Admins can delete redirects"
  on public.redirects for delete
  using (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'super_admin')
    )
  );
