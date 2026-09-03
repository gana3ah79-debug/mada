/* Mada Group Chat Controls */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const U=()=>{try{return user}catch(e){return window.user||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let open=false;
 function meta(){return window.__madaGroupConversation||null}
 async function render(){
  if(open)return; const m=meta(); if(!m?.groupId)return;
  const s=S(),u=U(); if(!s||!u)return;
  const chat=document.getElementById('mmChat'); if(!chat||chat.hidden)return;
  const gm=await s.from('group_members').select('role').eq('group_id',m.groupId).eq('user_id',u.id).maybeSingle();
  if(gm.error||!gm.data||!['admin','owner'].includes(gm.data.role))return;
  let b=document.getElementById('gmcManage'); if(b)return;
  b=document.createElement('button');b.id='gmcManage';b.type='button';b.textContent='⚙️ إدارة المجموعة';b.className='mm-chat-more-btn';
  const host=document.getElementById('mmChatHeader');(host||chat).appendChild(b);b.onclick=()=>panel(m.groupId,u.id);
 }
 async function panel(gid,uid){
  const s=S();if(!s)return;open=true;
  const [g,ms]=await Promise.all([s.from('groups').select('id,name').eq('id',gid).maybeSingle(),s.from('group_members').select('user_id,role').eq('group_id',gid)]);
  const ids=(ms.data||[]).map(x=>x.user_id);const ps=ids.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};const pm=new Map((ps.data||[]).map(x=>[x.id,x]));
  const o=document.createElement('div');o.className='gmc-overlay';o.innerHTML='<div class="gmc-card"><div class="gmc-head"><b>⚙️ إدارة '+esc(g.data?.name||'المجموعة')+'</b><button id="gmcClose">×</button></div><div class="gmc-list">'+(ms.data||[]).map(x=>{const p=pm.get(x.user_id)||{};return '<div class="gmc-row" data-uid="'+x.user_id+'"><span>'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'">':'👤')+'</span><div><b>'+esc(p.display_name||'مستخدم')+'</b><small>'+esc(x.role||'member')+'</small></div><select class="gmc-role" '+(x.user_id===uid?'disabled':'')+'><option value="member" '+(x.role==='member'?'selected':'')+'>عضو</option><option value="admin" '+(x.role==='admin'?'selected':'')+'>مشرف</option></select><button class="gmc-remove" '+(x.user_id===uid?'disabled':'')+'>إزالة</button></div>}).join('')+'</div></div>';
  document.body.appendChild(o);o.querySelector('#gmcClose').onclick=()=>{open=false;o.remove()};o.onclick=e=>{if(e.target===o){open=false;o.remove()}};
  o.querySelectorAll('.gmc-role').forEach(sel=>sel.onchange=async()=>{const id=sel.closest('.gmc-row').dataset.uid;const r=await s.from('group_members').update({role:sel.value}).eq('group_id',gid).eq('user_id',id);if(r.error){sel.value=sel.dataset.old||'member';window.madaToast?.('تعذر تغيير الصلاحية')}else window.madaToast?.('تم تحديث الصلاحية ✓')});
  o.querySelectorAll('.gmc-remove').forEach(btn=>btn.onclick=async()=>{const id=btn.closest('.gmc-row').dataset.uid;if(!confirm('إزالة هذا العضو من المجموعة؟'))return;const r=await s.from('group_members').delete().eq('group_id',gid).eq('user_id',id);if(r.error)window.madaToast?.('تعذر إزالة العضو');else{btn.closest('.gmc-row').remove();window.madaToast?.('تمت إزالة العضو ✓')}})
 }
 setInterval(render,700);
})();