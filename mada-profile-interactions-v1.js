/* Mada Profile Interactions v3 — shared profile controls only; editing belongs exclusively to MadaProfileEditor. */
(function(){'use strict';
if(window.__MADA_PROFILE_INTERACTIONS_V3)return;window.__MADA_PROFILE_INTERACTIONS_V3=true;
const $=id=>document.getElementById(id),C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const toast=t=>window.showToast?.(t)||window.showModal?.('Mada',`<div class="fb-empty">${esc(t)}</div>`);
const own=()=>window.__MADA_PROFILE_OWN===true;
const profile=()=>window.__MADA_PROFILE_DATA||{};
function share(){const p=profile(),url=location.origin+location.pathname+'#profile-'+encodeURIComponent(p.id||'');if(navigator.share)navigator.share({title:p.display_name||'Mada',text:'شاهد هذا الملف على Mada',url}).catch(()=>{});else navigator.clipboard?.writeText(url).then(()=>toast('تم نسخ رابط الملف')).catch(()=>toast('تعذر نسخ الرابط'))}
async function tab(type){const box=$('mfpContent');if(!box)return;if(type==='all')return window.ProfileUI?.refresh?.(window.__MADA_PROFILE_ID);box.innerHTML='<div class="mada-fast-loading">جاري التحميل…</div>';const c=C(),id=window.__MADA_PROFILE_ID;if(!c||!id)return;const q=await c.from('posts').select('id,body,media_url,created_at,is_pinned').eq('author_id',id).order('created_at',{ascending:false}).limit(50);if(q.error){box.innerHTML='<div class="fb-empty">تعذر تحميل المحتوى.</div>';return}let rows=q.data||[];const isImg=u=>!!u&&/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u),isVid=u=>!!u&&/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);if(type==='photos')rows=rows.filter(x=>isImg(x.media_url));if(type==='reels')rows=rows.filter(x=>isVid(x.media_url));if(type==='memories'){const cut=Date.now()-365*86400000;rows=rows.filter(x=>x.created_at&&new Date(x.created_at).getTime()<cut)}if(!rows.length){box.innerHTML=`<div class="fb-empty">لا يوجد ${type==='photos'?'صور':type==='reels'?'ريلز':'ذكريات'} للعرض الآن.</div>`;return}box.innerHTML=rows.map(x=>`<article class="fb-post" data-post-id="${esc(x.id)}"><div class="fb-post-top"><div class="fb-post-avatar">${esc((profile().display_name||profile().username||'م')[0])}</div><div><b>${esc(profile().display_name||profile().username||'مستخدم')}</b><time>${x.created_at?esc(new Date(x.created_at).toLocaleString('ar-EG')):''}</time></div><button class="fb-post-more" type="button" aria-label="خيارات المنشور">•••</button></div>${x.is_pinned?'<small class="mada-pinned">📌 منشور مثبت</small>':''}<p>${esc(x.body||'')}</p>${x.media_url?(isVid(x.media_url)?`<video class="fb-real-media" controls preload="metadata" src="${esc(x.media_url)}"></video>`:`<div class="fb-real-media"><img src="${esc(x.media_url)}" alt="" loading="lazy"></div>`):''}</article>`).join('')}
function options(){const buttons=own()?'<button id="mpiEdit">✏️ تعديل الملف الشخصي</button><button id="mpiShare">↗ مشاركة الملف</button><button id="mpiFriends">👥 الأصدقاء</button>':'<button id="mpiShare">↗ مشاركة الملف</button><button id="mpiFriends">👥 الأصدقاء</button>';window.showModal?.('⚙️ خيارات الملف',`<div class="mada-profile-menu">${buttons}</div>`);setTimeout(()=>{$('mpiEdit')?.addEventListener('click',()=>window.ProfileUI?.edit?.());$('mpiShare')?.addEventListener('click',share);$('mpiFriends')?.addEventListener('click',()=>window.MadaProfileControlsV1?.friends?.())},0)}
function lockInfo(){window.showModal?.('🔒 قفل الملف الشخصي','<div class="fb-empty">عند قفل الملف الشخصي يتم تقليل ما يمكن للزوار رؤيته. يمكنك إدارة بياناتك من تعديل الملف الشخصي.</div>')}
function create(mode){if(window.openCreatePost)return window.openCreatePost({mode});toast('تعذر فتح إنشاء المحتوى')}
function bind(){document.addEventListener('click',e=>{const modal=$('modal');if(!modal||!modal.contains(e.target))return;const b=e.target.closest('button');if(!b)return;
if(b.id==='mfpShare'){e.preventDefault();e.stopPropagation();share();return}
if(b.id==='mfpLockInfo'){e.preventDefault();e.stopPropagation();lockInfo();return}
/* fb-post-more is intentionally owned by MadaProfilePostManagement. */
/* #mfpEdit and #mfpDetailsEdit are intentionally owned by MadaProfileEditor. */
if(b.id==='mfpAllFriends'){e.preventDefault();e.stopPropagation();window.MadaProfileControlsV1?.friends?.();return}
if(b.id==='mfpCover'||b.id==='mfpAvatar'){if(!own()){e.preventDefault();e.stopPropagation();toast('لا يمكنك تعديل صورة هذا الملف.')}return}
if(b.id==='mfpAddStory'){e.preventDefault();e.stopPropagation();window.openCreateStory?.()||create('story');return}
if(b.id==='mfpCreatePost'){e.preventDefault();e.stopPropagation();create('post');return}
if(b.id==='mfpPhotoCreate'){e.preventDefault();e.stopPropagation();create('photo');return}
if(b.id==='mfpReelCreate'){e.preventDefault();e.stopPropagation();create('reel');return}
if(b.id==='mfpLive'){e.preventDefault();e.stopPropagation();create('live');return}
if(b.closest('.fb-tabs')){e.preventDefault();e.stopPropagation();const all=[...document.querySelectorAll('#modal .fb-tabs button')];all.forEach(x=>x.classList.remove('active'));b.classList.add('active');const t=b.id;tab(t==='mfpPostsTab'?'all':t==='mfpPhotosTab'?'photos':t==='mfpReelsTab'?'reels':'memories');return}
if(b.getAttribute('aria-label')==='خيارات'||b.getAttribute('aria-label')==='القائمة'){e.preventDefault();e.stopPropagation();options();return}
if(b.getAttribute('aria-label')==='بحث'){e.preventDefault();e.stopPropagation();window.MadaProfileControlsV1?.openSearch?.();return}
},{capture:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
const s=document.createElement('style');s.textContent='.mada-profile-menu{display:grid;gap:8px}.mada-profile-menu button{border:0;border-radius:12px;background:#f0f2f5;padding:13px;text-align:right;font:inherit;font-weight:800}.fb-real-media video{width:100%;max-height:520px;display:block;object-fit:contain;background:#000}';document.head.appendChild(s);
window.MadaProfileInteractionsV1={share,tab,options};
})();