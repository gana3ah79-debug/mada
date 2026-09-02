/* Mada Stories — reliable 2 second auto advance */
(function(){
  'use strict';
  const DURATION=2000;
  let timer=null, index=0, stories=[], running=false;
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const $=id=>document.getElementById(id);
  function stop(){if(timer){clearTimeout(timer);timer=null}running=false}
  function hideModal(){const m=$('modal');if(m)m.hidden=true}
  async function load(){
    const r=await sb().from('posts').select('id,author_id,media_url,body,created_at').eq('visibility','story').gt('created_at',new Date(Date.now()-86400000).toISOString()).order('created_at',{ascending:false}).limit(30);
    stories=r.data||[];
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(running)show(index+1)},DURATION)}
  async function show(i){
    if(!running)return;
    if(i>=stories.length){stop();hideModal();return}
    index=i;
    const item=stories[i], m=$('modal'), title=$('modalTitle'), body=$('modalBody');
    if(!m||!title||!body){stop();return}
    const p=await sb().from('profiles').select('display_name').eq('id',item.author_id).maybeSingle();
    if(!running||index!==i)return;
    const u=item.media_url||'', isv=/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
    title.textContent='قصة '+(p.data?.display_name||'مستخدم');
    body.innerHTML='<div class="mada-story-player"><div class="mada-story-progress"><i></i></div>'+(isv?'<video autoplay muted playsinline src="'+esc(u)+'"></video>':'<img src="'+esc(u)+'">')+'<div class="mada-story-caption">'+esc(item.body||'')+'</div></div>';
    m.hidden=false;
    schedule();
  }
  async function start(id){
    stop();
    await load();
    if(!stories.length)return;
    const p=stories.findIndex(x=>String(x.id)===String(id));
    running=true;
    show(p<0?0:p);
  }
  function bind(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('#storyRow .story-card[data-story-id]');
      if(!b)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      start(b.dataset.storyId);
    },true);
    const closeBtn=$('closeModal');
    if(closeBtn)closeBtn.addEventListener('click',()=>stop(),true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.MadaStoryDuration={start,stop};
})();