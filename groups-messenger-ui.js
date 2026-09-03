/* Mada Group Messenger UI */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let lastCid=null;
 async function enhance(){
   const meta=window.__madaGroupConversation;if(!meta?.conversationId)return;
   const chat=document.getElementById('mmChat');if(!chat||chat.hidden)return;
   const cid=meta.conversationId;if(cid===lastCid)return;
   const s=S();if(!s)return;
   const g=await s.from('groups').select('id,name,avatar_url,description,privacy').eq('id',meta.groupId).maybeSingle();
   if(g.error||!g.data)return;
   lastCid=cid;const group=g.data;
   const head=document.getElementById('mmChatUser');if(head){head.innerHTML='<span class="mm-avatar mm-group-avatar">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'" alt="">':'👥')+'</span><span><b>'+esc(group.name)+'</b><small>👥 مجموعة · '+(group.privacy==='private'?'خاصة':'عامة')+'</small></span>';head.style.cursor='pointer';head.onclick=()=>members(group)}
   let style=document.getElementById('group-mm-style');if(!style){style=document.createElement('style');style.id='group-mm-style';style.textContent='.mm-group-avatar{display:grid;place-items:center;overflow:hidden}.mm-group-avatar img{width:100%;height:100%;object-fit:cover}.gmmi{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000001;display:grid;place-items:center;padding:16px}.gmmi-card{width:min(430px,100%);max-height:82vh;overflow:auto;background:var(--card-bg,#fff);color:var(--text,#111);border-radius:24px;padding:18px;box-sizing:border-box}.gmmi-head{display:flex;align-items:center;gap:12px}.gmmi-cover{width:58px;height:58px;border-radius:18px;overflow:hidden;background:#ddd;display:grid;place-items:center;font-size:28px}.gmmi-cover img{width:100%;height:100%;object-fit:cover}.gmmi-close{margin-inline-start:auto;border:0;background:rgba(127,127,127,.15);border-radius:50%;width:38px;height:38px;font-size:22px}.gmmi-list{display:grid;gap:7px;margin-top:14px}.gmmi-row{display:flex;align-items:center;gap:10px;padding:9px;border-radius:14px;background:rgba(127,127,127,.08)}.gmmi-row img,.gmmi-letter{width:38px;height:38px;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:#ddd}.gmmi-row small{display:block;opacity:.6;margin-top:2px}';document.head.appendChild(style)}
 }
 async function members(group){const s=S();if(!s)return;const r=await s.from('group_members').select('user_id,role').eq('group_id',group.id);const ids=(r.data||[]).map(x=>x.user_id);const p=ids.length?await s.from('profiles').select('id,display_name,username,avatar_url').in('id',ids):{data:[]};const pm=new Map((p.data||[]).map(x=>[x.id,x]));const o=document.createElement('div');o.className='gmmi';o.innerHTML='<div class="gmmi-card"><div class="gmmi-head"><div class="gmmi-cover">'+(group.avatar_url?'<img src="'+esc(group.avatar_url)+'">':'👥')+'</div><div><h2 style="margin:0">'+esc(group.name)+'</h2><small>'+ids.length+' عضو</small></div><button class="gmmi-close">×</button></div><p>'+esc(group.description||'لا يوجد وصف للمجموعة.')+'</p><div class="gmmi-list">'+(r.data||[]).map(x=>{const q=pm.get(x.user_id)||{};return '<div class="gmmi-row">'+(q.avatar_url?'<img src="'+esc(q.avatar_url)+'">':'<span class="gmmi-letter">👤</span>')+'<div><b>'+esc(q.display_name||'مستخدم Mada')+'</b><small>'+esc(x.role==='admin'?'مشرف':'عضو')+'</small></div></div>'}).join('')+'</div></div>';document.body.appendChild(o);o.querySelector('.gmmi-close').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()}}
 setInterval(enhance,400);enhance();
 window.madaGroupMessengerReset=()=>{lastCid=null};
})();