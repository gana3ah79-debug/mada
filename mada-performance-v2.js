/* Mada Performance v2 — lazy media, delegated feed events, no duplicate handlers, auth-safe */
(function(){'use strict';
  const feed=()=>document.getElementById('feed');
  const isVideo=u=>/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u||'');
  let boundFeed=null,observer=null;
  function lazyMedia(root){
    if(!root)return;
    root.querySelectorAll('img').forEach(img=>{img.loading='lazy';img.decoding='async';if(!img.getAttribute('alt'))img.alt='';});
    root.querySelectorAll('video').forEach(v=>{
      if(v.dataset.mpvBound==='1')return;
      v.dataset.mpvBound='1';
      v.preload='none';
      if(v.src){v.dataset.src=v.src;v.removeAttribute('src');v.load();}
      if(v.dataset.src)v.addEventListener('loadeddata',()=>{v.dataset.loaded='1'},{once:true,passive:true});
    });
    root.querySelectorAll('img.post-image').forEach(img=>{
      const src=img.getAttribute('src');
      if(!isVideo(src))return;
      const v=document.createElement('video');v.className='post-video';v.controls=true;v.playsInline=true;v.preload='none';v.dataset.src=src;v.setAttribute('aria-label','فيديو المنشور');img.replaceWith(v);
    });
  }
  function loadVisibleVideo(v){if(!v)return;if(!v.src&&v.dataset.src){v.src=v.dataset.src;v.load();}return v;}
  function delegated(e){
    const b=e.target.closest('button');if(!b||!boundFeed?.contains(b))return;
    const id=b.dataset.id;
    if(b.matches('[data-comment-toggle]')){document.querySelector(`[data-comments-open="${b.dataset.commentToggle}"]`)?.click();return;}
    if(b.classList.contains('like')&&id){const liked=b.dataset.liked==='true';b.dataset.liked=String(!liked);b.classList.toggle('liked',!liked);b.textContent=(!liked?'💙':'👍')+' أعجبني';window.madaPerfLike?.(id,!liked);return;}
    if(b.classList.contains('share')&&id){window.madaPerfShare?.(id);return;}
    if(b.dataset.send){window.madaPerfComment?.(b.dataset.send);return;}
  }
  function installDelegation(){const f=feed();if(!f||boundFeed===f)return;boundFeed=f;f.querySelectorAll('button').forEach(b=>{b.onclick=null});f.addEventListener('click',delegated,{passive:false});lazyMedia(f);}
  function observe(){installDelegation();if(!observer){observer=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){loadVisibleVideo(v);if(v.dataset.autoplay==='1')v.play?.().catch(()=>{});}else{v.pause?.();}}),{rootMargin:'300px 0px',threshold:.01});}
    const f=feed();f?.querySelectorAll('video[data-src]').forEach(v=>observer.observe(v));
  }
  function patch(){
    if(window.__madaPerfPatched)return;window.__madaPerfPatched=true;
    const oldLike=window.toggleLike,oldComment=window.addComment,oldShare=window.sharePost;
    window.madaPerfLike=async(id,liked)=>{if(typeof oldLike==='function')return oldLike(id,liked);};
    window.madaPerfComment=async id=>{if(typeof oldComment==='function')return oldComment(id);};
    window.madaPerfShare=async id=>{if(typeof oldShare==='function')return oldShare(id);};
  }
  function boot(){patch();installDelegation();new MutationObserver(()=>{clearTimeout(window.__madaPerfTimer);window.__madaPerfTimer=setTimeout(observe,80)}).observe(document.body,{childList:true,subtree:true});observe();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MadaPerformance={refresh:observe,lazyMedia};
})();
