/* Mada Push v1 — background Buzz push notifications */
(()=>{
'use strict';
if(window.__MADA_PUSH_V1)return;window.__MADA_PUSH_V1=true;
const S=()=>window.MADA_SUPABASE_CLIENT||window.supabase;
const PUBLIC_VAPID='BAo3eGfbcyFwhD0GTKp0AExH7291VUa2bAUce5xM7qe3SD-ZzvKfMWKv6LPDLGGgEnAWCLvOYMEDYnNi0Wd6F8M';
let sb,user;
const toast=t=>{const x=document.createElement('div');x.className='mada-ms-toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),3200)};
function urlBase64ToUint8Array(base64){const pad='='.repeat((4-base64.length%4)%4),raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function register(){if(!('serviceWorker' in navigator)||!('PushManager' in window))throw new Error('push-not-supported');return navigator.serviceWorker.register('/mada-push-sw.js',{scope:'/'});}
async function enable(show=true){
 if(!sb||!user)return false;
 if(!window.isSecureContext){if(show)toast('الإشعارات تحتاج اتصالًا آمنًا HTTPS');return false}
 try{
  const reg=await register();
  let perm=Notification.permission;
  if(perm==='default')perm=await Notification.requestPermission();
  if(perm!=='granted'){if(show)toast('فعّل إشعارات Mada من إعدادات الهاتف');return false}
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(PUBLIC_VAPID)});
  const j=sub.toJSON();
  const payload={endpoint:j.endpoint,expirationTime:j.expirationTime||null,keys:j.keys||{}};
  const r=await sb.auth.updateUser({data:{mada_push:payload}});
  if(r.error)throw r.error;
  if(show)toast('🔔 تم تفعيل إشعارات Buzz في الخلفية');
  return true;
 }catch(e){console.error('Mada push',e);if(show)toast('تعذر تفعيل إشعارات Buzz');return false}
}
function addButton(){
 const head=document.querySelector('.mada-ms-head');
 if(!head||document.getElementById('madaMsPush'))return;
 const b=document.createElement('button');b.id='madaMsPush';b.type='button';b.textContent='🔔';b.title='تفعيل إشعارات Buzz';b.setAttribute('aria-label','تفعيل إشعارات Buzz');head.insertBefore(b,head.firstChild);b.onclick=()=>enable(true);
}
function handleBuzz(id){if(!id)return;const go=()=>window.MadaMessenger?.openFriend?.(id);if(window.MadaMessenger)go();else setTimeout(go,1200)}
async function start(){sb=S();if(!sb)return;const s=await sb.auth.getSession();user=s.data?.session?.user;if(!user)return;try{await register()}catch(_){};navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='MADA_BUZZ')handleBuzz(e.data.sender_id)});const q=new URLSearchParams(location.search);if(q.get('madaBuzz'))setTimeout(()=>handleBuzz(q.get('madaBuzz')),1200);setInterval(addButton,900)}
const boot=setInterval(()=>{if(window.MADA_SUPABASE_CLIENT){clearInterval(boot);start()}},500);
window.MadaPush={enable,register};
})();