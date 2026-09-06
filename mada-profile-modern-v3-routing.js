/* Mada Profile v3 routing bridge */
(function(){'use strict';
function bind(){const b=document.getElementById('profileNav');if(!b||b.dataset.mp3Route)return;b.dataset.mp3Route='1';b.addEventListener('click',function(e){const u=window.madaUser?.()||window.user,id=u?.id;if(id&&window.MadaProfileModernV3?.open){e.preventDefault();e.stopImmediatePropagation();window.MadaProfileModernV3.open(id)}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();