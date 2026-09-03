-- Mada stability/security hardening applied to the production Supabase project on 2026-09-03.
-- 1) Remove PUBLIC/anon EXECUTE from SECURITY DEFINER RPCs.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true AND p.prokind='f'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Client RPCs used by the signed-in application.
GRANT EXECUTE ON FUNCTION public.accept_group_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_premium(uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_premium_reward(uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_reward_badge(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_manual_payment_request(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_and_join(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_invitation(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_with_owner(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_group_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_badges(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_admin_ban_member(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_admin_remove_member(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_admin_set_role(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_admin_unban_member(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_group_join_request(uuid,uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_group_member(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pin_group_message(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_my_presence(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpin_group_message(uuid,uuid) TO authenticated;

-- Internal trigger/maintenance functions are never client RPCs.
REVOKE EXECUTE ON FUNCTION public.delete_expired_stories() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_group_chat_mute() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_group_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_follow() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_social_event() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_banned_group_member_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_my_presence_offline() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_paid_premium_rewards() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;

-- 2) Fix group RLS policies that previously used tautological predicates.
DROP POLICY IF EXISTS group_members_insert ON public.group_members;
DROP POLICY IF EXISTS group_members_delete ON public.group_members;
DROP POLICY IF EXISTS group_members_self_insert ON public.group_members;
CREATE POLICY group_members_self_insert ON public.group_members
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.privacy = 'public'
    )
  );

DROP POLICY IF EXISTS group_pin_admin ON public.group_pinned_posts;
DROP POLICY IF EXISTS group_pin_member_read ON public.group_pinned_posts;
CREATE POLICY group_pin_admin ON public.group_pinned_posts
  FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_pinned_posts.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_pinned_posts.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner','admin')
  ));
CREATE POLICY group_pin_member_read ON public.group_pinned_posts
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_pinned_posts.group_id AND gm.user_id = auth.uid()
  ));

-- 3) Remove duplicate indexes and add missing FK indexes identified by Supabase.
DROP INDEX IF EXISTS public.idx_group_members_user;
DROP INDEX IF EXISTS public.post_likes_post_user_uidx;
CREATE INDEX IF NOT EXISTS admin_settings_updated_by_idx ON public.admin_settings(updated_by);
CREATE INDEX IF NOT EXISTS conversation_reads_user_id_idx ON public.conversation_reads(user_id);
CREATE INDEX IF NOT EXISTS group_admin_actions_group_id_idx ON public.group_admin_actions(group_id);
CREATE INDEX IF NOT EXISTS group_invitations_inviter_id_idx ON public.group_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS group_message_pins_message_id_idx ON public.group_message_pins(message_id);
CREATE INDEX IF NOT EXISTS group_pinned_messages_conversation_id_idx ON public.group_pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS group_pinned_messages_message_id_idx ON public.group_pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS group_pinned_messages_pinned_by_idx ON public.group_pinned_messages(pinned_by);
CREATE INDEX IF NOT EXISTS group_pinned_posts_pinned_by_idx ON public.group_pinned_posts(pinned_by);
CREATE INDEX IF NOT EXISTS group_pinned_posts_post_id_idx ON public.group_pinned_posts(post_id);
CREATE INDEX IF NOT EXISTS group_posts_author_id_idx ON public.group_posts(author_id);
CREATE INDEX IF NOT EXISTS messages_deleted_by_idx ON public.messages(deleted_by);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON public.poll_votes(user_id);
CREATE INDEX IF NOT EXISTS post_interests_user_id_idx ON public.post_interests(user_id);
CREATE INDEX IF NOT EXISTS post_reports_reporter_id_idx ON public.post_reports(reporter_id);
CREATE INDEX IF NOT EXISTS post_saves_user_id_idx ON public.post_saves(user_id);
CREATE INDEX IF NOT EXISTS post_views_user_id_idx ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS profiles_pinned_post_id_idx ON public.profiles(pinned_post_id);
CREATE INDEX IF NOT EXISTS reel_comments_user_id_idx ON public.reel_comments(user_id);
CREATE INDEX IF NOT EXISTS reel_likes_user_id_idx ON public.reel_likes(user_id);
CREATE INDEX IF NOT EXISTS reel_shares_user_id_idx ON public.reel_shares(user_id);
CREATE INDEX IF NOT EXISTS reels_author_id_idx ON public.reels(author_id);
CREATE INDEX IF NOT EXISTS subscription_requests_reviewed_by_idx ON public.subscription_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS subscription_requests_user_id_idx ON public.subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS user_presence_typing_conversation_id_idx ON public.user_presence(typing_conversation_id);