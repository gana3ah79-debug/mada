/* Mada Group Messenger UI v3 */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const U=()=>{try{return user}catch(e){return window.user||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 const toast=m=>window.madaToast?window.madaToast(m):window.showToast?window.showToast(m):console.log(m);
 let lastCid=null,lastPinKey='';
 async function enhance(){
  const meta=window.__madaGroupConversation,s=S(),u=U(),chat=document.getElementById('mmChat');
  if(!meta?.conversationId||!meta.groupId||!s||!u||!chat||chat.hidden)return;
  const cid=meta.conversationId;
  if(cid!==lastCid){lastCid=cid;lastPinKey='';}
  const g=await s.from('groups').select('id,name,avatar_url,description,privacy,owner_id').eq('id',meta.groupId).maybeSingle();if(g.error||!g.data)return;
  const group=g.data;
  const head=document.getElementById('mmChatUser');
  if(head&&!head.dataset.groupHeader){head.dataset.groupHeader='1';head.innerHTML='<span class="mm-avatar mm-group-avatar">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'" alt="">':'👥')+'</span><span><b>'+esc(group.name)+'</b><small>👥 مجموعة · '+(group.privacy==='private'?'خاصة':'عامة')+'</small></span>';head.style.cursor='pointer';head.onclick=()=>members(group);}
  await pinned(meta,group);
 }
 async function pinned(meta,group){
  const s=S();if(!s)return;
  const r=await s.from('group_pinned_messages').select('message_id,created_at').eq('group_id',group.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  const out=document.getElementById('mmMessages');if(!out)return;
  let bar=document.getElementById('gmPinnedBar');
  if(!r.data){bar?.remove();return;}
  const msg=await s.from('messages').select('id,body,message_type').eq('id',r.data.message_id).maybeSingle();if(!msg.data){bar?.remove();return;}
  const key=r.data.message_id+':'+(msg.data.body||'');if(key===lastPinKey)return;lastPinKey=key;
  if(!bar){bar=document.createElement('button');bar.id='gmPinnedBar';bar.type='button';bar.className='gm-pinned-bar';out.parentElement.insertBefore(bar,out)}
  bar.innerHTML='📌 <span><b>رسالة مثبتة</b><small>'+esc(msg.data.body||({image:'🖼️ صورة',video:'🎬 فيديو',audio:'🎤 صوت',file:'📎 ملف',gif:'GIF'}[msg.data.message_type]||'رسالة'))+'</small></span><i>›</i>';
  bar.onclick=()=>{const el=out.querySelector('[data-message-id="'+CSS.escape(msg.data.id)+'"]');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],500)}};
 }
 async function members(group){
  const s=S();if(!s)return;const r=await s.from('group_members').select('user_id,role').eq('group_id',group.id);const ids=(r.data||[]).map(x=>x.user_id);const p=ids.length?await s.from('profiles').select('id,display_name,username,avatar_url').in('id',ids):{data:[]};const pm=new Map((p.data||[]).map(x=>[x.id,x]));
  const o=document.createElement('div');o.className='gmmi';o.innerHTML='<div class="gmmi-card"><div class="gmmi-head"><div class="gmmi-cover">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'">':'👥')+'</div><div><h2 style="margin:0">'+esc(group.name)+'</h2><small>'+ids.length+' عضو</small></div><button class="gmmi-close">×</button></div><p>'+esc(group.description||'لا يوجد وصف للمجموعة.')+'</p><div class="gmmi-list">'+(r.data||[]).map(x=>{const q=pm.get(x.user_id)||{};return '<div class="gmmi-row">'+(q.avatar_url?'<img src="'+esc(q.avatar_url)+'">':'<span class="gmmi-letter">👤</span>')+'<div><b>'+esc(q.display_name||q.username||'مستخدم Mada')+'</b><small>'+esc(x.role==='admin'?'مشرف':x.role==='owner'?'مالك':'عضو')+'</small></div></div>'}).join('')+'</div></div>';
  document.body.appendChild(o);o.querySelector('.gmmi-close').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};
 }
 setInterval(enhance,700);enhance();window.madaGroupMessengerReset=()=>{lastCid=null;lastPinKey=''};
})();