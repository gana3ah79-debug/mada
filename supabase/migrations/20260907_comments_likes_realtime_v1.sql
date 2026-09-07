-- Mada: enable realtime events for comment likes.
-- The publication change is also applied to the connected Supabase project.
alter publication supabase_realtime add table public.comment_likes;
