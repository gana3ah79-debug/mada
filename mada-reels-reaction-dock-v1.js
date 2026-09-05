/* Mada Reels — dynamic reaction dock */
(function(){'use strict';
function boot(){
 if(document.getElementById('mrrd-style'))return;
 var s=document.createElement('style');s.id='mrrd-style';s.textContent=`
.mada-reels-v3 .mr-actions .mrrd-reaction-wrap{position:relative;display:flex;flex-direction:column;align-items:center}
.mrrd-reaction-menu{position:absolute;right:62px;bottom:-4px;display:flex;flex-direction:column;gap:7px;padding:8px;background:rgba(15,15,18,.88);border:1px solid rgba(255,255,255,.16);border-radius:22px;box-shadow:0 10px 35px rgba(0,0,0,.45);backdrop-filter:blur(14px);transform:scale(.75) translateX(12px);opacity:0;pointer-events:none;transform-origin:right bottom;transition:.22s cubic-bezier(.2,.8,.2,1);z-index:99}
.mrrd-reaction-menu.open{transform:scale(1) translateX(0);opacity:1;pointer-events:auto}
.mrrd-reaction-menu button{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;border-radius:50%!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.08)!important;font-size:27px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;transition:transform .16s,background .16s!important}
.mrrd-reaction-menu button:hover,.mrrd-reaction-menu button:active{transform:scale(1.16)!important;background:rgba(255,255,255,.2)!important}
.mrrd-reaction-menu button:nth-child(1){animation-delay:.01s}.mrrd-reaction-menu button:nth-child(2){animation-delay:.04s}.mrrd-reaction-menu button:nth-child(3){animation-delay:.07s}.mrrd-reaction-menu button:nth-child(4){animation-delay:.10s}.mrrd-reaction-menu button:nth-child(5){animation-delay:.13s}.mrrd-reaction-menu button:nth-child(6){animation-delay:.16s}
.mrrd-reaction-menu.open button{animation:mrrdPop .25s both}
@keyframes mrrdPop{from{opacity:0;transform:scale(.45) translateX(8px)}to{opacity:1;transform:scale(1) translateX(0)}}
@media(max-width:600px){.mrrd-reaction-menu{right:57px;bottom:-2px;padding:7px;border-radius:20px;gap:5px}.mrrd-reaction-menu button{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;font-size:25px!important}}
`;
document.head.appendChild(s);enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true})}
function enhance(){document.querySelectorAll('.mada-reels-v3 .mr-actions').forEach(function(actions){if(actions.dataset.mrrd)return;actions.dataset.mrrd='1';var first=actions.querySelector('button');if(!first)return;var wrap=document.createElement('div');wrap.className='mrrd-reaction-wrap';first.parentNode.insertBefore(wrap,first);wrap.appendChild(first);first.setAttribute('aria-label','التفاعلات');first.title='التفاعلات';var menu=document.createElement('div');menu.className='mrrd-reaction-menu';['❤️','😂','😮','😢','😡','👍'].forEach(function(icon){var b=document.createElement('button');b.type='button';b.textContent=icon;b.title='تفاعل '+icon;b.onclick=function(e){e.stopPropagation();first.textContent=icon;menu.classList.remove('open');first.classList.add('liked');try{first.click()}catch(_){} };menu.appendChild(b)});wrap.appendChild(menu);first.addEventListener('click',function(e){if(e.detail===1){e.stopPropagation();menu.classList.toggle('open')}});document.addEventListener('click',function(e){if(!wrap.contains(e.target))menu.classList.remove('open')},{passive:true})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
