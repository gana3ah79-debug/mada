/* Mada Push v3 — persistent device subscriptions */
(()=>{
'use strict';
if(window.__MADA_PUSH_V3)return;window.__MADA_PUSH_V3=true;
const S=()=>window.MADA_SUPABASE_CLIENT||window.supabase;
const PUBLIC_VAPID='BAo3eGfbcyFwhD0GTKp0AExH7291VUa2bAUce5xM7qe3SD-ZzvKfMWKv6LPDLGGgEnAWCLvOYMEDYnNi0Wd6F8M';
let sb,user;
const toast=t=>{const x=document.createElement('div');x.className='mada-ms-toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),4500)};
function b64(s){const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)))}
async function register(){if(!window.isSecureContext)throw Error('secure-context');if(!('serviceWorker' in navigator))throw Error('service-worker');if(!('PushManager' in window))throw Error('push-manager');return navigator.serviceWorker.register('/mada-push-sw.js',{scope:'/'});}
async function enable(show=true){
 if(!sb||!user){if(show)toast('افتح حسابك في Mada أولًا');return false}
 try{
  if(!('Notification' in window))throw Error('notification');
  const reg=await register();
  let perm=Notification.permission;if(perm==='default')perm=await Notification.requestPermission();
  if(perm!=='granted')throw Error(perm==='denied'?'denied':'permission');
  let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(PUBLIC_VAPID)});
  const j=sub.toJSON();if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)throw Error('bad-subscription');
  const row={user_id:user.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,expiration_time:j.expirationTime||null,updated_at:new Date().toISOString()};
  const r=await sb.from('mada_push_subscriptions').upsert(row,{onConflict:'endpoint'});if(r.error)throw Error('db:'+r.error.message);
  await sb.auth.updateUser({data:{mada_push:{endpoint:j.endpoint,expirationTime:j.expirationTime||null,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth}}}});
  if(show)toast('🔔 تم تفعيل Buzz في الخلفية بنجاح');
  return true;
 }catch(e){
  console.error('Mada Push v3',e);const m=String(e?.message||e);let msg='تعذر تفعيل إشعارات Buzz';
  if(m==='secure-context')msg='افتح Mada من رابط HTTPS';else if(m==='service-worker')msg='المتصفح لا يدعم Service Worker';else if(m==='push-manager'||m==='notification')msg='هذا المتصفح لا يدعم إشعارات Push';else if(m==='denied')msg='الإشعارات مرفوضة — فعّلها من إعدادات المتصفح';else if(m==='permission')msg='لم يتم السماح بالإشعارات';else if(m==='bad-subscription')msg='تعذر إنشاء اشتراك الإشعارات';else if(m.startsWith('db:'))msg='تعذر حفظ جهاز الإشعارات — أعد فتح Mada وتسجيل الدخول';
  toast(msg);return false;
 }
}
function addButton(){const h=document.querySelector('.mada-ms-head');if(!h||document.getElementById('madaMsPush'))return;const b=document.createElement('button');b.id='madaMsPush';b.type='button';b.textContent='🔔';b.title='تفعيل إشعارات Buzz في الخلفية';b.setAttribute('aria-label','تفعيل إشعارات Buzz في الخلفية');b.onclick=()=>enable(true);h.insertBefore(b,h.firstChild)}
function handleBuzz(id){if(!id)return;const go=()=>window.MadaMessenger?.openFriend?.(id);if(window.MadaMessenger)go();else setTimeout(go,1200)}
async function start(){sb=S();if(!sb)return;const s=await sb.auth.getSession();user=s.data?.session?.user;if(!user)return;try{await register()}catch(e){}navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='MADA_BUZZ')handleBuzz(e.data.sender_id)});const q=new URLSearchParams(location.search);if(q.get('madaBuzz'))setTimeout(()=>handleBuzz(q.get('madaBuzz')),1200);addButton();setInterval(addButton,1500)}
const boot=setInterval(()=>{if(window.MADA_SUPABASE_CLIENT){clearInterval(boot);start()}},500);window.MadaPush={enable,register};
})();
