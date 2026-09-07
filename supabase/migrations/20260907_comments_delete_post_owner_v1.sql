drop policy if exists comments_delete_post_owner_v1 on public.comments;
create policy comments_delete_post_owner_v1 on public.comments
for delete to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = comments.post_id and p.author_id = auth.uid()
));
