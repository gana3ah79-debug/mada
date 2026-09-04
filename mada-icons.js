(() => {
  const paths = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    message:'<path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5a3.5 3.5 0 0 1-3.5 3.5H11l-5 4v-4.7a3.5 3.5 0 0 1-1-2.8z"/>',
    moon:'<path d="M20 15.2A8.2 8.2 0 0 1 8.8 4 8.3 8.3 0 1 0 20 15.2z"/>',
    bell:'<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z"/><path d="M10 21h4"/>',
    diamond:'<path d="m12 3 7 7-7 11L5 10z"/><path d="M5 10h14M9 6l3 4 3-4"/>',
    home:'<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 18a4 4 0 0 1 7 1"/>',
    grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 5 5"/>',
    video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
    location:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    reels:'<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 9h16M8 5l3 4M13 5l3 4"/><path d="m10 12 5 3-5 3z"/>',
    profile:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'
  };
  const map = {'☰':'menu','⌕':'search','💬':'message','🌙':'moon','🔔':'bell','💎':'diamond','⌂':'home','♙':'users','◉':'bell','☷':'grid','＋':'plus','🖼️':'image','🎥':'video','📍':'location','🙂':'smile','🎬':'reels'};
  function render(el, name){
    const body = paths[name]; if(!body) return;
    el.textContent=''; el.dataset.icon=name;
    el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`);
  }
  function boot(){
    document.querySelectorAll('.mada-icon').forEach(el => render(el, el.dataset.icon || map[el.textContent.trim()]));
    document.querySelectorAll('.bottom-plus span').forEach(el => render(el, 'plus'));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

// Keep the comments enhancements modular so the main app stays stable.
(function(){
  const load=()=>{
    if(!document.querySelector('script[data-mada-comments-fix]')){
      const s=document.createElement('script');s.src='mada-comments-fix.js?v=20260904-2';s.dataset.madaCommentsFix='1';document.body.appendChild(s)
    }
    if(!document.querySelector('script[data-mada-comment-social]')){
      const s=document.createElement('script');s.src='mada-comment-social.js?v=20260904-1';s.dataset.madaCommentSocial='1';document.body.appendChild(s)
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
