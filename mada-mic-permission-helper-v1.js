/* Mada Microphone Permission Helper v1 — opens Android/browser permission settings after a denied mic request. */
(()=>{'use strict';if(window.__MADA_MIC_PERMISSION_HELPER_V1)return;window.__MADA_MIC_PERMISSION_HELPER_V1=true;
function isAndroid(){return /Android/i.test(navigator.userAgent||'')}
function openSettings(){
  try{
    if(window.Android?.openAppSettings)return !!window.Android.openAppSettings();
    if(window.Android?.openSettings)return !!window.Android.openSettings();
  }catch(e){}
  if(isAndroid()){
    try{window.location.href='intent:#Intent;action=android.settings.SETTINGS;end';return true}catch(e){}
  }
  try{
    const site=encodeURIComponent(location.origin);
    const w=window.open('chrome://settings/content/siteDetails?site='+site,'_blank');
    if(w)return true;
  }catch(e){}
  return false;
}
function show(){
  if(document.getElementById('madaMicPermissionBox'))return;
  const d=document.createElement('div');d.id='madaMicPermissionBox';d.dir='rtl';
  d.style='position:fixed;z-index:40000;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;padding:20px';
  d.innerHTML='<div style="width:min(92vw,360px);background:#fff;border-radius:24px;padding:24px 18px;text-align:center;box-shadow:0 20px 70px rgba(0,0,0,.35);font-family:Arial,sans-serif"><div style="font-size:42px">🎙️</div><h3 style="margin:8px 0">السماح بالميكروفون</h3><p style="color:#64748b;line-height:1.7;margin:0 0 18px">إذن الميكروفون مرفوض. اضغط الزر لفتح إعدادات الأذونات، ثم اسمح لـ Mada باستخدام الميكروفون.</p><button id="madaMicOpenSettings" style="border:0;border-radius:14px;padding:13px 20px;background:#2563eb;color:#fff;font-weight:900;font-size:15px;width:100%">فتح إعدادات الأذونات</button><button id="madaMicCloseSettings" style="border:0;background:transparent;padding:12px;color:#64748b;font-weight:800">إلغاء</button></div>';
  document.body.appendChild(d);
  document.getElementById('madaMicOpenSettings').onclick=()=>openSettings();
  document.getElementById('madaMicCloseSettings').onclick=()=>d.remove();
}
const md=navigator.mediaDevices;if(md?.getUserMedia){const original=md.getUserMedia.bind(md);md.getUserMedia=function(...args){return original(...args).catch(e=>{if(e?.name==='NotAllowedError'||e?.name==='PermissionDeniedError')show();throw e})}}
window.MadaMicPermission={open:openSettings,show};
})();