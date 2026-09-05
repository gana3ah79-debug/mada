/* Mada - profile actions v1: safe enhancements for the isolated profile shell. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function toast(msg){
    let t=$('madaProfileToast');
    if(!t){t=document.createElement('div');t.id='madaProfileToast';t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%) translateY(12px);z-index:99999;background:#111827;color:#fff;padding:10px 16px;border-radius:14px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.22);opacity:0;transition:.2s;pointer-events:none';document.body.appendChild(t)}
    t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(12px)'},1800)
  }
  function wire(){
    const root=document.querySelector('.mada-safe-profile-shell');if(!root||root.dataset.actionsV1==='1')return;
    root.dataset.actionsV1='1';
    const title=root.querySelector('h2')?.textContent?.replace('👑','').trim()||'ملف شخصي';
    const share=document.createElement('button');share.className='profile-pill mada-profile-share';share.type='button';share.textContent='↗️ مشاركة';
    root.querySelector('.mada-safe-actions')?.appendChild(share);
    share.onclick=async()=>{try{await navigator.clipboard?.writeText(location.href);toast('تم نسخ رابط Mada');}catch(e){toast('يمكنك مشاركة رابط الصفحة من المتصفح')}};
    root.querySelectorAll('.mada-safe-stats > div,.mada-safe-stats > button').forEach(x=>x.setAttribute('role','button'));
    root.querySelector('.mada-safe-main')?.insertAdjacentHTML('beforeend','<div class="mada-profile-presence">● عضو في Mada</div>');
  }
  const obs=new MutationObserver(()=>setTimeout(wire,40));
  function start(){const m=$('modal');if(m)obs.observe(m,{childList:true,subtree:true});wire()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
