/* Mada Stories — 2 second auto-advance */
(function(){
  'use strict';
  const DURATION = 2000;
  let timer = null;
  let active = false;
  let index = 0;
  let stories = [];

  const sb = () => window.MADA_SUPABASE_CLIENT || window.sb;
  const esc = s => String(s ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function stop(){ if(timer){clearTimeout(timer);timer=null;} active=false; }
  function close(){ stop(); const m=document.getElementById('modal'); if(m && !m.hidden){m.hidden=true;} }

  async function openAt(i){
    if(!stories.length || i >= stories.length){ close(); return; }
    index=i; active=true;
    const item=stories[index];
    const m=document.getElementById('modal'), title=document.getElementById('modalTitle'), body=document.getElementById('modalBody');
    if(!m||!title||!body){return;}
    const p=await sb().from('profiles').select('display_name').eq('id',item.author_id).maybeSingle();
    if(!active || index!==i) return;
    const u=item.media_url||'';
    const isv=/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
    title.textContent='قصة '+(p.data?.display_name||'مستخدم');
    body.innerHTML=`<div class="mada-story-player"><div class="mada-story-progress"><i></i></div>${isv?`<video autoplay muted playsinline src="${esc(u)}"></video>`:`<img src="${esc(u)}">`}<div class="mada-story-caption">${esc(item.body||'')}</div></div>`;
    m.hidden=false;
    timer=setTimeout(()=>openAt(index+1),DURATION);
  }

  async function startFrom(id){
    const r=await sb().from('posts').select('id,author_id,media_url,body,created_at').eq('visibility','story').gt('created_at',new Date(Date.now()-86400000).toISOString()).order('created_at',{ascending:false}).limit(30);
    stories=r.data||[];
    if(!stories.length)return;
    const pos=stories.findIndex(x=>String(x.id)===String(id));
    openAt(pos>=0?pos:0);
  }

  function bind(){
    const row=document.getElementById('storyRow'); if(!row)return;
    row.addEventListener('click',e=>{const b=e.target.closest('[data-story-id]');if(b){e.preventDefault();e.stopPropagation();startFrom(b.dataset.storyId);}},true);
    const closeBtn=document.getElementById('closeModal'); if(closeBtn)closeBtn.addEventListener('click',stop);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.MadaStoryDuration={startFrom,close};
})();