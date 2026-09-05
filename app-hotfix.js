/* Mada runtime rescue: fast feed + startup recovery + button fallbacks. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function updatePremiumUI(){const b=$('premiumBanner'),p=$('premiumBtn');const active=typeof premium!=='undefined'?!!premium:!!window.madaPremium;window.madaPremium=active;if(b)b.hidden=active;if(p)p.title=active?'Mada Premium مفعل':'اشترك في Mada Premium'}
  window.updatePremiumUI=updatePremiumUI;
  try{Object.defineProperty(window,'user',{configurable:true,get:function(){return typeof user!=='undefined'?user:null}})}catch(e){}
  try{Object.defineProperty(window,'sb',{configurable:true,get:function(){return typeof sb!=='undefined'?sb:null}})}catch(e){}
  window.openProfile=function(id){const me=typeof user!=='undefined'?user:null;if(window.ProfileUI?.open)return window.ProfileUI.open(id||me?.id)};
  let feedCursor=null,feedLoading=false,feedDone=false,feedPromise=null;
  const esc=s=>String(s??'').replace(/[&<>\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#039;'}[c]));
  const initials=n=>(n||'م').trim().charAt(0);
  const rxIcon={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
  function renderFeedPosts(feed,posts,profiles,likes,me,reset){
    if(reset)feed.innerHTML='';
    for(const p of posts){
      if($('post-'+p.id))continue;
      const ls=likes.filter(x=>x.post_id===p.id),mine=ls.find(x=>x.user_id===me.id),a=profiles.get(p.author_id)||{};
      const el=document.createElement('article');el.className='card post';el.id='post-'+p.id;el.dataset.authorId=p.author_id;el.dataset.visibility=p.visibility||'public';
      const media=p.media_url?(/\\.(mp4|webm|mov|m4v)(\\?|$)/i.test(p.media_url)?`<video class="post-image" src="${esc(p.media_url)}" controls playsinline preload="metadata"></video>`:`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور" loading="lazy">`):'';
      el.innerHTML=`<div class="post-head"><button class="avatar" data-profile="${p.author_id}">${initials(a.display_name)}</button><div><button class="post-name profile-link" data-profile="${p.author_id}">${esc(a.display_name||'مستخدم Mada')}</button><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${media}<div class="post-meta"><span class="mada-rx-summary">👍 <b>${ls.length}</b></span><button class="meta-link" data-comments-open="${p.id}">تعليقات</button><span class="share-count" data-share-count="${p.id}">مشاركة</span></div><div class="post-actions"><button class="like ${mine?'liked':''}" data-id="${p.id}" data-reaction="${mine?.reaction_type||''}" data-liked="${!!mine}">${mine?(rxIcon[mine.reaction_type]||'👍'):'👍'} أعجبني</button><button class="comment-toggle" data-comment-toggle="${p.id}">💬 تعليق</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div>`;
      feed.appendChild(el);
    }
  }
  async function scalableLoadFeed(reset=true){
    if(feedPromise)return feedPromise;
    feedPromise=(async()=>{
      const feed=$('feed'),me=window.user,s=window.sb;
      if(!feed||!me||!s)return;
      if(reset){feedCursor=null;feedDone=false;feed.innerHTML='<div class="card empty">جاري تحميل المنشورات…</div>'}
      if(feedDone)return;
      feedLoading=true;
      try{
        let q=s.from('posts').select('id,author_id,body,media_url,visibility,created_at').eq('visibility','public').order('created_at',{ascending:false}).limit(10);
        if(feedCursor)q=q.lt('created_at',feedCursor);
        const r=await Promise.race([q,new Promise(resolve=>setTimeout(()=>resolve({error:{message:'انتهى وقت تحميل المنشورات'}}),7000))]);
        if(r.error){if(reset)feed.innerHTML='<div class="card empty">تعذر تحميل المنشورات.<br><small>'+esc(r.error.message)+'</small><br><button type="button" class="primary" data-retry-feed>إعادة المحاولة</button></div>';return}
        const posts=r.data||[];
        if(!posts.length){feedDone=true;if(reset)feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return}
        feedCursor=posts[posts.length-1].created_at;if(posts.length<10)feedDone=true;
        renderFeedPosts(feed,posts,new Map(),[],me,reset);
        const ids=posts.map(p=>p.id),authors=[...new Set(posts.map(p=>p.author_id).filter(Boolean))];
        Promise.all([s.from('profiles').select('id,display_name,avatar_url').in('id',authors),s.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids)]).then(([pr,lr])=>{
          const pm=new Map((pr.data||[]).map(x=>[x.id,x])),likes=lr.data||[];
          for(const p of posts){const el=$('post-'+p.id);if(!el)continue;const a=pm.get(p.author_id)||{},name=el.querySelector('.post-name'),av=el.querySelector('.avatar');if(name)name.textContent=a.display_name||'مستخدم Mada';if(av)av.textContent=initials(a.display_name);const ls=likes.filter(x=>x.post_id===p.id),mine=ls.find(x=>x.user_id===me.id),like=el.querySelector('.like'),sum=el.querySelector('.mada-rx-summary b');if(sum)sum.textContent=ls.length;if(like){like.classList.toggle('liked',!!mine);like.dataset.liked=String(!!mine);like.dataset.reaction=mine?.reaction_type||'';like.textContent=(mine?(rxIcon[mine.reaction_type]||'👍'):'👍')+' أعجبني'}}
        }).catch(()=>{});
        Promise.all([s.from('comments').select('id,post_id').in('post_id',ids),s.from('post_shares').select('post_id').in('post_id',ids)]).then(([cr,sr])=>{const cc=new Map(),sc=new Map();(cr.data||[]).forEach(x=>cc.set(x.post_id,(cc.get(x.post_id)||0)+1));(sr.data||[]).forEach(x=>sc.set(x.post_id,(sc.get(x.post_id)||0)+1));ids.forEach(id=>{const p=$('post-'+id);if(!p)return;const c=p.querySelector('[data-comments-open]');if(c)c.textContent=`${cc.get(id)||0} تعليق`;const sh=p.querySelector('[data-share-count]');if(sh)sh.textContent=`${sc.get(id)||0} مشاركة`})}).catch(()=>{});
      }catch(e){if(reset)feed.innerHTML='<div class="card empty">حدث خطأ أثناء تحميل المنشورات.<br><button type="button" class="primary" data-retry-feed>إعادة المحاولة</button></div>'}
      finally{feedLoading=false}
    })();
    try{return await feedPromise}finally{feedPromise=null}
  }
  window.loadFeed=scalableLoadFeed;window.madaReloadFeed=scalableLoadFeed;window.madaFeedState=()=>({loading:feedLoading,done:feedDone});
  function bindFallbacks(){
    const on=(id,fn)=>{const e=$(id);if(e&&!e.dataset.madaFallback){e.dataset.madaFallback='1';e.addEventListener('click',fn)}};
    on('themeBtn',()=>{if(typeof applyTheme==='function')applyTheme(!document.body.classList.contains('dark'))});
    on('menuBtn',()=>{if(window.MadaMenu?.open)window.MadaMenu.open();else if(window.MadaMobileNavigation?.nav)window.MadaMobileNavigation.nav('profile')});
    on('searchBtn',()=>{if(window.MadaUnifiedSearch?.open)window.MadaUnifiedSearch.open();else if(typeof showModal==='function')showModal('⌕ بحث','<input id="fallbackSearch" class="wide" placeholder="ابحث عن شخص…"><div id="fallbackSearchResults" class="results"></div>');const q=$('fallbackSearch');if(q)q.oninput=async()=>{const term=q.value.trim();if(term.length<2)return;const r=typeof searchUsers==='function'?await searchUsers(term):[];$('fallbackSearchResults').innerHTML=(r||[]).map(x=>`<div class="user-row"><div class="avatar">${initials(x.display_name)}</div><div class="user-info"><b>${esc(x.display_name)}</b></div><button type="button" class="social-btn" data-fallback-profile="${x.id}">فتح</button></div>`).join('')}});
    on('msgBtn',()=>{if(window.MessengerPro?.open)window.MessengerPro.open();else if(typeof messagesView==='function')messagesView()});
    on('msgBtn2',()=>{if(window.MessengerPro?.open)window.MessengerPro.open();else if(typeof messagesView==='function')messagesView()});
    on('notifyBtn',()=>{if(typeof notifications==='function')notifications();else if(window.NotificationsUI?.open)window.NotificationsUI.open()});
    on('notifyNav',()=>{if(typeof notifications==='function')notifications();else $('notifyBtn')?.click()});
    on('friendsNav',()=>{if(window.openFriends)window.openFriends();else if(window.Social?.center)window.Social.center();else if(typeof friendsView==='function')friendsView()});
    on('friendsBottom',()=>$('friendsNav')?.click());
    on('createNav',()=>{$('postInput')?.focus();$('postInput')?.scrollIntoView({behavior:'smooth',block:'center'})});
    on('createBottom',()=>$('createNav')?.click());
    on('profileNav',()=>window.openProfile?.());
    on('photoBtn',()=>$('imageInput')?.click());
    on('videoBtn',()=>{$('imageInput')?.setAttribute('accept','video/*');$('imageInput')?.click()});
    on('postBtn',()=>typeof addPost==='function'&&addPost());
    $('feed')?.addEventListener('click',e=>{const r=e.target.closest('[data-retry-feed]');if(r)scalableLoadFeed(true);const p=e.target.closest('[data-profile]');if(p)window.openProfile?.(p.dataset.profile);const l=e.target.closest('.like');if(l&&typeof toggleLike==='function')toggleLike(l.dataset.id,l.dataset.liked==='true');const c=e.target.closest('.comment-toggle,[data-comments-open]');if(c&&typeof window.openComments==='function')window.openComments(c.dataset.commentToggle||c.dataset.commentsOpen);const sh=e.target.closest('.share');if(sh&&typeof sharePost==='function')sharePost(sh.dataset.id)});
  }
  function boot(){
    updatePremiumUI();bindFallbacks();
    const app=$('app');
    const rescue=()=>{if(!app||app.hidden)return;setTimeout(()=>{const f=$('feed');if(f&&(/جاري تحميل المنشورات/.test(f.textContent||'')||!f.querySelector('.post')&&!f.querySelector('.empty')))scalableLoadFeed(true)},250)};
    if(app){new MutationObserver(rescue).observe(app,{attributes:true,attributeFilter:['hidden']});if(!app.hidden)rescue()}
    setTimeout(()=>{const f=$('feed');if(f&&/جاري تحميل المنشورات/.test(f.textContent||'')&&window.user)scalableLoadFeed(true)},1500);
  }
  document.addEventListener('DOMContentLoaded',boot,{once:true});
  ['mada-page-refresh.js?v20260905-2','mada-homepage-v3.js?v20260905-4','mada-home-modern-v2.js?v20260905-2','mada-comments-pro.js?v20260905-2'].forEach(src=>{if(document.querySelector(`script[src^="${src.split('?')[0]}"]`))return;const x=document.createElement('script');x.src=src;document.head.appendChild(x)});
  if(!document.querySelector('link[data-mada-comments-modern]')){const l=document.createElement('link');l.rel='stylesheet';l.href='mada-comments-modern.css?v20260905-2';l.dataset.madaCommentsModern='1';document.head.appendChild(l)}
})();
