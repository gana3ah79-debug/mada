/* Mada Profile Edit Fix v1 — reliable self-profile editing with clear errors. */
(function(){'use strict';
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
let busy=false;
function openEditor(){
 const id=window.__MADA_PROFILE_ID||window.__MADA_CURRENT_USER_ID;
 if(!id)return;
 const p=window.__MADA_PROFILE_HEADER_DATA__||{};
 const show=window.showModal;
 if(!show)return;
 show('✏️ تعديل الملف الشخصي',`<div class="edit-profile mada-edit-fix">
 <label>الاسم<input id="mpeName" value="${esc(p.display_name||'')}" maxlength="80" autocomplete="name"></label>
 <label>اسم المستخدم<input id="mpeUsername" value="${esc(p.username||'')}" maxlength="40" dir="ltr" autocomplete="username"></label>
 <label>المدينة<input id="mpeCity" value="${esc(p.city||'')}" maxlength="80"></label>
 <label>نبذة عني<textarea id="mpeBio" maxlength="500">${esc(p.bio||'')}</textarea></label>
 <div id="mpeError" class="empty" hidden></div>
 <button id="mpeSave" class="primary wide" type="button">حفظ التعديلات</button>
 </div>`);
 $('mpeSave').onclick=async()=>{
  if(busy)return;
  const name=$('mpeName').value.trim(),username=$('mpeUsername').value.trim()||null,city=$('mpeCity').value.trim()||null,bio=$('mpeBio').value.trim()||null,err=$('mpeError'),btn=$('mpeSave');
  if(!name){err.hidden=false;err.textContent='الاسم مطلوب.';return}
  if(username&&!/^[A-Za-z0-9_.\-\u0600-\u06FF]{3,40}$/.test(username)){err.hidden=false;err.textContent='اسم المستخدم يجب أن يكون 3 إلى 40 حرفًا.';return}
  busy=true;btn.disabled=true;btn.textContent='جاري الحفظ…';err.hidden=true;
  try{
   const r=await C().from('profiles').update({display_name:name,username,city,bio,updated_at:new Date().toISOString()}).eq('id',id).select('id,display_name,username,bio,city,avatar_url,cover_url,role,is_verified,verification_type,verification_expires_at,created_at').maybeSingle();
   if(r.error)throw r.error;
   if(!r.data)throw new Error('لم يتم تعديل الملف. تأكد أن الحساب الحالي هو نفس صاحب الملف.');
   window.__MADA_PROFILE_HEADER_DATA__=r.data;
   alert('تم حفظ تعديلات الملف الشخصي ✓');
   window.ProfileUI?.open?.(id);
  }catch(e){
   console.error('Mada profile edit',e);
   err.hidden=false;
   err.textContent='تعذر حفظ التعديل: '+(e?.message||'خطأ غير معروف');
  }finally{busy=false;if($('mpeSave')){$('mpeSave').disabled=false;$('mpeSave').textContent='حفظ التعديلات'}}
 };
}
document.addEventListener('click',function(e){
 const b=e.target.closest?.('#mfpEdit');
 if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 openEditor();
},true);
window.MadaProfileEditFix={open:openEditor};
})();
