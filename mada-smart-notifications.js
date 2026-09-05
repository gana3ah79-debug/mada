/* Mada Smart Notifications v2 — explicit successful-event notifications with deduplication */
(function(){
'use strict';
const getSB=()=>window.sb||window.MADA_SUPABASE_CLIENT,getUser=()=>window.user||null;
const recent=new Map();
async function notify({user_id,type,title,body,data={}}){const s=getSB();if(!s||!user_id)return null;const key=[user_id,type,data.post_id||'',data.comment_id||'',data.actor_id||''].join('|');const now=Date.now();if(recent.has(key)&&now-recent.get(key)<5000)return null;recent.set(key,now);try{return await s.from('notifications').insert({user_id,type,title,body,data}).select().maybeSingle()}catch(e){return {error:e}}}
async function profileName(id){const s=getSB();if(!s||!id)return'مستخدم Mada';try{const r=await s.from('profiles').select('display_name').eq('id',id).maybeSingle();return r.data?.display_name||'مستخدم Mada'}catch(e){return'مستخدم Mada'}}
async function postOwner(postId){const s=getSB();if(!s||!postId)return null;try{const r=await s.from('posts').select('author_id,body').eq('id',postId).maybeSingle();return r.data||null}catch(e){return null}}
async function postEvent(type,postId,extra={}){const me=getUser();if(!me||!postId)return null;const p=await postOwner(postId);if(!p?.author_id||p.author_id===me.id)return null;const name=await profileName(me.id);const map={like:['إعجاب جديد',`${name} أعجب بمنشورك`],reaction:['تفاعل جديد',`${name} تفاعل مع منشورك`],comment:['تعليق جديد',`${name} علّق على منشورك`],share:['مشاركة جديدة',`${name} شارك منشورك`],repost:['إعادة نشر',`${name} أعاد نشر منشورك`]};const x=map[type]||map.like;return notify({user_id:p.author_id,type:type==='repost'?'share':type,title:x[0],body:x[1],data:{post_id:postId,actor_id:me.id,...extra}})}
async function commentEvent(postId,commentId){return postEvent('comment',postId,{comment_id:commentId})}
async function shareEvent(postId){return postEvent('share',postId)}
async function friendEvent(targetId,accepted){const me=getUser();if(!me||!targetId||targetId===me.id)return null;const name=await profileName(me.id);return notify({user_id:targetId,type:accepted?'friend_accept':'friend_request',title:accepted?'تم قبول طلب الصداقة':'طلب صداقة جديد',body:accepted?`${name} قبل طلب صداقتك`:`${name} أرسل لك طلب صداقة`,data:{actor_id:me.id}})}
window.MadaSmartNotifications={notify,postEvent,commentEvent,shareEvent,friendEvent};
})();