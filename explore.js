/* Mada Explore v2: personalized recommendations */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let overlay=null;
  function openExplore(){
    overlay?.remove(); overlay=document.createElement('div'); overlay.className='explore-overlay';
    overlay.innerHTML='<div class="explore-shell"><header><div><h2>🔥 استكشاف</h2><small>محتوى مقترح لك من مجتمع Mada</small></div><button class="explore-close">×</button></header><div class="explore-tabs"><button class="active" data-tab="for_you">✨ لك</button><button data-tab="trending">🔥 الرائج</button><button data-tab="latest">🆕 الأحدث</button><button data-tab="reels">🎬 الريلز</button></div><div class="explore-grid" id="exploreGrid"><div class="explore-loading">جاري تحميل المقترحات…</div></div></div>';
    document.body.appendChild(overlay); overlay.querySelector('.explore-close').onclick=closeExplore; overlay.onclick=e=>{if(e.target===overlay)closeExplore()};
    overlay.querySelectorAll('.explore-tabs button').forEach(b=>b.onclick=()=>{overlay.querySelectorAll('.explore-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');loadExplore(b.dataset.tab)}); loadExplore('for_you');
  }
  function closeExplore(){overlay?.remove();overlay=null}
  async function loadExplore(tab){
    const grid=overlay?.querySelector('#exploreGrid'); if(!grid||!window.sb)return; grid.innerHTML='<div class="explore-loading">جاري التحميل…</div>';
    try{
      if(tab==='reels'){
        const {data,error}=await sb.from('reels').select('id,author_id,video_url,caption,created_at').order('created_at',{ascending:false}).limit(24); if(error)throw error;
        const ids=[...new Set((data||[]).map(x=>x.author_id))]; const {data:profiles}=ids.length?await sb.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]}; const pm=new Map((profiles||[]).map(x=>[x.id,x]));
        grid.innerHTML=(data||[]).map(r=>`<article class="explore-reel"><video src="${esc(r.video_url)}" muted loop playsinline controls></video><b>${esc(pm.get(r.author_id)?.display_name||'مستخدم Mada')}</b><p>${esc(r.caption||'')}</p></article>`).join('')||'<div class="explore-empty">لا توجد ريلز بعد.</div>'; return;
      }
      const {data,error}=await sb.from('posts').select('id,author_id,body,media_url,created_at,profiles!posts_author_id_fkey(display_name,avatar_url)').eq('visibility','public').order('created_at',{ascending:false}).limit(60); if(error)throw error;
      const ids=(data||[]).map(p=>p.id); const [lr,cr]=await Promise.all([ids.length?sb.from('post_likes').select('post_id,user_id').in('post_id',ids):Promise.resolve({data:[]} ),ids.length?sb.from('comments').select('post_id').in('post_id',ids):Promise.resolve({data:[]})]);
      const lc=new Map(),cc=new Map(),mine=new Set(); (lr.data||[]).forEach(x=>{lc.set(x.post_id,(lc.get(x.post_id)||0)+1);if(window.user&&x.user_id===user.id)mine.add(x.post_id)}); (cr.data||[]).forEach(x=>cc.set(x.post_id,(cc.get(x.post_id)||0)+1));
      const now=Date.now();
      const ranked=(data||[]).map(p=>{const age=Math.max(1,(now-new Date(p.created_at).getTime())/3600000);const engagement=(lc.get(p.id)||0)*4+(cc.get(p.id)||0)*3;const freshness=Math.max(0,48-age);const personalized=tab==='for_you'&&mine.has(p.id)?-15:0;return {...p,score:engagement*10+freshness+personalized}}).sort((a,b)=>tab==='latest'?new Date(b.created_at)-new Date(a.created_at):b.score-a.score).slice(0,30);
      grid.innerHTML=ranked.map(p=>`<article class="explore-card" data-post-id="${esc(p.id)}"><div class="explore-author"><span>${esc((p.profiles?.display_name||'م').charAt(0))}</span><div><b>${esc(p.profiles?.display_name||'مستخدم Mada')}</b><small>${esc(new Date(p.created_at).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'}))}</small></div></div><div class="explore-body">${esc(p.body||'')}</div>${p.media_url?`<img loading="lazy" src="${esc(p.media_url)}">`:''}<div class="explore-stats">❤️ ${lc.get(p.id)||0} &nbsp; 💬 ${cc.get(p.id)||0}</div></article>`).join('')||'<div class="explore-empty">لا توجد منشورات متاحة.</div>';
      grid.querySelectorAll('.explore-card').forEach(card=>card.onclick=()=>{closeExplore();const target=document.querySelector(`article.post[data-post-id="${CSS.escape(card.dataset.postId)}"]`);target?.scrollIntoView({behavior:'smooth',block:'center'})});
    }catch(e){console.error(e);grid.innerHTML='<div class="explore-empty">تعذر تحميل الاستكشاف حالياً.</div>'}
  }
  function addButton(){const top=document.querySelector('.top-actions');if(!top||top.querySelector('#exploreBtn'))return;const b=document.createElement('button');b.id='exploreBtn';b.type='button';b.textContent='🔥';b.title='استكشاف';b.setAttribute('aria-label','استكشاف');b.onclick=openExplore;top.insertBefore(b,top.firstChild)}
  document.addEventListener('DOMContentLoaded',()=>{addButton();new MutationObserver(addButton).observe(document.body,{childList:true,subtree:true})}); window.openExplore=openExplore;
})();