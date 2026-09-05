/* Mada: universal back navigation for sub-pages/modals. */
(function(){'use strict';
  let depth=0, internal=false;
  function modalOpen(){const m=document.getElementById('modal');return !!(m && !m.hidden);}
  function closeTop(){
    const m=document.getElementById('modal');
    if(m && !m.hidden){
      const c=document.getElementById('closeModal');
      if(c){c.click();return true;}
      m.hidden=true;return true;
    }
    const drawer=document.querySelector('.mada-drawer:not([hidden])');
    if(drawer){document.querySelector('.mada-drawer-close')?.click();return true;}
    return false;
  }
  function push(){if(internal)return;try{history.pushState({madaSubPage:true,depth:++depth},'','');}catch(e){}}
  function markNavigation(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('button,a,[data-profile]');if(!b)return;
      if(b.id==='closeModal'||b.classList.contains('mada-drawer-close'))return;
      if(b.matches('[data-profile]')||b.id==='profileNav'||b.id==='friendsNav'||b.id==='friendsBottom'||b.id==='notifyNav'||b.id==='notifyBottom'||b.id==='msgBtn'||b.id==='msgBtn2'||b.id==='premiumBtn'||b.id==='premiumBannerBtn'){
        setTimeout(()=>{if(modalOpen())push()},40);
      }
    },true);
  }
  window.addEventListener('popstate',function(){
    if(closeTop()){depth=Math.max(0,depth-1);return;}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&closeTop())e.stopPropagation()},true);
  function start(){markNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
