-- Cosmetics + global chat (2026-11-22)
-- Applied to Supabase project nexora (xioxbvmacewkpjtftqbb) as migration `cosmetics_and_global_chat`.
-- Kept in-repo for reproducibility/review.

-- ===== profile frame selection (Discord-style avatar decorations) =====
alter table public.profiles
  add column if not exists frame_slug text not null default 'none';

-- ===== global chat =====
create table if not exists public.global_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists global_messages_created on public.global_messages (created_at desc);
alter table public.global_messages enable row level security;

drop policy if exists global_messages_select on public.global_messages;
create policy global_messages_select on public.global_messages for select to authenticated using (true);

drop policy if exists global_messages_insert on public.global_messages;
create policy global_messages_insert on public.global_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.has_role(auth.uid(), array['member','contributor','moderator','admin','owner'])
  );

drop policy if exists global_messages_delete on public.global_messages;
create policy global_messages_delete on public.global_messages for delete to authenticated
  using (
    sender_id = auth.uid()
    or public.has_role(auth.uid(), array['moderator','admin','owner'])
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'global_messages'
  ) then
    alter publication supabase_realtime add table public.global_messages;
  end if;
end $$;

-- ===== avatars storage bucket (public read, own-folder write, 2MB, images only) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists avatars_select_public on storage.objects;
create policy avatars_select_public on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== signup honors an allowlisted default avatar choice =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  base_username text;
  candidate text;
  n integer := 0;
  is_first boolean;
  chosen_avatar text;
begin
  perform pg_advisory_xact_lock(424242);
  base_username := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'player'), '[^a-z0-9_]', '', 'g'));
  if length(base_username) < 3 then
    base_username := left(base_username || 'player', 3);
    if length(base_username) < 3 then base_username := 'player'; end if;
  end if;
  base_username := left(base_username, 18);
  candidate := base_username;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    n := n + 1;
    candidate := left(base_username, 18) || lpad(n::text, 4, '0');
  end loop;
  select count(*) = 0 into is_first from public.profiles;
  chosen_avatar := new.raw_user_meta_data->>'avatar_url';
  if chosen_avatar is null or chosen_avatar not in ('/avatars/hooded.png','/avatars/fox.png','/avatars/slime.png','/avatars/knight.png') then
    chosen_avatar := '/avatars/hooded.png';
  end if;
  insert into public.profiles (id, username, display_name, role, avatar_url)
  values (new.id, candidate, left(coalesce(new.raw_user_meta_data->>'display_name', candidate), 48),
          case when is_first then 'owner' else 'member' end,
          chosen_avatar);
  insert into public.user_achievements (user_id, slug) values (new.id, 'welcome') on conflict do nothing;
  update public.profiles set xp = xp + 50 where id = new.id;
  return new;
end $function$;

-- ===== index to support incoming-request lookups =====
create index if not exists friendships_addressee_status_idx on public.friendships (addressee_id, status);
