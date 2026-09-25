/* Mada Button Audit v1 — explicit wiring for previously inert controls. */
(()=>{'use strict';
if(window.__MADA_BUTTON_AUDIT_V1)return;window.__MADA_BUTTON_AUDIT_V1=true;
const $=id=>document.getElementById(id);
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
function toast(t){const x=document.createElement('div');x.textContent=t;x.style='position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:50000;background:#111827;color:#fff;padding:11px 16px;border-radius:14px;font-weight:800;max-width:90vw;text-align:center';document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
function bind(id,fn){const e=$(id);if(!e||e.dataset.auditBound)return;e.dataset.auditBound='1';e.addEventListener('click',e=>{e.preventDefault();Promise.resolve().then(()=>fn(e)).catch(err=>{console.error('Mada button',id,err);toast('تعذر تنفيذ الأمر. حاول مرة أخرى.')}})})}
function locationButton(){
  const input=$('postInput');if(!input)return;
  if(!navigator.geolocation){toast('الموقع غير متاح على هذا الجهاز');return}
  toast('جارٍ تحديد موقعك…');
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude.toFixed(6),lng=pos.coords.longitude.toFixed(6);
    const link='https://maps.google.com/?q='+lat+','+lng;
    const value='📍 موقعي: '+link;
    input.value=input.value.trim()?input.value.trim()+'\n'+value:value;
    input.focus();
    input.placeholder='أضف وصفًا للموقع ثم اضغط نشر';
    toast('تمت إضافة موقعك إلى المنشور');
  },err=>{
    const msg=err?.code===1?'اسمح للتطبيق بالوصول إلى الموقع من إعدادات الجهاز.':err?.code===2?'تعذر تحديد الموقع حاليًا.':'انتهت مهلة تحديد الموقع.';
    toast(msg);
  },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
function feelingButton(){
  const feelings=['😊 سعيد','😍 محبوب','😂 مرح','😎 رائع','🤩 متحمس','🥰 ممتن','😢 حزين','😡 غاضب','🤔 أفكر','😴 متعب','🎉 أحتفل','🙏 ممتن'];
  if(typeof window.showModal!=='function')return;
  showModal('🙂 بماذا تشعر؟','<div class="feeling-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'+feelings.map((x,i)=>'<button type="button" class="profile-pill" data-feeling="'+i+'">'+x+'</button>').join('')+'</div>');
  const box=$('modalBody');box?.querySelectorAll('[data-feeling]').forEach(b=>b.onclick=()=>{
    const input=$('postInput');if(input){input.value=input.value.trim()?' '+input.value.trim()+'\n'+b.textContent.trim():b.textContent.trim();input.focus();input.placeholder='اكتب منشورك...';}
    window.closeModal?.();
  });
}
function home(){window.scrollTo({top:0,behavior:'smooth'});if(typeof window.loadFeed==='function')Promise.resolve(window.loadFeed(true)).catch(()=>{})}
function audit(){
  bind('locationBtn',locationButton);
  bind('feelingBtn',feelingButton);
  bind('homeBottom',home);
  bind('menuBottom',()=>window.MadaMenuUI?.open?.());
  bind('menuBtn',()=>window.MadaMenuUI?.open?.());
  bind('reelsBtn',()=>window.MadaSocialUpgrades?.loadReels?.());
  bind('allStoriesBtn',()=>window.MadaSocialUpgrades?.loadPublicStories?.());
  bind('addStoryBtn',()=>window.MadaStoriesReels?.create?.('story'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(audit,300),{once:true});else setTimeout(audit,300);
window.MadaButtonAudit={audit};
})();