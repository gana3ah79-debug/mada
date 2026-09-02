-- Mada social features migration
-- Safe for the existing post_likes data: legacy 'care' is converted to 'love'.

alter table public.post_likes add column if not exists reaction_type text not null default 'like';
update public.post_likes set reaction_type='love' where reaction_type='care';
alter table public.post_likes drop constraint if exists post_likes_reaction_type_check;
alter table public.post_likes add constraint post_likes_reaction_type_check check (reaction_type in ('like','love','haha','wow','sad','angry'));
delete from public.post_likes a using public.post_likes b where a.post_id=b.post_id and a.user_id=b.user_id and a.ctid>b.ctid;
create unique index if not exists post_likes_post_user_uidx on public.post_likes(post_id,user_id);
create index if not exists post_likes_post_reaction_idx on public.post_likes(post_id,reaction_type);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '24 hours')
);
create index if not exists stories_user_created_idx on public.stories(user_id,created_at desc);
create index if not exists stories_expires_idx on public.stories(expires_at);
alter table public.stories enable row level security;
drop policy if exists stories_select_active on public.stories;
create policy stories_select_active on public.stories for select to authenticated using (expires_at>now());
drop policy if exists stories_insert_own on public.stories;
create policy stories_insert_own on public.stories for insert to authenticated with check (user_id=auth.uid());
drop policy if exists stories_delete_own on public.stories;
create policy stories_delete_own on public.stories for delete to authenticated using (user_id=auth.uid());

-- Admin-only post deletion; profiles.role='admin' is the authoritative role check.
drop policy if exists posts_admin_delete on public.posts;
create policy posts_admin_delete on public.posts for delete to authenticated using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin' and coalesce(p.is_banned,false)=false)
);

create or replace function public.delete_expired_stories()
returns integer language plpgsql security definer set search_path=public as $$
declare deleted_count integer;
begin
  delete from public.stories where expires_at<=now();
  get diagnostics deleted_count=row_count;
  return deleted_count;
end;
$$;
revoke all on function public.delete_expired_stories() from public;
