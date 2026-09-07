-- Stage 4: admin comment moderation permissions
-- Admins may update comments for moderation (pin/unpin and future moderation fields).
drop policy if exists comments_update_admin_v1 on public.comments;
create policy comments_update_admin_v1 on public.comments
for update to authenticated
using (private.is_admin())
with check (private.is_admin());
