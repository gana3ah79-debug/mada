/* Mada modern search experience */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const key='mada_recent_searches';
  let timer=null;
  const recent=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]').slice(0,8)}catch(_){return[]}};
  const saveRecent=p=>{let a=recent().filter(x=>x.id!==p.id);a.unshift({id:p.id,name:p.display_name||p.username||'مستخدم',username:p.username||'',avatar:p.avatar_url||''});try{localStorage.setItem(key,JSON.stringify(a.slice(0,8)))}catch(_){} };
  const avatar=p=>p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="" loading="lazy">`:`<span>${esc((p.display_name||p.username||'م').charAt(0))}</span>`;
  function open(){
    const modal=$('modal'),title=$('modalTitle'),body=$('modalBody'); if(!modal||!title||!body)return;
    title.textContent=''; title.className='modern-search-title';
    body.className='modern-search-body';
    body.innerHTML=`<div class="modern-search-head"><button type="button" class="modern-search-back" aria-label="رجوع">←</button><div class="modern-search-box"><span>⌕</span><input id="modernSearchInput" type="search" autocomplete="off" placeholder="ابحث في Mada" aria-label="البحث في Mada"><button type="button" id="modernSearchClear" aria-label="مسح">×</button></div></div><div id="modernSearchContent"></div>`;
    modal.classList.add('modern-search-modal'); modal.hidden=false;
    const input=$('modernSearchInput');
    $('modernSearchClear').onclick=()=>{input.value='';input.focus();renderHome()};
    $('.modern-search-back').onclick=()=>{modal.hidden=true;modal.classList.remove('modern-search-modal')};
    input.addEventListener('input',()=>{clearTimeout(timer);const q=input.value.trim();if(!q){renderHome();return}renderLoading();timer=setTimeout(()=>search(q),260)});
    renderHome(); setTimeout(()=>input.focus(),80);
  }
  function content(){return $('modernSearchContent')}
  function renderLoading(){const c=content();if(c)c.innerHTML='<div class="search-status"><span class="search-spinner"></span><div>جاري البحث…</div></div>'}
  function renderHome(){
    const c=content(); if(!c)return;
    const a=recent();
    c.innerHTML=`<div class="search-section-head"><b>عمليات البحث الأخيرة</b>${a.length?'<button id="clearRecent" type="button">مسح الكل</button>':''}</div>`+(a.length?a.map(p=>`<button type="button" class="search-user-row recent-row" data-id="${esc(p.id)}" data-name="${esc(p.name)}" data-username="${esc(p.username)}" data-avatar="${esc(p.avatar)}"><span class="search-avatar">${p.avatar?`<img src="${esc(p.avatar)}" alt="" loading="lazy">`:`${esc((p.name||'م').charAt(0))}`}</span><span class="search-user-info"><b>${esc(p.name)}</b><small>@${esc(p.username)}</small></span><span class="search-row-action">›</span></button>`).join(''):'<div class="search-empty"><div>⌕</div><b>ابدأ البحث</b><span>ابحث عن الأشخاص بالاسم أو اسم المستخدم</span></div>');
    $('clearRecent')?.addEventListener('click',()=>{localStorage.removeItem(key);renderHome()});
    c.querySelectorAll('.recent-row').forEach(r=>r.onclick=()=>openUser({id:r.dataset.id,display_name:r.dataset.name,username:r.dataset.username,avatar_url:r.dataset.avatar}));
  }
  async function search(q){
    const c=content(); if(!c||!window.sb||!window.user)return;
    try{
      const safe=q.replace(/[,%]/g,' ');
      const {data,error}=await window.sb.from('profiles').select('id,username,display_name,avatar_url').or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%`).neq('id',window.user.id).limit(20);
      if(error)throw error;
      if(!data?.length){c.innerHTML=`<div class="search-empty"><div>⌕</div><b>لا توجد نتائج</b><span>جرّب اسمًا أو اسم مستخدم مختلفًا</span></div>`;return}
      c.innerHTML=`<div class="search-section-head"><b>نتائج البحث</b><span>${data.length}</span></div>`+data.map(p=>`<button type="button" class="search-user-row result-row" data-id="${esc(p.id)}"><span class="search-avatar">${avatar(p)}</span><span class="search-user-info"><b>${esc(p.display_name||'مستخدم Mada')}</b><small>@${esc(p.username||'')}</small></span><span class="search-message-icon">💬</span></button>`).join('');
      c.querySelectorAll('.result-row').forEach((r,i)=>{const p=data[i];r.onclick=()=>openUser(p)});
    }catch(e){console.error(e);c.innerHTML='<div class="search-empty"><div>!</div><b>تعذر إتمام البحث</b><span>تحقق من الاتصال وحاول مرة أخرى</span></div>'}
  }
  async function openUser(p){
    saveRecent(p);
    try{
      if(typeof window.getOrCreateConversation!=='function'||typeof window.openConversation!=='function')throw new Error('نظام الرسائل غير جاهز');
      const cid=await window.getOrCreateConversation(p.id); await window.openConversation(p.id,cid);
    }catch(e){console.error(e);if(typeof window.showToast==='function')window.showToast('تعذر فتح المحادثة');}
  }
  function bind(){
    const msg=$('msgBtn');if(msg&&msg.dataset.messagesBound!=='1'){msg.dataset.messagesBound='1';msg.type='button';msg.onclick=e=>{e.preventDefault();e.stopPropagation();window.openMessages?.()}}
    const searchBtn=$('searchBtn');if(searchBtn&&searchBtn.dataset.modernSearchBound!=='1'){searchBtn.dataset.modernSearchBound='1';searchBtn.type='button';searchBtn.onclick=e=>{e.preventDefault();e.stopPropagation();open()}}
    const close=$('closeModal');if(close&&!close.dataset.closeBound){close.dataset.closeBound='1';close.onclick=()=>{$('modal').hidden=true;$('modal').classList.remove('modern-search-modal')}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  [300,800,1500,3000].forEach(ms=>setTimeout(bind,ms));
  window.madaSearch=open;
})();
