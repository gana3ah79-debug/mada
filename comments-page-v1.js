/* Mada standalone comments page v1 — paged, bounded, no inline expansion. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search);
  const postId=params.get('post');
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  let client=null,user=null,offset=0,hasMore=false,totalCount=0,loading=false;
  const PAGE_SIZE=30;

  function toast(message){const t=$('toast');if(!t)return;t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{t.hidden=true},2800)}
  function goBack(){if(document.referrer&&new URL(document.referrer,location.href).origin===location.origin&&history.length>1)history.back();else location.href='index.html'}
  function formatDate(value){try{return new Date(value).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'})}catch{return ''}}
  function initials(name){return (name||'م').trim().charAt(0)||'م'}

  async function loadPost(){
    if(!postId){$('postCard').innerHTML='<div class="empty">المنشور غير موجود.</div>';return false}
    const r=await client.from('posts').select('id,author_id,body,media_url,created_at').eq('id',postId).maybeSingle();
    if(r.error||!r.data){$('postCard').innerHTML='<div class="empty">تعذر العثور على المنشور.</div>';return false}
    const p=r.data;
    let author={display_name:'مستخدم Mada',avatar_url:null};
    if(p.author_id){const a=await client.from('profiles').select('display_name,avatar_url').eq('id',p.author_id).maybeSingle();if(a.data)author=a.data}
    $('postCard').innerHTML=`<div class="post-author"><span class="avatar">${esc(initials(author.display_name))}</span><div><strong>${esc(author.display_name||'مستخدم Mada')}</strong><small>${formatDate(p.created_at)}</small></div></div><div class="post-body">${esc(p.body||'')}</div>${p.media_url?`<img class="post-media" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`:''}`;
    return true;
  }

  async function refreshCount(){
    const r=await client.from('comments').select('id',{count:'exact',head:true}).eq('post_id',postId);
    if(!r.error){totalCount=r.count||0;$('commentsCount').textContent=String(totalCount);$('commentsSubtitle').textContent=`${totalCount} تعليق`}
  }

  function commentHtml(c,profile){
    const name=profile?.display_name||'مستخدم';
    return `<article class="comment-row" data-comment-id="${esc(c.id)}"><span class="avatar small">${esc(initials(name))}</span><div class="comment-content"><div class="comment-head"><strong>${esc(name)}</strong><time>${formatDate(c.created_at)}</time></div><div class="comment-body">${esc(c.body)}</div></div></article>`;
  }

  async function loadComments(reset){
    if(loading||!client||!postId)return;loading=true;
    const list=$('commentsList'),more=$('loadMoreBtn');
    if(reset){offset=0;hasMore=false;list.innerHTML='<div class="loading">جاري تحميل التعليقات…</div>';more.hidden=true}
    const r=await client.from('comments').select('id,author_id,body,created_at').eq('post_id',postId).order('created_at',{ascending:false}).range(offset,offset+PAGE_SIZE-1);
    if(r.error){if(reset)list.innerHTML='<div class="empty">تعذر تحميل التعليقات.</div>';toast('تعذر تحميل التعليقات');loading=false;return}
    const rows=r.data||[];hasMore=rows.length===PAGE_SIZE;offset+=rows.length;
    const ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];let profiles=new Map();
    if(ids.length){const p=await client.from('profiles').select('id,display_name,avatar_url').in('id',ids);profiles=new Map((p.data||[]).map(x=>[x.id,x]))}
    if(reset&&rows.length===0)list.innerHTML='<div class="empty">لا توجد تعليقات بعد. كن أول من يعلق 👋</div>';
    else list.insertAdjacentHTML('beforeend',rows.map(c=>commentHtml(c,profiles.get(c.author_id))).join(''));
    more.hidden=!hasMore;await refreshCount();loading=false;
  }

  async function sendComment(e){
    e.preventDefault();const input=$('commentInput'),button=$('sendBtn'),body=input.value.trim();
    if(!body||!user)return;
    input.disabled=true;button.disabled=true;
    const r=await client.from('comments').insert({post_id:postId,author_id:user.id,body}).select('id,author_id,body,created_at').single();
    input.disabled=false;button.disabled=false;
    if(r.error){toast('تعذر إضافة التعليق: '+r.error.message);return}
    input.value='';
    const name=user.user_metadata?.display_name||user.user_metadata?.name||'أنت';
    const list=$('commentsList');list.querySelector('.empty')?.remove();list.insertAdjacentHTML('afterbegin',commentHtml(r.data,{display_name:name}));
    await refreshCount();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }

  async function boot(){
    $('backBtn').addEventListener('click',goBack);$('loadMoreBtn').addEventListener('click',()=>loadComments(false));$('commentForm').addEventListener('submit',sendComment);
    client=sb();
    if(!client){$('postCard').innerHTML='<div class="empty">تعذر تشغيل التعليقات.</div>';return}
    const session=await client.auth.getSession();user=session.data?.session?.user||null;
    if(!user){$('commentInput').disabled=true;$('sendBtn').disabled=true;$('commentInput').placeholder='سجل الدخول لكتابة تعليق'}
    if(await loadPost())await loadComments(true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
