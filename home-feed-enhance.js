/* Mada Home Feed v1: smart/latest modes, realtime new-posts banner, skeleton loading and media lightbox. */
(function(){
  let mode='smart',channel=null,loadingTimer=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const feed=()=>document.getElementById('feed');
  function injectUI(){
    if(!feed()||document.getElementById('feed-toolbar'))return;
    const bar=document.createElement('div');bar.id='feed-toolbar';bar.className='feed-toolbar';
    bar.innerHTML='<div class="feed-heading"><strong>منشورات Mada</strong><span id="feed-mode-label">الأكثر ملاءمة لك</span></div><div class="feed-mode"><button type="button" data-feed-mode="smart" class="active">✨ لك</button><button type="button" data-feed-mode="latest">🕒 الأحدث</button></div><button type="button" id="new-posts-btn" class="new-posts-btn" hidden>↑ منشورات جديدة</button>';
    feed().before(bar);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-feed-mode]');if(b){mode=b.dataset.feedMode;bar.querySelectorAll('[data-feed-mode]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('feed-mode-label').textContent=mode==='latest'?'الأحدث أولاً':'الأكثر ملاءمة لك';applyOrder();return;}if(e.target.closest('#new-posts-btn')){document.getElementById('new-posts-btn').hidden=true;window.loadFeed?.();window.scrollTo({top:0,behavior:'smooth'});}});
  }
  function skeleton(){const f=feed();if(!f)return;f.classList.add('is-loading');f.innerHTML=Array.from({length:3},()=>'<div class="feed-skeleton card"><div class="sk-head"><i></i><span></span></div><div class="sk-line wide"></div><div class="sk-line"></div><div class="sk-media"></div><div class="sk-actions"><i></i><i></i><i></i></div></div>').join('');}
  function startLoading(){clearTimeout(loadingTimer);skeleton();loadingTimer=setTimeout(()=>feed()?.classList.remove('is-loading'),1200);}
  function applyOrder(){
    const f=feed();if(!f||f.querySelector('.feed-skeleton'))return;
    const cards=[...f.querySelectorAll('article.post')];
    cards.sort((a,b)=>{
      if(mode==='latest')return (window.feedPosts?.get(b.dataset.postId)?.created_at||'').localeCompare(window.feedPosts?.get(a.dataset.postId)?.created_at||'');
      const score=el=>{const p=window.feedPosts?.get(el.dataset.postId);const age=p?.created_at?Math.max(1,(Date.now()-new Date(p.created_at))/3600000):24;const nums=(el.querySelector('.post-stats')?.textContent.match(/\d+/g)||[]).map(Number);const engagement=nums.reduce((a,n)=>a+n,0);const mine=p?.author_id===window.user?.id?1:0;return engagement*2+(1/age)*100+mine*4;};return score(b)-score(a);
    });
    const frag=document.createDocumentFragment();cards.forEach(c=>frag.appendChild(c));f.appendChild(frag);f.classList.remove('is-loading');
  }
  function mediaViewer(src,type){if(!src)return;const o=document.createElement('div');o.className='mada-media-viewer';o.innerHTML='<button type="button" class="media-close" aria-label="إغلاق">×</button><div class="media-stage"></div>';const stage=o.querySelector('.media-stage');stage.innerHTML=type==='video'?`<video src="${esc(src)}" controls autoplay playsinline></video>`:`<img src="${esc(src)}" alt="صورة المنشور">`;document.body.appendChild(o);o.querySelector('.media-close').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)e.currentTarget.remove();};}
  function bindMedia(){feed()?.querySelectorAll('img.post-image, .post img, video.post-video, .post video').forEach(m=>{if(m.dataset.lightboxReady)return;m.dataset.lightboxReady='1';m.style.cursor='zoom-in';m.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();mediaViewer(m.currentSrc||m.src||m.querySelector('source')?.src,m.tagName==='VIDEO'?'video':'image');});});}
  function watchRealtime(){if(channel||!window.sb||!window.user)return;channel=sb.channel('mada-home-feed-'+user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'posts',filter:'visibility=eq.public'},payload=>{if(payload.new?.author_id===user.id)return;const btn=document.getElementById('new-posts-btn');if(btn){btn.hidden=false;btn.textContent='↑ منشور جديد';}else injectUI();}).subscribe();}
  const observer=new MutationObserver(()=>{injectUI();bindMedia();if(!feed()?.querySelector('.feed-skeleton'))applyOrder();});
  document.addEventListener('DOMContentLoaded',()=>{injectUI();setTimeout(watchRealtime,2200);setTimeout(bindMedia,2600);});
  const original=window.loadFeed;
  if(typeof original==='function')window.loadFeed=async function(){startLoading();try{return await original.apply(this,arguments)}finally{clearTimeout(loadingTimer);setTimeout(()=>{applyOrder();bindMedia();},40);}};
  else setTimeout(()=>{const fn=window.loadFeed;if(typeof fn==='function')window.loadFeed=async function(){startLoading();try{return await fn.apply(this,arguments)}finally{setTimeout(()=>{applyOrder();bindMedia()},40)}}},500);
  window.madaHomeFeed={setMode:m=>{mode=m==='latest'?'latest':'smart';injectUI();applyOrder()},refresh:()=>window.loadFeed?.()};
})();
