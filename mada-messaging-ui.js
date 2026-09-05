(function(){
  const s=()=>window.MADA_SUPABASE_CLIENT||window.sb,u=()=>window.madaUser?.()||window.user;
  function enhance(){const root=document.getElementById('modal');if(!root||root.dataset.madaMsgEnhanced)return;root.dataset.madaMsgEnhanced='1';root.addEventListener('input',e=>{if(e.target.id==='messageInput'){const other=document.querySelector('[data-chat-other]')?.dataset.chatOther;if(other)window.MadaMessagingNotifications?.typing(other)}});}
  function watch(){enhance();const m=document.getElementById('modal');if(m&&!m.dataset.madaMsgObserver){m.dataset.madaMsgObserver='1';new MutationObserver(enhance).observe(m,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(watch,900));else setTimeout(watch,900);
  window.MadaMessagingUI={watch};
})();
