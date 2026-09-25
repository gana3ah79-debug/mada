create or replace function public.mada_notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare recipient uuid; sender_name text; ntype text; ntitle text; nbody text;
begin
  select cm.user_id into recipient from public.conversation_members cm
  where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id limit 1;
  if recipient is null then return new; end if;
  select coalesce(p.display_name,'مستخدم') into sender_name from public.profiles p where p.id=new.sender_id;
  if new.message_type='call_offer' then
    ntype := 'incoming_call';
    ntitle := '📞 مكالمة واردة من '||coalesce(sender_name,'مستخدم');
    nbody := 'لديك مكالمة صوتية واردة';
  else
    ntype := 'new_message';
    ntitle := 'رسالة جديدة من '||coalesce(sender_name,'مستخدم');
    nbody := left(coalesce(nullif(new.body,''),'رسالة جديدة'),120);
  end if;
  insert into public.notifications(user_id,type,title,body,message,data,actor_id,is_read)
  values(recipient,ntype,ntitle,nbody,nbody,
    jsonb_build_object('conversation_id',new.conversation_id,'message_id',new.id,'sender_id',new.sender_id),
    new.sender_id,false);
  return new;
end;
$function$;

drop trigger if exists trg_notify_social_event_follows on public.follows;
drop trigger if exists trg_notify_social_event_post_likes on public.post_likes;
drop trigger if exists trg_notify_social_event_shares on public.post_shares;
drop trigger if exists comments_notify_activity on public.comments;