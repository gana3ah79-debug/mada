/* Mada Profile Editor v2 — exclusive ownership of profile edit and details edit actions. */
(function(){'use strict';
if(window.__MADA_PROFILE_EDITOR_V2)return;window.__MADA_PROFILE_EDITOR_V2=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function show(title,body){window.showModal?.(title,body)}
function install(){
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('#mfpEdit,#mfpDetailsEdit'); if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  const client=C();if(!client)return;
  (async()=>{
   try{
    const p=window.__MADA_PROFILE_DATA,u=await client.auth.getUser();
    if(!p||!u.data?.user||p.id!==u.data.user.id){show('Mada','<div class="fb-empty">لا يمكنك تعديل هذا الملف.</div>');return}
    show('✏️ تعديل الملف الشخصي',`<div class="mada-editor-v2">
     <label>الاسم<input id="mpeName" maxlength="80" value="${esc(p.display_name||'')}"></label>
     <label>اسم المستخدم<input id="mpeUsername" maxlength="40" dir="ltr" value="${esc(p.username||'')}"></label>
     <label>المدينة<input id="mpeCity" maxlength="80" value="${esc(p.city||'')}"></label>
     <label>نبذة عني<textarea id="mpeBio" maxlength="500">${esc(p.bio||'')}</textarea></label>
     <button id="mpeSave" class="primary wide" type="button">حفظ التعديلات</button>
     <div id="mpeMsg" class="muted" aria-live="polite"></div>
    </div>`);
    const s=$('mpeSave');if(!s)return;
    s.onclick=async()=>{
     const msg=$('mpeMsg'),name=$('mpeName')?.value.trim()||'',username=($('mpeUsername')?.value.trim()||'').replace(/^@/,'');
     if(!name){msg.textContent='الاسم مطلوب.';return}
     if(username&&!/^[a-zA-Z0-9_.]{3,40}$/.test(username)){msg.textContent='اسم المستخدم يجب أن يكون 3–40 حرفًا إنجليزيًا أو رقمًا أو _ أو .';return}
     s.disabled=true;s.textContent='جاري الحفظ…';msg.textContent='';
     try{
      const city=$('mpeCity')?.value.trim()||'',bio=$('mpeBio')?.value.trim()||'';
      const payload={display_name:name,username:username||null,city:city||null,bio:bio||null,updated_at:new Date().toISOString()};
      const r=await client.from('profiles').update(payload).eq('id',p.id).select('id,display_name,username,bio,avatar_url,cover_url,city,role,is_verified,verification_type,verification_expires_at,created_at,updated_at').single();
      if(r.error)throw r.error;
      window.__MADA_PROFILE_DATA=r.data;
      if(window.ProfileUI?.refresh)await window.ProfileUI.refresh(p.id);else location.reload();
     }catch(err){s.disabled=false;s.textContent='حفظ التعديلات';msg.textContent=err?.code==='23505'?'اسم المستخدم مستخدم بالفعل.':`تعذر الحفظ: ${err?.message||'خطأ غير معروف'}`}
    };
   }catch(err){show('Mada',`<div class="fb-empty">تعذر فتح التعديل: ${esc(err?.message||'خطأ غير معروف')}</div>`)}
  })();
 },true);
}
const style=document.createElement('style');style.textContent=`.mada-editor-v2{display:grid;gap:12px;padding:4px}.mada-editor-v2 label{display:grid;gap:6px;font-weight:800;font-size:13px}.mada-editor-v2 input,.mada-editor-v2 textarea{width:100%;box-sizing:border-box;border:1px solid #d9dce1;border-radius:10px;padding:11px;font:inherit;background:#fff}.mada-editor-v2 textarea{min-height:100px;resize:vertical}.mada-editor-v2 button{min-height:44px;border:0;border-radius:10px;cursor:pointer;font:inherit;font-weight:900}.mada-editor-v2 .primary{background:#1877f2;color:#fff}`;document.head.appendChild(style);install();
})();