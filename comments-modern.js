/* Mada Comments Modern v1 — reply, delete, live refresh */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const get=(id)=>document.getElementById(id);
  let replyTarget=null;
  function toast(msg){
    if(typeof window.showToast==='function') return window.showToast(msg);
    let t=get('madaCommentToast'); if(!t){t=document.createElement('div');t.id='madaCommentToast';t.className='mada-comment-toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200);
  }
  function ensureReplyBar(){
    if(get('commentReplyBar')) return;
    const bar=document.createElement('div');bar.id='commentReplyBar';bar.className='comment-reply-bar';bar.hidden=true;
    bar.innerHTML='<span>↩️ الرد على <b id="commentReplyName"></b></span><button type="button" id="cancelCommentReply">×</button>';
    document.body.appendChild(bar);
    get('cancelCommentReply').onclick=()=>{replyTarget=null;bar.hidden=true};
  }
  function startReply(comment){
    ensureReplyBar();
    replyTarget={id:comment.dataset.commentId,name:comment.dataset.authorName||'مستخدم'};
    get('commentReplyName').textContent=replyTarget.name;get('commentReplyBar').hidden=false;
    const post=comment.closest('.post');const input=post?.querySelector('.comment-box input');if(input){input.value='';input.placeholder='اكتب ردك...';input.focus()}
  }
  async function deleteComment(comment){
    if(!window.sb||!window.user)return;
    if(!confirm('حذف هذا التعليق؟'))return;
    const id=comment.dataset.commentId;if(!id)return;
    const {error}=await window.sb.from('comments').delete().eq('id',id).eq('author_id',window.user.id);
    if(error){toast('تعذر حذف التعليق');console.error(error);return}
    comment.remove();toast('تم حذف التعليق');
    const post=comment.closest('.post');if(post){const input=post.querySelector('.comment-box input');if(input)input.placeholder='اكتب تعليقًا...'}
  }
  function decorate(){
    document.querySelectorAll('#feed .comment').forEach(c=>{
      if(c.dataset.enhanced)return;
      c.dataset.enhanced='1';
      const text=c.textContent.trim();
      const first=c.querySelector('b');
      const name=first?.textContent||'مستخدم';
      const buttons=document.createElement('span');buttons.className='comment-tools';
      const reply=document.createElement('button');reply.type='button';reply.textContent='رد';reply.onclick=e=>{e.stopPropagation();startReply(c)};
      buttons.appendChild(reply);
      const body=document.createElement('span');body.className='comment-body';
      const b=first?.cloneNode(true);if(b)body.appendChild(b);
      const raw=first?text.slice(name.length).trim():text;const span=document.createElement('span');span.textContent=(raw||'');body.appendChild(span);
      c.textContent='';c.appendChild(body);c.appendChild(buttons);
      if(first?.dataset?.id)c.dataset.commentId=first.dataset.id;
      // Current renderer does not expose comment id, so recover it from a lightweight lookup on click.
      c.dataset.authorName=name;
    });
  }
  async function resolveCommentId(comment){
    if(comment.dataset.commentId)return comment.dataset.commentId;
    const post=comment.closest('.post');const postId=post?.dataset.postId;if(!postId||!window.sb)return null;
    const body=comment.querySelector('.comment-body')?.textContent?.trim()||'';
    const {data}=await window.sb.from('comments').select('id,author_id,body,created_at').eq('post_id',postId).eq('author_id',window.user?.id).order('created_at',{ascending:false}).limit(20);
    const found=(data||[]).find(x=>body.endsWith(x.body)||body.includes(x.body));if(found){comment.dataset.commentId=found.id;return found.id}return null;
  }
  document.addEventListener('click',async e=>{
    const del=e.target.closest('.comment-delete');if(del){e.stopPropagation();return deleteComment(del.closest('.comment'))}
    const comment=e.target.closest('#feed .comment');if(!comment)return;
    if(e.target.closest('.comment-tools'))return;
    const id=await resolveCommentId(comment);if(id&&id===window.user?.id)return;
  },true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('#feed .comment'))return;
    if(e.target.closest('.comment-tools'))return;
  });
  // Add delete buttons after resolving ownership and support reply submission without changing the existing comments table.
  async function addTools(){
    decorate();
    if(!window.sb||!window.user)return;
    const comments=[...document.querySelectorAll('#feed .comment')];
    const postIds=[...new Set(comments.map(c=>c.closest('.post')?.dataset.postId).filter(Boolean))];
    for(const pid of postIds){
      const {data}=await window.sb.from('comments').select('id,author_id,body,created_at').eq('post_id',pid).order('created_at',{ascending:true});
      const rows=data||[];const cs=comments.filter(c=>c.closest('.post')?.dataset.postId===pid);
      cs.forEach((c,i)=>{const row=rows[i];if(!row)return;c.dataset.commentId=row.id;c.dataset.authorName=c.querySelector('b')?.textContent||'مستخدم';if(row.author_id===window.user.id&&!c.querySelector('.comment-delete')){const btn=document.createElement('button');btn.type='button';btn.className='comment-delete';btn.textContent='حذف';btn.onclick=()=>deleteComment(c);c.querySelector('.comment-tools')?.appendChild(btn)}});
    }
  }
  const oldAddComment=window.addComment;
  window.addComment=async function(postId){
    const box=document.querySelector(`#feed [data-comment="${CSS.escape(postId)}"]`);const text=box?.value.trim();if(!text)return;
    const send=document.querySelector(`#feed [data-send="${CSS.escape(postId)}"]`);if(send){send.disabled=true;send.dataset.oldText=send.textContent;send.textContent='…'}
    try{
      let body=text;
      if(replyTarget){body=`↩️ @${replyTarget.name} ${text}`}
      const {error}=await window.sb.from('comments').insert({post_id:postId,author_id:window.user.id,body});if(error)throw error;
      box.value='';box.placeholder='اكتب تعليقًا...';replyTarget=null;if(get('commentReplyBar'))get('commentReplyBar').hidden=true;
      if(typeof window.loadFeed==='function')await window.loadFeed();
      toast('تم نشر التعليق ✓');
    }catch(err){console.error(err);toast('تعذر إضافة التعليق')}
    finally{if(send){send.disabled=false;send.textContent=send.dataset.oldText||'إرسال'}}
  };
  const observer=new MutationObserver(()=>{clearTimeout(window.__commentEnhanceTimer);window.__commentEnhanceTimer=setTimeout(addTools,80)});
  function init(){ensureReplyBar();const feed=get('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});setTimeout(addTools,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
