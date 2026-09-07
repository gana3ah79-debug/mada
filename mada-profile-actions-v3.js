/* Mada Profile Actions v5 — relation actions only. Rendering/editing belongs to the active profile stack. */
(function(){'use strict';
if(window.__MADA_PROFILE_ACTIONS_V5__)return;
window.__MADA_PROFILE_ACTIONS_V5__=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
async function me(){const c=C();if(!c)return null;try{return (await c.auth.getUser()).data?.user||null}catch(e){return null}}
async function rel(c,a,b){const r=await c.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`).order('created_at',{ascending:false}).limit(1);if(r.error)throw r.error;return r.data?.[0]||null}
async function refresh(id){if(window.ProfileUI?.open){await window.ProfileUI.open(id)}else if(window.ProfileUI?.refresh){await window.ProfileUI.refresh(id)}}
async function friend(id){const c=C(),u=await me();if(!c||!u||!id||id===u.id)return;try{const r=await rel(c,u.id,id);let q;if(!r){q=await c.from('friendships').insert({requester_id:u.id,addressee_id:id,status:'pending'})}else if(r.status==='pending'&&r.requester_id===u.id){q=await c.from('friendships').delete().eq('id',r.id)}else if(r.status==='pending'&&r.addressee_id===u.id){q=await c.from('friendships').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',r.id)}else if(r.status==='declined'){q=await c.from('friendships').update({requester_id:u.id,addressee_id:id,status:'pending',updated_at:new Date().toISOString()}).eq('id',r.id)}else if(r.status==='accepted'){return refresh(id)}else if(r.status==='blocked'){alert('لا يمكن إرسال طلب صداقة لهذا الحساب.');return}else{q=await c.from('friendships').insert({requester_id:u.id,addressee_id:id,status:'pending'})}if(q?.error){alert('تعذر تحديث الصداقة: '+q.error.message);return}await refresh(id)}catch(e){alert('تعذر تحديث الصداقة: '+(e?.message||'حدث خطأ'))}}
async function follow(id){const c=C(),u=await me();if(!c||!u||!id||id===u.id)return;try{const r=await c.from('follows').select('following_id').eq('follower_id',u.id).eq('following_id',id).maybeSingle();const q=r.data?await c.from('follows').delete().eq('follower_id',u.id).eq('following_id',id):await c.from('follows').insert({follower_id:u.id,following_id:id});if(q.error){alert('تعذر تحديث المتابعة: '+q.error.message);return}await refresh(id)}catch(e){alert('تعذر تحديث المتابعة: '+(e?.message||'حدث خطأ'))}}
window.MadaProfileActionsV3={friend,follow};
window.MadaProfileActionsV5=window.MadaProfileActionsV3;
})();
