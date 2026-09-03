// Bridge the existing app.js lexical state to the feature module without changing app.js.
try{Object.defineProperty(window,'sb',{configurable:true,get:()=>sb});}catch(e){}
try{Object.defineProperty(window,'user',{configurable:true,get:()=>user});}catch(e){}
try{Object.defineProperty(window,'feedPosts',{configurable:true,get:()=>feedPosts});}catch(e){}

// Final realtime bridge: unread messages, read receipts, friend requests and notifications.
(function(){
  let channel=null, timer=null, boundUserId=null;
  const badge=(id,count)=>{const el=document.getElementById(id);if(!el)return;el.dataset.count=String(count||0);el.title=count?`لديك ${count} رسالة غير مقروءة`:'لا توجد رسائل جديدة';};
  async function unread(){
    const u=window.user,s=window.sb;if(!u||!s)return;
    try{
      const {data:members,error:merr}=await s.from('conversation_members').select('conversation_id').eq('user_id',u.id);
      if(merr)throw merr; const ids=(members||[]).map(x=>x.conversation_id);
      if(!ids.length){badge('msgBtn',0);return;}
      const {count,error}=await s.from('messages').select('id',{count:'exact',head:true}).in('conversation_id',ids).neq('sender_id',u.id).is('read_at',null);
      if(!error)badge('msgBtn',count||0);
    }catch(e){console.warn('message badge',e)}
  }
  async function markCurrentRead(){
    const u=window.user,s=window.sb,c=window.madaMessengerCurrent;if(!u||!s||!c?.cid)return;
    try{await s.from('messages').update({read_at:new Date().toISOString()}).eq('conversation_id',c.cid).neq('sender_id',u.id).is('read_at',null);await unread();}catch(e){console.warn('read receipt',e)}
  }
  function start(){
    const u=window.user,s=window.sb;if(!u||!s||boundUserId===u.id)return;
    boundUserId=u.id; if(channel)s.removeChannel(channel);
    channel=s.channel('mada-social-'+u.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},p=>{if(p.new.sender_id!==u.id){unread();if(window.madaMessengerCurrent?.cid===p.new.conversation_id)markCurrentRead();}})
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages'},()=>unread())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${u.id}`},()=>window.loadNotificationCount?.())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'friendships',filter:`addressee_id=eq.${u.id}`},()=>{window.loadNotificationCount?.();window.showToast?.('وصلك طلب صداقة جديد 👥');})
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'friendships',filter:`addressee_id=eq.${u.id}`},()=>{window.loadNotificationCount?.();})
      .subscribe();
    unread();
    clearInterval(timer);timer=setInterval(()=>{unread();markCurrentRead()},1800);
  }
  const boot=()=>setTimeout(start,250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [700,1600,3000,5000].forEach(ms=>setTimeout(start,ms));
  window.madaUnreadMessages=unread;
  window.madaMarkCurrentMessagesRead=markCurrentRead;
})();
