/* Mada Home Feed v2 - lightweight enhancement. Do not block the feed while loading. */
(function(){
  'use strict';
  let mode='smart',channel=null;
  const feed=()=>document.getElementById('feed');
  function injectUI(){
    const f=feed();
    if(!f||document.getElementById('feed-toolbar'))return;
    const bar=document.createElement('div');bar.id='feed-toolbar';bar.className='feed-toolbar';
    bar.innerHTML='<div class="feed-heading"><strong>منشورات Mada</strong><span id="feed-mode-label">الأكثر ملاءمة لك</span></div><div class="feed-mode"><button type="button" data-feed-mode="smart" class="active">✨ لك</button><button type="button" data-feed-mode="latest">🕒 الأحدث</button></div><button type="button" id="new-posts-btn" class="new-posts-btn" hidden>↑ منشورات جديدة</button>';
    f.before(bar);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-feed-mode]');if(b){mode=b.dataset.feedMode;bar.querySelectorAll('[data-feed-mode]').forEach(x=>x.classList.toggle('active',x===b));const l=document.getElementById('feed-mode-label');if(l)l.textContent=mode==='latest'?'الأحدث أولاً':'الأكثر ملاءمة لك';applyOrder();return}if(e.target.closest('#new-posts-btn')){e.target.closest('#new-posts-btn').hidden=true;window.loadFeed?.();window.scrollTo({top:0,behavior:'smooth'});}});
  }
  function applyOrder(){
    const f=feed();if(!f)return;
    const cards=[...f.querySelectorAll('article.post')];if(cards.length<2)return;
    cards.sort((a,b)=>{
      const pa=window.feedPosts?.get(a.dataset.postId)||{},pb=window.feedPosts?.get(b.dataset.postId)||{};
      if(mode==='latest')return String(pb.created_at||'').localeCompare(String(pa.created_at||''));
      return String(pb.created_at||'').localeCompare(String(pa.created_at||''));
    });
    const frag=document.createDocumentFragment();cards.forEach(c=>frag.appendChild(c));f.appendChild(frag);
  }
  function bindMedia(){feed()?.querySelectorAll('img.post-image, .post img').forEach(m=>{if(m.dataset.lightboxReady)return;m.dataset.lightboxReady='1';m.style.cursor='zoom-in';});}
  function watchRealtime(){if(channel||!window.sb||!window.user)return;channel=window.sb.channel('mada-home-feed-'+window.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'posts',filter:'visibility=eq.public'},()=>{const b=document.getElementById('new-posts-btn');if(b){b.hidden=false;b.textContent='↑ منشور جديد';}}).subscribe();}
  function init(){injectUI();setTimeout(watchRealtime,3500);setTimeout(bindMedia,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.madaHomeFeed={setMode:m=>{mode=m==='latest'?'latest':'smart';injectUI();applyOrder()},refresh:()=>window.loadFeed?.()};
})();
