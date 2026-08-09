-- Glueckshafen Basel - Privacy Hardening v33
-- Dieses Skript EINMAL im SQL Editor des bereits funktionierenden Supabase-Projekts ausfuehren.
-- Es veraendert nicht die Tabellenstruktur des Gluecksrads und loescht keine Abstimmungen.

alter table public.polls enable row level security;
alter table public.votes enable row level security;

-- Nur die Person, die die Abstimmung erstellt hat, darf Einzelstimmen lesen -
-- und erst nachdem die Runde geschlossen wurde.
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

-- Stimmen duerfen nur unter der eigenen anonymen Supabase-ID und nur in
-- einer noch offenen Runde abgegeben werden.
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

-- Nur die erstellende Sitzung darf ihre Abstimmung veraendern/schliessen.
drop policy if exists "polls_update_own" on public.polls;
create policy "polls_update_own"
on public.polls for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- Keine echten Namen in der Online-Stimm-Tabelle speichern.
update public.votes
set voter_name = 'Anonym'
where voter_name is distinct from 'Anonym';

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

-- Least-privilege-Grants fuer die ueber Anonymous Sign-In angemeldeten Nutzer.
revoke all on table public.votes from anon;
grant select, insert on table public.votes to authenticated;
revoke delete on table public.votes from authenticated;

revoke all on table public.polls from anon;
grant select, insert, update on table public.polls to authenticated;
revoke delete on table public.polls from authenticated;
