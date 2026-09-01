/* Mada reactions: Facebook-style reaction picker for posts. */
(function(){
  const REACTIONS={
    like:{emoji:'👍',label:'إعجاب'},
    love:{emoji:'❤️',label:'أحببته'},
    haha:{emoji:'😂',label:'هاها'},
    wow:{emoji:'😮',label:'واو'},
    sad:{emoji:'😢',label:'حزين'},
    angry:{emoji:'😡',label:'غاضب'},
    care:{emoji:'🤗',label:'دعم'}
  };
  let openId=null;
  function picker(id){
    return `<div class="mada-reaction-picker" data-picker="${id}" role="menu">${Object.entries(REACTIONS).map(([k,v])=>`<button type="button" class="mada-reaction" data-reaction="${k}" title="${v.label}" aria-label="${v.label}">${v.emoji}</button>`).join('')}</div>`;
  }
  function closeAll(except){document.querySelectorAll('.mada-reaction-picker').forEach(x=>{if(!except||x.dataset.picker!==except)x.remove()});openId=except||null}
  async function saveReaction(postId,type){
    if(!window.user||!window.sb)return;
    const existing=await sb.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',postId).eq('user_id',user.id).maybeSingle();
    if(existing.error){alert('تعذر قراءة الإعجاب: '+existing.error.message);return}
    let r;
    if(existing.data){
      if(existing.data.reaction_type===type){r=await sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id)}
      else r=await sb.from('post_likes').update({reaction_type:type}).eq('post_id',postId).eq('user_id',user.id);
    }else r=await sb.from('post_likes').insert({post_id:postId,user_id:user.id,reaction_type:type});
    if(r.error){alert('تعذر حفظ التفاعل: '+r.error.message);return}
    closeAll();
    if(typeof window.loadFeed==='function') await window.loadFeed();
  }
  function addPickers(){
    document.querySelectorAll('.post-actions .like[data-id]').forEach(btn=>{
      if(btn.dataset.reactionReady)return;
      btn.dataset.reactionReady='1';
      let timer=null;
      const show=()=>{
        const id=btn.dataset.id;closeAll(id);
        if(btn.parentElement.querySelector(`[data-picker="${id}"]`))return;
        btn.insertAdjacentHTML('afterend',picker(id));openId=id;
      };
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        if(openId===btn.dataset.id){closeAll();return}
        show();
      });
      btn.addEventListener('contextmenu',e=>{e.preventDefault();show()});
      btn.addEventListener('touchstart',()=>{timer=setTimeout(show,450)},{passive:true});
      btn.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});
      btn.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true});
    });
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-reaction]');
    if(b){e.preventDefault();e.stopPropagation();await saveReaction(b.closest('[data-picker]').dataset.picker,b.dataset.reaction);return}
    if(!e.target.closest('.mada-reaction-picker')&&!e.target.closest('.post-actions .like'))closeAll();
  },true);
  const oldLoad=window.loadFeed;
  if(typeof oldLoad==='function'){
    window.loadFeed=async function(){const r=await oldLoad.apply(this,arguments);setTimeout(addPickers,0);return r};
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(addPickers,300));
  window.MadaReactions={addPickers,saveReaction,REACTIONS};
})();
