(() => {
  const css = `
    .comments{display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--mada-line,#e5e7eb)}
    .comments.mada-comments-open{display:block}
    .comments .comment{padding:10px 12px;margin:6px 0;border-radius:16px;background:rgba(127,127,127,.08);line-height:1.6}
    .comments .comment b{margin-left:5px}
    .comment-tools{display:flex;gap:12px;margin-top:4px;align-items:center}
    .comment-tools button{border:0;background:none;color:inherit;opacity:.65;font-size:12px;cursor:pointer;padding:2px 0}
    .comment-tools button:hover{opacity:1}
    .comment-reply{margin-right:28px;border-right:2px solid rgba(124,92,255,.22);padding-right:10px}
    .comment-reply-box{display:none;margin:7px 0 7px 28px;gap:7px}
    .comment-reply-box.open{display:flex}
    .comment-reply-box input{flex:1;min-width:0;border:1px solid var(--mada-line,#ddd);border-radius:16px;padding:8px 11px;background:var(--mada-surface,#fff);color:inherit}
    .comment-reply-box button{border:0;border-radius:16px;padding:8px 12px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#6d5dfc,#9b5cff);color:#fff}
    .comment-box{display:flex;gap:8px;margin-top:10px;align-items:center}
    .comment-box input{flex:1;min-width:0;border:1px solid var(--mada-line,#ddd);border-radius:18px;padding:10px 14px;background:var(--mada-surface,#fff);color:inherit;outline:none}
    .comment-box input:focus,.comment-reply-box input:focus{border-color:#7c5cff;box-shadow:0 0 0 3px rgba(124,92,255,.12)}
    .comment-box button,.comment-reply-box button{white-space:nowrap}
    .comment-box button:disabled,.comment-reply-box button:disabled{opacity:.6;cursor:wait}
    .meta-link,.comment-toggle{cursor:pointer}
    .mada-comments-empty{padding:10px 4px;opacity:.65;text-align:center;font-size:13px}
    .dark .comments{border-color:rgba(255,255,255,.1)}
    .dark .comment-box input,.dark .comment-reply-box input{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14)}
  `;
  if(!document.getElementById('mada-comments-fix-style')){const style=document.createElement('style');style.id='mada-comments-fix-style';style.textContent=css;document.head.appendChild(style)}

  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
  async function getUser(){if(window.user?.id)return window.user;const sb=client();if(!sb?.auth?.getUser)return null;const r=await sb.auth.getUser();return r.data?.user||null}
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const sel=v=>CSS.escape(String(v));

  function postIdFrom(el){const raw=el?.dataset?.commentToggle||el?.dataset?.commentsOpen||el?.dataset?.id;if(raw)return raw;return el?.closest('[id^="post-"]')?.id?.replace(/^post-/,'')||null}

  function controls(c,u){
    const mine=u?.id&&c.author_id===u.id;
    return `<div class="comment-tools"><button type="button" data-reply="${esc(c.id)}">↩️ رد</button>${mine?`<button type="button" data-delete-comment="${esc(c.id)}">🗑️ حذف</button>`:''}</div>`;
  }

  async function loadComments(postId,box){
    const sb=client();if(!sb||!box)return;
    box.dataset.loaded='loading';
    const [r,u]=await Promise.all([sb.from('comments').select('id,post_id,author_id,body,created_at,parent_id').eq('post_id',postId).order('created_at',{ascending:true}),getUser()]);
    if(r.error){box.dataset.loaded='error';return}
    const rows=r.data||[],ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];
    const pr=ids.length?await sb.from('profiles').select('id,display_name').in('id',ids):{data:[]};
    const names=new Map((pr.data||[]).map(x=>[x.id,x.display_name]));
    const roots=rows.filter(c=>!c.parent_id),children=new Map();
    rows.filter(c=>c.parent_id).forEach(c=>{if(!children.has(c.parent_id))children.set(c.parent_id,[]);children.get(c.parent_id).push(c)});
    const render=c=>`<div class="comment ${c.parent_id?'comment-reply':''}" data-comment-id="${esc(c.id)}"><b>${esc(names.get(c.author_id)||'مستخدم Mada')}</b> ${esc(c.body)}<small style="display:block;opacity:.5;font-size:11px">${new Date(c.created_at).toLocaleString('ar-EG')}</small>${controls(c,u)}<div class="comment-reply-box" data-reply-box="${esc(c.id)}"><input maxlength="1000" data-reply-input="${esc(c.id)}" placeholder="اكتب ردك…"><button type="button" data-send-reply="${esc(c.id)}" data-post-id="${esc(postId)}">إرسال</button></div>${(children.get(c.id)||[]).map(render).join('')}</div>`;
    const html=roots.length?roots.map(render).join(''):'<div class="mada-comments-empty">لا توجد تعليقات بعد. كن أول من يعلّق 💬</div>';
    const oldBox=box.querySelector('.comment-box');box.innerHTML=html;if(oldBox)box.appendChild(oldBox);else addBox(box,postId);box.dataset.loaded='1';
  }

  function addBox(box,postId){const wrap=document.createElement('div');wrap.className='comment-box';wrap.innerHTML=`<input data-comment="${esc(postId)}" maxlength="1000" placeholder="اكتب تعليقًا…"><button type="button" data-send="${esc(postId)}">إرسال</button>`;box.appendChild(wrap)}

  async function sendComment(postId,button,parentId=null){
    const sb=client(),u=await getUser();if(!sb||!u){alert('سجّل الدخول أولاً لإضافة تعليق.');return}
    const input=parentId?q(`[data-reply-input="${sel(parentId)}"]`):q(`[data-comment="${sel(postId)}"]`),body=input?.value.trim();if(!body)return;
    button.disabled=true;button.textContent='جاري…';
    const payload={post_id:postId,author_id:u.id,body};if(parentId)payload.parent_id=parentId;
    const r=await sb.from('comments').insert(payload);
    if(r.error){alert('تعذر إضافة التعليق: '+r.error.message);button.disabled=false;button.textContent='إرسال';return}
    input.value='';button.disabled=false;button.textContent='إرسال';
    const box=q(`[data-comments="${sel(postId)}"]`);if(box)await loadComments(postId,box);
    const count=q(`[data-comments-open="${sel(postId)}"]`);if(count){const m=(count.textContent||'').match(/\d+/);const n=m?Number(m[0])+1:1;count.textContent=`${n} تعليق`}
  }

  async function deleteComment(id){
    const u=await getUser(),sb=client();if(!u||!sb)return;
    if(!confirm('حذف هذا التعليق؟'))return;
    const r=await sb.from('comments').delete().eq('id',id).eq('author_id',u.id);
    if(r.error){alert('تعذر حذف التعليق: '+r.error.message);return}
    const item=q(`[data-comment-id="${sel(id)}"]`);const post=item?.closest('[data-comments]')?.dataset.comments;if(post){const box=q(`[data-comments="${sel(post)}"]`);if(box)await loadComments(post,box)}
  }

  function toggle(postId,force){const box=q(`[data-comments="${sel(postId)}"]`);if(!box)return;const open=force===undefined?!box.classList.contains('mada-comments-open'):force;box.classList.toggle('mada-comments-open',open);if(open&&box.dataset.loaded!=='1')loadComments(postId,box);if(open)setTimeout(()=>box.querySelector('input[data-comment]')?.focus(),60)}

  function boot(){
    document.addEventListener('click',e=>{
      const toggleBtn=e.target.closest('[data-comment-toggle],[data-comments-open]');if(toggleBtn){e.preventDefault();toggle(postIdFrom(toggleBtn));return}
      const send=e.target.closest('[data-send]');if(send){e.preventDefault();sendComment(send.dataset.send,send);return}
      const reply=e.target.closest('[data-reply]');if(reply){e.preventDefault();const box=q(`[data-reply-box="${sel(reply.dataset.reply)}"]`);box?.classList.toggle('open');box?.querySelector('input')?.focus();return}
      const sendReply=e.target.closest('[data-send-reply]');if(sendReply){e.preventDefault();sendComment(sendReply.dataset.postId,sendReply,sendReply.dataset.sendReply);return}
      const del=e.target.closest('[data-delete-comment]');if(del){e.preventDefault();deleteComment(del.dataset.deleteComment);return}
    },true);
    document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey)return;const input=e.target.closest('input[data-comment]');if(input){const btn=q(`[data-send="${sel(input.dataset.comment)}"]`);if(btn)sendComment(input.dataset.comment,btn);return}const ri=e.target.closest('input[data-reply-input]');if(ri){const btn=q(`[data-send-reply="${sel(ri.dataset.replyInput)}"]`);if(btn)sendComment(btn.dataset.postId,btn,ri.dataset.replyInput)}});
    const observer=new MutationObserver(()=>qa('.comments').forEach(box=>{if(!box.querySelector('.comment-box')){const id=box.dataset.comments;if(id)addBox(box,id)}}));
    const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();