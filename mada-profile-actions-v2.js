/* Mada profile actions v2: safe friend-request state handling without duplicate-request errors. */
(function(){'use strict';
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const $=id=>document.getElementById(id);
let busy=false;
async function user(){try{return (await C()?.auth.getUser())?.data?.user||null}catch(e){return null}}
async function relation(uid,target){
  const c=C(); if(!c||!uid||!target)return null;
  const r=await c.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${uid},addressee_id.eq.${target}),and(requester_id.eq.${target},addressee_id.eq.${uid})`).order('created_at',{ascending:false}).limit(1);
  return r.data?.[0]||null;
}
async function sync(){
  const b=$('mh3Friend'); if(!b)return;
  const u=await user(), id=window.__MADA_PROFILE_ID; if(!u||!id||u.id===id)return;
  const r=await relation(u.id,id); b.dataset.friendState=r?.status||'none';
  if(!r)b.textContent='👥 إضافة صديق';
  else if(r.status==='accepted')b.textContent='✓ أصدقاء';
  else if(r.status==='pending'&&r.requester_id===u.id)b.textContent='⏳ الطلب مُرسل';
  else if(r.status==='pending')b.textContent='✅ قبول طلب الصداقة';
  else if(r.status==='declined')b.textContent='👥 إضافة صديق';
  else if(r.status==='blocked')b.textContent='🚫 محظور';
}
async function action(e){
  const b=e.target.closest?.('#mh3Friend'); if(!b)return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if(busy)return; busy=true;
  try{
    const c=C(),u=await user(),id=window.__MADA_PROFILE_ID;
    if(!c||!u||!id||u.id===id)return;
    const r=await relation(u.id,id);
    let q;
    if(!r){q=await c.from('friendships').insert({requester_id:u.id,addressee_id:id,status:'pending'});}
    else if(r.status==='pending'&&r.requester_id!==u.id){q=await c.from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',r.id);}
    else if(r.status==='pending'&&r.requester_id===u.id){q=await c.from('friendships').delete().eq('id',r.id);}
    else if(r.status==='declined'){q=await c.from('friendships').update({requester_id:u.id,addressee_id:id,status:'pending',updated_at:new Date().toISOString()}).eq('id',r.id);}
    else {await sync();return;}
    if(q?.error){alert('تعذر تحديث الصداقة: '+q.error.message);}
    else if(typeof window.openProfile==='function'){await window.openProfile(id)}
  }catch(err){alert('حدث خطأ أثناء تحديث الصداقة. حاول مرة أخرى.')}finally{busy=false}
}
function install(){
  document.addEventListener('click',action,true);
  const mo=new MutationObserver(()=>{if($('mh3Friend'))sync()});
  mo.observe(document.body,{childList:true,subtree:true});
  sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
