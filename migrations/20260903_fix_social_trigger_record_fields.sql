-- Fix social notification trigger: avoid referencing columns that do not exist
-- on the current trigger table. This prevents post_likes inserts from failing
-- with: record "new" has no field "author_id".
create or replace function public.notify_social_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  actor_name text;
  post_owner uuid;
begin
  if tg_table_name = 'post_likes' then
    actor_id := new.user_id;
    select author_id into post_owner from public.posts where id = new.post_id;
    actor_name := coalesce((select display_name from public.profiles where id = actor_id), 'مستخدم Mada');
    if post_owner is not null and post_owner <> actor_id then
      insert into public.notifications(user_id,type,title,body,data)
      values(post_owner,'like',actor_name || ' أعجب بمنشورك',actor_name || ' أعجب بمنشورك',jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  elsif tg_table_name = 'comments' then
    actor_id := new.author_id;
    select author_id into post_owner from public.posts where id = new.post_id;
    actor_name := coalesce((select display_name from public.profiles where id = actor_id), 'مستخدم Mada');
    if post_owner is not null and post_owner <> actor_id then
      insert into public.notifications(user_id,type,title,body,data)
      values(post_owner,'comment',actor_name || ' علّق على منشورك',left(new.body,180),jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  elsif tg_table_name = 'friendships' then
    actor_id := new.requester_id;
    actor_name := coalesce((select display_name from public.profiles where id = actor_id), 'مستخدم Mada');
    if new.status = 'pending' and new.addressee_id <> actor_id then
      insert into public.notifications(user_id,type,title,body,data)
      values(new.addressee_id,'friend_request',actor_name || ' أرسل لك طلب صداقة','لديك طلب صداقة جديد',jsonb_build_object('friendship_id',new.id,'actor_id',actor_id));
    end if;
  elsif tg_table_name = 'follows' then
    actor_id := new.follower_id;
    actor_name := coalesce((select display_name from public.profiles where id = actor_id), 'مستخدم Mada');
    if new.follower_id <> new.following_id then
      insert into public.notifications(user_id,type,title,body,data)
      values(new.following_id,'follow',actor_name || ' بدأ متابعتك',actor_name || ' يتابعك الآن',jsonb_build_object('actor_id',actor_id));
    end if;
  elsif tg_table_name = 'post_shares' then
    actor_id := new.user_id;
    actor_name := coalesce((select display_name from public.profiles where id = actor_id), 'مستخدم Mada');
    if new.target_user_id is not null and new.target_user_id <> actor_id then
      insert into public.notifications(user_id,type,title,body,data)
      values(new.target_user_id,'share',actor_name || ' شارك معك منشورًا','لديك منشور تمت مشاركته معك',jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  end if;
  return new;
end;
$$;
