// Mada data fix: bypasses the fragile embedded-relation feed query.
(function(){
  const $=id=>document.getElementById(id);
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
  function initials(n){return(n||'م').trim().charAt(0)}
  function client(){return window.MADA_SUPABASE_CLIENT||window.supabase?.createClient?.(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY)}
  async function fixedLoadFeed(user){
    const feed=$('feed'); if(!feed||!user)return;
    feed.innerHTML='<div class="card empty">جاري تحميل المنشورات…</div>';
    const sb=client();
    if(!sb) throw new Error('Supabase client unavailable');
    const r=await sb.from('posts').select('id,author_id,body,media_url,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
    if(r.error) throw r.error;
    const posts=r.data||[];
    if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return;}
    const authorIds=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
    const pr=authorIds.length?await sb.from('profiles').select('id,display_name,avatar_url').in('id',authorIds):{data:[],error:null};
    if(pr.error) throw pr.error;
    const profiles=new Map((pr.data||[]).map(x=>[x.id,x]));
    const ids=posts.map(p=>p.id);
    const lr=await sb.from('post_likes').select('post_id,user_id').in('post_id',ids);
    const cr=await sb.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true});
    const likes=lr.error?[]:(lr.data||[]), comments=cr.error?[]:(cr.data||[]);
    const commentAuthorIds=[...new Set(comments.map(c=>c.author_id).filter(Boolean))];
    const cpr=commentAuthorIds.length?await sb.from('profiles').select('id,display_name').in('id',commentAuthorIds):{data:[],error:null};
    const commentProfiles=new Map((cpr.data||[]).map(x=>[x.id,x]));
    feed.innerHTML='';
    posts.forEach(p=>{
      const prof=profiles.get(p.author_id)||{}, pl=likes.filter(x=>x.post_id===p.id), cs=comments.filter(x=>x.post_id===p.id);
      const liked=pl.some(x=>x.user_id===user.id), el=document.createElement('article'); el.className='card post';
      el.innerHTML=`<div class="post-head"><div class="avatar">${initials(prof.display_name)}</div><div><div class="post-name">${esc(prof.display_name||'مستخدم Mada')}</div><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}">👍 إعجاب ${pl.length}</button><button type="button">💬 تعليق ${cs.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments">${cs.map(c=>`<div class="comment"><b>${esc(commentProfiles.get(c.author_id)?.display_name||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}<div class="comment-box"><input data-comment="${p.id}" placeholder="اكتب تعليقًا..."><button data-send="${p.id}">إرسال</button></div></div>`;
      feed.appendChild(el);
    });
  }
  window.madaStartFixed=async function(){
    const sb=client(); if(!sb) throw new Error('تعذر الاتصال بقاعدة البيانات');
    const {data:{session},error}=await sb.auth.getSession();
    if(error) throw error;
    const auth=$('auth'),app=$('app');
    if(!session){if(auth)auth.hidden=false;if(app)app.hidden=true;return false;}
    window.madaUser=session.user;
    if(auth){auth.hidden=true;auth.style.setProperty('display','none','important');}
    if(app){app.hidden=false;app.style.setProperty('display','block','important');}
    const p=await sb.from('profiles').select('*').eq('id',session.user.id).single();
    if(p.error) throw p.error;
    window.madaProfile=p.data;
    const av=$('userAvatar');if(av)av.textContent=initials(p.data.display_name);
    try{await fixedLoadFeed(session.user)}catch(e){console.error('Mada feed error',e);const feed=$('feed');if(feed)feed.innerHTML=`<div class="card empty">تعذر تحميل المنشورات.<br><small>${esc(e?.message||'خطأ غير معروف')}</small></div>`;}
    return true;
  };
  window.madaReloadFeed=()=>fixedLoadFeed(window.madaUser);
})();
