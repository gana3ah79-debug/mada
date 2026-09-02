(()=>{
  const getSB=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function currentUser(){const s=getSB();if(!s)return null;const r=await s.auth.getUser();return r.data?.user||null}
  async function getShareCount(id){const s=getSB();if(!s)return 0;const r=await s.from('post_shares').select('*',{count:'exact',head:true}).eq('post_id',id);return r.count||0}
  function setShareCount(btn,count){if(!btn)return;const old=btn.querySelector('.share-count')?.textContent;if(old===String(count))return;btn.dataset.shareCount=String(count);btn.innerHTML=`↗️ مشاركة <span class="share-count">${count}</span>`}
  async function enhanceCounts(root){if(!root)return;const buttons=[...root.querySelectorAll('.profile-share[data-id]')];await Promise.all(buttons.map(async b=>setShareCount(b,await getShareCount(b.dataset.id))))}
  function renderSharedPost(post,author,likesCount,commentsCount,sharesCount){
    const article=document.createElement('article');article.className='card post profile-post shared-profile-post';article.dataset.post=post.id;article.dataset.sharedCopy=post.id;
    article.innerHTML=`<div class="post-head profile-post-head"><div class="avatar">${author?.avatar_url?`<img src="${esc(author.avatar_url)}" alt="">`:esc((author?.display_name||'مستخدم').trim().charAt(0)||'م')}</div><div><b>${esc(author?.display_name||'مستخدم Mada')}</b><div class="post-time">${new Date(post.created_at).toLocaleString('ar-EG')}</div></div></div><div class="shared-post-label">↗️ منشور مُشارك في الملف الشخصي</div><div class="post-text">${esc(post.body||'')}</div>${post.media_url?`<img class="post-image" src="${esc(post.media_url)}" alt="صورة المنشور" loading="lazy">`:''}<div class="post-actions"><button class="profile-like" data-id="${post.id}" data-liked="false">👍 إعجاب ${likesCount}</button><button class="profile-comment" data-id="${post.id}">💬 تعليق ${commentsCount}</button><button class="profile-share" data-id="${post.id}">↗️ مشاركة <span class="share-count">${sharesCount}</span></button></div><div class="profile-comments"><div class="comment-box"><input data-pcomment="${post.id}" placeholder="اكتب تعليقًا..."><button data-psend="${post.id}">إرسال</button></div></div>`;
    return article;
  }
  async function loadExistingShares(){
    const s=getSB(),me=await currentUser();
    if(!s||!me||window.__MADA_PROFILE_ID!==me.id)return;
    const list=document.getElementById('profilePosts');if(!list)return;
    const r=await s.from('post_shares').select('post_id,created_at').eq('target_user_id',me.id).order('created_at',{ascending:false}).limit(30);
    const rows=r.data||[];if(!rows.length)return;
    const ids=[...new Set(rows.map(x=>x.post_id).filter(Boolean))];
    const pr=await s.from('posts').select('id,author_id,body,media_url,created_at').in('id',ids);const posts=pr.data||[];if(!posts.length)return;
    const authorIds=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
    const ar=authorIds.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',authorIds):{data:[]};
    const am=new Map((ar.data||[]).map(x=>[x.id,x]));
    const existing=new Set([...list.querySelectorAll('.shared-profile-post[data-shared-copy]')].map(x=>x.dataset.sharedCopy));
    const missing=posts.filter(p=>!existing.has(p.id));
    const likeRows=missing.length?(await s.from('post_likes').select('post_id').in('post_id',missing.map(p=>p.id))).data||[]:[];
    const commentRows=missing.length?(await s.from('comments').select('post_id').in('post_id',missing.map(p=>p.id))).data||[]:[];
    for(const p of missing){
      const likes=likeRows.filter(x=>x.post_id===p.id).length,comments=commentRows.filter(x=>x.post_id===p.id).length,shares=await getShareCount(p.id);
      list.appendChild(renderSharedPost(p,am.get(p.author_id),likes,comments,shares));
    }
    await enhanceCounts(list);
  }
  async function shareToProfile(id){
    const s=getSB(),me=await currentUser();if(!s||!me)return alert('تعذر تنفيذ المشاركة. سجّل الدخول مرة أخرى.');
    const r=await s.from('post_shares').insert({post_id:id,user_id:me.id,target_user_id:me.id});
    if(r.error){if(/duplicate|unique/i.test(r.error.message||''))return alert('هذا المنشور موجود بالفعل في ملفك الشخصي.');return alert('تعذر مشاركة المنشور داخل الملف الشخصي: '+r.error.message)}
    alert('تمت مشاركة المنشور داخل الملف الشخصي ✓');
    if(window.__MADA_PROFILE_ID===me.id)setTimeout(loadExistingShares,100);
  }
  function boot(){
    document.addEventListener('click',e=>{const share=e.target.closest('.profile-share');if(!share)return;e.preventDefault();e.stopImmediatePropagation();shareToProfile(share.dataset.id)},true);
    const modal=document.getElementById('modal');if(!modal)return;
    let timer=0;
    const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{enhanceCounts(modal);loadExistingShares()},120)});
    observer.observe(modal,{childList:true,subtree:true});
    enhanceCounts(modal);setTimeout(loadExistingShares,300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();