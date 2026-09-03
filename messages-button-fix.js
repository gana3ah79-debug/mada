/* Mada: ensure the top messages button is always clickable. */
(function(){
  function bindMessagesButton(){
    const btn = document.getElementById('msgBtn');
    if(!btn || btn.dataset.messagesBound === '1') return;
    btn.dataset.messagesBound = '1';
    btn.type = 'button';
    btn.disabled = false;
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.openMessages === 'function'){
        window.openMessages();
      }else{
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        if(modal && title && body){
          title.textContent = '💬 الرسائل';
          body.innerHTML = '<div class="card empty">جاري تجهيز الرسائل…<br><small>حدّث الصفحة مرة أخرى إذا استمر الانتظار.</small></div>';
          modal.hidden = false;
        }
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindMessagesButton);
  else bindMessagesButton();
  setTimeout(bindMessagesButton, 500);
  setTimeout(bindMessagesButton, 1500);
})();
