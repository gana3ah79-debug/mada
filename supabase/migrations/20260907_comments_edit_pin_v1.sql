-- Comments v1: editing timestamps + pinning.
alter table public.comments add column if not exists edited_at timestamptz null;
alter table public.comments add column if not exists is_pinned boolean not null default false;
create index if not exists comments_post_pinned_created_idx on public.comments(post_id,is_pinned desc,created_at desc);

drop policy if exists comments_update_own_v1 on public.comments;
create policy comments_update_own_v1 on public.comments for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists comments_pin_post_owner_v1 on public.comments;
create policy comments_pin_post_owner_v1 on public.comments for update to authenticated using (exists (select 1 from public.posts p where p.id = comments.post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = comments.post_id and p.author_id = auth.uid()));