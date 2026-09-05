/* Mada Homepage Safe Layer — performance only, never rebuilds page DOM. */
(function(){
  'use strict';
  const STYLE='mada-home-safe-style';
  function install(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      .page-wrap{contain:layout style;}
      #feed{min-width:0;}
      #feed>.post{content-visibility:auto;contain-intrinsic-size:420px;}
      .mada-feed-loading{padding:22px;text-align:center;color:#64748b}
      @media(max-width:700px){#feed>.post{contain-intrinsic-size:360px}.page-wrap{padding-bottom:82px}}
    `;document.head.appendChild(s);
  }
  function videos(){return document.querySelectorAll('#feed video:not([data-mada-video])');}
  function setupVideos(){
    const list=videos(); if(!list.length)return;
    list.forEach(v=>{v.dataset.madaVideo='1';v.preload='metadata';v.setAttribute('playsinline','');});
    if(!window.IntersectionObserver)return;
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{
      const v=e.target;if(e.isIntersecting&&e.intersectionRatio>=.65){v.play().catch(()=>{});}else if(!v.paused)v.pause();
    }),{threshold:[0,.65]});
    list.forEach(v=>io.observe(v));
  }
  function boot(){install();setupVideos();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  let timer=0;
  const feedObserver=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(setupVideos,120)});
  function watch(){const f=document.getElementById('feed');if(f&&!f.dataset.madaSafeWatch){f.dataset.madaSafeWatch='1';feedObserver.observe(f,{childList:true});setupVideos();}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
  window.MadaHomeSafe={refresh:setupVideos};
})();