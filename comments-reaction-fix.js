/* Mada comment reactions fix v2
   - Reaction tray is ALWAYS hidden by default and opens only after tapping 👍.
   - Reaction changes update the current row only; no comments-list reload.
   - Blocks the old comments realtime listener from re-rendering on reaction changes.
*/
(function(){
  'use strict';
  const REACTIONS={like:'👍',love:'❤️',haha:'😂',wow:'😮',sad:'😢',angry:'😡'};
  const TYPES=Object.keys(REACTIONS);
  let busy=false;
  let patchedClients=new WeakSet();

  function client(){
    return window.MADA_COMMENTS_SB||window.sb||(window.supabase?.createClient&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null)
  }
  function user(){return window.user||null}

  function closePickers(except){
    document.querySelectorAll('.mada-reaction-picker').forEach(p=>{if(p!==except)p.hidden=true})
  }
  function rowFrom(el){return el?.closest?.('.mada-comment-row')||null}
  function setButton(row,type){
    const b=row?.querySelector('.mada-comment-like');
    if(!b)return;
    b.textContent=REACTIONS[type]||'👍';
    b.classList.toggle('liked',!!type);
    b.dataset.reaction=type||'';
    b.setAttribute('aria-label',type?'إزالة التفاعل':'إظهار التفاعلات');
  }
  function setCount(row,count){
    const wrap=row?.querySelector('.mada-comment-like-wrap');
    if(!wrap)return;
    let n=wrap.querySelector('.mada-comment-like-count');
    if(count>0){
      if(!n){n=document.createElement('span');n.className='mada-comment-like-count';wrap.insertBefore(n,wrap.querySelector('.mada-reaction-picker'))}
      n.textContent=String(count)
    }else if(n)n.remove()
  }

  /*
   * comments-modern creates a realtime channel that listens to both comments
   * and comment_reactions. Its reaction callback calls loadComments(), which
   * redraws the whole sheet after every reaction. We intercept channel().on()
   * before that script creates its channel and simply skip that one listener.
   */
  function patchClient(d){
    if(!d||patchedClients.has(d)||typeof d.channel!=='function')return;
    try{
      const original=d.channel;
      d.channel=function(name,...args){
        const ch=original.call(this,name,...args);
        if(name==='mada-comments-live-v10'&&ch&&typeof ch.on==='function'&&!ch.__madaReactionPatched){
          const originalOn=ch.on;
          ch.on=function(event,config,callback){
            if(event==='postgres_changes'&&config?.schema==='public'&&config?.table==='comment_reactions'){
              return this;
            }
            return originalOn.call(this,event,config,callback);
          };
          ch.__madaReactionPatched=true;
        }
        return ch;
      };
      patchedClients.add(d);
    }catch(e){console.warn('Mada reaction realtime patch failed',e)}
  }

  /* The Supabase client may be assigned a little after this file loads. */
  function patchKnownClients(){
    patchClient(window.sb);
    patchClient(window.MADA_COMMENTS_SB);
  }
  patchKnownClients();
  let patchTicks=0;
  const patchTimer=setInterval(()=>{
    patchKnownClients();
    if(++patchTicks>120)clearInterval(patchTimer);
  },100);

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
      const {count,error:countError}=await d.from('comment_reactions').select('comment_id',{count:'exact',head:true}).eq('comment_id',id).eq('reaction_type','like');
      if(!countError)setCount(row,count||0);
    }catch(e){
      console.error('Mada reaction error',e);
    }finally{
      if(b){b.disabled=false;b.style.opacity=''}
      busy=false;
      if(picker)picker.hidden=true;
    }
  }

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
      const current=like.dataset.reaction||'';
      if(current){
        apply(row,current);
      }else{
        closePickers(picker);
        picker.hidden=false;
      }
    }
  },true);

  /* Any newly rendered picker starts hidden, even if another renderer forgets the attribute. */
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes||[]){
        if(node.nodeType!==1)continue;
        if(node.matches?.('.mada-reaction-picker'))node.hidden=true;
        node.querySelectorAll?.('.mada-reaction-picker').forEach(p=>p.hidden=true);
      }
    }
  });
  function observe(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    else requestAnimationFrame(observe);
  }
  observe();

  const style=document.createElement('style');
  style.id='mada-reaction-fix-css';
  style.textContent=`
    .mada-reaction-picker[hidden]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    .mada-reaction-picker:not([hidden]){display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
  `;
  (document.head||document.documentElement).appendChild(style);
})();
