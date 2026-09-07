/* Mada profile polish v1 - safe loader */
(function(){
  'use strict';
  if(window.__MADA_PROFILE_POLISH_V1)return;
  window.__MADA_PROFILE_POLISH_V1=true;
  function load(){
    if(!document.getElementById('mada-profile-polish-v2-css')){
      var l=document.createElement('link');l.id='mada-profile-polish-v2-css';l.rel='stylesheet';l.href='mada-profile-polish-v2.css?v20260906-2';document.head.appendChild(l);
    }
    if(!document.getElementById('mada-real-profile-header')){
      var js=document.createElement('script');js.id='mada-real-profile-header';js.src='mada-profile-real-header-v1.js?v20260907-2';document.body.appendChild(js);
    }
  }
  function style(){
    if(document.getElementById('mada-profile-polish-v1-style'))return;
    var s=document.createElement('style');s.id='mada-profile-polish-v1-style';s.textContent='#modal .profile-page{background:#fff!important;color:#172033!important;border-radius:22px!important;overflow:hidden!important}#modal .profile-page .profile-main{background:#fff!important}#modal .profile-page .profile-tabs{background:#fff!important}';document.head.appendChild(s);
  }
  function boot(){style();load();var m=document.getElementById('modal');if(m&&!m.dataset.madaProfilePolishWatch){m.dataset.madaProfilePolishWatch='1';new MutationObserver(load).observe(m,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
