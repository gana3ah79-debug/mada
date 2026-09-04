(() => {
  const css = `
    .comments{display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--mada-line,#e5e7eb)}
    .comments.mada-comments-open{display:block}
    .comments .comment{padding:10px 12px;margin:6px 0;border-radius:16px;background:rgba(127,127,127,.08);line-height:1.6}
    .comments .comment b{margin-left:5px}
    .comment-box{display:flex;gap:8px;margin-top:10px;align-items:center}
    .comment-box input{flex:1;min-width:0;border:1px solid var(--mada-line,#ddd);border-radius:18px;padding:10px 14px;background:var(--mada-surface,#fff);color:inherit;outline:none}
    .comment-box input:focus{border-color:#7c5cff;box-shadow:0 0 0 3px rgba(124,92,255,.12)}
    .comment-box button{border:0;border-radius:18px;padding:10px 16px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#6d5dfc,#9b5cff);color:#fff}
    .comment-box button:disabled{opacity:.6;cursor:wait}
    .meta-link,.comment-toggle{cursor:pointer}
    .mada-comments-empty{padding:10px 4px;opacity:.65;text-align:center;font-size:13px}
    .dark .comments{border-color:rgba(255,255,255,.1)}
    .dark .comment-box input{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}
  `;
  const style=document.createElement('style');style.id='mada-comments-fix-style';style.textContent=css;document.head.appendChild(style);

  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
  const getUser=()=>window.user||null;

  function postIdFrom(el){
    const raw=el?.dataset?.commentToggle||el?.dataset?.commentsOpen||el?.dataset?.id;
    if(raw)return raw;
    const post=el?.closest('[id^="post-"]');
    return post?.id?.replace(/^post-/,'')||null;
  }

  async function loadComments(postId,box){
    const sb=client(); if(!sb||!box)return;
    box.dataset.loaded='loading';
    const r=await sb.from('comments').select('id,post_id,author_id,body,created_at').eq('post_id',postId).order('created_at',{ascending:true});
    if(r.error){box.dataset.loaded='error';return;}
    const rows=r.data||[], ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];
    const pr=ids.length?await sb.from('profiles').select('id,display_name').in('id',ids):{data:[]};
    const names=new Map((pr.data||[]).map(x=>[x.id,x.display_name]));
    const oldBox=box.querySelector('.comment-box');
    const html=rows.length?rows.map(c=>`<div class="comment"><b>${esc(names.get(c.author_id)||'مستخدم Mada')}</b> ${esc(c.body)}<small style="display:block;opacity:.5;font-size:11px">${new Date(c.created_at).toLocaleString('ar-EG')}</small></div>`).join(''):'<div class="mada-comments-empty">لا توجد تعليقات بعد. كن أول من يعلّق 💬</div>';
    box.innerHTML=html;
    if(oldBox)box.appendChild(oldBox); else addBox(box,postId);
    box.dataset.loaded='1';
  }

  function addBox(box,postId){
    const wrap=document.createElement('div');wrap.className='comment-box';
    wrap.innerHTML=`<input data-comment="${esc(postId)}" maxlength="1000" placeholder="اكتب تعليقًا…"><button type="button" data-send="${esc(postId)}">إرسال</button>`;
    box.appendChild(wrap);
  }

  async function sendComment(postId,button){
    const sb=client(),u=getUser(),input=document.querySelector(`[data-comment="${CSS.escape(postId)}"]`),body=input?.value.trim();
    if(!sb||!u){alert('سجّل الدخول أولاً لإضافة تعليق.');return}
    if(!body)return;
    button.disabled=true;button.textContent='جاري…';
    const r=await sb.from('comments').insert({post_id:postId,author_id:u.id,body});
    if(r.error){alert('تعذر إضافة التعليق: '+r.error.message);button.disabled=false;button.textContent='إرسال';return}
    input.value='';button.disabled=false;button.textContent='إرسال';
    const box=document.querySelector(`[data-comments="${CSS.escape(postId)}"]`);if(box)await loadComments(postId,box);
    const count=document.querySelector(`[data-comments-open="${CSS.escape(postId)}"]`);
    if(count){const m=(count.textContent||'').match(/\d+/);const n=m?Number(m[0])+1:1;count.textContent=`${n} تعليق`}
  }

  function toggle(postId,force){
    const box=document.querySelector(`[data-comments="${CSS.escape(postId)}"]`);if(!box)return;
    const open=force===undefined?!box.classList.contains('mada-comments-open'):force;
    box.classList.toggle('mada-comments-open',open);
    if(open && box.dataset.loaded!=='1')loadComments(postId,box);
    if(open)setTimeout(()=>box.querySelector('input[data-comment]')?.focus(),60);
  }

  function boot(){
    document.addEventListener('click',e=>{
      const toggleBtn=e.target.closest('[data-comment-toggle],[data-comments-open]');
      if(toggleBtn){e.preventDefault();toggle(postIdFrom(toggleBtn));return}
      const send=e.target.closest('[data-send]');
      if(send){e.preventDefault();sendComment(send.dataset.send,send);return}
    },true);
    document.addEventListener('keydown',e=>{
      if(e.key!=='Enter'||e.shiftKey)return;
      const input=e.target.closest('input[data-comment]');if(!input)return;
      const id=input.dataset.comment,btn=document.querySelector(`[data-send="${CSS.escape(id)}"]`);if(btn)sendComment(id,btn);
    });
    const observer=new MutationObserver(()=>{
      document.querySelectorAll('.comments').forEach(box=>{
        if(!box.querySelector('.comment-box')){const id=box.dataset.comments;if(id)addBox(box,id)}
      });
    });
    const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
