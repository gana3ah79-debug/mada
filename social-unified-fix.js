/* Mada unified social stability: one safe surface for badges, reactions, notifications and photo selection. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const icons={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
  const names={like:'إعجاب',love:'أحببته',haha:'هاها',wow:'واو',sad:'حزين',angry:'غاضب'};
  const post=id=>document.querySelector(`article.post[data-post-id="${CSS.escape(id)}"]`);

  async function refreshPostStats(postId){
    if(!window.sb||!postId)return;
    try{
      const [lr,cr]=await Promise.all([
        sb.from('post_likes').select('user_id,reaction_type').eq('post_id',postId),
        sb.from('comments').select('id',{count:'exact',head:true}).eq('post_id',postId)
      ]);
      if(lr.error)throw lr.error;
      if(cr.error)throw cr.error;
      const list=lr.data||[], groups={};
      list.forEach(x=>{groups[x.reaction_type]=(groups[x.reaction_type]||0)+1});
      const top=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>icons[k]||'👍').join('')||'👍';
      const p=post(postId); if(!p)return;
      const actions=p.querySelector('.post-actions');
      let stats=p.querySelector('.post-stats');
      if(!stats&&actions){stats=document.createElement('div');stats.className='post-stats';actions.before(stats);}
      if(stats){
        let sum=stats.querySelector('.reaction-summary');
        if(!sum){stats.innerHTML='<span class="reaction-summary"><span class="summary-icons"></span><span class="reaction-total">0</span></span><span class="comment-summary">0 تعليق</span>';sum=stats.querySelector('.reaction-summary');}
        stats.querySelector('.summary-icons').textContent=top;
        stats.querySelector('.reaction-total').textContent=String(list.length);
        const cs=stats.querySelector('.comment-summary');if(cs)cs.textContent=`${cr.count||0} تعليق`;
      }
      const btn=p.querySelector(`.like[data-id="${CSS.escape(postId)}"]`),mine=list.find(x=>x.user_id===window.user?.id)?.reaction_type||null;
      if(btn){btn.dataset.liked=String(!!mine);if(mine)btn.dataset.reaction=mine;else delete btn.dataset.reaction;btn.innerHTML=`<span class="reaction-icon">${icons[mine]||'👍'}</span><span>${names[mine]||'إعجاب'}</span>`;}
    }catch(e){console.warn('Mada unified reaction stats',e)}
  }

  async function refreshBadges(){
    const u=window.user,s=window.sb;if(!u||!s)return;
    try{
      const [nr,fr]=await Promise.all([
        s.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',u.id).is('read_at',null),
        s.from('friendships').select('id',{count:'exact',head:true}).eq('addressee_id',u.id).eq('status','pending')
      ]);
      const notices=nr.error?0:(nr.count||0),friends=fr.error?0:(fr.count||0);
      ['notifyBtn','notifyNav'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.dataset.count=String(notices);el.classList.toggle('has-badge',notices>0);el.title=notices?`لديك ${notices} إشعار غير مقروء`:'الإشعارات';});
      const f=document.getElementById('friendsNav');if(f){f.dataset.count=String(friends);f.classList.toggle('has-badge',friends>0);f.title=friends?`لديك ${friends} طلب صداقة`:'الأصدقاء';}
    }catch(e){console.warn('Mada unified badges',e)}
  }

  function setupPhoto(){
    const button=document.getElementById('photoBtn'),input=document.getElementById('imageInput');
    if(!button||!input||button.dataset.madaPhotoFix)return;
    button.dataset.madaPhotoFix='1';button.type='button';
    button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();input.click()},true);
    input.addEventListener('change',()=>{
      const file=input.files?.[0];
      if(!file)return;
      if(!file.type.startsWith('image/')){alert('اختر صورة صحيحة');input.value='';return;}
      if(file.size>8*1024*1024){alert('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');input.value='';return;}
      const composer=document.querySelector('.composer');if(!composer)return;
      let preview=composer.querySelector('.mada-photo-preview');
      if(!preview){preview=document.createElement('div');preview.className='mada-photo-preview';preview.innerHTML='<img alt="معاينة الصورة"><button type="button" aria-label="إلغاء الصورة">×</button>';composer.appendChild(preview);preview.querySelector('button').onclick=()=>{input.value='';preview.remove()};}
      const img=preview.querySelector('img');if(img){if(preview.dataset.url)URL.revokeObjectURL(preview.dataset.url);preview.dataset.url=URL.createObjectURL(file);img.src=preview.dataset.url;}
    });
  }

  function setupFeed(){
    const feed=document.getElementById('feed');if(!feed||feed.dataset.madaUnifiedFeed)return;feed.dataset.madaUnifiedFeed='1';
    feed.addEventListener('click',e=>{
      const img=e.target.closest('img.post-image');if(img){e.preventDefault();let old=document.querySelector('.mada-media-viewer');if(old)old.remove();const o=document.createElement('div');o.className='mada-media-viewer';o.innerHTML=`<button type="button" aria-label="إغلاق">×</button><img src="${esc(img.src)}" alt="صورة المنشور">`;o.querySelector('button').onclick=()=>o.remove();o.onclick=x=>{if(x.target===o)o.remove()};document.body.appendChild(o);}
    });
  }

  window.madaRefreshPostStats=refreshPostStats;
  window.madaRefreshSocialBadges=refreshBadges;
  function boot(){setupPhoto();setupFeed();setTimeout(refreshBadges,700);setTimeout(refreshBadges,1800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
