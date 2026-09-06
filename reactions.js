/* Mada reactions: stable click + long press picker. */
(function(){
  'use strict';
  const REACTIONS={like:{emoji:'👍',label:'إعجاب'},love:{emoji:'❤️',label:'أحببته'},haha:{emoji:'😂',label:'هاها'},wow:{emoji:'😮',label:'واو'},sad:{emoji:'😢',label:'حزين'},angry:{emoji:'😡',label:'غاضب'}};
  let openId=null;
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function getButton(id){return document.querySelector('#post-'+CSS.escape(String(id))+' .post-actions .like[data-id]')}
  function picker(id){return '<div class="mada-reaction-picker" data-picker="'+esc(id)+'" role="menu"><div class="mada-reaction-title">اختر تفاعلك</div><div class="mada-reaction-list">'+Object.entries(REACTIONS).map(([k,v])=>'<button type="button" class="mada-reaction" data-reaction="'+k+'" aria-label="'+v.label+'">'+v.emoji+'</button>').join('')+'</div></div>'}
  function close(){document.querySelectorAll('.mada-reaction-picker').forEach(x=>x.remove());openId=null}
  function render(btn,type,count){const r=REACTIONS[type]||REACTIONS.like;btn.innerHTML='<span class="action-icon">'+r.emoji+'</span><span>'+esc(r.label)+'</span><b class="action-count">'+Math.max(0,count)+'</b>';btn.dataset.reactionType=type;btn.dataset.liked='true';btn.classList.add('liked')}
  function unrender(btn,count){btn.innerHTML='<span class="action-icon">👍</span><span>إعجاب</span><b class="action-count">'+Math.max(0,count)+'</b>';delete btn.dataset.reactionType;btn.dataset.liked='false';btn.classList.remove('liked')}
  async function currentUser(client){
    if(window.MadaCurrentUser)return window.MadaCurrentUser;
    if(window.user)return window.user;
    try{const r=await client.auth.getUser();return r.data?.user||null}catch(e){return null}
  }
  async function save(id,type){
    const client=sb(),me=client?await currentUser(client):null,btn=getButton(id);
    if(!client||!me||!btn){if(!me) alert('يرجى تسجيل الدخول أولاً');return}
    const before=btn.innerHTML,beforeLiked=btn.dataset.liked==='true',beforeType=btn.dataset.reactionType||'';
    const count=parseInt(btn.querySelector('.action-count')?.textContent||'0',10)||0;
    const q=await client.from('post_likes').select('post_id,user_id,reaction_type').eq('post_id',id).eq('user_id',me.id).maybeSingle();
    if(q.error){alert('تعذر قراءة التفاعل: '+q.error.message);return}
    const old=q.data,remove=!!old&&old.reaction_type===type,nextCount=remove?Math.max(0,count-1):(old?count:count+1);
    if(remove)unrender(btn,nextCount);else render(btn,type,nextCount);
    close();
    let r;
    if(old)r=remove?await client.from('post_likes').delete().eq('post_id',id).eq('user_id',me.id):await client.from('post_likes').update({reaction_type:type}).eq('post_id',id).eq('user_id',me.id);
    else r=await client.from('post_likes').insert({post_id:id,user_id:me.id,reaction_type:type});
    if(r.error){btn.innerHTML=before;btn.dataset.liked=String(beforeLiked);if(beforeType)btn.dataset.reactionType=beforeType;else delete btn.dataset.reactionType;btn.classList.toggle('liked',beforeLiked);alert('تعذر حفظ التفاعل: '+r.error.message);}
  }
  function show(btn){const id=btn.dataset.id;if(!id)return;close();btn.insertAdjacentHTML('afterend',picker(id));const p=btn.parentElement.querySelector('[data-picker="'+CSS.escape(String(id))+'"]');if(!p)return;const r=btn.getBoundingClientRect(),w=p.getBoundingClientRect();p.style.position='fixed';p.style.left=Math.max(8,Math.min(r.left+r.width/2-w.width/2,innerWidth-w.width-8))+'px';p.style.top=Math.max(8,r.top-w.height-10)+'px';openId=id}
  function bind(){document.querySelectorAll('.post-actions .like[data-id]').forEach(btn=>{if(btn.dataset.madaReactionBound==='1')return;btn.dataset.madaReactionBound='1';let timer=null,long=false;btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(long){long=false;return}save(btn.dataset.id,'like')},true);btn.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();show(btn)},true);btn.addEventListener('touchstart',()=>{long=false;timer=setTimeout(()=>{long=true;show(btn)},450)},{passive:true});btn.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});btn.addEventListener('touchcancel',()=>clearTimeout(timer),{passive:true});btn.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true})})}
  document.addEventListener('click',e=>{const b=e.target.closest('.mada-reaction');if(b){e.preventDefault();e.stopPropagation();const p=b.closest('[data-picker]');if(p)save(p.dataset.picker,b.dataset.reaction);return}if(!e.target.closest('.mada-reaction-picker'))close()},true);
  const obs=new MutationObserver(bind);function boot(){const feed=document.getElementById('feed');if(feed)obs.observe(feed,{childList:true,subtree:true});bind()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MadaReactions={bind,save,REACTIONS};
})();