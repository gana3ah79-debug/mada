/* Mada social features: reactions, stories, native share fallback */
(function(){
  const reactionMap={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
  const reactionNames={like:'إعجاب',love:'أحببته',haha:'هاها',wow:'واو',sad:'حزين',angry:'غاضب'};
  let longPressTimer=null,longPressed=false,menu=null,storyTimer=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function reactionMenu(btn){
    closeReactionMenu();
    menu=document.createElement('div'); menu.className='reaction-menu'; menu.setAttribute('role','menu');
    Object.entries(reactionMap).forEach(([type,emoji])=>{
      const b=document.createElement('button'); b.type='button'; b.dataset.reaction=type; b.title=reactionNames[type]; b.textContent=emoji;
      b.onclick=async e=>{e.stopPropagation(); await setReaction(btn.dataset.id,type); closeReactionMenu();};
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const r=btn.getBoundingClientRect();
    menu.style.left=Math.max(8,Math.min(window.innerWidth-menu.offsetWidth-8,r.left+r.width/2-menu.offsetWidth/2))+'px';
    menu.style.top=Math.max(8,r.top-58)+'px';
  }
  function closeReactionMenu(){if(menu){menu.remove();menu=null;}}
  document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target))closeReactionMenu();});

  function parseCount(text){const m=String(text||'').match(/(\d[\d,]*)\s*$/);return m?Number(m[1].replace(/,/g,'')):0;}
  function decoratePost(post){
    const actions=post.querySelector('.post-actions'); if(!actions||actions.dataset.socialReady)return;
    actions.dataset.socialReady='1';
    const like=actions.querySelector('.like'), comment=actions.querySelector('.comment-toggle'), share=actions.querySelector('.share');
    if(!like)return;
    const count=parseCount(like.textContent);
    let stats=post.querySelector('.post-stats');
    if(!stats){stats=document.createElement('div');stats.className='post-stats';actions.before(stats);}
    stats.innerHTML=`<span class="reaction-summary"><span class="summary-icons">👍</span><span class="reaction-total">${count}</span></span><span class="comment-summary">${comment?parseCount(comment.textContent):0} تعليق</span>`;
    if(comment)comment.textContent='💬 تعليق';
    if(share)share.textContent='↗️ مشاركة';
    const selected=like.dataset.reaction||((like.dataset.liked==='true')?'like':null);
    like.innerHTML=`<span class="reaction-icon">${selected?reactionMap[selected]:'👍'}</span><span>${selected?reactionNames[selected]:'إعجاب'}</span>`;
    like.title='اضغط للإعجاب، واضغط مطولًا لاختيار تفاعل';
    like.setAttribute('aria-label','التفاعل مع المنشور');
    ['mousedown','touchstart'].forEach(ev=>like.addEventListener(ev,()=>{
      longPressed=false; clearTimeout(longPressTimer);
      longPressTimer=setTimeout(()=>{longPressed=true;reactionMenu(like);},500);
    },{passive:true}));
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>like.addEventListener(ev,()=>clearTimeout(longPressTimer),{passive:true}));
    like.addEventListener('click',async e=>{if(longPressed){e.preventDefault();longPressed=false;return;} const current=like.dataset.reaction|| (like.dataset.liked==='true'?'like':null); await setReaction(like.dataset.id,current==='like'?'none':'like');});
  }

  async function setReaction(postId,type){
    if(!window.user||!window.sb)return;
    const btn=document.querySelector(`.like[data-id="${CSS.escape(postId)}"]`); if(btn)btn.disabled=true;
    try{
      if(type==='none'){
        const {error}=await sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id); if(error)throw error;
        if(btn){btn.dataset.liked='false';delete btn.dataset.reaction;}
      }else{
        const {error}=await sb.from('post_likes').upsert({post_id:postId,user_id:user.id,reaction_type:type},{onConflict:'post_id,user_id'}); if(error)throw error;
        if(btn){btn.dataset.liked='true';btn.dataset.reaction=type;}
      }
      const {data,error}=await sb.from('post_likes').select('user_id,reaction_type').eq('post_id',postId); if(error)throw error;
      const likes=data||[]; const mine=likes.find(x=>x.user_id===user.id)?.reaction_type||null;
      if(btn){btn.dataset.liked=String(!!mine); if(mine)btn.dataset.reaction=mine;else delete btn.dataset.reaction; btn.innerHTML=`<span class="reaction-icon">${mine?reactionMap[mine]:'👍'}</span><span>${mine?reactionNames[mine]:'إعجاب'}</span>`;}
      const post=document.querySelector(`article.post[data-post-id="${CSS.escape(postId)}"]`);
      const stats=post?.querySelector('.post-stats');
      if(stats){const groups={};likes.forEach(x=>{groups[x.reaction_type]=(groups[x.reaction_type]||0)+1;});const top=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>reactionMap[k]).join('');stats.querySelector('.summary-icons').textContent=top||'👍';stats.querySelector('.reaction-total').textContent=likes.length;}
    }catch(e){console.error(e);alert('تعذر تحديث التفاعل: '+(e?.message||'خطأ غير متوقع'));}
    finally{if(btn)btn.disabled=false;}
  }
  window.madaSetReaction=setReaction;

  function pickStory(){
    let input=document.getElementById('storyInput'); if(!input){input=document.createElement('input');input.id='storyInput';input.type='file';input.accept='image/*';input.hidden=true;document.body.appendChild(input);input.onchange=uploadStory;}
    input.click();
  }
  async function uploadStory(){
    const input=document.getElementById('storyInput'),file=input?.files?.[0]; if(!file||!window.sb||!window.user)return;
    if(!file.type.startsWith('image/'))return alert('اختر صورة فقط');
    if(file.size>8*1024*1024)return alert('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
      const path=`stories/${user.id}/${crypto.randomUUID()}.${ext}`;
      const up=await sb.storage.from('mada-media').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
      const url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
      const {error}=await sb.from('stories').insert({user_id:user.id,media_url:url,expires_at:new Date(Date.now()+24*60*60*1000).toISOString()});if(error)throw error;
      input.value='';await loadStories();
    }catch(e){alert('تعذر نشر القصة: '+(e?.message||'خطأ غير متوقع'));}
  }
  async function loadStories(){
    if(!window.sb||!window.user)return;
    const section=document.querySelector('.stories'); if(!section)return;
    const {data,error}=await sb.from('stories').select('id,user_id,media_url,created_at,expires_at,profiles!stories_user_id_fkey(display_name,avatar_url)').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(30);
    if(error){console.warn('stories unavailable',error);return;}
    const byUser=new Map();(data||[]).forEach(s=>{if(!byUser.has(s.user_id))byUser.set(s.user_id,s);});
    const mine=byUser.get(user.id); const items=[mine,...Array.from(byUser.values()).filter(s=>s.user_id!==user.id)].filter(Boolean).slice(0,8);
    section.innerHTML=`<button class="story add-story" type="button"><span class="story-plus">＋</span><span>قصتك</span></button>`+items.map(s=>{const name=s.user_id===user.id?'قصتك':(s.profiles?.display_name||'مستخدم');return `<button class="story live-story" type="button" data-story-id="${esc(s.id)}" data-user-id="${esc(s.user_id)}"><span class="story-thumb" style="background-image:url('${esc(s.media_url)}')"></span><span>${esc(name)}</span></button>`}).join('');
    section.querySelector('.add-story').onclick=pickStory;
    section.querySelectorAll('.live-story').forEach(b=>b.onclick=()=>openStory(b.dataset.storyId,data||[]));
  }
  function openStory(id,all){
    const stories=all.filter(x=>new Date(x.expires_at)>new Date());if(!stories.length)return; const index=stories.findIndex(x=>x.id===id);let i=index>=0?index:0;
    const overlay=document.createElement('div');overlay.className='story-viewer';
    overlay.innerHTML='<button class="story-close" aria-label="إغلاق">×</button><div class="story-progress"></div><div class="story-media"></div><div class="story-caption"></div>';
    document.body.appendChild(overlay);overlay.querySelector('.story-close').onclick=()=>{clearTimeout(storyTimer);overlay.remove();};
    const show=()=>{clearTimeout(storyTimer);const s=stories[i];if(!s){overlay.remove();return;}const media=overlay.querySelector('.story-media');media.style.backgroundImage=`url('${String(s.media_url).replace(/'/g,"%27")}')`;overlay.querySelector('.story-caption').textContent=s.user_id===user.id?'قصتك':(s.profiles?.display_name||'مستخدم');const bar=document.createElement('span');bar.className='story-progress-fill';overlay.querySelector('.story-progress').replaceChildren(bar);requestAnimationFrame(()=>bar.style.width='100%');storyTimer=setTimeout(()=>{i++;show();},5000);};
    overlay.onclick=e=>{if(e.target===overlay||e.target.classList.contains('story-media')){i++;show();}};show();
  }
  window.madaLoadStories=loadStories;

  /* Share: the post button calls handleShare(post); native Share Sheet first, Clipboard fallback second. */
  window.handleShare=async function(post){
    const postId=typeof post==='string'?post:post?.id;
    const postText=typeof post==='string'?'':(post?.body||'');
    const postUrl=post?.url||post?.postUrl||`${location.origin}${location.pathname}#post-${encodeURIComponent(postId||'')}`;
    const shareData={title:'تطبيق Mada',text:postText||'شاهد هذا المنشور على تطبيق Mada!',url:postUrl};
    try{
      if(typeof navigator.share==='function'){
        await navigator.share(shareData);
      }else{
        throw new Error('SHARE_UNSUPPORTED');
      }
    }catch(err){
      if(err?.name==='AbortError')return;
      try{
        if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareData.url);
        else {const ta=document.createElement('textarea');ta.value=shareData.url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
        alert('تم نسخ الرابط إلى الحافظة');
      }catch(copyErr){alert('تعذر نسخ الرابط');console.warn(copyErr);}
    }
  };

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.share');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const postId=b.dataset.id;
    const article=b.closest('article.post');
    const post={id:postId,body:article?.querySelector('.post-text')?.textContent?.trim()||'',url:`${location.origin}${location.pathname}#post-${encodeURIComponent(postId||'')}`};
    window.handleShare(post);
  },true);

  const observer=new MutationObserver(()=>document.querySelectorAll('#feed article.post').forEach(decoratePost));
  observer.observe(document.getElementById('feed')||document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(loadStories,1200);});
})();