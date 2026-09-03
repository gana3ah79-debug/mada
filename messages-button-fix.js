/* Mada: activate messages/search buttons and modal close. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function showSearch(){
    const modal=$('modal'),title=$('modalTitle'),body=$('modalBody');
    if(!modal||!title||!body)return;
    title.textContent='⌕ البحث عن مستخدم';
    body.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px"><input id="madaSearchInput" type="search" placeholder="اكتب الاسم أو اسم المستخدم" style="flex:1;padding:13px;border:1px solid #ddd;border-radius:14px"><button id="madaSearchGo" type="button" class="primary">بحث</button></div><div id="madaSearchResults"><div class="card empty">اكتب الاسم أو اسم المستخدم ثم اضغط بحث.</div></div>';
    modal.hidden=false;
    const input=$('madaSearchInput');
    const run=()=>searchUsers(input?.value.trim());
    $('madaSearchGo').onclick=run;
    input?.addEventListener('keydown',e=>{if(e.key==='Enter')run();});
    setTimeout(()=>input?.focus(),50);
  }

  async function searchUsers(q){
    const out=$('madaSearchResults');
    if(!out)return;
    if(!q){out.innerHTML='<div class="card empty">اكتب اسم المستخدم للبحث.</div>';return;}
    if(!window.sb||!window.user){out.innerHTML='<div class="card empty">سجّل الدخول أولاً.</div>';return;}
    out.innerHTML='<div class="card empty">جاري البحث…</div>';
    try{
      const {data,error}=await window.sb.from('profiles').select('id,username,display_name,avatar_url').or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).neq('id',window.user.id).limit(20);
      if(error)throw error;
      if(!data?.length){out.innerHTML='<div class="card empty">لم يتم العثور على مستخدم.</div>';return;}
      out.innerHTML=data.map(p=>`<div class="card" style="display:flex;align-items:center;gap:10px;margin:8px 0;padding:12px"><div class="avatar">${esc((p.display_name||p.username||'م').charAt(0))}</div><div style="flex:1"><b>${esc(p.display_name||'مستخدم Mada')}</b><div style="opacity:.65;font-size:12px">@${esc(p.username||'')}</div></div><button type="button" class="primary mada-message-user" data-user-id="${esc(p.id)}">💬 رسالة</button></div>`).join('');
      out.querySelectorAll('.mada-message-user').forEach(btn=>btn.addEventListener('click',async()=>{
        const otherId=btn.dataset.userId;
        btn.disabled=true;btn.textContent='جاري فتح…';
        try{
          if(typeof window.getOrCreateConversation!=='function'||typeof window.openConversation!=='function')throw new Error('نظام الرسائل غير جاهز');
          const cid=await window.getOrCreateConversation(otherId);
          await window.openConversation(otherId,cid);
        }catch(e){console.error(e);btn.disabled=false;btn.textContent='💬 رسالة';alert('تعذر فتح المحادثة: '+(e?.message||'حدث خطأ'));}
      }));
    }catch(e){console.error(e);out.innerHTML='<div class="card empty">تعذر البحث.<br><small>'+esc(e?.message||'حدث خطأ')+'</small></div>';}
  }

  function bindUI(){
    const msg=$('msgBtn');
    if(msg&&msg.dataset.messagesBound!=='1'){
      msg.dataset.messagesBound='1';msg.type='button';msg.disabled=false;msg.style.pointerEvents='auto';
      msg.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.openMessages==='function')window.openMessages();};
    }
    const search=$('searchBtn');
    if(search&&search.dataset.searchBound!=='1'){
      search.dataset.searchBound='1';search.type='button';search.disabled=false;search.style.pointerEvents='auto';
      search.onclick=e=>{e.preventDefault();e.stopPropagation();showSearch();};
    }
    const close=$('closeModal');
    if(close&&close.dataset.closeBound!=='1'){
      close.dataset.closeBound='1';close.type='button';close.onclick=e=>{e.preventDefault();e.stopPropagation();const m=$('modal');if(m)m.hidden=true;};
    }
    const modal=$('modal');
    if(modal&&modal.dataset.backdropBound!=='1'){
      modal.dataset.backdropBound='1';modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindUI);else bindUI();
  [300,800,1500,3000].forEach(ms=>setTimeout(bindUI,ms));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('modal');if(m)m.hidden=true;}});
  window.madaSearch=showSearch;
})();
