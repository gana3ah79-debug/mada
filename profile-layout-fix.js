/* Mada profile layout + interaction guard + mobile bottom-nav performance fix. */
(function(){
 function page(){return document.querySelector('#modal .profile-page')}
 function dedupe(p,selector){const all=[...p.querySelectorAll(selector)];all.slice(1).forEach(x=>x.remove());return all[0]||null}
 function installBottomNavPerf(){
  if(document.getElementById('mada-bottom-nav-perf'))return;
  const s=document.createElement('style');s.id='mada-bottom-nav-perf';s.textContent=`
    .bottom-nav{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 4px 12px rgba(24,40,72,.10)!important;transform:translateZ(0);-webkit-transform:translateZ(0);will-change:transform;contain:layout paint;}
    .bottom-nav button{transition:none!important;animation:none!important;transform:translateZ(0);-webkit-transform:translateZ(0);}
    .bottom-nav .bottom-plus{box-shadow:0 4px 10px rgba(32,111,236,.18)!important;}
    @media(max-width:520px){.bottom-nav{left:6px;right:6px;bottom:6px;height:66px;border-radius:18px;box-shadow:0 3px 10px rgba(24,40,72,.10)!important}.bottom-nav button{margin:4px 2px}.bottom-nav .bottom-plus{width:50px!important;height:50px!important;margin:8px auto!important}}
  `;document.head.appendChild(s);
 }
 function fix(){
  installBottomNavPerf();
  const p=page();if(!p)return;
  const details=dedupe(p,'.fb-profile-info');
  const friends=dedupe(p,'.fb-profile-friends');
  const composer=dedupe(p,'.fb-profile-composer');
  const shared=dedupe(p,'.fb-shared-section');
  const content=p.querySelector('.profile-content');
  if(friends)p.appendChild(friends);
  if(composer)p.appendChild(composer);
  if(shared)p.appendChild(shared);
  if(content)p.appendChild(content);
  if(details){const tabs=p.querySelector('.profile-tabs');if(tabs)tabs.after(details);else p.appendChild(details)}
  p.dataset.madaLayoutFixed='1';
  window.MadaProfileButtons?.wire?.(p);
  window.MadaFinalLikeFix?.run?.();
 }
 function loadWiring(){
  if(window.MadaProfileButtons)return;
  if(document.querySelector('script[data-mada-profile-buttons]'))return;
  const s=document.createElement('script');s.src='profile-button-wiring-v4.js?v=20260902-2';s.dataset.madaProfileButtons='1';document.body.appendChild(s);
 }
 function loadLikeFinal(){
  if(window.MadaFinalLikeFix)return;
  if(document.querySelector('script[data-mada-final-like]'))return;
  const s=document.createElement('script');s.src='profile-like-final-fix.js?v=20260902-1';s.dataset.madaFinalLike='1';document.body.appendChild(s);
 }
 function watchModal(){
  const modal=document.getElementById('modal');
  if(modal){
   const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(()=>{if(page()){fix();loadWiring();loadLikeFinal()}},80)});
   obs.observe(modal,{childList:true,subtree:true});
   return true;
  }
  return false;
 }
 installBottomNavPerf();loadWiring();loadLikeFinal();
 if(!watchModal()){
  const finder=new MutationObserver(()=>{
   if(watchModal()){finder.disconnect();const p=page();if(p){fix();loadWiring();loadLikeFinal()}}
  });
  finder.observe(document.body,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{fix();loadWiring();loadLikeFinal()},300));else setTimeout(()=>{fix();loadWiring();loadLikeFinal()},300);
 window.MadaProfileLayoutFix={run:fix};
})();
