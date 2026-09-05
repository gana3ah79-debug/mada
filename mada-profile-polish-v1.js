/* Mada profile polish v1 — visual only, no data/logic changes */
(function(){
  'use strict';
  if(window.__MADA_PROFILE_POLISH_V1)return;
  window.__MADA_PROFILE_POLISH_V1=true;
  function style(){
    if(document.getElementById('mada-profile-polish-v1'))return;
    const s=document.createElement('style');s.id='mada-profile-polish-v1';s.textContent=`
      #modal .profile-page{background:#fff!important;color:#172033!important;border-radius:22px!important;overflow:hidden!important;box-shadow:0 10px 35px rgba(20,35,60,.10)!important}
      #modal .profile-page .cover{height:190px!important;min-height:190px!important;background-color:#e9eef5!important;background-size:cover!important;background-position:center!important;border:0!important}
      #modal .profile-page .profile-main{background:#fff!important;padding:0 18px 18px!important}
      #modal .profile-page .profile-avatar{width:104px!important;height:104px!important;margin:-52px 0 10px auto!important;border:5px solid #fff!important;background:#edf2f7!important;box-shadow:0 4px 18px rgba(20,35,60,.18)!important}
      #modal .profile-page h2{margin:2px 0 2px!important;font-size:26px!important;line-height:1.25!important;font-weight:900!important;color:#111827!important}
      #modal .profile-page .mada-profile-username{margin:0 0 10px!important;color:#7b8798!important;font-size:13px!important}
      #modal .profile-page .profile-bio{margin:0 0 12px!important;padding:14px 15px!important;background:#f8fafc!important;border:1px solid #e7ebf1!important;border-radius:16px!important;color:#4b5565!important;line-height:1.8!important}
      #modal .profile-page .profile-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;background:#f7f9fc!important;border:1px solid #e7ebf1!important;border-radius:16px!important;padding:4px!important;margin:0 0 12px!important;gap:2px!important}
      #modal .profile-page .profile-stats>button{min-height:58px!important;background:transparent!important;border:0!important;border-radius:12px!important;color:#172033!important}
      #modal .profile-page .profile-stats>button+button{border-right:1px solid #e2e7ee!important}
      #modal .profile-page .profile-stats b{font-size:19px!important;font-weight:900!important}
      #modal .profile-page .profile-stats span{font-size:12px!important;color:#748094!important}
      #modal .profile-page .profile-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;margin:0!important}
      #modal .profile-page .profile-actions button{min-height:48px!important;border-radius:14px!important;font-size:14px!important;font-weight:800!important;margin:0!important}
      #modal .profile-page .profile-actions .wide{grid-column:1/-1!important}
      #modal .profile-page .profile-actions .primary{box-shadow:0 5px 14px rgba(24,119,242,.16)!important}
      #modal .profile-page .profile-tabs{display:grid!important;grid-template-columns:repeat(2,1fr)!important;margin:0!important;padding:4px 12px!important;background:#fff!important;border-top:1px solid #edf0f4!important;border-bottom:1px solid #edf0f4!important;position:sticky!important;bottom:0!important;z-index:3!important}
      #modal .profile-page .profile-tabs button{min-height:46px!important;background:transparent!important;border:0!important;border-bottom:3px solid transparent!important;color:#667085!important;font-weight:700!important}
      #modal .profile-page .profile-tabs button.active{color:#1877f2!important;border-bottom-color:#1877f2!important}
      #modal .profile-page .profile-content{background:#f5f7fa!important;padding:10px!important}
      #modal .profile-page .profile-posts .card{border-radius:16px!important;margin-bottom:10px!important}
      #modal .profile-page .profile-photos{background:#fff!important;border-radius:16px!important;padding:8px!important}
      #modal .profile-page .profile-photos img{border-radius:12px!important}
      @media(max-width:600px){
        #modal .profile-page .cover{height:170px!important;min-height:170px!important}
        #modal .profile-page .profile-main{padding:0 14px 14px!important}
        #modal .profile-page .profile-avatar{width:96px!important;height:96px!important;margin:-48px 0 8px auto!important}
        #modal .profile-page h2{font-size:23px!important}
        #modal .profile-page .profile-bio{font-size:14px!important;padding:12px!important}
        #modal .profile-page .profile-stats>button{min-height:54px!important}
        #modal .profile-page .profile-actions button{min-height:46px!important;font-size:13px!important}
      }
    `;document.head.appendChild(s);
  }
  function boot(){style();const m=document.getElementById('modal');if(m&&!m.dataset.madaProfilePolishWatch){m.dataset.madaProfilePolishWatch='1';new MutationObserver(()=>style()).observe(m,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
