/* Mada: clicking a member name opens that member's profile. */
(function(){
  'use strict';
  if(window.__madaMemberProfileFix)return;
  window.__madaMemberProfileFix=true;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function openMemberProfile(id){
    if(!id||!window.sb)return;
    if(id===window.user?.id){if(typeof window.loadProfile==='function')return window.loadProfile();return;}
    try{
      const {data:p,error}=await window.sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('id',id).maybeSingle();
      if(error)throw error;
      if(!p)return alert('العضو غير موجود');
      const {data:posts}=await window.sb.from('posts').select('id,body,media_url,created_at,visibility').eq('author_id',id).eq('visibility','public').order('created_at',{ascending:false}).limit(12);
      let old=document.getElementById('madaMemberProfileOverlay');if(old)old.remove();
      const o=document.createElement('div');o.id='madaMemberProfileOverlay';
      const avatar=p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:`<span>${esc((p.display_name||'م').charAt(0))}</span>`;
      o.innerHTML=`<div class="mada-member-profile-card"><header><button class="mada-member-close" type="button">×</button><h2>الملف الشخصي</h2></header><div class="mada-member-hero"><div class="mada-member-avatar">${avatar}</div><h3>${esc(p.display_name||'مستخدم Mada')}</h3><div class="mada-member-username">${p.username?'@'+esc(p.username):''}</div>${p.bio?`<p>${esc(p.bio)}</p>`:''}<div class="mada-member-actions"><button class="mada-member-add" type="button" data-user="${esc(id)}">👥 صداقة</button><button class="mada-member-chat" type="button" data-user="${esc(id)}">💬 رسالة</button></div></div><section class="mada-member-posts"><h3>المنشورات</h3>${posts?.length?posts.map(x=>`<article><p>${esc(x.body||'')}</p>${x.media_url?`<img src="${esc(x.media_url)}" alt="صورة المنشور">`:''}<small>${new Date(x.created_at).toLocaleString('ar-EG',{dateStyle:'medium'})}</small></article>`).join(''):'<p class="mada-member-empty">لا توجد منشورات عامة بعد.</p>'}</section></div>`;
      document.body.appendChild(o);
      o.querySelector('.mada-member-close').onclick=()=>o.remove();
      o.addEventListener('click',e=>{if(e.target===o)o.remove()});
      const add=o.querySelector('.mada-member-add');
      add.onclick=async()=>{if(typeof window.addFriend==='function')await window.addFriend(id);};
      o.querySelector('.mada-member-chat').onclick=async()=>{try{const cid=await window.getOrCreateConversation(id);await window.openConversation(id,cid);o.remove()}catch(e){alert('تعذر فتح المحادثة: '+(e?.message||''))}};
    }catch(e){console.error('member profile',e);alert('تعذر تحميل الملف الشخصي: '+(e?.message||'حاول مرة أخرى'))}
  }

  function decoratePostAuthors(root=document){
    const sb=window.sb;
    if(!sb)return;
    root.querySelectorAll('article.post[data-post-id]').forEach(async article=>{
      if(article.dataset.madaAuthorBound==='1')return;
      article.dataset.madaAuthorBound='loading';
      const postId=article.getAttribute('data-post-id');
      const {data:post}=await sb.from('posts').select('author_id').eq('id',postId).maybeSingle();
      if(!post?.author_id){article.dataset.madaAuthorBound='1';return;}
      const {data:p}=await sb.from('profiles').select('id,display_name,username,avatar_url').eq('id',post.author_id).maybeSingle();
      if(!p){article.dataset.madaAuthorBound='1';return;}
      const names=[p.display_name,p.username].filter(Boolean).map(String);
      const matches=[];
      article.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,span,div,a,p,button').forEach(el=>{
        if(el.dataset.madaMemberBound==='1'||el.dataset.madaAuthorIgnore==='1')return;
        const t=(el.textContent||'').trim();
        if(t&&t.length<=100&&names.includes(t))matches.push(el);
      });
      matches.slice(0,2).forEach(el=>{
        el.dataset.memberId=p.id;
        el.dataset.madaMemberBound='1';
        el.classList.add('mada-post-author-link');
        el.setAttribute('role','button');
        el.setAttribute('tabindex','0');
      });
      if(p.avatar_url){
        const img=[...article.querySelectorAll('img')].find(x=>x.src===p.avatar_url||x.currentSrc===p.avatar_url||x.getAttribute('src')===p.avatar_url);
        if(img){img.dataset.memberId=p.id;img.dataset.madaMemberBound='1';img.classList.add('mada-post-author-link');}
      }
      article.dataset.madaAuthorBound='1';
    });
  }

  function bind(){
    if(window.__madaMemberBound)return;
    window.__madaMemberBound=true;
    document.addEventListener('click',e=>{
      const el=e.target.closest?.('[data-member-id]');
      if(!el)return;
      e.preventDefault();e.stopPropagation();openMemberProfile(el.dataset.memberId);
    },true);
    document.addEventListener('keydown',e=>{
      if((e.key==='Enter'||e.key===' ')&&e.target?.dataset?.memberId){e.preventDefault();openMemberProfile(e.target.dataset.memberId);}
    },true);
    const feed=document.getElementById('feed');
    if(feed)new MutationObserver(()=>decoratePostAuthors(feed)).observe(feed,{childList:true,subtree:true});
    decoratePostAuthors(feed||document);
  }

  if(!document.getElementById('mada-member-profile-style')){
    const st=document.createElement('style');st.id='mada-member-profile-style';st.textContent=`#madaMemberProfileOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center}.mada-member-profile-card{width:100%;max-width:680px;max-height:90vh;overflow:auto;background:var(--card,#fff);color:var(--text,#111);border-radius:28px 28px 0 0;box-shadow:0 -12px 45px rgba(0,0,0,.25)}.mada-member-profile-card header{position:sticky;top:0;z-index:2;display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(128,128,128,.18);background:inherit}.mada-member-profile-card header h2{flex:1;text-align:center;margin:0;font-size:19px}.mada-member-close{border:0;border-radius:50%;width:40px;height:40px;font-size:27px;background:rgba(128,128,128,.13);color:inherit}.mada-member-hero{text-align:center;padding:24px 18px 18px}.mada-member-avatar{width:88px;height:88px;margin:auto;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#e9eef7;font-size:34px;font-weight:800}.mada-member-avatar img{width:100%;height:100%;object-fit:cover}.mada-member-hero h3{margin:12px 0 3px;font-size:23px}.mada-member-username{opacity:.6}.mada-member-hero p{margin:12px auto;max-width:520px;line-height:1.6}.mada-member-actions{display:flex;gap:10px;justify-content:center;margin-top:16px}.mada-member-actions button{border:0;border-radius:14px;padding:11px 18px;font-weight:800}.mada-member-add{background:#1677ff;color:#fff}.mada-member-chat{background:rgba(128,128,128,.15);color:inherit}.mada-member-posts{padding:0 16px 28px}.mada-member-posts>h3{border-top:1px solid rgba(128,128,128,.18);padding-top:16px}.mada-member-posts article{padding:14px 0;border-bottom:1px solid rgba(128,128,128,.15)}.mada-member-posts article img{width:100%;max-height:380px;object-fit:cover;border-radius:16px}.mada-member-posts small{display:block;opacity:.55;margin-top:8px}.mada-member-empty{text-align:center;opacity:.6;padding:24px}.mada-post-author-link{cursor:pointer!important;text-decoration:none!important;touch-action:manipulation}.mada-post-author-link:active{opacity:.65}`;document.head.appendChild(st);
  }
  window.madaOpenMemberProfile=openMemberProfile;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
