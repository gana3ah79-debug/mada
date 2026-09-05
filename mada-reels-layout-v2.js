/* Mada Reels Layout v2 — fixes mobile action placement: reactions/comments under the video */
(function(){'use strict';
function apply(){
  var root=document.querySelector('.mada-reels-v3'); if(!root)return;
  root.classList.add('mrl2-root');
  root.querySelectorAll('.mr-reel').forEach(function(card){
    card.classList.add('mrl2-card');
    var actions=card.querySelector('.mr-actions');
    if(!actions || actions.dataset.mrl2)return;
    actions.dataset.mrl2='1';
    actions.classList.add('mrl2-actions');
    var input=document.createElement('div');
    input.className='mrl2-commentbar';
    input.innerHTML='<button type="button" class="mrl2-avatar">👤</button><button type="button" class="mrl2-comment-open">إضافة تعليق... <span>☺</span></button>';
    card.appendChild(input);
    input.querySelector('.mrl2-comment-open').onclick=function(e){
      e.stopPropagation();
      var b=card.querySelector('[data-mri-comment],[data-reel-comment]');
      if(b)b.click();
    };
  });
}
function css(){if(document.getElementById('mrl2-style'))return;var s=document.createElement('style');s.id='mrl2-style';s.textContent=`
.mada-reels-v3.mrl2-root{background:#000!important}
.mrl2-card{overflow:hidden!important}
.mrl2-card .mr-info{bottom:112px!important;right:18px!important;left:18px!important;padding-right:4px!important}
.mrl2-card .mr-actions.mrl2-actions{position:absolute!important;z-index:8!important;left:12px!important;right:12px!important;bottom:58px!important;height:58px!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:5px 8px!important;border-radius:18px!important;background:rgba(0,0,0,.48)!important;backdrop-filter:blur(12px)!important}
.mrl2-card .mr-actions.mrl2-actions button{min-width:58px!important;height:48px!important;min-height:48px!important;border:0!important;border-radius:14px!important;background:transparent!important;color:#fff!important;padding:4px 8px!important;font-size:22px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:0!important;box-shadow:none!important}
.mrl2-card .mr-actions.mrl2-actions button b{font-size:10px!important;line-height:12px!important;margin:0!important;font-weight:600!important}
.mrl2-card .mr-actions.mrl2-actions button.liked{background:rgba(220,40,70,.75)!important}
.mrl2-card .mrl2-commentbar{position:absolute!important;z-index:9!important;left:12px!important;right:12px!important;bottom:8px!important;height:46px!important;display:flex!important;align-items:center!important;gap:8px!important}
.mrl2-card .mrl2-avatar{width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:rgba(255,255,255,.18)!important;color:#fff!important;flex:none!important}
.mrl2-card .mrl2-comment-open{height:42px!important;flex:1!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:22px!important;background:rgba(20,20,20,.72)!important;color:#ddd!important;text-align:right!important;padding:0 14px!important;font-size:14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
.mrl2-card .mrl2-comment-open span{font-size:22px!important}
@media(max-width:600px){
 .mada-reels-v3.mrl2-root{height:calc(100vh - 125px)!important;max-height:none!important;border-radius:0!important}
 .mrl2-card{height:calc(100vh - 125px)!important;min-height:0!important}
 .mrl2-card .mr-info{bottom:118px!important}
 .mrl2-card .mr-actions.mrl2-actions{left:8px!important;right:8px!important;bottom:58px!important}
 .mrl2-card .mrl2-commentbar{left:8px!important;right:8px!important;bottom:7px!important}
}
`;
document.head.appendChild(s)}
function boot(){css();apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
