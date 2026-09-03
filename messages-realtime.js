/* Mada realtime messages: unread badge + incoming message toast */
(function(){
  let channels=[];
  const seen=new Set();
  let timer=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function toast(text){
    let el=document.getElementById('madaMessageToast');
    if(!el){el=document.createElement('div');el.id='madaMessageToast';el.className='mada-message-toast';document.body.appendChild(el);}
    el.innerHTML=`<span>💬</span><span>${esc(text)}</span>`;
    el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3200);
  }
  function setBadge(count){
    const el=document.getElementById('msgBtn');if(!el)return;
    el.dataset.messageCount=String(count);
    el.classList.toggle('has-message-badge',count>0);
    el.setAttribute('aria-label',count?`الرسائل، ${count} جديدة`:'الرسائل');
  }
  let unread=0;
  function clearUnread(){unread=0;setBadge(0);}
  async function subscribe(){
    if(!window.sb||!window.user)return false;
    try{
      const {data:members,error}=await sb.from('conversation_members').select('conversation_id').eq('user_id',user.id).limit(100);
      if(error)throw error;
      channels.forEach(c=>sb.removeChannel(c));channels=[];
      (members||[]).forEach(m=>{
        const cid=m.conversation_id;
        const ch=sb.channel('mada-msg-watch-'+cid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${cid}`},payload=>{
          if(payload.new.sender_id===user.id)return;
          // When a chat is open, its own realtime handler already renders the message.
          if(document.getElementById('chatList'))return;
          unread++;setBadge(unread);
          toast('وصلتك رسالة جديدة 💬');
        }).subscribe();
        channels.push(ch);
      });
      return true;
    }catch(e){console.warn('Mada realtime messages unavailable',e);return false;}
  }
  function start(){
    if(timer)clearInterval(timer);
    const tryStart=()=>{if(window.sb&&window.user)subscribe();};
    tryStart();timer=setInterval(tryStart,30000);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#msgBtn'))clearUnread();
    if(e.target.closest('#sendMessage'))clearUnread();
  });
  window.madaClearMessageBadge=clearUnread;
  window.madaMessageToast=toast;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(start,1500));
})();
