/* Mada mobile auth event fallback. The main auth controller owns the action. */
(function(){
  if(window.__madaAuthClickShield)return;
  window.__madaAuthClickShield=true;
  function handler(e){
    const t=e.target?.closest?.('#loginBtn,#signupBtn,#forgotPasswordBtn');
    if(!t)return;
    if(e.type==='touchend'||e.type==='pointerup'){try{e.preventDefault()}catch(_){} }
    const a=window.madaAuthFinal;if(!a)return;
    if(t.id==='loginBtn')return void a.login?.();
    if(t.id==='signupBtn'){
      const hidden=document.getElementById('nameField')?.hidden;
      return void a.setMode?.(hidden?'signup':'login');
    }
    return void a.reset?.();
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
  setInterval(wire,1000);
})();