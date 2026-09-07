/* Mada profile edit entry v6: capture every known legacy edit button, especially mh4Edit. */
(function(){'use strict';
if(window.__MADA_PROFILE_EDIT_ENTRY_V6__)return;window.__MADA_PROFILE_EDIT_ENTRY_V6__=true;
function findEditor(){return window.MadaProfileEditV2?.open||window.MadaProfileEditV4?.open||window.MadaProfileEditV5?.open||window.ProfileUI?.edit||window.ProfileUI?.open||null}
async function currentUser(){try{const c=window.MADA_SUPABASE_CLIENT||window.sb||window.supabaseClient;return c?(await c.auth.getUser()).data?.user||null:null}catch(e){return null}}
function isEdit(el){return !!el?.closest?.('#mp1Edit,#v3Edit,#mh3Edit,#mh4Edit,#madaRootEdit,[data-profile-edit],.profile-edit-btn')}
document.addEventListener('click',function(e){if(!isEdit(e.target))return;e.preventDefault();e.stopImmediatePropagation();const run=async()=>{let fn=findEditor();for(let i=0;i<20&&!fn;i++){await new Promise(r=>setTimeout(r,50));fn=findEditor()}if(!fn){alert('تعذر فتح محرر الملف الشخصي.');return}const u=await currentUser();if(!u){alert('يجب تسجيل الدخول أولاً.');return}await fn(u.id)};run().catch(err=>alert('تعذر فتح تعديل الملف: '+(err?.message||'خطأ')))},true);
})();
