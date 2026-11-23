-- P2 Social: friendships + direct messages with RLS, guards and helpers
-- Applied to Supabase project nexora (xioxbvmacewkpjtftqbb) as migration p2_social_schema.
-- Kept in-repo for reproducibility/review. See docs/NEXORA_SPEC.md.

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);
alter table public.friendships enable row level security;

create policy friendships_select on public.friendships for select using (
  auth.uid() in (requester_id, addressee_id)
  or public.has_role(auth.uid(), array['moderator','admin','owner'])
);
create policy friendships_insert on public.friendships for insert with check (
  requester_id = auth.uid() and status = 'pending'
);
create policy friendships_update on public.friendships for update using (
  auth.uid() in (requester_id, addressee_id)
) with check (
  auth.uid() in (requester_id, addressee_id)
);
create policy friendships_delete on public.friendships for delete using (
  auth.uid() in (requester_id, addressee_id)
);

create or replace function public.friendships_guard() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'friendship participants are immutable';
  end if;
  if new.status <> old.status then
    if new.status = 'pending' then
      raise exception 'cannot reopen a friendship to pending';
    elsif old.status = 'pending' and new.status in ('accepted','declined') then
      if auth.uid() <> old.addressee_id then
        raise exception 'only the addressee can accept or decline';
      end if;
    elsif old.status in ('accepted','declined') and new.status = 'blocked' then
      if auth.uid() not in (old.requester_id, old.addressee_id) then
        raise exception 'not a participant';
      end if;
    else
      raise exception 'illegal friendship status transition % -> %', old.status, new.status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger friendships_guard_trg before update on public.friendships
for each row execute function public.friendships_guard();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);
alter table public.conversations enable row level security;

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_members enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conversation_created on public.messages(conversation_id, created_at);
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members
                 where conversation_id = cid and user_id = auth.uid())
$$;

create policy conversations_select on public.conversations for select using (
  public.is_conversation_member(id)
);
create policy conversation_members_select on public.conversation_members for select using (
  user_id = auth.uid() or public.is_conversation_member(conversation_id)
);
create policy messages_select on public.messages for select using (
  public.is_conversation_member(conversation_id)
);
create policy messages_insert on public.messages for insert with check (
  public.is_conversation_member(conversation_id) and sender_id = auth.uid()
);
create policy messages_update on public.messages for update using (
  public.is_conversation_member(conversation_id) and sender_id <> auth.uid()
) with check (
  public.is_conversation_member(conversation_id) and sender_id <> auth.uid()
);

create or replace function public.messages_guard() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.body <> old.body or new.sender_id <> old.sender_id
     or new.conversation_id <> old.conversation_id or new.id <> old.id then
    raise exception 'only read_at may be modified';
  end if;
  return new;
end $$;
create trigger messages_guard_trg before update on public.messages
for each row execute function public.messages_guard();

create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger touch_conversation_trg after insert on public.messages
for each row execute function public.touch_conversation();

alter publication supabase_realtime add table public.messages;

create or replace function public.create_or_get_direct_conversation(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  existing uuid;
  cid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other is null or other = me then raise exception 'invalid peer'; end if;
  if not exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = me and f.addressee_id = other)
        or (f.addressee_id = me and f.requester_id = other))
  ) then
    raise exception 'you can only message accepted friends';
  end if;
  select a.conversation_id into existing
  from public.conversation_members a
  join public.conversation_members b on b.conversation_id = a.conversation_id
  where a.user_id = me and b.user_id = other
  limit 1;
  if existing is not null then return existing; end if;
  insert into public.conversations default values returning id into cid;
  insert into public.conversation_members(conversation_id, user_id) values (cid, me), (cid, other);
  return cid;
end $$;
revoke execute on function public.create_or_get_direct_conversation(uuid) from anon;
grant execute on function public.create_or_get_direct_conversation(uuid) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  (privacy = 'public')
  or (id = auth.uid())
  or (privacy = 'friends' and auth.uid() is not null)
  or public.has_role(auth.uid(), array['moderator','admin','owner'])
  or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id)
        or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))
  )
);
