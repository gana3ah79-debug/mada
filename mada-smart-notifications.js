/* Mada Smart Notifications v1
 * Creates notifications for social events and keeps the notification UI in sync.
 */
(function(){
'use strict';
const getSB=()=>window.sb||null,getUser=()=>window.user||null;
async function notify({user_id,type,title,body,data={}}){
 const s=getSB(); if(!s||!user_id)return null;
 try{return await s.from('notifications').insert({user_id,type,title,body,data}).select().maybeSingle()}catch(e){return {error:e}}
}
async function profileName(id){const s=getSB();if(!s||!id)return 'مستخدم Mada';try{const r=await s.from('profiles').select('display_name').eq('id',id).maybeSingle();return r.data?.display_name||'مستخدم Mada'}catch(e){return 'مستخدم Mada'}}
async function postOwner(postId){const s=getSB();if(!s||!postId)return null;try{const r=await s.from('posts').select('author_id,body').eq('id',postId).maybeSingle();return r.data||null}catch(e){return null}}
async function postEvent(type,postId,extra={}){
 const me=getUser(); if(!me||!postId)return;
 const p=await postOwner(postId); if(!p?.author_id||p.author_id===me.id)return;
 const name=await profileName(me.id);
 const map={like:['إعجاب جديد',`${name} أعجب بمنشورك`],reaction:['تفاعل جديد',`${name} تفاعل مع منشورك`],comment:['تعليق جديد',`${name} علّق على منشورك`],share:['مشاركة جديدة',`${name} شارك منشورك`],repost:['إعادة نشر',`${name} أعاد نشر منشورك`]};
 const x=map[type]||map.like;
 return notify({user_id:p.author_id,type:titleType(type),title:x[0],body:x[1],data:{post_id:postId,actor_id:me.id,...extra}});
}
function titleType(t){return t==='reaction'?'reaction':t==='repost'?'share':t}
async function friendEvent(targetId,accepted){const me=getUser();if(!me||!targetId||targetId===me.id)return;const name=await profileName(me.id);return notify({user_id:targetId,type:accepted?'friend_accept':'friend_request',title:accepted?'تم قبول طلب الصداقة':'طلب صداقة جديد',body:accepted?`${name} قبل طلب صداقتك`: `${name} أرسل لك طلب صداقة`,data:{actor_id:me.id}})}
function install(){
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-id][data-reaction],.like[data-id]');if(b&&b.dataset.id){const id=b.dataset.id;setTimeout(()=>{if(b.classList.contains('liked'))postEvent('reaction',id,{reaction_type:b.dataset.reaction||'like'});},350)}
  const c=e.target.closest('[data-comment-toggle],[data-comments-open]');if(c){const id=c.getAttribute('data-comment-toggle')||c.getAttribute('data-comments-open');if(id)setTimeout(()=>postEvent('comment',id),500)}
  const sh=e.target.closest('.share[data-id],[data-share-post]');if(sh){const id=sh.dataset.id||sh.dataset.sharePost;if(id)setTimeout(()=>postEvent('share',id),500)}
 },true);
 const oldSend=window.sendFriendRequest; if(typeof oldSend==='function'&&!oldSend.__smart){const fn=async function(...a){const r=await oldSend.apply(this,a);if(r!==false&&a[0])friendEvent(a[0],false);return r};fn.__smart=true;window.sendFriendRequest=fn}
}
window.MadaSmartNotifications={notify,postEvent,friendEvent};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
