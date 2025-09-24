-- Supabase schema based on spec (sessions, blocks, outputs, drawings)

create extension if not exists pgcrypto;

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  order_index int not null,
  content text not null,
  level int default 1,
  type text check (type in ('question','answer','memo','action')) default 'memo',
  status text check (status in ('open','closed')) default 'open',
  lang text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists outputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  pane int check (pane in (1,2)) not null,
  mode text check (mode in ('translate','summarize','detect','free')) not null,
  model text not null,
  source_lang text,
  target_lang text,
  prompt jsonb,
  result_md text,
  token_input int,
  token_output int,
  cost_usd numeric(10,5),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists drawings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- updated_at trigger
create or replace function trigger_set_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists t_sessions on sessions;
create trigger t_sessions before update on sessions
for each row execute function trigger_set_timestamp();

drop trigger if exists t_blocks on blocks;
create trigger t_blocks before update on blocks
for each row execute function trigger_set_timestamp();

drop trigger if exists t_drawings on drawings;
create trigger t_drawings before update on drawings
for each row execute function trigger_set_timestamp();

-- RLS owner-only (sharingは後続で session_members を追加)
alter table sessions enable row level security;
alter table blocks enable row level security;
alter table outputs enable row level security;
alter table drawings enable row level security;

create policy "sessions owner read" on sessions
for select using (created_by = auth.uid());
create policy "sessions owner write" on sessions
for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "blocks by session owner read" on blocks
for select using (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "blocks by session owner write" on blocks
for all using (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()))
with check (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));

create policy "outputs by session owner read" on outputs
for select using (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "outputs by session owner insert" on outputs
for insert with check (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));

create policy "drawings by session owner read" on drawings
for select using (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));
create policy "drawings by session owner upsert" on drawings
for all using (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()))
with check (exists (select 1 from sessions s where s.id = session_id and s.created_by = auth.uid()));

