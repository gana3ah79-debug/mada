(()=>{
  const THRESHOLD=58,MAX_PULL=96;
  let startY=0,lastY=0,pulling=false,refreshing=false;
  const state={ready:false};
  function getScrollTop(){return window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0}
  function isBlocked(){return refreshing||document.body.classList.contains('modal-open')||document.querySelector('.modal:not([hidden])')}
  function indicator(){
    let el=document.getElementById('madaPullRefresh');
    if(el)return el;
    el=document.createElement('div');el.id='madaPullRefresh';el.innerHTML='<span class="mada-pull-icon">↓</span><span class="mada-pull-text">اسحب للتحديث</span>';
    document.body.appendChild(el);
    const s=document.createElement('style');s.textContent=`#madaPullRefresh{position:fixed;z-index:9998;top:8px;left:50%;transform:translate(-50%,-80px) scale(.96);opacity:0;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 5px 22px rgba(0,0,0,.14);font:700 13px system-ui,sans-serif;color:#2871df;pointer-events:none;transition:transform .18s ease,opacity .18s ease}#madaPullRefresh .mada-pull-icon{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:#eef4ff;font-size:18px;transition:transform .15s ease}body.dark #madaPullRefresh{background:rgba(31,36,45,.97);color:#78a9ff}body.dark #madaPullRefresh .mada-pull-icon{background:#28354b}@keyframes madaSpin{to{transform:rotate(360deg)}}#madaPullRefresh.loading .mada-pull-icon{animation:madaSpin .75s linear infinite}`;document.head.appendChild(s);return el
  }
  function show(y){const el=indicator();const progress=Math.min(y/MAX_PULL,1);el.style.transform=`translate(-50%,${Math.max(-72,progress*58-72)}px) scale(${.96+progress*.04})`;el.style.opacity=String(Math.min(.98,progress+.1));const icon=el.querySelector('.mada-pull-icon'),text=el.querySelector('.mada-pull-text');if(y>=THRESHOLD){state.ready=true;icon.textContent='↻';icon.style.transform='rotate(180deg)';text.textContent='اترك للتحديث'}else{state.ready=false;icon.textContent='↓';icon.style.transform=`rotate(${progress*180}deg)`;text.textContent='اسحب للتحديث'}}
  function hide(){const el=indicator();el.style.transform='translate(-50%,-80px) scale(.96)';el.style.opacity='0'}
  async function refresh(){if(refreshing)return;refreshing=true;const el=indicator();el.classList.add('loading');el.querySelector('.mada-pull-icon').textContent='↻';el.querySelector('.mada-pull-text').textContent='جاري التحديث…';el.style.transform='translate(-50%,8px) scale(1)';el.style.opacity='1';try{if(typeof window.loadFeed==='function')await window.loadFeed();if(window.MadaStoriesReels?.loadStories)await window.MadaStoriesReels.loadStories();window.dispatchEvent(new CustomEvent('mada:refresh'));}catch(e){console.warn('Mada pull refresh',e)}finally{setTimeout(()=>{el.classList.remove('loading');hide();refreshing=false;},420)}}
  function touchStart(e){if(isBlocked()||getScrollTop()>2)return;if(!e.touches?.length)return;startY=e.touches[0].clientY;lastY=startY;pulling=false}
  function touchMove(e){if(isBlocked()||getScrollTop()>2||!startY)return;const y=e.touches[0]?.clientY||startY;lastY=y;const delta=y-startY;if(delta<=0)return;pulling=true;const eased=Math.min(MAX_PULL,delta*.72);show(eased);if(eased>6)e.preventDefault()}
  function touchEnd(){if(!pulling){startY=lastY=0;return}const delta=lastY-startY,start=startY;startY=lastY=0;if(delta*.72>=THRESHOLD)refresh();else hide()}
  function boot(){document.addEventListener('touchstart',touchStart,{passive:true});document.addEventListener('touchmove',touchMove,{passive:false});document.addEventListener('touchend',touchEnd,{passive:true});document.addEventListener('touchcancel',touchEnd,{passive:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.MadaPullRefresh={refresh};
})();
