/* Mada authoritative profile layer v3 - fixes both legacy and safe profile renderers. */
(function(){
'use strict';
if(window.__MADA_PROFILE_AUTHORITATIVE_V3)return;
window.__MADA_PROFILE_AUTHORITATIVE_V3=true;
const sb=()=>window.MADA_SUPABASE_CLIENT||window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let lastId='',busy=false,timer=0;
function css(){if(document.getElementById('mada-authoritative-profile-style-v3'))return;const s=document.createElement('style');s.id='mada-authoritative-profile-style-v3';s.textContent=`
#modal .profile-page .mada-authoritative-meta{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;flex-wrap:wrap!important;min-height:22px!important;margin:3px auto 10px!important;color:#697586!important;font-size:13px!important;font-weight:700!important}
#modal .profile-page .mada-authoritative-username{direction:ltr!important;unicode-bidi:plaintext!important}
#modal .profile-page .mada-authoritative-city{white-space:nowrap!important}
#modal .profile-page .mada-authoritative-verified{display:inline-grid!important;place-items:center!important;width:21px!important;height:21px!important;border-radius:50%!important;background:#1877f2!important;color:#fff!important;font-size:13px!important;font-weight:900!important;box-shadow:0 2px 7px rgba(24,119,242,.22)!important}
#modal .profile-page .profile-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;justify-content:center!important}
#modal .profile-page .profile-actions button{min-height:43px!important;border-radius:13px!important;font-weight:800!important}
#modal .profile-page .profile-actions .primary{background:linear-gradient(135deg,#4e63f7,#1677ff)!important;color:#fff!important}
@media(max-width:600px){#modal .profile-page .mada-authoritative-meta{font-size:12px!important;margin-bottom:8px!important}#modal .profile-page .profile-actions button{min-height:44px!important;font-size:13px!important}}
`;document.head.appendChild(s)}
async function profile(id){const c=sb();if(!c||!id)return null;try{const r=await c.from('profiles').select('id,display_name,username,city,is_verified,verification_type,verification_expires_at,role').eq('id',id).single();return r.error?null:r.data}catch{return null}}
function verified(p){if(!p?.is_verified)return false;if(p.verification_type==='premium'&&p.verification_expires_at&&new Date(p.verification_expires_at)<=new Date())return false;return true}
async function enhance(){
 if(busy)return;
 const id=window.__MADA_PROFILE_ID;if(!id)return;
 const legacy=document.querySelector('#modal .profile-page');
 const safe=document.querySelector('#modal .mada-safe-profile-shell');
 if(!legacy&&!safe)return;
 if(lastId===id&&((legacy&&legacy.dataset.madaAuthoritative==='1')||(safe&&safe.dataset.madaAuthoritative==='1')))return;
 busy=true;const p=await profile(id);busy=false;if(!p)return;if(window.__MADA_PROFILE_ID!==id)return;css();lastId=id;
 if(legacy){
   const h2=legacy.querySelector('h2');
   if(h2){
     legacy.querySelectorAll('.mada-profile-username,.mada-real-meta,.mada-profile-meta-v3,.mada-authoritative-meta').forEach(x=>x.remove());
     const meta=document.createElement('div');meta.className='mada-authoritative-meta';
     meta.innerHTML=`${p.username?`<span class="mada-authoritative-username">@${esc(p.username)}</span>`:''}${verified(p)?'<span class="mada-authoritative-verified" title="حساب موثّق" aria-label="حساب موثّق">✓</span>':''}${p.city?`<span class="mada-authoritative-city">📍 ${esc(p.city)}</span>`:''}`;
     h2.insertAdjacentElement('afterend',meta);
     const fake=legacy.querySelector('.mada-profile-username');if(fake)fake.remove();
   }
   legacy.dataset.madaAuthoritative='1';
 }
 if(safe){
   const name=safe.querySelector('.mada-safe-main h2');
   if(name){name.querySelectorAll('.mada-authoritative-verified').forEach(x=>x.remove());if(verified(p)){const v=document.createElement('span');v.className='mada-authoritative-verified';v.title='حساب موثّق';v.textContent='✓';name.appendChild(v)}let meta=safe.querySelector('.mada-authoritative-meta');if(!meta){meta=document.createElement('div');meta.className='mada-authoritative-meta';name.insertAdjacentElement('afterend',meta)}meta.innerHTML=`${p.username?`<span class="mada-authoritative-username">@${esc(p.username)}</span>`:'<span>عضو في Mada</span>'}${p.city?`<span class="mada-authoritative-city">📍 ${esc(p.city)}</span>`:''}`;safe.querySelectorAll('.mada-safe-username').forEach(x=>x.style.display='none')}
   safe.dataset.madaAuthoritative='1';
 }
}
function boot(){css();const modal=document.getElementById('modal');if(!modal){setTimeout(boot,300);return}const run=()=>{clearTimeout(timer);timer=setTimeout(enhance,80)};new MutationObserver(run).observe(modal,{childList:true,subtree:true});run()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
