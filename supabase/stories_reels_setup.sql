-- Mada Stories + Reels support using the existing posts/media infrastructure.
-- Run this once in Supabase SQL Editor.
-- Stories use visibility='story' and expire after 24h by created_at filtering in the app.
-- Reels use visibility='reel'.
-- Existing posts table already has author_id, body, media_url and visibility.

-- Allow authenticated users to publish stories/reels through the existing posts insert policy.
-- If the current policy already checks only author_id=auth.uid(), no policy change is needed.

-- Optional indexes for fast story/reel loading.
create index if not exists posts_story_created_idx on public.posts(created_at desc) where visibility='story';
create index if not exists posts_reel_created_idx on public.posts(created_at desc) where visibility='reel';
