-- Mada production data-linkage migration. Safe to rerun.
alter table public.profiles add column if not exists cover_url text;
create table if not exists public.post_shares (id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,target_user_id uuid references public.profiles(id) on delete cascade,created_at timestamptz not null default now());
create index if not exists post_shares_post_idx on public.post_shares(post_id,created_at desc);
create index if not exists post_shares_target_idx on public.post_shares(target_user_id,created_at desc);
create unique index if not exists friendships_pair_unique on public.friendships(least(requester_id,addressee_id),greatest(requester_id,addressee_id));
alter table public.post_shares enable row level security;
drop policy if exists post_shares_read on public.post_shares;
drop policy if exists post_shares_insert on public.post_shares;
create policy post_shares_read on public.post_shares for select to authenticated using (user_id=auth.uid() or target_user_id=auth.uid() or public.is_admin());
create policy post_shares_insert on public.post_shares for insert to authenticated with check (user_id=auth.uid());
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index if not exists friendships_addressee_status_idx on public.friendships(addressee_id,status);
create index if not exists friendships_requester_status_idx on public.friendships(requester_id,status);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
insert into public.premium_plans(code,name,price_egp,interval_months,active) values ('monthly','Mada Premium',99,1,true) on conflict (code) do update set name=excluded.name,price_egp=excluded.price_egp,interval_months=excluded.interval_months,active=true;
-- notify_social_event is a trigger-only SECURITY DEFINER function.
revoke execute on function public.notify_social_event() from anon,authenticated,public;