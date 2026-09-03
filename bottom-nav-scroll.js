/* Mada mobile navigation: hide the bottom navigation while scrolling down, reveal while scrolling up. */
(function(){
  let lastY=Math.max(0,window.scrollY||0);
  let ticking=false;
  const THRESHOLD=8;
  const nav=()=>document.querySelector('.bottom-nav');
  function setHidden(hidden){
    const n=nav(); if(!n)return;
    n.classList.toggle('mada-nav-hidden',!!hidden);
  }
  function isOverlayOpen(){
    const share=document.querySelector('.share-sheet:not([hidden])');
    const modal=document.querySelector('.modal:not([hidden])');
    return !!(share||modal);
  }
  function update(){
    ticking=false;
    const y=Math.max(0,window.scrollY||window.pageYOffset||0);
    if(isOverlayOpen()){setHidden(true);lastY=y;return;}
    if(y<=18){setHidden(false);lastY=y;return;}
    const delta=y-lastY;
    if(Math.abs(delta)<THRESHOLD)return;
    // Scrolling down (content moves upward): hide the nav like Facebook/Instagram.
    if(delta>0)setHidden(true);
    // Scrolling up: bring it back.
    else setHidden(false);
    lastY=y;
  }
  function onScroll(){
    if(!ticking){ticking=true;requestAnimationFrame(update);}
  }
  function boot(){
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',()=>{lastY=Math.max(0,window.scrollY||0);});
    document.addEventListener('click',e=>{
      if(e.target.closest('.share-close,.share-sheet-backdrop'))setTimeout(()=>setHidden(false),80);
    });
    setHidden(false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.madaBottomNavScroll={show:()=>setHidden(false),hide:()=>setHidden(true)};
})();
