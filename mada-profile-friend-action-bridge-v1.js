/* Mada Profile Friend Action Bridge v1 — connects the active profile button to the existing relation action. */
(function(){'use strict';
if(window.__MADA_PROFILE_FRIEND_ACTION_BRIDGE_V1)return;
window.__MADA_PROFILE_FRIEND_ACTION_BRIDGE_V1=true;
function run(){
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('#mfpFriend');
    if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=window.__MADA_PROFILE_ID;
    if(!id)return;
    if(window.MadaProfileActionsV3?.friend){window.MadaProfileActionsV3.friend(id);return}
    if(window.MadaProfileActionsV5?.friend){window.MadaProfileActionsV5.friend(id);return}
    window.showToast?.('تعذر تنفيذ طلب الصداقة الآن');
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
