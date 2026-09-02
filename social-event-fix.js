(function(){
 const wire=()=>document.querySelectorAll('#feed .like').forEach(b=>{if(b.dataset.stopLegacy)return;b.dataset.stopLegacy='1';b.addEventListener('click',e=>e.stopPropagation());});
 const f=document.getElementById('feed');if(f){new MutationObserver(wire).observe(f,{childList:true,subtree:true});wire();}
})();