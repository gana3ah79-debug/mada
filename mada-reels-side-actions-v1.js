/* Mada Reels — right vertical actions like modern Reels UI */
(function(){'use strict';
  function apply(){
    if(document.getElementById('madaReelsSideActionsStyle'))return;
    var s=document.createElement('style');
    s.id='madaReelsSideActionsStyle';
    s.textContent=`
      .mada-reels-v3 .mr-reel{overflow:hidden!important}
      .mada-reels-v3 .mr-actions{
        position:absolute!important;
        z-index:20!important;
        right:10px!important;
        left:auto!important;
        bottom:92px!important;
        top:auto!important;
        width:62px!important;
        min-width:62px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:12px!important;
        padding:0!important;
        margin:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      .mada-reels-v3 .mr-actions button{
        width:54px!important;
        min-width:54px!important;
        height:58px!important;
        min-height:58px!important;
        border:0!important;
        background:rgba(0,0,0,.38)!important;
        color:#fff!important;
        border-radius:18px!important;
        padding:5px 2px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:2px!important;
        font-size:24px!important;
        line-height:1!important;
        backdrop-filter:blur(5px)!important;
        -webkit-backdrop-filter:blur(5px)!important;
      }
      .mada-reels-v3 .mr-actions button b{
        display:block!important;
        font-size:10px!important;
        line-height:1.1!important;
        font-weight:600!important;
        color:#fff!important;
      }
      .mada-reels-v3 .mr-actions .liked,
      .mada-reels-v3 .mr-actions .saved{background:rgba(0,0,0,.48)!important;outline:0!important}
      .mada-reels-v3 .mr-info{right:82px!important;left:18px!important;bottom:24px!important;padding-right:0!important}
      .mada-reels-v3 .mri-rx-menu{
        position:absolute!important;
        right:58px!important;
        left:auto!important;
        bottom:0!important;
        display:flex!important;
        flex-direction:column!important;
        gap:3px!important;
        padding:6px!important;
        background:rgba(0,0,0,.9)!important;
        border-radius:18px!important;
      }
      .mada-reels-v3 .mri-rx-menu button{background:transparent!important;font-size:25px!important;width:44px!important;height:42px!important;min-height:42px!important}
      @media(max-width:600px){
        .mada-reels-v3 .mr-actions{right:8px!important;bottom:86px!important;width:58px!important;min-width:58px!important;gap:9px!important}
        .mada-reels-v3 .mr-actions button{width:50px!important;min-width:50px!important;height:54px!important;min-height:54px!important;border-radius:16px!important}
        .mada-reels-v3 .mr-info{right:70px!important}
      }
    `;
    document.head.appendChild(s);
  }
  function boot(){apply();setTimeout(apply,300);setTimeout(apply,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
