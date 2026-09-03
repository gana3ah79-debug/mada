/* Mada message realtime compatibility layer. The unified realtime bridge owns subscriptions now. */
(function(){
  function sync(){try{window.madaUnreadMessages?.()}catch(e){console.warn('Mada message badge sync',e)}}
  function clear(){try{window.madaClearMessageBadge?.();window.madaMarkCurrentMessagesRead?.()}catch(e){}}
  document.addEventListener('click',e=>{if(e.target.closest('#msgBtn,#mmSend,#sendMessage'))clear()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,2200));else setTimeout(sync,2200);
  window.madaMessageRealtimeReady=true;
})();
