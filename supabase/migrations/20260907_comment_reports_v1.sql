-- Stage 5: reports for individual comments
alter table public.reports add column if not exists comment_id uuid null;
alter table public.reports add column if not exists report_type text not null default 'user';
alter table public.reports add constraint reports_comment_id_fkey foreign key (comment_id) references public.comments(id) on delete cascade;
create index if not exists reports_comment_status_idx on public.reports(comment_id,status,created_at desc);
drop policy if exists reports_comment_insert_v1 on public.reports;
create policy reports_comment_insert_v1 on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
