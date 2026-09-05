/* Mada Stability v1 — session, network, errors, cache, listener guards */
(function(){'use strict';
  if(window.__MADA_STABILITY_V1)return; window.__MADA_STABILITY_V1=true;
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const cache=new Map(), inflight=new Map(), bound=new WeakMap();
  const TTL=15000;
  function once(el,event,key,fn,options){if(!el)return false;let m=bound.get(el);if(!m){m=new Set();bound.set(el,m)}const k=event+':'+key;if(m.has(k))return false;m.add(k);el.addEventListener(event,fn,options);return true}
  async function session(){const s=sb();if(!s?.auth)return null;try{return (await s.auth.getSession()).data?.session||null}catch(e){console.warn('Mada session check',e);return null}}
  async function cached(key,loader,ttl=TTL){const now=Date.now(),hit=cache.get(key);if(hit&&hit.exp>now)return hit.value;if(inflight.has(key))return inflight.get(key);const p=Promise.resolve().then(loader).then(v=>{cache.set(key,{value:v,exp:Date.now()+ttl});return v}).finally(()=>inflight.delete(key));inflight.set(key,p);return p}
  function invalidate(prefix){for(const k of cache.keys())if(k.startsWith(prefix))cache.delete(k)}
  function retry(fn,attempts=2,delay=350){return Promise.resolve().then(fn).catch(err=>attempts>1?new Promise(r=>setTimeout(r,delay)).then(()=>retry(fn,attempts-1,Math.min(delay*2,1500))):Promise.reject(err))}
  function status(offline){let el=document.getElementById('mada-network-status');if(!el){el=document.createElement('div');el.id='mada-network-status';el.setAttribute('role','status');el.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99999;padding:8px 14px;border-radius:999px;background:#222;color:#fff;font:600 13px system-ui;box-shadow:0 4px 16px rgba(0,0,0,.18);display:none';document.body.appendChild(el)}el.textContent=offline?'لا يوجد اتصال بالإنترنت — سيعود Mada تلقائيًا عند الاتصال.':'تم استعادة الاتصال ✓';el.style.display='block';if(!offline)setTimeout(()=>{el.style.display='none'},1800)}
  function boot(){once(window,'offline','network',()=>status(true));once(window,'online','network',()=>status(false));
    const s=sb(); if(s?.auth && !window.__MADA_STABILITY_AUTH){window.__MADA_STABILITY_AUTH=true;s.auth.onAuthStateChange((event,session)=>{window.MadaStability.lastAuthEvent=event;window.MadaStability.sessionValue=session||null});}
    window.MadaStability.session().then(x=>window.MadaStability.sessionValue=x);
    window.addEventListener('error',e=>console.warn('Mada runtime error',e.error||e.message));
    window.addEventListener('unhandledrejection',e=>console.warn('Mada async error',e.reason));
  }
  window.MadaStability={session,cached,invalidate,retry,once,sessionValue:null,lastAuthEvent:null,clearCache:()=>cache.clear(),inflight};
  if(document.readyState==='loading')once(document,'DOMContentLoaded','boot',boot);else boot();
})();
