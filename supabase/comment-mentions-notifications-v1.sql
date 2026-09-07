-- Mada: comment mentions + comment/reply notifications
-- Applied to production Supabase on 2026-09-07.
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists actor_id uuid references public.profiles(id) on delete set null;
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, is_read, created_at desc);
update public.notifications set is_read=(read_at is not null), message=coalesce(message,body);
create or replace function public.mada_notify_comment() returns trigger language plpgsql security definer set search_path=public as $$
declare post_owner uuid; parent_owner uuid; actor_name text; mentioned record; token text;
begin
  select p.user_id into post_owner from public.posts p where p.id=new.post_id;
  select c.user_id into parent_owner from public.comments c where c.id=new.parent_comment_id;
  select coalesce(pr.display_name,pr.username,'مستخدم') into actor_name from public.profiles pr where pr.id=new.user_id;
  if post_owner is not null and post_owner<>new.user_id then
    insert into public.notifications(user_id,type,title,body,message,data,actor_id,is_read) values(post_owner,'comment','تعليق جديد',actor_name||' علّق على منشورك',actor_name||' علّق على منشورك',jsonb_build_object('post_id',new.post_id,'comment_id',new.id,'actor_id',new.user_id),new.user_id,false);
  end if;
  if parent_owner is not null and parent_owner<>new.user_id and parent_owner<>post_owner then
    insert into public.notifications(user_id,type,title,body,message,data,actor_id,is_read) values(parent_owner,'comment_reply','رد جديد',actor_name||' رد على تعليقك',actor_name||' رد على تعليقك',jsonb_build_object('post_id',new.post_id,'comment_id',new.id,'parent_comment_id',new.parent_comment_id,'actor_id',new.user_id),new.user_id,false);
  end if;
  for token in select distinct lower((m)[1]) from regexp_matches(coalesce(new.body,''),'@([^[:space:]@]+)','g') m loop
    select p.id,p.username,p.display_name into mentioned from public.profiles p where lower(p.username)=token limit 1;
    if mentioned.id is not null and mentioned.id<>new.user_id and mentioned.id<>post_owner and mentioned.id<>parent_owner then
      insert into public.notifications(user_id,type,title,body,message,data,actor_id,is_read) values(mentioned.id,'mention','منشن في تعليق',actor_name||' ذكرك في تعليق',actor_name||' ذكرك في تعليق',jsonb_build_object('post_id',new.post_id,'comment_id',new.id,'actor_id',new.user_id),new.user_id,false);
    end if;
  end loop;
  return new;
end; $$;
drop trigger if exists trg_mada_notify_comment on public.comments;
create trigger trg_mada_notify_comment after insert on public.comments for each row execute function public.mada_notify_comment();