/* Mada: reliable Android/browser back handling for pages, modals and drawers. */
(function(){'use strict';
  function modal(){const x=document.getElementById('modal');return !!(x&&!x.hidden);}
  function drawer(){return document.querySelector('.mada-drawer:not([hidden])');}
  function closeTop(){
    if(modal()){
      const b=document.getElementById('closeModal');
      if(b)b.click();else document.getElementById('modal').hidden=true;
      return true;
    }
    const d=drawer();
    if(d){d.querySelector('.mada-drawer-close')?.click();return true;}
    return false;
  }
  function pushLayer(){
    try{history.pushState({madaBackLayer:true},document.title,location.href);}catch(e){}
  }
  function ensureBase(){
    try{
      if(!history.state||!history.state.madaBackBase)
        history.replaceState(Object.assign({},history.state||{},{madaBackBase:true}),document.title,location.href);
    }catch(e){}
  }
  function isDynamicButton(b){
    if(b.matches('a[href]'))return false; /* real URL navigation already creates history */
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
      if(!isDynamicButton(b))return;
      /* Make Android/browser Back close the dynamic Mada screen first. */
      pushLayer();
    },true);
  }
  window.addEventListener('popstate',function(){
    if(closeTop())return;
    /* For real standalone URLs, normal browser/WebView history remains untouched. */
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&closeTop())e.stopPropagation();
  },true);
  function start(){ensureBase();markNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
