/* Mada - real profile navigation from feed author names/avatars. */
(function(){
'use strict';
function openProfile(id){if(!id)return;const fn=window.ProfileUI?.open;if(typeof fn==='function'){try{fn(id)}catch(e){console.warn('Mada profile link',e)}}}
document.addEventListener('click',function(e){const el=e.target?.closest?.('[data-profile]');if(!el)return;const id=el.getAttribute('data-profile');if(!id)return;e.preventDefault();e.stopPropagation();openProfile(id)},true);
})();
