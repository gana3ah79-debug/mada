/* Route all profile-menu clicks to the root profile loader. */
(function(){
'use strict';
function bind(){
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('.menu-list button,.menu-list [role="button"]');
    if(!b)return;
    const t=(b.textContent||'').trim();
    if(!/(الملف الشخصي|ملفي|profile)/i.test(t))return;
    const fn=window.__MADA_PROFILE_HARD_OPEN__;
    if(typeof fn!=='function')return;
    e.preventDefault();e.stopImmediatePropagation();fn();
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
