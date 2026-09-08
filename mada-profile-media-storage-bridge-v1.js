/* Mada Profile Media Storage Bridge v1 — uses the real Supabase profile-images bucket. */
(function(){'use strict';
if(window.__MADA_PROFILE_MEDIA_STORAGE_BRIDGE_V1)return;
window.__MADA_PROFILE_MEDIA_STORAGE_BRIDGE_V1=true;
const c=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const aliases=new Set(['avatars','profiles','media','covers']);
function install(){
  const client=c();
  const storage=client?.storage;
  if(!storage||typeof storage.from!=='function')return false;
  if(storage.__madaProfileStorageBridgeV1)return true;
  const original=storage.from.bind(storage);
  storage.from=function(bucket){
    return original(aliases.has(String(bucket))?'profile-images':bucket);
  };
  storage.__madaProfileStorageBridgeV1=true;
  return true;
}
function boot(){if(install())return;let n=0;const t=setInterval(()=>{if(install()||++n>=40)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
