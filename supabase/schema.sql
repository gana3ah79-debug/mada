-- Mada production schema for Supabase/Postgres
create extension if not exists pgcrypto;

create type public.app_role as enum ('user','admin');
create type public.subscription_status as enum ('trialing','active','past_due','canceled','expired');
create type public.payment_status as enum ('pending','paid','failed','refunded');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  email text,
  avatar_url text,
  role public.app_role not null default 'user',
  is_banned boolean not null default false,
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  banned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  price_egp integer not null check(price_egp >= 0),
  interval_days integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'trialing',
  provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount_egp integer not null check(amount_egp >= 0),
  provider text not null,
  provider_transaction_id text,
  status public.payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists payments_status_idx on public.payments(status);

insert into public.subscription_plans(code,name,price_egp,interval_days)
values ('premium_monthly','Mada Premium',99,30)
on conflict (code) do update set price_egp=excluded.price_egp, interval_days=excluded.interval_days;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username,display_name,email)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_banned=false);
$$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.bans enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated with check (user_id=auth.uid());
create policy posts_update on public.posts for update to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create policy posts_delete on public.posts for delete to authenticated using (user_id=auth.uid() or public.is_admin());
create policy likes_read on public.post_likes for select to authenticated using (true);
create policy likes_insert on public.post_likes for insert to authenticated with check (user_id=auth.uid());
create policy likes_delete on public.post_likes for delete to authenticated using (user_id=auth.uid() or public.is_admin());
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check (user_id=auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (user_id=auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id=auth.uid());
create policy reports_admin_read on public.reports for select to authenticated using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy plans_read on public.subscription_plans for select to authenticated using (active=true or public.is_admin());
create policy subscriptions_self_read on public.subscriptions for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy payments_self_read on public.payments for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy bans_admin_all on public.bans for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Never store gateway secret keys, OTPs, PINs, bank passwords, or wallet PINs in tables.
