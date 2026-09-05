/* Mada Reels Stage 4 — follow author, views and saved state */
(function(){'use strict';
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const me=()=>window.madaUser?.()||window.user;
let running=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function hydrate(){
 if(running)return; const root=document.querySelector('.mada-reels-v3'); const s=sb(); if(!root||!s)return;
 const cards=[...root.querySelectorAll('.mr-reel')]; const ids=cards.map(c=>c.dataset.reel).filter(Boolean); if(!ids.length)return; running=true;
 try{
  const u=me();
  const [posts,views,saves,following,allF]=await Promise.all([
   s.from('posts').select('id,author_id').in('id',ids),
   s.from('post_views').select('post_id').in('post_id',ids),
   s.from('post_saves').select('post_id,user_id').in('post_id',ids),
   u?s.from('follows').select('following_id').eq('follower_id',u.id):Promise.resolve({data:[]}),
   s.from('follows').select('following_id').in('following_id',[...new Set(ids.map(id=>cards.find(c=>String(c.dataset.reel)===String(id))?.dataset.author).filter(Boolean))])
  ]);
  const pm=new Map((posts.data||[]).map(x=>[String(x.id),x]));
  const vc=new Map(),sc=new Map(),fc=new Map();
  (views.data||[]).forEach(x=>vc.set(String(x.post_id),(vc.get(String(x.post_id))||0)+1));
  (saves.data||[]).forEach(x=>sc.set(String(x.post_id),(sc.get(String(x.post_id))||0)+1));
  (allF.data||[]).forEach(x=>fc.set(String(x.following_id),(fc.get(String(x.following_id))||0)+1));
  const fs=new Set((following.data||[]).map(x=>String(x.following_id)));
  cards.forEach(card=>{
   const id=String(card.dataset.reel||''),p=pm.get(id),author=p?.author_id;if(!author)return;
   card.dataset.madaAuthor=author;
   let info=card.querySelector('.mr-info'); if(!info)return;
   let row=info.querySelector('.mrs-author-row');
   if(!row){const authorEl=info.querySelector('.mr-author');row=document.createElement('div');row.className='mrs-author-row';if(authorEl){authorEl.parentNode.insertBefore(row,authorEl);row.appendChild(authorEl)}else info.prepend(row)}
   let fb=row.querySelector('.mrs-follow');
   if(!fb && u && author!==u.id){fb=document.createElement('button');fb.className='mrs-follow';fb.type='button';row.appendChild(fb);fb.onclick=async e=>{e.preventDefault();e.stopPropagation();await toggleFollow(author,fb,fc,author)} }
   if(fb){fb.textContent=fs.has(String(author))?'✓ تتابعه':'＋ متابعة';fb.classList.toggle('is-following',fs.has(String(author)))}
   let stats=info.querySelector('.mrs-stats');if(!stats){stats=document.createElement('div');stats.className='mrs-stats';info.appendChild(stats)}
   stats.innerHTML=`👁 ${vc.get(id)||0} · 🔖 ${sc.get(id)||0} · 👥 ${fc.get(String(author))||0}`;
   const save=card.querySelector('[data-mri-save]');if(save&&u){const saved=(saves.data||[]).some(x=>String(x.post_id)===id&&x.user_id===u.id);save.classList.toggle('saved',saved);save.innerHTML=saved?'🔖<b>محفوظ</b>':'🔖<b>حفظ</b>'}
  });
 }finally{running=false}
}
async function toggleFollow(author,b,fc){const u=me(),s=sb();if(!u||b.disabled)return;b.disabled=true;const on=b.classList.contains('is-following');const r=on?await s.from('follows').delete().eq('follower_id',u.id).eq('following_id',author):await s.from('follows').insert({follower_id:u.id,following_id:author});if(!r.error){b.classList.toggle('is-following',!on);b.textContent=!on?'✓ تتابعه':'＋ متابعة'}b.disabled=false}
const st=document.createElement('style');st.textContent=`
.mrs-author-row{display:flex;align-items:center;gap:8px;min-width:0}.mrs-author-row .mr-author{margin:0;min-width:0}.mrs-follow{border:0;border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.16);color:#fff;font-size:12px;font-weight:700;white-space:nowrap;backdrop-filter:blur(8px)}.mrs-follow.is-following{background:rgba(255,255,255,.24)}.mrs-stats{margin-top:6px;color:rgba(255,255,255,.82);font-size:12px;font-weight:600;text-shadow:0 1px 4px #000;direction:rtl}.mr-actions .saved b{color:#fff}`;document.head.appendChild(st);
function boot(){hydrate();new MutationObserver(()=>hydrate()).observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();