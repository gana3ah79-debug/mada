/* Mada profile v2 - safe visual polish + share action. */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const css=`
.mada-safe-profile-shell{box-shadow:0 8px 30px rgba(15,23,42,.08)}
.mada-safe-cover{position:relative;background-color:#e8edf4!important}
.mada-safe-cover:after{content:'MADA';position:absolute;inset:auto 14px 12px auto;font-size:11px;font-weight:900;letter-spacing:2px;color:rgba(255,255,255,.72);text-shadow:0 1px 5px rgba(0,0,0,.25)}
.mada-safe-main{position:relative}.mada-safe-avatar{transition:transform .18s ease,box-shadow .18s ease}.mada-safe-avatar:hover{transform:scale(1.025);box-shadow:0 6px 24px rgba(15,23,42,.22)}
.mada-safe-main h2{letter-spacing:-.3px}.mada-safe-username{font-weight:650}
.mada-safe-actions{align-items:center}.mada-safe-actions button{box-shadow:0 2px 7px rgba(15,23,42,.06);font-weight:800;cursor:pointer}.mada-safe-share{border:1px solid #dbe3ec!important;background:#fff!important;color:#334155!important;padding:0 15px;min-height:42px;border-radius:12px}
.mada-safe-stats{background:rgba(248,250,252,.72)}.mada-safe-stats button{cursor:pointer}.mada-safe-stats button:active,.mada-safe-share:active{transform:scale(.98)}
.mada-safe-tabs{position:sticky;top:0;z-index:3;background:rgba(255,255,255,.94);backdrop-filter:blur(10px)}
.mada-safe-post{background:#fff;box-shadow:0 2px 9px rgba(15,23,42,.035);transition:transform .15s ease,box-shadow .15s ease}.mada-safe-post:hover{box-shadow:0 5px 16px rgba(15,23,42,.07)}
@media(max-width:600px){.mada-safe-cover{height:158px}.mada-safe-actions{display:grid;grid-template-columns:1fr 1fr}.mada-safe-actions .wide{grid-column:1/-1}.mada-safe-share{width:100%}.mada-safe-tabs{top:0}.mada-safe-post{border-radius:12px}}
.dark .mada-safe-tabs{background:rgba(17,29,49,.94)}.dark .mada-safe-share{background:#172338!important;color:#e5edf8!important;border-color:#33445c!important}.dark .mada-safe-stats{background:rgba(15,23,42,.35)}
`;
  function style(){if($('#mada-profile-v2-style'))return;const s=document.createElement('style');s.id='mada-profile-v2-style';s.textContent=css;document.head.appendChild(s)}
  function enhance(){
    const root=$('.mada-safe-profile-shell');if(!root)return;
    style();
    if(root.dataset.v2==='1')return;
    root.dataset.v2='1';
    const actions=root.querySelector('.mada-safe-actions');
    if(actions){
      const b=document.createElement('button');b.type='button';b.className='mada-safe-share';b.textContent='↗️ مشاركة الملف';
      b.onclick=async()=>{const url=location.origin+location.pathname+'?profile='+encodeURIComponent(window.__MADA_PROFILE_ID||'');const title=root.querySelector('h2')?.textContent||'ملف على Mada';try{if(navigator.share){await navigator.share({title,text:'شاهد هذا الملف على Mada',url})}else{await navigator.clipboard.writeText(url);alert('تم نسخ رابط الملف ✓')}}catch(e){if(e?.name!=='AbortError')try{await navigator.clipboard.writeText(url);alert('تم نسخ رابط الملف ✓')}catch(_){}}};actions.appendChild(b);
    }
    root.querySelectorAll('img').forEach(i=>i.addEventListener('error',()=>{i.style.display='none'},{once:true}));
  }
  function watch(){
    style();enhance();
    const m=document.getElementById('modal');if(!m)return setTimeout(watch,500);
    const obs=new MutationObserver(()=>enhance());obs.observe(m,{childList:true,subtree:true});
  }
  watch();
})();
