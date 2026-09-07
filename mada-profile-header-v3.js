/* Mada profile header v3 compatibility: core profile.js renders the real header. */
(function(){'use strict';
  function run(){
    const p=document.querySelector('#modal .profile-page');
    if(!p)return;
    if(p.querySelector('.mada-profile-meta-real'))return;
    const legacy=p.querySelector('.mada-profile-meta-v3');
    if(legacy)legacy.remove();
  }
  function boot(){run();const m=document.getElementById('modal');if(m&&!m.dataset.madaHeaderV3Watch){m.dataset.madaHeaderV3Watch='1';new MutationObserver(()=>setTimeout(run,60)).observe(m,{childList:true,subtree:true)}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();