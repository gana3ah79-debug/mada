// Final runtime bindings: keep the public UI and data layer connected.
(function(){
  function updatePremiumUI(){
    const b=document.getElementById('premiumBanner'),p=document.getElementById('premiumBtn');
    if(b)b.hidden=!!window.madaPremium;
    if(p)p.title=window.madaPremium?'Mada Premium مفعل':'اشترك في Mada Premium';
  }
  window.updatePremiumUI=updatePremiumUI;
  window.openProfile=function(id){
    if(window.ProfileUI&&window.ProfileUI.open)return window.ProfileUI.open(id||window.madaUser?.()?.id);
  };
  const originalStart=window.start;
  // app.js keeps the authoritative session. This hook is intentionally tiny and only
  // provides missing UI globals before the async boot finishes.
  window.madaPremium=false;
  window.addEventListener('mada:premium',function(e){window.madaPremium=!!e.detail;updatePremiumUI()});
  document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('premiumBannerAction')?.addEventListener('click',function(){document.getElementById('premiumBtn')?.click()});
    document.getElementById('premiumBanner')?.addEventListener('click',function(e){if(e.target.closest('.premium-btn'))document.getElementById('premiumBtn')?.click()});
  });
})();