create table if not exists chatwoot_conversations (
  id bigint primary key,
  contact_name text not null default 'Cliente',
  contact_phone text,
  last_message text,
  last_activity_at timestamptz not null default now(),
  unread_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table chatwoot_conversations enable row level security;

-- Only service_role (backend) can read/write
create policy "service only" on chatwoot_conversations
  using (false)
  with check (false);
