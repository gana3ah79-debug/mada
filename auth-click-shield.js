/* Independent mobile auth fallback. It intentionally does not depend on app.js. */
(function(){
  if(window.__madaAuthClickShield)return;
  window.__madaAuthClickShield=true;
  function call(id){
    const a=window.madaAuthFinal;
    if(id==='loginBtn')return a?.login?.();
    if(id==='signupBtn')return a?.setMode?.(document.getElementById('nameField')?.hidden?'signup':'login');
    if(id==='forgotPasswordBtn')return a?.reset?.();
  }
  function handler(e){
    const t=e.target?.closest?.('#loginBtn,#signupBtn,#forgotPasswordBtn');
    if(!t)return;
    e.preventDefault();e.stopImmediatePropagation();
    call(t.id);
  }
  window.addEventListener('click',handler,true);
  window.addEventListener('pointerup',handler,true);
  window.addEventListener('touchend',handler,{capture:true,passive:false});
  function wire(){
    ['loginBtn','signupBtn','forgotPasswordBtn'].forEach(id=>{
      const b=document.getElementById(id);if(!b)return;
      b.style.pointerEvents='auto';b.style.touchAction='manipulation';b.style.position='relative';b.style.zIndex='2147483647';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  setInterval(wire,500);
})();
