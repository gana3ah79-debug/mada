/* Mada Search routing safety bridge */
(function(){'use strict';
function bind(){const b=document.getElementById('searchBtn');if(!b||b.dataset.msrFix)return;b.dataset.msrFix='1';b.addEventListener('click',function(e){if(window.MadaSearchFriendsV3?.open){e.preventDefault();e.stopImmediatePropagation();window.MadaSearchFriendsV3.open()}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();