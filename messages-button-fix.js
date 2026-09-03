/* Mada: messages button + modal close fix */
(function(){
  function bindUI(){
    const btn = document.getElementById('msgBtn');
    if(btn && btn.dataset.messagesBound !== '1'){
      btn.dataset.messagesBound = '1';
      btn.type = 'button';
      btn.disabled = false;
      btn.style.pointerEvents = 'auto';
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(typeof window.openMessages === 'function') window.openMessages();
      });
    }
    const close = document.getElementById('closeModal');
    if(close && close.dataset.closeBound !== '1'){
      close.dataset.closeBound = '1';
      close.type = 'button';
      close.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        const modal = document.getElementById('modal');
        if(modal) modal.hidden = true;
      });
    }
    const modal = document.getElementById('modal');
    if(modal && modal.dataset.backdropBound !== '1'){
      modal.dataset.backdropBound = '1';
      modal.addEventListener('click', function(e){
        if(e.target === modal) modal.hidden = true;
      });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI);
  else bindUI();
  [300,800,1500,3000].forEach(ms=>setTimeout(bindUI,ms));
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      const modal = document.getElementById('modal');
      if(modal) modal.hidden = true;
    }
  });
})();
