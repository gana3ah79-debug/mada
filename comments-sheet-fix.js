/* Mada Comments Sheet — reliable comment sending v5. */
(function(){
  const db=()=>window.sb||null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const fmt=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'})}catch{return''}};
  let current=null, loading=false;
  async function getUser(){
    const d=db(); if(!d)return null;
    for(let n=0;n<4;n++){
      try{
        const {data,error}=await d.auth.getSession();
        if(!error&&data?.session?.user){window.user=data.session.user;window.sb=d;return data.session.user}
      }catch(e){}
      try{
        const {data,error}=await d.auth.getUser();
        if(!error&&data?.user){window.user=data.user;window.sb=d;return data.user}
      }catch(e){}
      if(window.user?.id)return window.user;
      if(n<3)await new Promise(r=>setTimeout(r,350));
    }
    return window.user?.id?window.user:null;
  }
  function removeLegacyComposer(){document.querySelectorAll('#feed article.post .comment-box').forEach(x=>x.remove())}
  function installLegacyCleanup(){removeLegacyComposer();const feed=document.getElementById('feed');if(feed&&!feed.dataset.madaCommentComposerClean){new MutationObserver(removeLegacyComposer).observe(feed,{childList:true,subtree:true});feed.dataset.madaCommentComposerClean='1'}}
  function close(){document.getElementById('mada-comments-sheet')?.remove();current=null;loading=false;document.body.classList.remove('mada-comments-open')}
  function shell(){
    close();
    const s=document.createElement('div');s.id='mada-comments-sheet';s.className='mada-comments-sheet';
    s.innerHTML='<div class="mada-comments-backdrop"></div><section class="mada-comments-panel" role="dialog" aria-modal="true" aria-label="التعليقات"><header><b>💬 التعليقات</b><button type="button" id="mada-comments-close" aria-label="إغلاق">×</button></header><div id="mada-comments-list" class="mada-comments-list"><div class="mada-comments-loading">جاري تحميل التعليقات…</div></div><form id="mada-comments-form" class="mada-comments-form" novalidate><input id="mada-comments-input" maxlength="1000" autocomplete="off" placeholder="اكتب تعليقًا..." enterkeyhint="send"><button type="button" id="mada-comments-send">إرسال</button></form></section></div>';
    document.body.appendChild(s);document.body.classList.add('mada-comments-open');
    s.querySelector('.mada-comments-backdrop').onclick=close;s.querySelector('#mada-comments-close').onclick=close;s.querySelector('#mada-comments-send').onclick=send;
    s.querySelector('#mada-comments-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send(e)}});
    return s;
  }
  function render(rows){
    const list=document.getElementById('mada-comments-list');if(!list)return;
    if(!rows.length){list.innerHTML='<div class="mada-comments-empty">لا توجد تعليقات بعد. كن أول من يعلق 👋</div>';return}
    list.innerHTML=rows.map(c=>`<div class="mada-comment-row" data-comment-id="${esc(c.id)}"><div class="mada-comment-avatar">${esc((c.profiles?.display_name||'مستخدم').trim().charAt(0)||'م')}</div><div class="mada-comment-body"><div class="mada-comment-meta"><b>${esc(c.profiles?.display_name||'مستخدم Mada')}</b><small>${fmt(c.created_at)}</small></div><div class="mada-comment-text">${esc(c.body)}</div>${c.parent_id?'<small class="mada-comment-reply-label">↳ رد</small>':''}${window.user?.id===c.author_id?'<button type="button" class="mada-comment-delete" data-delete="'+esc(c.id)+'">حذف</button>':''}</div></div>`).join('');
    list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteComment(b.dataset.delete));list.scrollTop=list.scrollHeight;
  }
  async function open(postId){
    const d=db();if(!d||!postId)return;current=postId;shell();
    try{const{data,error}=await d.from('comments').select('id,post_id,author_id,body,parent_id,created_at,profiles!comments_author_id_fkey(display_name,avatar_url)').eq('post_id',postId).order('created_at',{ascending:true});if(error)throw error;render(data||[]);setTimeout(()=>document.getElementById('mada-comments-input')?.focus(),100)}catch(e){console.error('Mada comments load failed',e);const l=document.getElementById('mada-comments-list');if(l)l.innerHTML='<div class="mada-comments-empty">تعذر تحميل التعليقات. حاول مرة أخرى.</div>'}
  }
  async function send(e){
    e?.preventDefault?.();e?.stopPropagation?.();
    if(loading)return;
    const d=db(),i=document.getElementById('mada-comments-input'),b=document.getElementById('mada-comments-send');
    const text=i?.value?.trim();
    if(!d||!current){alert('تعذر إرسال التعليق. حاول فتح التعليقات مرة أخرى.');return}
    if(!text){i?.focus();return}
    if(text.length>1000){alert('التعليق طويل جدًا. الحد الأقصى 1000 حرف.');return}
    loading=true;if(b){b.disabled=true;b.textContent='جارٍ التحقق…'}
    try{
      const u=await getUser();
      if(!u?.id){throw new Error('لم يتم العثور على جلسة تسجيل الدخول. أعد فتح التطبيق مرة واحدة.')}
      if(b)b.textContent='جارٍ الإرسال…';
      let result=await d.from('comments').insert({post_id:current,author_id:u.id,body:text}).select('id,post_id,author_id,body,created_at').single();
      if(result.error)throw result.error;
      const data=result.data;i.value='';
      const list=document.getElementById('mada-comments-list');
      if(list){const empty=list.querySelector('.mada-comments-empty');if(empty)list.innerHTML='';const row=document.createElement('div');row.className='mada-comment-row';row.dataset.commentId=data.id;row.innerHTML=`<div class="mada-comment-avatar">${esc((window.profile?.display_name||u.email||'أنت').trim().charAt(0)||'أ')}</div><div class="mada-comment-body"><div class="mada-comment-meta"><b>${esc(window.profile?.display_name||u.email||'أنت')}</b><small>الآن</small></div><div class="mada-comment-text">${esc(data.body)}</div><button type="button" class="mada-comment-delete" data-delete="${esc(data.id)}">حذف</button></div>`;row.querySelector('[data-delete]').onclick=()=>deleteComment(data.id);list.appendChild(row);list.scrollTop=list.scrollHeight}
      window.madaRefreshPostStats?.(current);
    }catch(err){console.error('Mada comment send failed',err);alert('تعذر إرسال التعليق: '+(err?.message||'حدث خطأ غير معروف'));}
    finally{loading=false;if(b){b.disabled=false;b.textContent='إرسال'}}
  }
  async function deleteComment(id){const d=db(),u=await getUser();if(!d||!u||!id||!confirm('حذف هذا التعليق؟'))return;const{error}=await d.from('comments').delete().eq('id',id).eq('author_id',u.id);if(error){alert('تعذر حذف التعليق: '+(error.message||''));return}document.querySelector(`#mada-comments-sheet [data-comment-id="${CSS.escape(id)}"]`)?.remove();window.madaRefreshPostStats?.(current)}
  document.addEventListener('click',e=>{const b=e.target.closest('.comment-toggle');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open(b.dataset.id)},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mada-comments-sheet'))close()});
  function init(){installLegacyCleanup()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.madaOpenCommentsSheet=open;window.madaCloseCommentsSheet=close;window.madaSendComment=send;
})();