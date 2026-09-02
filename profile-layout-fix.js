/* Mada profile layout + interaction guard. Keeps the profile clean and loads the real button wiring. */
(function(){
 function page(){return document.querySelector('#modal .profile-page')}
 function dedupe(p,selector){const all=[...p.querySelectorAll(selector)];all.slice(1).forEach(x=>x.remove());return all[0]||null}
 function fix(){const p=page();if(!p)return;
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
 }
 function loadWiring(){
  if(window.MadaProfileButtons)return;
  if(document.querySelector('script[data-mada-profile-buttons]'))return;
  const s=document.createElement('script');s.src='profile-button-wiring.js?v=20260902-2';s.dataset.madaProfileButtons='1';document.body.appendChild(s);
 }
 loadWiring();
 const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(()=>{fix();loadWiring()},60)});obs.observe(document.body,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{fix();loadWiring()},300));else setTimeout(()=>{fix();loadWiring()},300);
 window.MadaProfileLayoutFix={run:fix};
})();