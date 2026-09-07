/* Mada: reliable Android/browser back handling for pages, modals, drawers and Messenger. */
(function(){'use strict';
  function modal(){const x=document.getElementById('modal');return !!(x&&!x.hidden);}
  function drawer(){return document.querySelector('.mada-drawer:not([hidden])');}
  function messenger(){return document.querySelector('.mada-messenger-overlay');}
  function closeTop(){
    if(messenger()){
      try{window.MadaMessenger?.close?.();}catch(e){messenger()?.remove();}
      return true;
    }
    if(modal()){
      const b=document.getElementById('closeModal');
      if(b)b.click();else document.getElementById('modal').hidden=true;
      return true;
    }
    const d=drawer();
    if(d){d.querySelector('.mada-drawer-close')?.click();return true;}
    return false;
  }
  function pushLayer(){try{history.pushState({madaBackLayer:true},document.title,location.href);}catch(e){}}
  function ensureBase(){
    try{
      if(!history.state||!history.state.madaBackBase)
        history.replaceState(Object.assign({},history.state||{},{madaBackBase:true}),document.title,location.href);
    }catch(e){}
  }
  function isDynamicButton(b){
    if(b.matches('a[href]'))return false;
    return b.matches('[data-profile]')||[
      'profileNav','friendsNav','friendsBottom','notifyNav','notifyBottom','msgBtn','msgBtn2',
      'premiumBtn','premiumBannerBtn','searchBtn','menuBtn','allStoriesBtn','reelsBtn',
      'addStoryBtn','createNav','createBottom'
    ].includes(b.id);
  }
  function markNavigation(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('button,a,[data-profile]');
      if(!b||b.disabled||b.id==='closeModal'||b.classList.contains('mada-drawer-close'))return;
      if(b.id==='backBtn'){
        e.preventDefault();
        if(closeTop())return;
        if(history.length>1)history.back();
        else location.href='index.html';
        return;
      }
      if(isDynamicButton(b))pushLayer();
    },true);
  }
  window.addEventListener('popstate',function(){if(closeTop())return;});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&closeTop())e.stopPropagation();},true);
  function start(){ensureBase();markNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
