// Final runtime bindings for the unified Mada frontend.
(function(){
  function updatePremiumUI(){
    const b=document.getElementById('premiumBanner'),p=document.getElementById('premiumBtn');
    const active=typeof premium!=='undefined'?!!premium:!!window.madaPremium;
    window.madaPremium=active;
    if(b)b.hidden=active;
    if(p)p.title=active?'Mada Premium مفعل':'اشترك في Mada Premium';
  }
  window.updatePremiumUI=updatePremiumUI;
  Object.defineProperty(window,'user',{configurable:true,get:function(){return typeof user!=='undefined'?user:null}});
  Object.defineProperty(window,'sb',{configurable:true,get:function(){return typeof sb!=='undefined'?sb:null}});
  window.openProfile=function(id){
    const me=typeof user!=='undefined'?user:null;
    if(window.ProfileUI&&window.ProfileUI.open)return window.ProfileUI.open(id||me?.id);
  };
  const sync=()=>{try{updatePremiumUI()}catch(e){}};
  sync();
  setInterval(sync,1500);
  document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('premiumBannerAction')?.addEventListener('click',function(){document.getElementById('premiumBtn')?.click()});
    document.getElementById('premiumBanner')?.addEventListener('click',function(e){if(e.target.closest('.premium-btn'))document.getElementById('premiumBtn')?.click()});
  });
})();