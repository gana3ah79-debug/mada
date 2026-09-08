/* Mada Profile No Posts v1 — profile timelines intentionally do not display posts. */
(function(){'use strict';
if(window.__MADA_PROFILE_NO_POSTS_V1)return;
window.__MADA_PROFILE_NO_POSTS_V1=true;
function clear(){
  const box=document.getElementById('mfpContent');
  if(!box)return;
  box.innerHTML='<div class="fb-empty">لا توجد منشورات معروضة في الملف الشخصي.</div>';
}
function install(){
  clear();
  const root=document.getElementById('modalBody')||document.body;
  if(window.__MADA_PROFILE_NO_POSTS_OBS)window.__MADA_PROFILE_NO_POSTS_OBS.disconnect();
  const obs=new MutationObserver(()=>{
    const box=document.getElementById('mfpContent');
    if(box && box.querySelector('.fb-post'))clear();
  });
  obs.observe(root,{childList:true,subtree:true});
  window.__MADA_PROFILE_NO_POSTS_OBS=obs;
}
const originalOpen=window.ProfileUI?.open;
if(originalOpen){
  window.ProfileUI.open=async function(){
    const r=await originalOpen.apply(this,arguments);
    setTimeout(install,0);
    return r;
  };
}
const originalRefresh=window.ProfileUI?.refresh;
if(originalRefresh){
  window.ProfileUI.refresh=async function(){
    const r=await originalRefresh.apply(this,arguments);
    setTimeout(install,0);
    return r;
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});
else setTimeout(install,0);
})();
