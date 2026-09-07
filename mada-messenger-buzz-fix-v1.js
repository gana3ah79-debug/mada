/* Mada Messenger Buzz Fix v1 — prevent duplicate Buzz rows from overlapping realtime + open refresh. */
(()=>{
'use strict';
if(window.__MADA_MESSENGER_BUZZ_FIX_V1__)return;
window.__MADA_MESSENGER_BUZZ_FIX_V1__=true;
function dedupe(root){
  if(!root)return;
  const seen=new Set();
  root.querySelectorAll('[data-message-id]').forEach(el=>{
    const id=el.dataset.messageId;
    if(!id)return;
    if(seen.has(id)){el.remove();return;}
    seen.add(id);
  });
}
function watch(){
  const body=document.getElementById('madaMsBody');
  if(!body||body.__madaBuzzFixBound)return;
  body.__madaBuzzFixBound=true;
  const run=()=>dedupe(body);
  new MutationObserver(run).observe(body,{childList:true});
  run();
}
const boot=()=>{watch();setTimeout(watch,300);setTimeout(watch,1000)};
boot();
new MutationObserver(boot).observe(document.body,{childList:true});
})();