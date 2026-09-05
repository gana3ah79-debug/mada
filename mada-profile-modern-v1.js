/* Mada - modern profile enhancement v1 */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function enhance(){
    const page=document.querySelector('#modal .profile-page');
    if(!page||page.dataset.madaModernProfile==='1')return;
    page.dataset.madaModernProfile='1';
    const h2=page.querySelector('h2');
    if(h2){
      const raw=(h2.textContent||'').replace('👑','').trim();
      if(!page.querySelector('.mada-profile-username')){
        const u=document.createElement('div');u.className='mada-profile-username';u.textContent='@'+(raw||'madauser').replace(/\s+/g,'').toLowerCase();
        h2.after(u);
      }
    }
    const stats=page.querySelector('.profile-stats');
    if(stats){
      stats.classList.add('mada-profile-stats-modern');
      stats.querySelectorAll('button').forEach(b=>b.type='button');
    }
    const actions=page.querySelector('.profile-actions');
    if(actions)actions.classList.add('mada-profile-actions-modern');
    const tabs=page.querySelector('.profile-tabs');
    if(tabs)tabs.classList.add('mada-profile-tabs-modern');
  }
  function style(){
    if(document.getElementById('mada-profile-modern-style'))return;
    const s=document.createElement('style');s.id='mada-profile-modern-style';s.textContent=`
      .profile-page .mada-profile-username{font-size:13px;color:#8a94a6;margin:0 0 7px;font-weight:600;direction:ltr;text-align:right}
      .profile-page .mada-profile-stats-modern{background:#f7f9fc!important;border-radius:12px!important;padding:7px 8px!important;margin:7px 0 9px!important;gap:0!important;justify-content:space-around!important}
      .profile-page .mada-profile-stats-modern>button{flex:1 1 0!important;border-radius:9px!important;min-height:43px!important}
      .profile-page .mada-profile-stats-modern>button+button{border-right:1px solid #e5e9f0!important}
      .profile-page .mada-profile-stats-modern b{display:block!important;font-size:17px!important;color:#172033!important}
      .profile-page .mada-profile-stats-modern span{display:block!important;font-size:12px!important;margin-top:1px!important}
      .profile-page .mada-profile-actions-modern{margin-top:8px!important}
      .profile-page .mada-profile-tabs-modern button{position:relative!important}
      .profile-page .mada-profile-tabs-modern button.active{font-weight:900!important}
      @media(max-width:600px){.profile-page .mada-profile-username{font-size:12px}.profile-page .mada-profile-stats-modern{margin-left:0!important;margin-right:0!important}}
    `;document.head.appendChild(s);
  }
  function boot(){style();enhance();const modal=document.getElementById('modal');if(modal&&!modal.dataset.madaModernWatch){modal.dataset.madaModernWatch='1';new MutationObserver(()=>setTimeout(enhance,50)).observe(modal,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
