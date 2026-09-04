/* Mada comment reactions fix v1
   - Reaction tray is hidden until the 👍 button is tapped.
   - Reaction changes are optimistic/local and do NOT reload the comments list or page.
*/
(function(){
  'use strict';
  const REACTIONS={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
  const TYPES=Object.keys(REACTIONS);
  let busy=false;

  function client(){return window.MADA_COMMENTS_SB||window.sb||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null)}
  function user(){return window.user||null}
  function closePickers(except){document.querySelectorAll('.mada-reaction-picker').forEach(p=>{if(p!==except)p.hidden=true})}
  function rowFrom(el){return el?.closest?.('.mada-comment-row')||null}
  function setButton(row,type){const b=row?.querySelector('.mada-comment-like');if(!b)return;b.textContent=REACTIONS[type]||'👍';b.classList.toggle('liked',!!type);b.dataset.reaction=type||'';b.setAttribute('aria-label',type?'إزالة التفاعل':'إظهار التفاعلات')}
  function setCount(row,count){const wrap=row?.querySelector('.mada-comment-like-wrap');if(!wrap)return;let n=wrap.querySelector('.mada-comment-like-count');if(count>0){if(!n){n=document.createElement('span');n.className='mada-comment-like-count';wrap.insertBefore(n,wrap.querySelector('.mada-reaction-picker'))}n.textContent=String(count)}else if(n)n.remove()}

  async function apply(row,type){
    if(busy)return;
    const d=client(),u=user(),id=row?.dataset.commentId;
    if(!d||!u||!id)return;
    busy=true;
    const b=row.querySelector('.mada-comment-like');
    const picker=row.querySelector('.mada-reaction-picker');
    closePickers();
    try{
      const {data:mine,error:readError}=await d.from('comment_reactions').select('reaction_type').eq('comment_id',id).eq('user_id',u.id).maybeSingle();
      if(readError)throw readError;
      if(mine?.reaction_type===type){
        const {error}=await d.from('comment_reactions').delete().eq('comment_id',id).eq('user_id',u.id);
        if(error)throw error;
        setButton(row,'');
      }else{
        const {error}=await d.from('comment_reactions').upsert({comment_id:id,user_id:u.id,reaction_type:type},{onConflict:'comment_id,user_id'});
        if(error)throw error;
        setButton(row,type);
      }
      // Update only the reaction count in this comment; never reload the comments list.
      const {count,error:countError}=await d.from('comment_reactions').select('comment_id',{count:'exact',head:true}).eq('comment_id',id).eq('reaction_type','like');
      if(!countError)setCount(row,count||0);
      if(b){b.disabled=false;b.style.opacity='';}
    }catch(e){
      console.error('Mada reaction error',e);
      if(b){b.disabled=false;b.style.opacity='';}
    }finally{busy=false}
    if(picker)picker.hidden=true;
  }

  // Capture phase runs before the old inline onclick handlers in comments-modern.js,
  // so the old handler cannot call loadComments() after a reaction.
  document.addEventListener('click',function(e){
    const choice=e.target.closest?.('.mada-reaction-choice');
    if(choice){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const row=rowFrom(choice),type=choice.dataset.reaction;
      if(row&&TYPES.includes(type))apply(row,type);
      return;
    }
    const like=e.target.closest?.('.mada-comment-like');
    if(like){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const row=rowFrom(like),picker=row?.querySelector('.mada-reaction-picker');
      if(!row||!picker)return;
      closePickers(picker);
      const current=like.dataset.reaction||'';
      if(current){
        apply(row,current);
      }else{
        picker.hidden=!picker.hidden;
      }
    }
  },true);

  // Hard safety net for the visual state, including after the comments renderer creates rows.
  const style=document.createElement('style');
  style.id='mada-reaction-fix-css';
  style.textContent='.mada-reaction-picker[hidden]{display:none!important}.mada-reaction-picker:not([hidden]){display:flex!important}';
  (document.head||document.documentElement).appendChild(style);
})();
