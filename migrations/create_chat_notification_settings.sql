create table if not exists chat_notification_settings (
  user_id uuid references profiles(id) on delete cascade not null,
  conversation_id uuid references chat_conversations(id) on delete cascade not null,
  is_muted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, conversation_id)
);

alter table chat_notification_settings enable row level security;

create policy "Users can view their own settings"
  on chat_notification_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on chat_notification_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on chat_notification_settings for update
  using (auth.uid() = user_id);
