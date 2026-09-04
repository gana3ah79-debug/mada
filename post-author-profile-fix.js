/* Mada: make every post author name/avatar open the member profile. */
(function(){
  'use strict';
  if(window.__madaPostAuthorProfileFix)return;
  window.__madaPostAuthorProfileFix=true;

  const cache=new Map();
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  async function getAuthor(postId){
    if(!window.sb||!postId)return null;
    if(cache.has(postId))return cache.get(postId);
    const {data:post,error}=await window.sb.from('posts').select('author_id').eq('id',postId).maybeSingle();
    if(error||!post?.author_id)return null;
    const {data:p}=await window.sb.from('profiles').select('id,display_name,username,avatar_url').eq('id',post.author_id).maybeSingle();
    if(!p)return null;
    cache.set(postId,p); return p;
  }

  function makeClickable(el,id){
    if(!el||el.dataset.madaMemberBound==='1')return;
    el.dataset.madaMemberBound='1';
    el.dataset.memberId=id;
    el.classList.add('mada-post-author-link');
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.addEventListener('click',function(e){
      e.preventDefault(); e.stopPropagation();
      if(typeof window.madaOpenMemberProfile==='function') window.madaOpenMemberProfile(id);
    },true);
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(typeof window.madaOpenMemberProfile==='function')window.madaOpenMemberProfile(id);}
    },true);
  }

  function decorate(article,p){
    if(!p||!article)return;
    const names=[p.display_name,p.username].filter(Boolean).map(String);
    const candidates=[];
    article.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,span,div,a,p,button').forEach(el=>{
      if(el.dataset.madaMemberBound==='1')return;
      const t=(el.textContent||'').trim();
      if(!t||t.length>120)return;
      if(names.includes(t)) candidates.push(el);
    });
    candidates.slice(0,2).forEach(el=>makeClickable(el,p.id));

    // Also make the first avatar/image in the post header clickable when it has the author's avatar URL.
    if(p.avatar_url){
      const img=[...article.querySelectorAll('img')].find(x=>x.src===p.avatar_url||x.currentSrc===p.avatar_url||x.getAttribute('src')===p.avatar_url);
      if(img) makeClickable(img,p.id);
    }
  }

  async function scan(root=document){
    const posts=[...root.querySelectorAll('article.post[data-post-id]')];
    for(const article of posts){
      if(article.dataset.madaAuthorResolved==='1')continue;
      const id=article.getAttribute('data-post-id');
      const p=await getAuthor(id);
      article.dataset.madaAuthorResolved='1';
      if(p)decorate(article,p);
    }
  }

  function boot(){
    scan();
    const feed=document.getElementById('feed');
    if(feed){
      new MutationObserver(()=>scan(feed)).observe(feed,{childList:true,subtree:true});
    }
    document.addEventListener('click',function(e){
      const el=e.target.closest?.('[data-member-id]');
      if(el&&el.classList.contains('mada-post-author-link'))return;
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
