-- Glueckshafen Basel - Supabase setup
-- Im SQL Editor eines NEUEN/LEEREN Supabase-Projekts ausfuehren.
-- Anonymous Sign-Ins muessen zusaetzlich in Authentication aktiviert werden.

create extension if not exists pgcrypto;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  room_code text not null unique,
  is_closed boolean not null default false,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint polls_options_array check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option text not null,
  voter_name text not null default 'Anonym',
  browser_key text not null,
  voter_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint votes_one_per_user unique (poll_id, voter_id),
  constraint votes_one_per_browser_key unique (poll_id, browser_key)
);

alter table public.polls enable row level security;
alter table public.votes enable row level security;

drop policy if exists "polls_read_authenticated" on public.polls;
create policy "polls_read_authenticated"
on public.polls for select
to authenticated
using (true);

drop policy if exists "polls_insert_own" on public.polls;
create policy "polls_insert_own"
on public.polls for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "polls_update_own" on public.polls;
create policy "polls_update_own"
on public.polls for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "votes_insert_authenticated" on public.votes;
create policy "votes_insert_authenticated"
on public.votes for insert
to authenticated
with check (
  voter_id = auth.uid()
  and exists (
    select 1
    from public.polls p
    where p.id = poll_id
      and p.is_closed = false
  )
);

drop policy if exists "votes_read_by_poll_creator" on public.votes;
create policy "votes_read_by_poll_creator"
on public.votes for select
to authenticated
using (
  exists (
    select 1
    from public.polls p
    where p.id = poll_id
      and p.created_by = auth.uid()
      and p.is_closed = true
  )
);


-- Datenschutz: Online-Stimmen werden serverseitig ohne Namen gespeichert.
-- So kann auch ein veraenderter/alter Client keinen Klarnamen in votes ablegen.
create or replace function public.force_anonymous_vote_name()
returns trigger
language plpgsql
as $$
begin
  new.voter_name := 'Anonym';
  return new;
end;
$$;

drop trigger if exists votes_force_anonymous_name on public.votes;
create trigger votes_force_anonymous_name
before insert or update of voter_name on public.votes
for each row execute function public.force_anonymous_vote_name();

-- Explizite Data-API-Rechte fuer anonym angemeldete Nutzer.
grant usage on schema public to authenticated;
grant select, insert, update on table public.polls to authenticated;
grant select, insert on table public.votes to authenticated;
