/* Mada: real profile header fields/actions - isolated, no legacy rewrites. */
(function(){
'use strict';
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function style(){if(document.getElementById('madaRealProfileStyle'))return;const s=document.createElement('style');s.id='madaRealProfileStyle';s.textContent=`
.mada-real-meta{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:2px 0 9px;color:#697586;font-size:13px;font-weight:600}.mada-real-username{direction:ltr}.mada-real-verified{display:inline-flex;align-items:center;gap:4px;color:#1877f2;font-weight:800}.mada-real-city{display:inline-flex;align-items:center;gap:3px}.mada-real-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.mada-real-actions button{min-height:40px!important;border-radius:12px!important;font-weight:800!important}.mada-real-primary{background:#1877f2!important;color:#fff!important;border:0!important}.mada-real-secondary{background:#f0f2f5!important;color:#172033!important;border:0!important}.dark .mada-real-secondary{background:#26364d!important;color:#fff!important}
` ;document.head.appendChild(s)}
async function enhance(){const page=document.querySelector('#modal .profile-page');if(!page)return;const id=window.__MADA_PROFILE_ID;if(!id)return;const client=sb();if(!client)return;style();let data=page.dataset.madaRealProfileData;let p=null;try{p=data?JSON.parse(data):(await client.from('profiles').select('id,display_name,username,city,is_verified,verification_type,role').eq('id',id).single()).data;if(p)page.dataset.madaRealProfileData=JSON.stringify(p)}catch(e){return}
const h2=page.querySelector('h2');if(h2){let meta=page.querySelector('.mada-real-meta');if(!meta){meta=document.createElement('div');meta.className='mada-real-meta';h2.insertAdjacentElement('afterend',meta)}meta.innerHTML=`${p.username?`<span class="mada-real-username">@${esc(p.username)}</span>`:''}${p.is_verified?'<span class="mada-real-verified">✓ موثّق</span>':''}${p.city?`<span class="mada-real-city">📍 ${esc(p.city)}</span>`:''}`}
const actions=page.querySelector('.profile-actions');if(actions){actions.classList.add('mada-real-actions');actions.querySelectorAll('button').forEach(b=>b.type='button');if(id===window.__MADA_PROFILE_ID && !actions.querySelector('#editProfile')){const b=document.createElement('button');b.id='editProfile';b.className='primary wide mada-real-primary';b.type='button';b.textContent='✏️ تعديل الملف';actions.prepend(b);b.onclick=()=>window.ProfileUI?.edit?.()}}
}
function boot(){enhance();const m=document.getElementById('modal');if(m&&!m.dataset.madaRealWatch){m.dataset.madaRealWatch='1';new MutationObserver(()=>setTimeout(enhance,80)).observe(m,{childList:true,subtree:true})}setInterval(enhance,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
