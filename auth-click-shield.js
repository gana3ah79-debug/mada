/* Mada auth visual/touch guard only. The auth controller owns all events. */
(function(){
  if(window.__madaAuthClickShield)return;
  window.__madaAuthClickShield=true;
  function wire(){
    ['loginBtn','signupBtn','forgotPasswordBtn'].forEach(id=>{
      const b=document.getElementById(id);if(!b)return;
      b.style.pointerEvents='auto';
      b.style.touchAction='manipulation';
      b.style.position='relative';
      b.style.zIndex='2147483647';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  setInterval(wire,1000);
})();