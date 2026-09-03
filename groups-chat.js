/* Mada group chat - open actual group conversation */
(function(){
  const S=()=>{try{return sb}catch(e){return window.sb||null}};
  const U=()=>{try{return user}catch(e){return window.user||null}};
  let wrapped=false;
  function wrap(){
    if(wrapped||typeof window.madaOpenEnhancedGroup!=='function')return;
    const orig=window.madaOpenEnhancedGroup;
    window.madaOpenEnhancedGroup=async function(id){window.__madaActiveGroupId=id;return orig.apply(this,arguments)};
    wrapped=true;
  }
  function add(){
    wrap();
    const shell=document.querySelector('.groups-shell');
    if(!shell||shell.querySelector('#geChat'))return;
    const host=shell.querySelector('.group-buttons'); if(!host)return;
    const btn=document.createElement('button');btn.id='geChat';btn.className='gm-primary';btn.textContent='💬 دردشة المجموعة';host.appendChild(btn);
    btn.onclick=async()=>{
      const s=S(),u=U(),gid=window.__madaActiveGroupId;
      if(!s||!u||!gid){window.madaToast?.('افتح المجموعة مرة أخرى');return}
      const m=await s.from('group_members').select('user_id').eq('group_id',gid).eq('user_id',u.id).maybeSingle();
      if(m.error||!m.data){window.madaToast?.('يجب أن تكون عضوًا في المجموعة');return}
      const c=await s.rpc('get_or_create_group_conversation',{p_group_id:gid});
      if(c.error){console.error(c.error);window.madaToast?.('تعذر إنشاء دردشة المجموعة');return}
      const cid=typeof c.data==='string'?c.data:(c.data?.id||c.data?.conversation_id);
      window.__madaGroupConversation={groupId:gid,conversationId:cid};
      document.querySelector('#geClose')?.click();
      if(typeof window.madaMessenger==='function')window.madaMessenger();
      setTimeout(()=>{
        const row=document.querySelector('.mm-row[data-cid="'+CSS.escape(cid||'')+'"]');
        if(row)row.click();
        else window.madaToast?.('تم إنشاء دردشة المجموعة؛ افتحها من الرسائل 💬');
      },500);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
  new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
  setInterval(wrap,500);
})();