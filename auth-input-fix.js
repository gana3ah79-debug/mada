/* Mada auth input interaction guard: keeps login/signup fields focusable on mobile. */
(function(){
  'use strict';
  const inputSelector='#auth .auth-card input';
  function repair(){
    document.querySelectorAll(inputSelector).forEach(el=>{
      el.disabled=false;
      el.readOnly=false;
      el.tabIndex=0;
      el.style.pointerEvents='auto';
      el.style.userSelect='text';
      el.style.webkitUserSelect='text';
      el.style.touchAction='manipulation';
    });
  }
  function bind(){
    repair();
    document.addEventListener('pointerdown',function(e){
      const input=e.target.closest?.(inputSelector);
      if(!input)return;
      e.stopPropagation();
      input.disabled=false;
      input.readOnly=false;
      setTimeout(()=>{try{input.focus({preventScroll:true})}catch(_){try{input.focus()}catch(__){}}},0);
    },true);
    document.addEventListener('touchstart',function(e){
      const input=e.target.closest?.(inputSelector);
      if(input){e.stopPropagation();input.disabled=false;input.readOnly=false;}
    },true);
    document.addEventListener('click',function(e){
      const input=e.target.closest?.(inputSelector);
      if(input){e.stopPropagation();setTimeout(()=>{try{input.focus({preventScroll:true})}catch(_){try{input.focus()}catch(__){}}},0);}
    },true);
    const auth=document.getElementById('auth');
    if(auth)new MutationObserver(repair).observe(auth,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','readonly','style']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
