/* Mada profile hard fix v1: patches the visible safe-profile DOM directly. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const client=()=>window.MADA_SUPABASE_CLIENT||window.sb;
let busy=false,lastId=null;
function css(){
 if($('mada-profile-hard-fix-css'))return;
 const s=document.createElement('style');s.id='mada-profile-hard-fix-css';s.textContent=`
.mada-safe-profile-shell .mada-hard-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:5px 0 10px;color:#65758a;font-size:13px;font-weight:750}
.mada-safe-profile-shell .mada-hard-user{direction:ltr}
.mada-safe-profile-shell .mada-hard-verified{display:inline-flex;align-items:center;gap:4px;color:#1877f2;font-weight:900}
.mada-safe-profile-shell .mada-hard-verified i{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#1877f2;color:#fff;font-style:normal;font-size:11px}
.mada-safe-profile-shell .mada-hard-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.mada-safe-profile-shell .mada-hard-actions button{min-height:43px!important;border-radius:12px!important;font-weight:850!important}
.mada-safe-profile-shell .mada-hard-primary{background:linear-gradient(135deg,#3567f2,#13a9df)!important;color:#fff!important;border:0!important}
.mada-safe-profile-shell .mada-hard-secondary{background:#f1f4f8!important;color:#263348!important;border:1px solid #dce4ed!important}
.dark .mada-safe-profile-shell .mada-hard-secondary{background:#1a293f!important;color:#fff!important;border-color:#33445d!important}
.mada-hard-editor{display:grid;gap:10px}.mada-hard-editor label{font-weight:800}.mada-hard-editor input,.mada-hard-editor textarea{width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #dce4ed;border-radius:12px;font:inherit}.mada-hard-editor textarea{min-height:100px}.mada-hard-editor button{width:100%;min-height:43px;border:0;border-radius:12px;font-weight:850}.mada-hard-editor .save{background:#1877f2;color:#fff}.mada-hard-editor .cancel{background:#eef2f6;color:#263348}
`;
 document.head.appendChild(s);
}
async function getProfile(id){
 const c=client();if(!c||!id)return null;
 const r=await c.from('profiles').select('id,display_name,username,bio,city,location,avatar_url,cover_url,is_verified,verification_type,role').eq('id',id).maybeSingle();
 return r.error?null:r.data;
}
function modal(title,body){if(typeof window.showModal==='function')window.showModal(title,body);else{const m=$('modal'),t=$('modalTitle'),b=$('modalBody');if(m&&t&&b){t.textContent=title;b.innerHTML=body;m.hidden=false;}}}
async function editProfile(p,id){
 modal('✏️ تعديل الملف الشخصي',`<div class="mada-hard-editor">
 <label>الاسم<input id="madaHardName" value="${esc(p.display_name||'')}"></label>
 <label>اسم المستخدم<input id="madaHardUsername" value="${esc(p.username||'')}"></label>
 <label>المدينة<input id="madaHardCity" value="${esc(p.city||p.location||'')}" placeholder="مثال: القاهرة"></label>
 <label>نبذة عني<textarea id="madaHardBio">${esc(p.bio||'')}</textarea></label>
 <button id="madaHardCancel" class="cancel" type="button">إلغاء</button>
 <button id="madaHardSave" class="save" type="button">حفظ التعديلات</button></div>`);
 $('madaHardCancel')?.addEventListener('click',()=>window.ProfileUI?.open?.(id));
 $('madaHardSave')?.addEventListener('click',async()=>{
  const c=client();if(!c)return;
  const payload={display_name:$('madaHardName').value.trim(),username:$('madaHardUsername').value.trim(),city:$('madaHardCity').value.trim(),bio:$('madaHardBio').value.trim(),updated_at:new Date().toISOString()};
  const r=await c.from('profiles').update(payload).eq('id',id);
  if(r.error){alert('تعذر حفظ الملف: '+r.error.message);return;}
  window.ProfileUI?.open?.(id);
 });
}
async function patch(){
 if(busy)return;
 const root=document.querySelector('.mada-safe-profile-shell');
 const id=window.__MADA_PROFILE_ID;
 if(!root||!id||id===lastId&&root.dataset.madaHardDone==='1')return;
 busy=true;
 try{
  const p=await getProfile(id);if(!p)return;
  css();
  const main=root.querySelector('.mada-safe-main');if(!main)return;
  const me=await client().auth.getUser();const own=me.data?.user?.id===id;
  const h=main.querySelector('h2');
  if(h){
   h.innerHTML=esc(p.display_name||p.username||'مستخدم Mada')+(p.is_verified?'<span class="mada-hard-verified" style="margin-inline-start:6px"><i>✓</i></span>':'');
   let line=main.querySelector('.mada-hard-line');
   if(!line){line=document.createElement('div');line.className='mada-hard-line';h.insertAdjacentElement('afterend',line)}
   line.innerHTML=`${p.username?`<span class="mada-hard-user">@${esc(p.username)}</span>`:''}${(p.city||p.location)?`<span>📍 ${esc(p.city||p.location)}</span>`:''}${p.is_verified?'<span class="mada-hard-verified">✓ موثّق</span>':''}`;
  }
  const actions=main.querySelector('.mada-safe-actions');
  if(actions){
   actions.classList.add('mada-hard-actions');
   actions.querySelectorAll('button').forEach(b=>b.type='button');
   if(own){
    const edit=actions.querySelector('#madaSafeEdit')||document.createElement('button');
    if(!edit.parentNode)actions.prepend(edit);
    edit.id='madaSafeEdit';edit.className='mada-hard-primary';edit.textContent='✏️ تعديل الملف';edit.onclick=()=>editProfile(p,id);
    const share=actions.querySelector('[data-hard-share]')||document.createElement('button');
    if(!share.parentNode)actions.appendChild(share);
    share.type='button';share.dataset.hardShare='1';share.className='mada-hard-secondary';share.textContent='↗️ مشاركة الملف';share.onclick=()=>shareProfile(id,p);
   }else{
    const friend=actions.querySelector('#madaSafeFriend');if(friend){friend.className='mada-hard-primary';friend.textContent='👥 إضافة صديق';friend.type='button'}
    const msg=actions.querySelector('#madaSafeMessage');if(msg){msg.className='mada-hard-secondary';msg.textContent='💬 رسالة';msg.type='button'}
    const share=actions.querySelector('[data-hard-share]')||document.createElement('button');if(!share.parentNode)actions.appendChild(share);share.type='button';share.dataset.hardShare='1';share.className='mada-hard-secondary';share.textContent='↗️ مشاركة الملف';share.onclick=()=>shareProfile(id,p);
   }
  }
  root.dataset.madaHardDone='1';lastId=id;
 }catch(e){console.warn('Mada profile hard fix:',e)}
 finally{busy=false}
}
function shareProfile(id,p){
 const url=location.origin+location.pathname+'?profile='+encodeURIComponent(id);
 if(navigator.share)navigator.share({title:p?.display_name||'Mada',text:'شاهد هذا الملف على Mada',url}).catch(()=>{});
 else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>alert('تم نسخ رابط الملف ✓'));
}
function watch(){
 patch();
 const mo=new MutationObserver(()=>{const root=document.querySelector('.mada-safe-profile-shell');if(root&&root.dataset.madaHardDone!=='1')patch();});
 mo.observe(document.body,{childList:true,subtree:true});
 setInterval(()=>{const root=document.querySelector('.mada-safe-profile-shell');if(root&&root.dataset.madaHardDone!=='1')patch();},1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
