/* Mada: prevent an empty modal sheet from appearing on startup. */
(function(){
  function closeEmptyModal(){
    const m=document.getElementById('modal');
    if(!m)return;
    const title=(document.getElementById('modalTitle')?.textContent||'').trim();
    const body=(document.getElementById('modalBody')?.innerHTML||'').trim();
    if(!title&&!body){
      m.hidden=true;
      m.style.display='none';
      document.body.classList.remove('modal-open');
    }
  }
  function boot(){
    closeEmptyModal();
    const m=document.getElementById('modal');
    if(!m)return;
    new MutationObserver(closeEmptyModal).observe(m,{attributes:true,childList:true,subtree:true,characterData:true});
    window.addEventListener('pageshow',closeEmptyModal);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
