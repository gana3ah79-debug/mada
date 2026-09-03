/* Mada group chat - sender names and unread badge */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const U=()=>{try{return user}catch(e){return window.user||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 const meta=()=>window.__madaGroupConversation;
 const toast=m=>window.madaToast?window.madaToast(m):window.showToast?window.showToast(m):console.log(m);
 async function decorate(){
  const m=meta(),s=S(),u=U(); if(!m?.conversationId||!s||!u)return;
  const out=document.getElementById('mmMessages'); if(!out)return;
  const rows=[...out.querySelectorAll('.mm-bubble[data-message-id]')]; if(!rows.length)return;
  const ids=rows.map(x=>x.dataset.messageId);
  const q=await s.from('messages').select('id,sender_id').in('id',ids); if(q.error)return;
  const senderIds=[...new Set((q.data||[]).map(x=>x.sender_id).filter(x=>x!==u.id))]; if(!senderIds.length)return;
  const p=await s.from('profiles').select('id,display_name,username').in('id',senderIds); const pm=new Map((p.data||[]).map(x=>[x.id,x]));
  const sm=new Map((q.data||[]).map(x=>[x.id,x.sender_id]));
  rows.forEach(row=>{if(row.classList.contains('mine')||row.querySelector('.gm-sender'))return;const sp=pm.get(sm.get(row.dataset.messageId));if(!sp)return;const n=document.createElement('div');n.className='gm-sender';n.textContent=sp.display_name||sp.username||'عضو';row.prepend(n);});
 }
 function style(){if(document.getElementById('gm-names-css'))return;const st=document.createElement('style');st.id='gm-names-css';st.textContent='.gm-sender{font-size:11px;font-weight:800;opacity:.72;margin:0 0 4px 2px}.mm-bubble.theirs .gm-sender{color:inherit}.gm-group-unread{position:absolute;top:7px;left:7px;min-width:20px;height:20px;padding:0 6px;border-radius:20px;background:#e53935;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center}';document.head.appendChild(st)}
 style();setInterval(decorate,900);decorate();
 window.madaGroupChatNotify=function(name,text){toast((name?name+': ':'')+(text||'رسالة جديدة في المجموعة 💬'))};
})();