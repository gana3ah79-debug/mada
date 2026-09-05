/* Mada homepage stability layer: fast startup, feed recovery, and safe control fallbacks. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let bound=false,feedAttempts=0,revealAttempts=0;
  const run=fn=>{try{const r=fn();if(r&&typeof r.catch==='function')r.catch(()=>{})}catch(_){}};
  function revealWhenReady(){
    const app=$('app'),auth=$('auth');
    if(window.user&&app){app.hidden=false;app.style.display='block';if(auth){auth.hidden=true;auth.style.display='none'}return}
    if(revealAttempts++<40)setTimeout(revealWhenReady,250);
  }
  function feedWatch(){
    const feed=$('feed');
    if(!feed){if(feedAttempts++<30)setTimeout(feedWatch,300);return}
    const ready=!!window.user,stuck=/جاري تحميل المنشورات/.test(feed.textContent||'');
    if(ready&&stuck&&typeof window.madaReloadFeed==='function')run(()=>window.madaReloadFeed(true));
    if(!ready&&feedAttempts++<40)setTimeout(feedWatch,300);
  }
  function openSearch(){
    if(window.MadaUnifiedSearch?.open){run(()=>window.MadaUnifiedSearch.open());return}
    const q=prompt('ابحث عن مستخدم في Mada');
    if(!q||q.trim().length<2||typeof window.searchUsers!=='function')return;
    run(async()=>{const users=await window.searchUsers(q.trim());const body=users.length?users.map(u=>`<div class="user-row"><div class="avatar">${String(u.display_name||'م').trim().charAt(0)}</div><div class="user-info"><b>${String(u.display_name||'مستخدم Mada').replace(/[&<>\"']/g,'')}</b></div><button type="button" class="social-btn" data-runtime-profile="${u.id}">فتح</button></div>`).join(''):'<div class="empty">لا توجد نتائج.</div>';window.showModal?.('🔎 البحث',`<div class="results">${body}</div>`)});
  }
  function bind(){
    if(bound)return;bound=true;
    document.addEventListener('click',function(e){
      const b=e.target.closest('button');if(!b)return;const id=b.id,action=b.dataset.mnav;
      if(b.dataset.runtimeProfile){e.preventDefault();e.stopImmediatePropagation();run(()=>window.openProfile?.(b.dataset.runtimeProfile));return}
      if(action==='search'){e.preventDefault();e.stopImmediatePropagation();openSearch();return}
      if(action==='messages'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.messagesView?.());return}
      if(action==='notifications'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.notifications?.());return}
      if(action==='profile'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.openProfile?.(window.user?.id));return}
      if(action==='create'){e.preventDefault();e.stopImmediatePropagation();$('createNav')?.click();return}
      if(id==='searchBtn'){e.preventDefault();e.stopImmediatePropagation();openSearch();return}
      if(id==='msgBtn'||id==='msgBtn2'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.messagesView?.());return}
      if(id==='notifyBtn'||id==='notifyNav'||id==='notifyBottom'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.notifications?.());return}
      if(id==='friendsNav'||id==='friendsBottom'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.friendsView?.());return}
      if(id==='profileNav'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.openProfile?.(window.user?.id));return}
      if(id==='themeBtn'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.applyTheme?.(!document.body.classList.contains('dark')));return}
      if(id==='photoBtn'||id==='videoBtn'){e.preventDefault();e.stopImmediatePropagation();const f=$('imageInput');if(f){f.accept=id==='videoBtn'?'video/*':'image/*';f.click()}return}
      if(id==='postBtn'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.addPost?.());return}
      if(id==='closeModal'){e.preventDefault();e.stopImmediatePropagation();run(()=>window.closeModal?.());return}
    },true);
  }
  function boot(){bind();revealWhenReady();setTimeout(feedWatch,250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MadaRuntimeStability={feedWatch,openSearch,revealWhenReady};
})();
