/* Mada bottom navigation smart behavior v1 */
(function(){'use strict';
  var nav, lastY=0, ticking=false;
  function isHome(){
    var app=document.getElementById('app');
    var modal=document.getElementById('modal');
    return !!(app && !app.hidden && !(modal && !modal.hidden));
  }
  function setHidden(hidden){
    if(!nav)return;
    nav.classList.toggle('mada-nav-hidden',!!hidden);
  }
  function sync(){
    if(!nav)return;
    if(!isHome()){ setHidden(true); return; }
    setHidden(window.scrollY>8);
  }
  function onScroll(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(function(){
      var y=Math.max(0,window.scrollY||0);
      if(!isHome()) setHidden(true);
      else if(y<=8) setHidden(false);
      else if(y>lastY+2) setHidden(true);
      else if(y<lastY-2) setHidden(false);
      lastY=y; ticking=false;
    });
  }
  function init(){
    nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    if(nav.dataset.madaSmartNav)return;
    nav.dataset.madaSmartNav='1';
    var style=document.createElement('style');
    style.textContent='.bottom-nav{transition:transform .24s ease,opacity .2s ease!important;will-change:transform,opacity!important}.bottom-nav.mada-nav-hidden{transform:translateY(calc(100% + 18px))!important;opacity:0!important;pointer-events:none!important}.bottom-nav{z-index:500!important}';
    document.head.appendChild(style);
    lastY=window.scrollY||0;
    sync();
    window.addEventListener('scroll',onScroll,{passive:true});
    document.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b)return;
      if(!b.closest('.bottom-nav'))return;
      if(b===nav.querySelector('button:first-child')){
        setTimeout(function(){window.scrollTo({top:0,behavior:'smooth'});lastY=0;setHidden(false)},30);
      }else{
        setHidden(true);
      }
    },true);
    var modal=document.getElementById('modal');
    if(modal)new MutationObserver(function(){setTimeout(sync,20)}).observe(modal,{attributes:true,attributeFilter:['hidden','class']});
    new MutationObserver(function(){setTimeout(sync,20)}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
