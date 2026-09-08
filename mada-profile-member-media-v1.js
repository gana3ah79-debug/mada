/* Mada Profile Member Media v2 — member profiles are view-only for avatar/cover media. */
(function(){'use strict';
if(window.__MADA_PROFILE_MEMBER_MEDIA_V2)return;window.__MADA_PROFILE_MEMBER_MEDIA_V2=true;
const c=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const esc=s=>String(s??'').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[x]));
function mediaUrl(v){const s=String(v||'').trim();if(!s)return'';if(/^https?:\/\//i.test(s)||s.startsWith('data:'))return s;try{return c()?.storage?.from('profile-images')?.getPublicUrl(s)?.data?.publicUrl||s}catch{return s}}
function paint(root,p){if(!root||!p)return;const avatar=mediaUrl(p.avatar_url),cover=mediaUrl(p.cover_url);root.dataset.avatarUrl=avatar;root.dataset.coverUrl=cover;
 const a=root.querySelector('.fb-avatar');if(a){if(avatar){a.querySelector('span')?.remove();let img=a.querySelector('img');if(!img){img=document.createElement('img');a.insertBefore(img,a.firstChild)}img.src=avatar;img.alt='';img.loading='eager';img.decoding='async';}else if(!a.querySelector('img')){a.querySelector('span')?.remove();const s=document.createElement('span');s.textContent=(p.display_name||p.username||'م').trim().charAt(0)||'م';a.insertBefore(s,a.firstChild)}}
 const coverBox=root.querySelector('.fb-cover');if(coverBox){if(cover){coverBox.querySelector('.fb-cover-placeholder')?.remove();let img=coverBox.querySelector('.fb-cover-img');if(!img){img=document.createElement('img');img.className='fb-cover-img';img.alt='';coverBox.insertBefore(img,coverBox.firstChild)}img.src=cover;img.loading='eager';img.decoding='async';}else if(!coverBox.querySelector('.fb-cover-img')&&!coverBox.querySelector('.fb-cover-placeholder')){const d=document.createElement('div');d.className='fb-cover-placeholder';d.innerHTML='<span>MADA</span>';coverBox.insertBefore(d,coverBox.firstChild)}}
}
function hideEditControls(root){if(window.__MADA_PROFILE_OWN===true)return;if(!root)return;root.querySelector('.fb-cover-action')?.remove();root.querySelector('.fb-avatar-camera')?.remove();const tools=root.querySelector('.fb-cover-tools');if(tools){const buttons=[...tools.querySelectorAll('button')];buttons[2]?.remove();}}
async function refreshCurrent(){const root=document.querySelector('.mada-fb-profile'),id=root?.dataset?.profileId||window.__MADA_PROFILE_ID;if(!root||!id||!c())return;hideEditControls(root);try{const r=await c().from('profiles').select('id,display_name,username,avatar_url,cover_url').eq('id',id).maybeSingle();if(!r.error&&r.data){paint(root,r.data);hideEditControls(root)}}catch(e){console.debug('[Mada Member Media]',e)}}
function boot(){const apply=()=>{const root=document.querySelector('.mada-fb-profile');if(root){hideEditControls(root);if(!root.__madaMemberMediaSeen){root.__madaMemberMediaSeen=1;refreshCurrent()}}};apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.MadaProfileMemberMediaV2={refresh:refreshCurrent,paint};
})();
