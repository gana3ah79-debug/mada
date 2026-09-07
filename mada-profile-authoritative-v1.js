/* Mada profile authoritative loader v4. */
(function(){'use strict';
function load(){if(document.querySelector('script[data-mada-profile-v3]'))return;const s=document.createElement('script');s.src='mada-profile-authoritative-v3.js?v20260907-1';s.async=false;s.setAttribute('data-mada-profile-v3','1');document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
