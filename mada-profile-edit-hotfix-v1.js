/* Mada Profile Edit Hotfix v1 — reliable profile updates from browser. */
(function(){'use strict';
if(window.__MADA_PROFILE_EDIT_HOTFIX_V1)return;window.__MADA_PROFILE_EDIT_HOTFIX_V1=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb,$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function show(t,b){return window.showModal?.(t,b)}
async function getOwn(){try{const c=C();const u=(await c.auth.getUser()).data?.user;if(!u)return null;const r=await c.from('profiles').select('id,display_name,username,bio,city').eq('id',u.id).maybeSingle();if(r.error)throw r.error;return r.data?{...r.data,id:u.id}:null}catch(e){console.error('[Mada Profile Edit]',e);return null}}
async function openEditor(){const p=await getOwn();if(!p){show('✏️ تعديل الملف الشخصي','<div class="empty">تعذر تحميل بيانات الملف الشخصي. تأكد من تسجيل الدخول.</div>');return}
show('✏️ تعديل الملف الشخصي',`<div class="edit-profile mada-edit-hotfix"><label>الاسم<input id="mfhName" maxlength="80" value="${esc(p.display_name||'')}"></label><label>اسم المستخدم<input id="mfhUsername" maxlength="40" value="${esc(p.username||'')}"></label><label>المدينة<input id="mfhCity" maxlength="80" value="${esc(p.city||'')}"></label><label>نبذة عني<textarea id="mfhBio" maxlength="500">${esc(p.bio||'')}</textarea></label><button id="mfhSave" class="primary wide" type="button">حفظ التعديلات</button><div id="mfhMsg" class="muted" aria-live="polite"></div></div>`);
const btn=$('mfhSave');if(!btn)return;btn.onclick=async()=>{if(btn.disabled)return;const msg=$('mfhMsg');const name=$('mfhName').value.trim();const username=$('mfhUsername').value.trim().replace(/^@/,'');const city=$('mfhCity').value.trim();const bio=$('mfhBio').value.trim();
if(!name){msg.textContent='الاسم مطلوب.';return}if(username&&!/^[a-zA-Z0-9_.]{3,40}$/.test(username)){msg.textContent='اسم المستخدم يجب أن يكون 3–40 حرفًا إنجليزيًا أو رقمًا أو _ أو .';return}
btn.disabled=true;btn.textContent='جاري الحفظ…';msg.textContent='';
try{const c=C();const payload={display_name:name,username:username||null,city:city||null,bio:bio||null};const r=await c.from('profiles').update(payload).eq('id',p.id);if(r.error)throw r.error;
const check=await c.from('profiles').select('id,display_name,username,bio,city,avatar_url,cover_url,role,is_verified,verification_type,verification_expires_at,created_at,updated_at').eq('id',p.id).maybeSingle();if(check.error)throw check.error;if(!check.data)throw new Error('تم إرسال التحديث لكن تعذر التحقق من البيانات.');
msg.textContent='تم حفظ التعديلات ✓';msg.style.color='#16803c';
setTimeout(()=>{document.getElementById('closeModal')?.click();window.ProfileUI?.refresh?.(p.id)},350);
}catch(e){console.error('[Mada Profile Edit]',e);btn.disabled=false;btn.textContent='حفظ التعديلات';const code=e?.code||'';msg.style.color='';msg.textContent=code==='23505'?'اسم المستخدم مستخدم بالفعل.':code==='42501'?'ليس لديك صلاحية تعديل الملف حالياً.':String(e?.message||'تعذر حفظ التعديلات.');}}
}
function install(){document.addEventListener('click',e=>{const b=e.target?.closest?.('#mfpEdit');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openEditor()},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.MadaProfileEditHotfixV1={open:openEditor};
})();