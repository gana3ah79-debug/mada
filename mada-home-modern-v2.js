/* Mada Home Modern v2 — lightweight visual/UX layer. No DOM rebuilds, no global observers. */
(function(){
  'use strict';
  const KEY='data-mada-modern-v2';
  function addStyle(){
    if(document.getElementById('mada-modern-v2-style'))return;
    const s=document.createElement('style');s.id='mada-modern-v2-style';
    s.textContent=`
      [${KEY}] .mhm-toolbar{display:flex;align-items:center;gap:8px;margin:0 0 10px;position:sticky;top:8px;z-index:8}
      [${KEY}] .mhm-toolbar button{border:0;border-radius:999px;padding:9px 14px;background:var(--card,#fff);color:inherit;box-shadow:0 2px 10px rgba(0,0,0,.07);font-weight:700;cursor:pointer}
      [${KEY}] .mhm-toolbar button.active{background:var(--primary,#1877f2);color:#fff}
      [${KEY}] .mhm-toolbar .mhm-refresh{margin-inline-start:auto}
      [${KEY}] .mhm-welcome{font-size:14px;font-weight:700;margin:0 0 10px;opacity:.82}
      [${KEY}] .mhm-top{position:fixed;inset:auto 16px 82px auto;width:44px;height:44px;border:0;border-radius:50%;display:none;z-index:30;box-shadow:0 6px 20px rgba(0,0,0,.18);font-size:18px;cursor:pointer}
      [${KEY}] .mhm-top.show{display:block}
      [${KEY}] #feed{scroll-margin-top:70px}
      [${KEY}] .post{content-visibility:auto;contain-intrinsic-size:240px}
      @media(max-width:700px){[${KEY}] .mhm-toolbar{top:4px;overflow:auto;padding:2px 1px 6px}[${KEY}] .mhm-toolbar button{white-space:nowrap;padding:8px 12px}[${KEY}] .mhm-welcome{margin-inline:4px}}
    `;
    document.head.appendChild(s);
  }
  function install(){
    if(document.documentElement.hasAttribute(KEY))return;
    const app=document.getElementById('app');if(!app)return;
    document.documentElement.setAttribute(KEY,'1');addStyle();
    const wrap=document.querySelector('.page-wrap');const feed=document.getElementById('feed');
    if(!wrap||!feed)return;
    const toolbar=document.createElement('div');toolbar.className='mhm-toolbar';
    toolbar.innerHTML='<button type="button" class="active" data-mhm="latest">الأحدث</button><button type="button" data-mhm="friends">أصدقاؤك</button><button type="button" class="mhm-refresh" data-mada-refresh>↻ تحديث</button>';
    const profile=typeof window.madaProfile==='function'?window.madaProfile():null;
    const welcome=document.createElement('div');welcome.className='mhm-welcome';
    const name=(profile&&profile.display_name)||'أهلاً بك في Mada 👋';welcome.textContent=profile&&profile.display_name?`أهلاً ${name} 👋`:'أهلاً بك في Mada 👋';
    feed.parentNode.insertBefore(welcome,feed);feed.parentNode.insertBefore(toolbar,feed);
    const top=document.createElement('button');top.className='mhm-top';top.type='button';top.textContent='↑';top.title='العودة للأعلى';top.setAttribute('aria-label','العودة للأعلى');document.body.appendChild(top);
    toolbar.addEventListener('click',async e=>{
      const b=e.target.closest('[data-mhm]');if(!b)return;
      toolbar.querySelectorAll('[data-mhm]').forEach(x=>x.classList.remove('active'));b.classList.add('active');
      if(b.dataset.mhm==='friends'){
        feed.setAttribute('data-filter','friends');
        feed.innerHTML='<div class="card empty">منشورات الأصدقاء ستكون هنا قريبًا. يمكنك الآن استخدام صفحة الأصدقاء 👥</div>';
      }else{
        feed.removeAttribute('data-filter');
        if(typeof window.loadFeed==='function')await window.loadFeed(true);
      }
    });
    top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    let ticking=false;
    window.addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{top.classList.toggle('show',window.scrollY>500);ticking=false})},{passive:true});
    document.addEventListener('click',e=>{if(e.target.closest('#mhmRefresh')){e.preventDefault();if(typeof window.madaRefreshHome==='function')window.madaRefreshHome();else if(typeof window.loadFeed==='function')window.loadFeed(true)}},{passive:false});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,250),{once:true});else setTimeout(install,250);
})();
