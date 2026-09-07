/* Mada profile header v4: visual header enhancement without replacing profile logic. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
function css(){if($('mada-profile-header-v4-css'))return;const s=document.createElement('style');s.id='mada-profile-header-v4-css';s.textContent=`
.mada-root-profile .mada-root-cover,.mada-v3-profile .v3-cover{height:190px!important;background-size:cover!important;background-position:center!important}
.mada-root-profile .mada-root-avatar,.mada-v3-profile .v3-avatar{width:116px!important;height:116px!important;margin-top:-58px!important;border-width:5px!important;box-shadow:0 4px 18px rgba(0,0,0,.14)}
.mada-root-profile .mada-root-main h2,.mada-v3-profile .v3-main h2{display:flex;align-items:center;justify-content:flex-start;gap:6px;flex-wrap:wrap}
.mada-profile-join-v4{display:inline-flex;align-items:center;gap:5px;color:#718096;font-size:12px;font-weight:700;margin:4px 0 10px}
.mada-profile-join-v4::before{content:'🗓️'}
.dark .mada-profile-join-v4{color:#aeb8c7}
@media(max-width:600px){.mada-root-profile .mada-root-cover,.mada-v3-profile .v3-cover{height:175px!important}.mada-root-profile .mada-root-avatar,.mada-v3-profile .v3-avatar{width:108px!important;height:108px!important;margin-top:-54px!important}}
`;document.head.appendChild(s)}
async function profile(id){const c=sb();if(!c||!id)return null;try{const r=await c.from('profiles').select('id,display_name,username,city,bio,avatar_url,cover_url,is_verified,created_at').eq('id',id).maybeSingle();return r.data||null}catch(e){return null}}
async function enhance(id){css();const p=await profile(id);if(!p)return;const root=document.querySelector('#modal .mada-root-profile');if(root){const main=root.querySelector('.mada-root-main');if(main&&!main.querySelector('.mada-profile-join-v4')){const el=document.createElement('div');el.className='mada-profile-join-v4';el.textContent='عضو منذ '+new Date(p.created_at).toLocaleDateString('ar-EG',{year:'numeric',month:'long'});const bio=main.querySelector('.mada-root-bio');(bio||main.querySelector('.mada-root-actions'))?.insertAdjacentElement('beforebegin',el)}}
const v3=document.querySelector('#modal .mada-v3-profile');if(v3){const main=v3.querySelector('.v3-main');if(main&&!main.querySelector('.mada-profile-join-v4')){const el=document.createElement('div');el.className='mada-profile-join-v4';el.textContent='عضو منذ '+new Date(p.created_at).toLocaleDateString('ar-EG',{year:'numeric',month:'long'});const bio=main.querySelector('.v3-bio');(bio||main.querySelector('.v3-actions'))?.insertAdjacentElement('beforebegin',el)}}}
function watch(){const m=$('modal');if(!m)return setTimeout(watch,300);const run=()=>{const id=window.__MADA_PROFILE_ID;if(id){enhance(id);setTimeout(()=>enhance(id),250);setTimeout(()=>enhance(id),900)}};new MutationObserver(run).observe(m,{subtree:true,childList:true});run()}
css();watch();
})();
