/* Fix: Messenger three-dots menu */
(function(){
  const q=s=>document.querySelector(s);
  let menu=null;
  function close(){ if(menu){menu.remove();menu=null;} }
  function show(){
    close();
    const btn=q('#mmChatMore'); if(!btn) return;
    menu=document.createElement('div');
    menu.className='mm-chat-menu';
    menu.innerHTML='<button type="button" data-action="search">🔎 <span>البحث في المحادثة</span></button><button type="button" data-action="refresh">🔄 <span>تحديث المحادثة</span></button><button type="button" data-action="close">✕ <span>إغلاق المحادثة</span></button>';
    document.body.appendChild(menu);
    const r=btn.getBoundingClientRect();
    menu.style.top=Math.min(window.innerHeight-170,Math.max(8,r.bottom+6))+'px';
    menu.style.left=Math.max(8,Math.min(window.innerWidth-235,r.left-185))+'px';
    menu.onclick=async e=>{
      const item=e.target.closest('[data-action]'); if(!item)return;
      const action=item.dataset.action; close();
      if(action==='close'){window.madaMessengerClose?.();return;}
      if(action==='refresh'){
        if(window.madaMessenger?.loadConversations) window.madaMessenger.loadConversations();
        document.dispatchEvent(new CustomEvent('mada:refresh'));
        return;
      }
      if(action==='search'){
        const input=q('#mmFilter');
        const list=q('#mmList'),chat=q('#mmChat');
        if(chat&&!chat.hidden){
          const messages=q('#mmMessages');
          if(!messages)return;
          const term=window.prompt('اكتب كلمة للبحث داخل الرسائل');
          if(!term)return;
          const rows=[...messages.querySelectorAll('.mm-bubble')];
          let found=0;
          rows.forEach(row=>{const ok=(row.innerText||'').toLowerCase().includes(term.toLowerCase());row.style.outline=ok?'2px solid currentColor':'';if(ok){found++;row.scrollIntoView({behavior:'smooth',block:'center'});}});
          if(window.showToast) window.showToast(found?'تم العثور على '+found+' رسالة':'لم يتم العثور على الرسالة');
        } else if(input){input.focus();}
      }
    };
  }
  function bind(){
    const b=q('#mmChatMore');
    if(!b||b.dataset.menuFix==='1')return;
    b.dataset.menuFix='1';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show();});
  }
  document.addEventListener('click',e=>{if(menu&&!e.target.closest('#mmChatMore')&&!e.target.closest('.mm-chat-menu'))close();});
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  [0,300,800,1500,3000].forEach(t=>setTimeout(bind,t));
})();
