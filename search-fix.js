/* Mada: robust search fallback */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let client=null;
  function getClient(){
    if(window.sb) return window.sb;
    if(client) return client;
    try{
      if(window.supabase&&window.MADA_SUPABASE_URL&&window.MADA_SUPABASE_KEY){
        client=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
        return client;
      }
    }catch(e){console.error(e)}
    return null;
  }
  async function getCurrentUser(){
    if(window.user) return window.user;
    const s=getClient();
    if(!s) return null;
    const r=await s.auth.getUser();
    return r?.data?.user||null;
  }
  function openSearch(){
    let old=$('madaSearchOverlay');
    if(old) old.remove();
    const overlay=document.createElement('div'); overlay.id='madaSearchOverlay';
    overlay.innerHTML='<div class="mada-search-fix-card"><div class="mada-search-fix-head"><button id="madaSearchBack" type="button">←</button><div class="mada-search-fix-input"><span>⌕</span><input id="madaSearchFixInput" type="search" placeholder="ابحث عن شخص في Mada" autocomplete="off"><button id="madaSearchFixClear" type="button">×</button></div></div><div id="madaSearchFixResults" class="mada-search-fix-results"><div class="mada-search-fix-empty"><strong>ابدأ البحث</strong><span>اكتب اسم الشخص أو اسم المستخدم</span></div></div></div>';
    document.body.appendChild(overlay);
    const input=$('madaSearchFixInput');
    const close=()=>overlay.remove();
    $('madaSearchBack').onclick=close;
    $('madaSearchFixClear').onclick=()=>{input.value='';input.focus();renderRecent()};
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    let timer;
    input.addEventListener('input',()=>{clearTimeout(timer);const q=input.value.trim();if(!q){renderRecent();return}timer=setTimeout(()=>runSearch(q),250)});
    input.focus();
    renderRecent();
  }
  function renderRecent(){
    const out=$('madaSearchFixResults');if(!out)return;
    let a=[];try{a=JSON.parse(localStorage.getItem('mada_recent_searches')||'[]')}catch(_){ }
    if(!a.length){out.innerHTML='<div class="mada-search-fix-empty"><div>⌕</div><strong>ابدأ البحث</strong><span>اكتب اسم الشخص أو اسم المستخدم</span></div>';return}
    out.innerHTML='<div class="mada-search-fix-label">عمليات البحث الأخيرة</div>'+a.slice(0,8).map(p=>'<button type="button" class="mada-search-fix-row" data-id="'+esc(p.id)+'"><span class="mada-search-fix-avatar">'+(p.avatar?'<img src="'+esc(p.avatar)+'" alt="">':esc((p.name||'م').charAt(0)))+'</span><span><b>'+esc(p.name||'مستخدم Mada')+'</b><small>@'+esc(p.username||'')+'</small></span><i>›</i></button>').join('');
    out.querySelectorAll('[data-id]').forEach((b,i)=>b.onclick=()=>openUser(a[i]));
  }
  async function runSearch(q){
    const out=$('madaSearchFixResults');if(!out)return;
    const s=getClient();const u=await getCurrentUser();
    if(!s||!u){out.innerHTML='<div class="mada-search-fix-empty"><strong>سجّل الدخول أولاً</strong></div>';return}
    out.innerHTML='<div class="mada-search-fix-loading">جاري البحث…</div>';
    try{
      const safe=q.replace(/[%_,]/g,' ').trim();
      const {data,error}=await s.from('profiles').select('id,username,display_name,avatar_url').or('display_name.ilike.%'+safe+'%,username.ilike.%'+safe+'%').neq('id',u.id).limit(20);
      if(error)throw error;
      if(!data?.length){out.innerHTML='<div class="mada-search-fix-empty"><strong>لا توجد نتائج</strong><span>جرّب اسمًا أو اسم مستخدم مختلفًا</span></div>';return}
      out.innerHTML='<div class="mada-search-fix-label">نتائج البحث</div>'+data.map(p=>'<button type="button" class="mada-search-fix-row" data-user="'+esc(p.id)+'"><span class="mada-search-fix-avatar">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="" loading="lazy">':esc((p.display_name||p.username||'م').charAt(0)))+'</span><span><b>'+esc(p.display_name||'مستخدم Mada')+'</b><small>@'+esc(p.username||'')+'</small></span><i>💬</i></button>').join('');
      out.querySelectorAll('[data-user]').forEach((b,i)=>b.onclick=()=>openUser(data[i]));
    }catch(e){console.error('Mada search',e);out.innerHTML='<div class="mada-search-fix-empty"><strong>تعذر البحث</strong><span>'+esc(e?.message||'تحقق من الاتصال ثم حاول مرة أخرى')+'</span></div>'}
  }
  async function openUser(p){
    try{localStorage.setItem('mada_recent_searches',JSON.stringify([{id:p.id,name:p.display_name||p.username||'مستخدم',username:p.username||'',avatar:p.avatar_url||''},...JSON.parse(localStorage.getItem('mada_recent_searches')||'[]').filter(x=>x.id!==p.id)].slice(0,8)))}catch(_){ }
    try{
      if(typeof window.getOrCreateConversation!=='function'||typeof window.openConversation!=='function') throw new Error('نظام الرسائل غير جاهز');
      const cid=await window.getOrCreateConversation(p.id);
      await window.openConversation(p.id,cid);
      $('madaSearchOverlay')?.remove();
    }catch(e){console.error(e);window.showToast?.('تعذر فتح المحادثة');}
  }
  function bind(){
    const b=$('searchBtn');if(!b||b.dataset.fixSearchBound==='1')return;
    b.dataset.fixSearchBound='1';b.type='button';b.disabled=false;b.style.pointerEvents='auto';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openSearch()},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  [100,500,1000,2000,4000].forEach(ms=>setTimeout(bind,ms));
  window.madaSearchFix=openSearch;
})();
