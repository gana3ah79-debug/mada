/* Mada Reels — dynamic reaction dock v2 */
(function(){'use strict';
var ICONS={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
function closeAll(except){document.querySelectorAll('.mrrd-reaction-menu.open').forEach(function(m){if(m!==except)m.classList.remove('open')})}
function openOriginalReaction(first,type,menu){
  /* Reuse the real interaction handler so the selected reaction is saved normally. */
  first.click();
  setTimeout(function(){
    var old=first.parentElement.parentElement.querySelector('.mri-rx-menu');
    if(old){var target=old.querySelector('[data-rx="'+type+'"]');if(target)target.click();}
    menu.classList.remove('open');
  },0);
}
function enhance(){document.querySelectorAll('.mada-reels-v3 .mr-actions').forEach(function(actions){
  if(actions.dataset.mrrd==='1')return;
  var first=actions.querySelector('[data-mri-react]');
  if(!first)return;
  actions.dataset.mrrd='1';
  var wrap=document.createElement('div');wrap.className='mrrd-reaction-wrap';
  first.parentNode.insertBefore(wrap,first);wrap.appendChild(first);
  first.setAttribute('aria-label','التفاعلات');first.title='التفاعلات';
  var menu=document.createElement('div');menu.className='mrrd-reaction-menu';
  Object.keys(ICONS).forEach(function(type){
    var b=document.createElement('button');b.type='button';b.className='mrrd-rx-btn';b.dataset.rx=type;b.textContent=ICONS[type];b.title=type;
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openOriginalReaction(first,type,menu)});
    menu.appendChild(b);
  });
  wrap.appendChild(menu);
  first.addEventListener('click',function(e){
    e.stopPropagation();
    setTimeout(function(){
      if(menu.classList.contains('open'))menu.classList.remove('open');
      else{closeAll(menu);menu.classList.add('open')}
    },0);
  });
  document.addEventListener('click',function(e){if(!wrap.contains(e.target))menu.classList.remove('open')},{passive:true});
});}
function css(){if(document.getElementById('mrrd-style'))return;var s=document.createElement('style');s.id='mrrd-style';s.textContent=`
.mada-reels-v3 .mr-actions .mrrd-reaction-wrap{position:relative;display:flex;flex-direction:column;align-items:center}
.mrrd-reaction-menu{position:absolute;right:61px;bottom:0;display:flex;flex-direction:column;gap:6px;padding:7px;background:rgba(12,12,16,.9);border:1px solid rgba(255,255,255,.18);border-radius:24px;box-shadow:0 12px 38px rgba(0,0,0,.5);backdrop-filter:blur(16px);transform:translateX(12px) scale(.72);opacity:0;pointer-events:none;transform-origin:right bottom;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s ease;z-index:100}
.mrrd-reaction-menu.open{transform:translateX(0) scale(1);opacity:1;pointer-events:auto}
.mrrd-reaction-menu button{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.1)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;font-size:27px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;transition:transform .15s ease,background .15s ease!important}
.mrrd-reaction-menu button:hover,.mrrd-reaction-menu button:active{transform:scale(1.15)!important;background:rgba(255,255,255,.2)!important}
.mrrd-reaction-menu.open button{animation:mrrdPop .23s both}
.mrrd-reaction-menu button:nth-child(1){animation-delay:.01s}.mrrd-reaction-menu button:nth-child(2){animation-delay:.04s}.mrrd-reaction-menu button:nth-child(3){animation-delay:.07s}.mrrd-reaction-menu button:nth-child(4){animation-delay:.10s}.mrrd-reaction-menu button:nth-child(5){animation-delay:.13s}.mrrd-reaction-menu button:nth-child(6){animation-delay:.16s}
@keyframes mrrdPop{from{opacity:0;transform:scale(.45) translateX(8px)}to{opacity:1;transform:scale(1) translateX(0)}}
@media(max-width:600px){.mrrd-reaction-menu{right:56px;bottom:0;gap:5px;padding:6px;border-radius:21px}.mrrd-reaction-menu button{width:45px!important;height:45px!important;min-width:45px!important;min-height:45px!important;font-size:25px!important}}
`;
document.head.appendChild(s)}
function boot(){css();enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
