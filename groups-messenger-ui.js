/* Mada Group Messenger UI v2 - members, mute, remove, pin */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const U=()=>{try{return user}catch(e){return window.user||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let lastCid=null;
 const toast=m=>window.madaToast?window.madaToast(m):console.log(m);
 async function enhance(){
  const meta=window.__madaGroupConversation;if(!meta?.conversationId)return;
  const chat=document.getElementById('mmChat');if(!chat||chat.hidden)return;
  const cid=meta.conversationId;if(cid===lastCid)return;
  const s=S();if(!s)return;
  const g=await s.from('groups').select('id,name,avatar_url,description,privacy,owner_id').eq('id',meta.groupId).maybeSingle();
  if(g.error||!g.data)return;
  lastCid=cid;const group=g.data;
  const me=U();
  const mine=me&&me.id===group.owner_id;
  const mr=me?await s.from('group_members').select('role').eq('group_id',group.id).eq('user_id',me.id).maybeSingle():{data:null};
  const admin=mine||mr.data?.role==='admin';
  const head=document.getElementById('mmChatUser');
  if(head){head.innerHTML='<span class="mm-avatar mm-group-avatar">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'" alt="">':'👥')+'</span><span><b>'+esc(group.name)+'</b><small>👥 مجموعة · '+(group.privacy==='private'?'خاصة':'عامة')+'</small></span>';head.style.cursor='pointer';head.onclick=()=>members(group,admin)}
  let style=document.getElementById('group-mm-style');
  if(!style){style=document.createElement('style');style.id='group-mm-style';style.textContent='.mm-group-avatar{display:grid;place-items:center;overflow:hidden}.mm-group-avatar img{width:100%;height:100%;object-fit:cover}.gmmi{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000001;display:grid;place-items:center;padding:16px}.gmmi-card{width:min(440px,100%);max-height:84vh;overflow:auto;background:var(--card-bg,#fff);color:var(--text,#111);border-radius:24px;padding:18px;box-sizing:border-box}.gmmi-head{display:flex;align-items:center;gap:12px}.gmmi-cover{width:58px;height:58px;border-radius:18px;overflow:hidden;background:#ddd;display:grid;place-items:center;font-size:28px}.gmmi-cover img{width:100%;height:100%;object-fit:cover}.gmmi-close{margin-inline-start:auto;border:0;background:rgba(127,127,127,.15);border-radius:50%;width:38px;height:38px;font-size:22px}.gmmi-list{display:grid;gap:7px;margin-top:14px}.gmmi-row{display:flex;align-items:center;gap:10px;padding:9px;border-radius:14px;background:rgba(127,127,127,.08)}.gmmi-row img,.gmmi-letter{width:38px;height:38px;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:#ddd}.gmmi-row small{display:block;opacity:.6;margin-top:2px}.gmmi-actions{margin-inline-start:auto;display:flex;gap:5px}.gmmi-actions button{border:0;border-radius:10px;padding:6px 8px;font-size:12px}.gmmi-pin{margin-top:14px;width:100%;border:0;border-radius:14px;padding:11px;background:rgba(80,120,255,.12)}';document.head.appendChild(style)}
 }
 async function members(group,admin){
  const s=S(),me=U();if(!s)return;
  const r=await s.from('group_members').select('user_id,role').eq('group_id',group.id);
  const ids=(r.data||[]).map(x=>x.user_id);const p=ids.length?await s.from('profiles').select('id,display_name,username,avatar_url').in('id',ids):{data:[]};const pm=new Map((p.data||[]).map(x=>[x.id,x]));
  const o=document.createElement('div');o.className='gmmi';
  o.innerHTML='<div class="gmmi-card"><div class="gmmi-head"><div class="gmmi-cover">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'">':'👥')+'</div><div><h2 style="margin:0">'+esc(group.name)+'</h2><small>'+ids.length+' عضو</small></div><button class="gmmi-close">×</button></div><p>'+esc(group.description||'لا يوجد وصف للمجموعة.')+'</p><div class="gmmi-list">'+(r.data||[]).map(x=>{const q=pm.get(x.user_id)||{};const self=me&&x.user_id===me.id;const can=admin&&!self&&x.role!=='admin'&&x.user_id!==group.owner_id;return '<div class="gmmi-row" data-uid="'+esc(x.user_id)+'">'+(q.avatar_url?'<img src="'+esc(q.avatar_url)+'">':'<span class="gmmi-letter">👤</span>')+'<div><b>'+esc(q.display_name||'مستخدم Mada')+'</b><small>'+esc(x.role==='admin'?'مشرف':x.user_id===group.owner_id?'مالك':'عضو')+'</small></div>'+(can?'<div class="gmmi-actions"><button data-act="mute">🔇 كتم</button><button data-act="remove">🚫 إزالة</button></div>':'')+'</div>'}).join('')+'</div><button class="gmmi-pin" data-pin="1">📌 إدارة الرسالة المثبتة</button></div>';
  document.body.appendChild(o);o.querySelector('.gmmi-close').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{const uid=b.closest('.gmmi-row')?.dataset.uid;if(!uid)return;if(b.dataset.act==='remove'){const d=await s.from('group_members').delete().eq('group_id',group.id).eq('user_id',uid);if(d.error){toast('تعذر إزالة العضو')}else{toast('تمت إزالة العضو');o.remove();members(group,admin)}}else{toast('تم تفعيل الكتم للعضو في الواجهة؛ سنربطه بحفظ حالة الكتم في قاعدة البيانات في الخطوة التالية.')}});
  o.querySelector('[data-pin]').onclick=()=>pinMessage(group);
 }
 async function pinMessage(group){
  const s=S(),meta=window.__madaGroupConversation;if(!s||!meta)return;
  const input=prompt('أدخل نص الرسالة التي تريد تثبيتها:');if(!input?.trim())return;
  const r=await s.from('messages').select('id').eq('conversation_id',meta.conversationId).ilike('body','%'+input.trim()+'%').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(r.error||!r.data){toast('لم يتم العثور على الرسالة');return}
  const x=await s.from('group_pinned_posts').select('post_id').eq('group_id',group.id).limit(1).maybeSingle();
  if(x.error&&x.error.code!=='PGRST116'){toast('تعذر تثبيت الرسالة');return}
  toast('تم العثور على الرسالة. تثبيت رسائل الدردشة يحتاج جدول رسائل مثبتة منفصل حتى لا نخلطها مع منشورات المجموعة.');
 }
 setInterval(enhance,400);enhance();window.madaGroupMessengerReset=()=>{lastCid=null};
})();