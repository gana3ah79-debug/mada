/* Mada: reliable Android/browser back handling for pages, modals and drawers. */
(function(){'use strict';
  const KEY='madaBackV2';
  let suppress=false;
  function modal(){const x=document.getElementById('modal');return x&&!x.hidden;}
  function drawer(){return document.querySelector('.mada-drawer:not([hidden])');}
  function closeTop(){
    if(modal()){
      const b=document.getElementById('closeModal');
      if(b)b.click(); else document.getElementById('modal').hidden=true;
      return true;
    }
    const d=drawer();
    if(d){d.querySelector('.mada-drawer-close')?.click();return true;}
    return false;
  }
  function isHome(){
    const p=(location.pathname||'/').replace(/\\/+/g,'/').replace(/\\$/,'')||'/';
    return p==='/'||p==='/index.html'||p.endsWith('/index.html');
  }
  function pushLayer(){
    if(suppress)return;
    try{history.pushState({madaBack:true},'',location.href);}catch(e){}
  }
  function ensureBase(){
    try{
      const s=history.state;
      if(!s||!s[KEY])history.replaceState(Object.assign({},s||{},{[KEY]:true,base:true}),document.title,location.href);
    }catch(e){}
  }
  function markNavigation(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('button,a,[data-profile]');
      if(!b||b.disabled)return;
      if(b.id==='closeModal'||b.classList.contains('mada-drawer-close'))return;
      const navigates=(
        b.matches('[data-profile]')||
        ['profileNav','friendsNav','friendsBottom','notifyNav','notifyBottom','msgBtn','msgBtn2','premiumBtn','premiumBannerBtn','searchBtn','menuBtn','allStoriesBtn','reelsBtn','addStoryBtn','createNav','createBottom'].includes(b.id)
      );
      if(!navigates)return;
      /* Create a real browser-history entry BEFORE the app opens its dynamic view.
         This makes the Android system Back button fire popstate instead of exiting. */
      pushLayer();
    },true);
  }
  window.addEventListener('popstate',function(){
    /* First Back closes the topmost in-app layer. */
    if(closeTop())return;
    /* On a standalone URL, let the browser/WebView continue normal history. */
    if(!isHome())return;
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&closeTop())e.stopPropagation();
  },true);
  function start(){ensureBase();markNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
