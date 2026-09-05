/* Mada reactions: instant Facebook-style interactions, no feed refresh/flicker. */
(function(){
  const REACTIONS={like:{emoji:'👍',label:'إعجاب'},love:{emoji:'❤️',label:'أحببته'},haha:{emoji:'😂',label:'هاها'},wow:{emoji:'😮',label:'واو'},sad:{emoji:'😢',label:'حزين'},angry:{emoji:'😡',label:'غاضب'},care:{emoji:'🤗',label:'دعم'}};
  let openId=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const picker=id=>`<div class="mada-reaction-picker" data-picker="${id}" role="menu" aria-label="اختيار التفاعل"><div class="mada-reaction-title">اختر تفاعلك</div><div class="mada-reaction-list">${Object.entries(REACTIONS).map(([k,v])=>`<button type="button" class="mada-reaction" data-reaction="${k}" title="${v.label}" aria-label="${v.label}"><span>${v.emoji}</span></button>`).join('')}</div></div>`;
  function closeAll(except){document.querySelectorAll('.mada-reaction-picker').forEach(x=>{if(!except||x.dataset.picker!==except)x.remove()});openId=except||null}
  function button(postId){return document.getElementById('post-'+postId)?.querySelector('.post-actions .like')||null}
  function setButton(btn,type,count){const r=REACTIONS[type]||REACTIONS.like;btn.innerHTML=`<span class="action-icon">${r.emoji}</span><span>${esc(r.label)}</span><b class="action-count">${Math.max(0,count)}</b>`;btn.dataset.reactionType=type;btn.dataset.liked='true';btn.classList.add('liked');}
  function setUnliked(btn,count){btn.innerHTML=`<span class="action-icon">👍</span><span>إعجاب</span><b class="action-count">${Math.max(0,count)}</b>`;delete btn.dataset.reactionType;btn.dataset.liked='false';btn.classList.remove('liked')}
  async function saveReaction(postId,type){
    if(!window.user||!window.sb)return;
    const btn=button(postId);if(!btn)return;
    const oldHtml=btn.innerHTML,oldType=btn.dataset.reactionType||'',oldLiked=btn.dataset.liked==='true';
    const oldCount=parseInt(btn.querySelector('.action-count')?.textContent||'0',10)||0;
    const existing=await sb.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(existing.error){alert('تعذر قراءة التفاعل: '+existing.error.message);return}
    const was=existing.data;
    const removing=!!was&&was.reaction_type===type;
    const optimisticCount=removing?Math.max(0,oldCount-1):(was?oldCount:oldCount+1);
    if(removing)setUnliked(btn,optimisticCount);else setButton(btn,type,optimisticCount);
    closeAll();
    let r;
    if(was){r=removing?await sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id):await sb.from('post_likes').update({reaction_type:type}).eq('post_id',postId).eq('user_id',user.id)}
    else r=await sb.from('post_likes').insert({post_id:postId,user_id:user.id,reaction_type:type});
    if(r.error){btn.innerHTML=oldHtml;btn.dataset.liked=String(oldLiked);if(oldType)btn.dataset.reactionType=oldType;else delete btn.dataset.reactionType;btn.classList.toggle('liked',oldLiked);alert('تعذر حفظ التفاعل: '+r.error.message);return}
    if(window.MadaPostLayout?.refresh) setTimeout(()=>window.MadaPostLayout.refresh(document.getElementById('post-'+postId)),0);
  }
  function show(btn){const id=btn.dataset.id;if(!id)return;closeAll(id);if(!btn.parentElement.querySelector(`[data-picker="${id}"]`))btn.insertAdjacentHTML('afterend',picker(id));openId=id}
  function addPickers(){
    document.querySelectorAll('.post-actions .like[data-id]').forEach(btn=>{
      if(btn.dataset.reactionReady)return;btn.dataset.reactionReady='1';
      let timer=null,longPress=false;
      btn.addEventListener('click',e=>{if(longPress){e.preventDefault();e.stopPropagation();longPress=false;return}e.preventDefault();e.stopPropagation();const liked=btn.dataset.liked==='true';saveReaction(btn.dataset.id,liked?'like':'like')},true);
      btn.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();show(btn)},true);
      btn.addEventListener('touchstart',()=>{longPress=false;timer=setTimeout(()=>{longPress=true;show(btn)},500)},{passive:true});
      btn.addEventListener('touchend',()=>{clearTimeout(timer)},{passive:true});
      btn.addEventListener('touchmove',()=>{clearTimeout(timer)},{passive:true});
    });
  }
  const observer=new MutationObserver(addPickers);
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-reaction]');if(b){e.preventDefault();e.stopPropagation();await saveReaction(b.closest('[data-picker]').dataset.picker,b.dataset.reaction);return}if(!e.target.closest('.mada-reaction-picker')&&!e.target.closest('.post-actions .like'))closeAll()},true);
  function boot(){const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});addPickers()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaReactions={addPickers,saveReaction,REACTIONS};
})();
