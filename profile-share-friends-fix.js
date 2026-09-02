(()=>{
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function sharePost(id){
    const url=`${location.origin}${location.pathname}?post=${encodeURIComponent(id)}`;
    const data={title:'منشور على Mada',text:'شاهد هذا المنشور على Mada',url};
    try{
      if(navigator.share){await navigator.share(data);return;}
      await navigator.clipboard.writeText(url);
      alert('تم نسخ رابط المنشور ✓ يمكنك مشاركته مع أصدقائك.');
    }catch(e){
      if(e?.name==='AbortError')return;
      try{await navigator.clipboard.writeText(url);alert('تم نسخ رابط المنشور ✓');}
      catch(_){prompt('انسخ رابط المنشور:',url)}
    }
  }
  function cleanSharedPosts(root=document){
    root.querySelectorAll('.profile-post').forEach(article=>{
      if(article.querySelector('.shared-post-label'))article.remove();
    });
  }
  function boot(){
    document.addEventListener('click',e=>{
      const share=e.target.closest('.profile-share');
      if(share){e.preventDefault();e.stopPropagation();sharePost(share.dataset.id);return;}
    },true);
    const modal=document.getElementById('modal');
    if(!modal)return;
    const observer=new MutationObserver(()=>cleanSharedPosts(modal));
    observer.observe(modal,{childList:true,subtree:true});
    cleanSharedPosts(modal);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();