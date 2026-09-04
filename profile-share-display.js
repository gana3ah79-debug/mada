(()=>{
 const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 const ini=n=>(n||'م').trim().charAt(0);
 let lastProfile='';
 async function load(){
  const id=window.__MADA_PROFILE_ID,page=document.querySelector('#modal .profile-page');if(!id||!page||lastProfile===id&&page.querySelector('.fb-shared-section'))return;
  lastProfile=id;
  const r=await sb().from('post_shares').select('post_id,user_id,target_user_id,created_at').eq('target_user_id',id).order('created_at',{ascending:false}).limit(30);
  const shares=r.data||[];if(!shares.length)return;
  const ids=[...new Set(shares.map(x=>x.post_id).filter(Boolean))];
  const pr=await sb().from('posts').select('id,author_id,body,media_url,created_at').in('id',ids);const posts=pr.data||[];if(!posts.length)return;
  const authorIds=[...new Set(posts.map(x=>x.author_id).filter(Boolean))];
  const ar=authorIds.length?await sb().from('profiles').select('id,display_name,avatar_url').in('id',authorIds):{data:[]};
  const am=new Map((ar.data||[]).map(x=>[x.id,x]));
  const byId=new Map(posts.map(x=>[x.id,x]));
  const rows=shares.map(s=>{const p=byId.get(s.post_id),a=p&&am.get(p.author_id);return p?`<article class="fb-share-item"><div class="fb-share-label">↗️ مشاركة داخل الملف الشخصي · ${esc(a?.display_name||'مستخدم')}</div>${p.body?`<div class="fb-share-text">${esc(p.body)}</div>`:''}${p.media_url?`<img src="${esc(p.media_url)}" alt="" loading="lazy">`:''}</article>`:''}).filter(Boolean).join('');
  if(!rows)return;
  const sec=document.createElement('section');sec.className='fb-shared-section';sec.innerHTML='<h3>المنشورات التي تمت مشاركتها</h3>'+rows;
  const content=page.querySelector('.profile-content');
  if(content)content.parentNode.insertBefore(sec,content);else page.appendChild(sec);
 }
 const obs=new MutationObserver(()=>setTimeout(load,80));
 const start=()=>{const m=document.getElementById('modal');if(m)obs.observe(m,{childList:true,subtree:true});load()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
