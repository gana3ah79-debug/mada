-- Prevent the same user from repeatedly reporting the same comment.
create unique index if not exists reports_comment_reporter_unique on public.reports(reporter_id,comment_id) where comment_id is not null;
