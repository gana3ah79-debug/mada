/* Mada final feed fixes v1: remove stray verification badges and prevent duplicate posts. */
(function(){
'use strict';
function css(){
 if(document.getElementById('mada-final-feed-fix-style'))return;
 const s=document.createElement('style');s.id='mada-final-feed-fix-style';
 s.textContent='.feed>.mada-verified-badge{display:none!important}.feed>.mada-verified-badge.admin{display:none!important}';
 document.head.appendChild(s);
}
function removeStrayBadges(){
 document.querySelectorAll('.feed>.mada-verified-badge').forEach(b=>b.remove());
}
function bind(){
 css();removeStrayBadges();
 const btn=document.getElementById('postBtn');
 if(!btn||btn.dataset.madaFinalPostFix)return;
 btn.dataset.madaFinalPostFix='1';
 let locked=false;
 btn.addEventListener('click',async function(e){
   e.preventDefault();
   e.stopImmediatePropagation();
   if(locked)return;
   locked=true;
   btn.disabled=true;
   btn.setAttribute('aria-busy','true');
   try{
     const fn=window.addPost;
     if(typeof fn==='function')await fn();
   }finally{
     setTimeout(()=>{locked=false;btn.disabled=false;btn.removeAttribute('aria-busy')},900);
   }
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
new MutationObserver(()=>{removeStrayBadges();bind()}).observe(document.documentElement,{childList:true,subtree:true});
})();
