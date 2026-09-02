/* Mada profile layout guard: remove async duplicates and enforce one stable order. */
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
 }
 const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(fix,60)});obs.observe(document.body,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fix,300));else setTimeout(fix,300);
 window.MadaProfileLayoutFix={run:fix};
})();