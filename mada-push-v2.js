/* Mada Push v2 — robust background Buzz push setup */
(()=>{
'use strict';
if(window.__MADA_PUSH_V2)return;window.__MADA_PUSH_V2=true;
const S=()=>window.MADA_SUPABASE_CLIENT||window.supabase;
const PUBLIC_VAPID='BAo3eGfbcyFwhD0GTKp0AExH7291VUa2bAUce5xM7qe3SD-ZzvKfMWKv6LPDLGGgEnAWCLvOYMEDYnNi0Wd6F8M';
let sb,user;
const toast=t=>{const x=document.createElement('div');x.className='mada-ms-toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),4200)};
function urlBase64ToUint8Array(base64){const pad='='.repeat((4-base64.length%4)%4),raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function register(){
 if(!window.isSecureContext)throw new Error('secure-context');
 if(!('serviceWorker' in navigator))throw new Error('service-worker');
 if(!('PushManager' in window))throw new Error('push-manager');
 return navigator.serviceWorker.register('/mada-push-sw.js',{scope:'/'});
}
async function enable(show=true){
 if(!sb||!user){if(show)toast('افتح حسابك في Mada أولًا');return false}
 try{
  if(!('Notification' in window)){toast('هذا المتصفح لا يدعم إشعارات Buzz');return false}
  const reg=await register();
  let perm=Notification.permission;
  if(perm==='default')perm=await Notification.requestPermission();
  if(perm!=='granted'){
   toast(perm==='denied'?'إشعارات Mada مرفوضة — فعّلها من إعدادات الموقع في المتصفح':'لم يتم السماح بالإشعارات');
   return false;
  }
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(PUBLIC_VAPID)});
  const j=sub.toJSON();
  if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)throw new Error('bad-subscription');
  const payload={endpoint:j.endpoint,expirationTime:j.expirationTime||null,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth}};
  const r=await sb.auth.updateUser({data:{mada_push:payload}});
  if(r.error)throw new Error('profile-save:'+r.error.message);
  if(show)toast('🔔 تم تفعيل Buzz في الخلفية بنجاح');
  return true;
 }catch(e){
  console.error('Mada Push v2',e);
  const m=String(e?.message||e);
  let msg='تعذر تفعيل إشعارات Buzz';
  if(m==='secure-context')msg='افتح Mada من رابط HTTPS';
  else if(m==='service-worker')msg='المتصفح لا يدعم Service Worker';
  else if(m==='push-manager')msg='المتصفح لا يدعم Push Notifications';
  else if(m==='bad-subscription')msg='تعذر إنشاء اشتراك الإشعارات';
  else if(m.startsWith('profile-save:'))msg='تعذر حفظ إشعار جهازك — أعد تسجيل الدخول';
  toast(msg);return false;
 }
}
function addButton(){
 const head=document.querySelector('.mada-ms-head');
 if(!head||document.getElementById('madaMsPush'))return;
 const b=document.createElement('button');b.id='madaMsPush';b.type='button';b.textContent='🔔';b.title='تفعيل إشعارات Buzz في الخلفية';b.setAttribute('aria-label','تفعيل إشعارات Buzz في الخلفية');
 b.onclick=()=>enable(true);head.insertBefore(b,head.firstChild);
}
function handleBuzz(id){if(!id)return;const go=()=>window.MadaMessenger?.openFriend?.(id);if(window.MadaMessenger)go();else setTimeout(go,1200)}
async function start(){
 sb=S();if(!sb)return;
 const s=await sb.auth.getSession();user=s.data?.session?.user;if(!user)return;
 try{await register()}catch(e){console.warn('Mada push service worker',e)}
 navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='MADA_BUZZ')handleBuzz(e.data.sender_id)});
 const q=new URLSearchParams(location.search);if(q.get('madaBuzz'))setTimeout(()=>handleBuzz(q.get('madaBuzz')),1200);
 addButton();setInterval(addButton,1500);
}
const boot=setInterval(()=>{if(window.MADA_SUPABASE_CLIENT){clearInterval(boot);start()}},500);
window.MadaPush={enable,register};
})();