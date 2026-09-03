-- Prevent duplicate follow notifications and make trigger actor resolution deterministic.
DROP TRIGGER IF EXISTS follow_notification ON public.follows;

CREATE OR REPLACE FUNCTION public.notify_social_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare actor_id uuid; actor_name text; post_owner uuid;
begin
  actor_id := CASE tg_table_name
    WHEN 'post_likes' THEN new.user_id
    WHEN 'comments' THEN new.author_id
    WHEN 'friendships' THEN new.requester_id
    WHEN 'follows' THEN new.follower_id
    WHEN 'post_shares' THEN new.user_id
    ELSE NULL
  END;
  actor_name := coalesce((select display_name from public.profiles where id=actor_id),'مستخدم Mada');
  IF tg_table_name='post_likes' THEN
    select author_id into post_owner from public.posts where id=new.post_id;
    if post_owner is not null and post_owner<>actor_id then
      insert into public.notifications(user_id,type,title,body,data) values(post_owner,'like',actor_name||' أعجب بمنشورك',actor_name||' أعجب بمنشورك',jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  ELSIF tg_table_name='comments' THEN
    select author_id into post_owner from public.posts where id=new.post_id;
    if post_owner is not null and post_owner<>actor_id then
      insert into public.notifications(user_id,type,title,body,data) values(post_owner,'comment',actor_name||' علّق على منشورك',left(new.body,180),jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  ELSIF tg_table_name='friendships' THEN
    if new.status='pending' then
      insert into public.notifications(user_id,type,title,body,data) values(new.addressee_id,'friend_request',actor_name||' أرسل لك طلب صداقة','لديك طلب صداقة جديد',jsonb_build_object('friendship_id',new.id,'actor_id',actor_id));
    end if;
  ELSIF tg_table_name='follows' THEN
    if new.follower_id<>new.following_id then
      insert into public.notifications(user_id,type,title,body,data) values(new.following_id,'follow',actor_name||' بدأ متابعتك',actor_name||' يتابعك الآن',jsonb_build_object('actor_id',actor_id));
    end if;
  ELSIF tg_table_name='post_shares' THEN
    if new.target_user_id is not null and new.target_user_id<>actor_id then
      insert into public.notifications(user_id,type,title,body,data) values(new.target_user_id,'share',actor_name||' شارك معك منشورًا','لديك منشور تمت مشاركته معك',jsonb_build_object('post_id',new.post_id,'actor_id',actor_id));
    end if;
  END IF;
  return new;
end;
$function$;