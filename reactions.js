/* Mada reactions: Facebook-style reaction picker for posts. */
(function(){
  const REACTIONS={
    angry:{emoji:'😡',label:'غاضب'},
    sad:{emoji:'😢',label:'حزين'},
    wow:{emoji:'😮',label:'واو'},
    haha:{emoji:'😂',label:'هاها'},
    care:{emoji:'🤗',label:'دعم'},
    love:{emoji:'❤️',label:'أحببته'},
    like:{emoji:'👍',label:'إعجاب'}
  };
  let openId=null;
  const picker=id=>`<div class="mada-reaction-picker" data-picker="${id}" role="menu" aria-label="اختيار التفاعل">${Object.entries(REACTIONS).map(([k,v])=>`<button type="button" class="mada-reaction" data-reaction="${k}" title="${v.label}" aria-label="${v.label}">${v.emoji}</button>`).join('')}</div>`;
  function closeAll(except){document.querySelectorAll('.mada-reaction-picker').forEach(x=>{if(!except||x.dataset.picker!==except)x.remove()});openId=except||null}
  async function saveReaction(postId,type){
    if(!window.user||!window.sb){return;}
    const existing=await sb.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(existing.error){alert('تعذر قراءة التفاعل: '+existing.error.message);return}
    let r;
    if(existing.data){
      r=existing.data.reaction_type===type
        ?await sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id)
        :await sb.from('post_likes').update({reaction_type:type}).eq('post_id',postId).eq('user_id',user.id);
    }else r=await sb.from('post_likes').insert({post_id:postId,user_id:user.id,reaction_type:type});
    if(r.error){alert('تعذر حفظ التفاعل: '+r.error.message);return}
    closeAll();
    if(typeof loadFeed==='function')await loadFeed();
  }
  function addPickers(){
    document.querySelectorAll('.post-actions .like[data-id]').forEach(btn=>{
      if(btn.dataset.reactionReady)return;
      btn.dataset.reactionReady='1';
      let timer=null;
      const show=()=>{
        const id=btn.dataset.id;
        closeAll(id);
        if(!btn.parentElement.querySelector(`[data-picker="${id}"]`))btn.insertAdjacentHTML('afterend',picker(id));
        openId=id;
      };
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        if(openId===btn.dataset.id)closeAll();else show();
      });
      btn.addEventListener('contextmenu',e=>{e.preventDefault();show()});
      btn.addEventListener('touchstart',()=>{timer=setTimeout(show,450)},{passive:true});
      btn.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});
      btn.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true});
    });
  }
  const observer=new MutationObserver(()=>addPickers());
  function boot(){const feed=document.getElementById('feed');if(feed)observer.observe(feed,{childList:true,subtree:true});addPickers()}
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-reaction]');
    if(b){e.preventDefault();e.stopPropagation();await saveReaction(b.closest('[data-picker]').dataset.picker,b.dataset.reaction);return}
    if(!e.target.closest('.mada-reaction-picker')&&!e.target.closest('.post-actions .like'))closeAll();
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaReactions={addPickers,saveReaction,REACTIONS};
})();
