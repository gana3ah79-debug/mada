(() => {
  const css = `
    .comment-tools .comment-like{display:inline-flex;align-items:center;gap:4px}
    .comment-tools .comment-like.is-liked{color:#ef476f;opacity:1;font-weight:800}
    .comment-tools .comment-like .comment-like-count{font-variant-numeric:tabular-nums}
  `;
  if(!document.getElementById('mada-comment-social-style')){
    const style=document.createElement('style');style.id='mada-comment-social-style';style.textContent=css;document.head.appendChild(style);
  }

  const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const sel=v=>CSS.escape(String(v));
  let busy=new Set();

  async function getUser(){
    if(window.user?.id)return window.user;
    const sb=client();
    if(!sb?.auth?.getUser)return null;
    const r=await sb.auth.getUser();
    return r.data?.user||null;
  }

  async function decorate(box){
    if(!box||box.dataset.madaSocial==='loading')return;
    const sb=client();if(!sb)return;
    const comments=qa('[data-comment-id]',box);
    if(!comments.length){box.dataset.madaSocial='1';return}
    box.dataset.madaSocial='loading';
    const ids=comments.map(x=>x.dataset.commentId).filter(Boolean);
    const [lr,u]=await Promise.all([
      sb.from('comment_likes').select('comment_id,user_id').in('comment_id',ids),
      getUser()
    ]);
    if(lr.error){box.dataset.madaSocial='error';return}
    const likes=lr.data||[],counts=new Map(),mine=new Set();
    likes.forEach(x=>{counts.set(x.comment_id,(counts.get(x.comment_id)||0)+1);if(u?.id&&x.user_id===u.id)mine.add(x.comment_id)});
    comments.forEach(el=>{
      const id=el.dataset.commentId;
      let btn=el.querySelector('[data-comment-like]');
      if(!btn){
        const tools=el.querySelector('.comment-tools');
        if(!tools)return;
        btn=document.createElement('button');
        btn.type='button';btn.className='comment-like';btn.dataset.commentLike=id;
        tools.insertBefore(btn,tools.firstChild);
      }
      const n=counts.get(id)||0,liked=mine.has(id);
      btn.classList.toggle('is-liked',liked);
      btn.innerHTML=`${liked?'❤️':'♡'} <span class="comment-like-count">${n}</span>`;
      btn.setAttribute('aria-label',liked?'إلغاء الإعجاب':'إعجاب بالتعليق');
    });
    box.dataset.madaSocial='1';
  }

  async function toggleLike(commentId,btn){
    if(busy.has(commentId))return;
    const sb=client(),u=await getUser();
    if(!sb||!u){alert('سجّل الدخول أولاً للإعجاب بالتعليق.');return}
    busy.add(commentId);btn.disabled=true;
    try{
      const existing=await sb.from('comment_likes').select('id').eq('comment_id',commentId).eq('user_id',u.id).maybeSingle();
      if(existing.error)throw existing.error;
      if(existing.data){
        const r=await sb.from('comment_likes').delete().eq('id',existing.data.id).eq('user_id',u.id);
        if(r.error)throw r.error;
      }else{
        const r=await sb.from('comment_likes').insert({comment_id:commentId,user_id:u.id});
        if(r.error)throw r.error;
      }
      const row=btn.closest('[data-comment-id]');
      if(row){
        const count=await sb.from('comment_likes').select('id',{count:'exact',head:true}).eq('comment_id',commentId);
        const n=count.error?0:(count.count||0);
        btn.classList.toggle('is-liked',!existing.data);
        btn.innerHTML=`${existing.data?'♡':'❤️'} <span class="comment-like-count">${n}</span>`;
      }
    }catch(err){
      alert('تعذر تحديث إعجاب التعليق: '+(err?.message||'خطأ غير معروف'));
    }finally{
      btn.disabled=false;busy.delete(commentId);
    }
  }

  function scan(){qa('.comments').forEach(decorate)}

  function boot(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest('[data-comment-like]');
      if(btn){e.preventDefault();e.stopPropagation();toggleLike(btn.dataset.commentLike,btn);}
    },true);
    const feed=document.getElementById('feed');
    if(feed){
      const observer=new MutationObserver(()=>scan());
      observer.observe(feed,{childList:true,subtree:true});
    }
    scan();
    setTimeout(scan,500);
    setTimeout(scan,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
