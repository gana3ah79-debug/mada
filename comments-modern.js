/* Mada Comments Modern v5 — reliable comments, live counts, replies, delete and realtime. */
(function(){
  const get=id=>document.getElementById(id), db=()=>window.sb||null, me=()=>window.user||null;
  const pending=new Set(); let replyTarget=null, realtime=null;

  function toast(msg){
    if(window.showToast)return window.showToast(msg);
    let t=get('madaCommentToast');
    if(!t){t=document.createElement('div');t.id='madaCommentToast';t.className='mada-comment-toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200);
  }
  function findPost(id){return document.querySelector(`article.post[data-post-id="${CSS.escape(id)}"]`)}
  function commentsHost(post){return post?.querySelector('.comment-list')||post?.querySelector('.comments')||null}

  function ensureReplyBar(){
    if(get('commentReplyBar'))return;
    const b=document.createElement('div');b.id='commentReplyBar';b.className='comment-reply-bar';b.hidden=true;
    b.innerHTML='<span>↩️ الرد على <b id="commentReplyName"></b></span><button type="button" id="cancelCommentReply">×</button>';
    document.body.appendChild(b);get('cancelCommentReply').onclick=clearReply;
  }
  function clearReply(){
    replyTarget=null;const b=get('commentReplyBar');if(b)b.hidden=true;
    document.querySelectorAll('.comment-box input').forEach(i=>i.placeholder='اكتب تعليقًا...');
  }
  function startReply(c){
    ensureReplyBar();
    replyTarget={id:c.dataset.commentId,name:c.dataset.authorName||'مستخدم',postId:c.closest('.post')?.dataset.postId};
    get('commentReplyName').textContent=replyTarget.name;get('commentReplyBar').hidden=false;
    const i=c.closest('.post')?.querySelector('.comment-box input');
    if(i){i.placeholder=`الرد على ${replyTarget.name}...`;i.focus()}
  }

  function updateCount(postId,count){
    const post=findPost(postId);if(!post)return;
    const btn=post.querySelector('.comment-toggle');
    if(btn)btn.textContent=`💬 تعليق ${Number(count)||0}`;
  }
  async function refreshPostStats(postId){
    const d=db();if(!d||!postId)return;
    const {count,error}=await d.from('comments').select('id',{count:'exact',head:true}).eq('post_id',postId);
    if(!error)updateCount(postId,count||0);
  }
  window.madaRefreshPostStats=refreshPostStats;

  function makeComment(row,name,currentUserId){
    const c=document.createElement('div');c.className='comment mada-live-comment';
    c.dataset.commentId=row.id;c.dataset.parentId=row.parent_id||'';c.dataset.authorName=name||'مستخدم';
    const body=document.createElement('span');body.className='comment-body';
    const b=document.createElement('b');b.textContent=name||'مستخدم';
    const txt=document.createElement('span');txt.textContent=row.body||'';body.append(b,txt);
    const meta=document.createElement('small');meta.className='comment-time';meta.textContent=row.created_at?new Date(row.created_at).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'}):'';
    const tools=document.createElement('span');tools.className='comment-tools';
    const reply=document.createElement('button');reply.type='button';reply.textContent='رد';reply.onclick=e=>{e.stopPropagation();startReply(c)};tools.appendChild(reply);
    if(row.author_id===currentUserId){
      const del=document.createElement('button');del.type='button';del.className='comment-delete';del.textContent='حذف';
      del.onclick=e=>{e.stopPropagation();deleteComment(c)};tools.appendChild(del);
    }
    c.append(body,meta,tools);return c;
  }

  function renderRows(postId,rows,profiles,limit){
    const post=findPost(postId),host=commentsHost(post);if(!post||!host)return;
    host.replaceChildren();
    const pmap=new Map((profiles||[]).map(p=>[p.id,p]));
    const shown=rows.slice(Math.max(0,rows.length-(limit||20)));
    shown.forEach(r=>{
      const p=pmap.get(r.author_id)||{};host.appendChild(makeComment(r,p.display_name||'مستخدم',me()?.id));
    });
    if(rows.length>(limit||20)){
      const more=document.createElement('button');more.type='button';more.className='comments-more';more.textContent=`عرض كل التعليقات (${rows.length})`;
      more.onclick=()=>renderRows(postId,rows,profiles,rows.length);host.insertBefore(more,host.firstChild);
    }
    updateCount(postId,rows.length);
  }

  async function loadPostComments(postId,limit=20){
    const d=db();if(!d||!postId)return;
    const {data,error}=await d.from('comments').select('id,post_id,author_id,body,parent_id,created_at').eq('post_id',postId).order('created_at',{ascending:true});
    if(error){console.warn('comments load failed',error);return}
    const rows=data||[];
    const ids=[...new Set(rows.map(r=>r.author_id).filter(Boolean))];
    const {data:profiles}=ids.length?await d.from('profiles').select('id,display_name').in('id',ids):{data:[]};
    renderRows(postId,rows,profiles,limit);
  }

  async function deleteComment(c){
    const d=db(),u=me(),id=c?.dataset.commentId,key='del:'+id;
    if(!d||!u||!id||pending.has(key))return;
    if(!confirm('حذف هذا التعليق؟'))return;
    pending.add(key);const btn=c.querySelector('.comment-delete');if(btn)btn.disabled=true;
    try{
      const{error}=await d.from('comments').delete().eq('id',id).eq('author_id',u.id);if(error)throw error;
      const pid=c.closest('.post')?.dataset.postId;c.remove();if(pid)await refreshPostStats(pid);toast('تم حذف التعليق ✓');
    }catch(e){console.error(e);toast('تعذر حذف التعليق')}
    finally{pending.delete(key);if(btn)btn.disabled=false}
  }

  async function addComment(postId){
    const d=db(),u=me(),key='add:'+postId;
    if(!d||!u||!postId||pending.has(key))return;
    const box=document.querySelector(`#feed [data-comment="${CSS.escape(postId)}"]`),text=box?.value.trim();if(!text)return;
    if(text.length>1000){toast('التعليق طويل جدًا');return}
    const send=document.querySelector(`#feed [data-send="${CSS.escape(postId)}"]`);
    pending.add(key);if(send){send.disabled=true;send.textContent='…'}
    try{
      const parentId=replyTarget&&replyTarget.postId===postId?replyTarget.id:null;
      const{data,error}=await d.from('comments').insert({post_id:postId,author_id:u.id,body:text,parent_id:parentId}).select('id,post_id,author_id,body,parent_id,created_at').single();
      if(error)throw error;
      if(box)box.value='';clearReply();
      const host=commentsHost(findPost(postId));
      if(host){
        const row=makeComment(data,u.display_name||u.email||'أنت',u.id);
        if(parentId){const parent=host.querySelector(`[data-comment-id="${CSS.escape(parentId)}"]`);if(parent)parent.insertAdjacentElement('afterend',row);else host.appendChild(row)}else host.appendChild(row);
      }
      await refreshPostStats(postId);toast(parentId?'تم نشر الرد ✓':'تم نشر التعليق ✓');
    }catch(e){console.error(e);toast('تعذر إضافة التعليق: '+(e?.message||''))}
    finally{pending.delete(key);if(send){send.disabled=false;send.textContent='إرسال'}}
  }

  function startRealtime(){
    const d=db(),u=me();if(!d||!u||realtime)return;
    realtime=d.channel('mada-comments-'+u.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'comments'},async payload=>{
        const r=payload.new;if(!r?.post_id)return;
        await refreshPostStats(r.post_id);
        if(r.author_id===u.id)return;
        const post=findPost(r.post_id);if(!post)return;
        const host=commentsHost(post);if(!host||host.querySelector(`[data-comment-id="${CSS.escape(r.id)}"]`))return;
        const{data:p}=await d.from('profiles').select('display_name').eq('id',r.author_id).maybeSingle();
        const row=makeComment(r,p?.display_name||'مستخدم',u.id);host.appendChild(row);toast('تعليق جديد 💬');
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'comments'},async payload=>{
        const id=payload.old?.id,pid=payload.old?.post_id;
        if(id)document.querySelector(`[data-comment-id="${CSS.escape(id)}"]`)?.remove();
        if(pid)await refreshPostStats(pid);
      }).subscribe();
  }

  function enhancePost(post){
    const pid=post?.dataset.postId;if(!pid)return;
    const toggle=post.querySelector('.comment-toggle');
    if(toggle&&!toggle.dataset.commentEnhanced){
      toggle.dataset.commentEnhanced='1';
      toggle.addEventListener('click',()=>{const box=post.querySelector('.comment-box input');box?.focus();post.querySelector('.comments')?.scrollIntoView({behavior:'smooth',block:'nearest'})});
    }
    loadPostComments(pid,20);
  }
  function enhanceAll(){document.querySelectorAll('#feed article.post').forEach(enhancePost)}

  function init(){
    ensureReplyBar();
    const feed=get('feed');if(!feed)return;
    const observer=new MutationObserver(()=>{clearTimeout(window.__commentEnhanceTimer);window.__commentEnhanceTimer=setTimeout(enhanceAll,120)});
    observer.observe(feed,{childList:true,subtree:true});
    setTimeout(enhanceAll,300);setTimeout(startRealtime,1000);
    feed.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey)return;const input=e.target.closest('[data-comment]');if(input){e.preventDefault();window.addComment?.(input.dataset.comment)}});
  }
  window.addComment=addComment;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();