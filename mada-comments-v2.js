/* Mada comments v4 - real comments layer for dynamically rendered posts. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨'];
  const getSB=()=>window.sb||window.MADA_SUPABASE_CLIENT;
  const getUser=()=>window.user;
  function commentsMarkup(rows){return rows.map(r=>`<div class="comment mada-comment-v2" data-comment-id="${esc(r.id)}"><b><span class="mada-comment-avatar">${esc((r.name||'م').trim().charAt(0)||'م')}</span>${esc(r.name||'مستخدم Mada')}</b><div class="mada-comment-body">${esc(r.body||'')}</div><div class="mada-comment-tools"><button type="button" data-comment-reply>رد</button><button type="button" data-comment-like aria-label="إعجاب بالتعليق">♡</button></div></div>`).join('')}
  async function hydrateComments(article){
    if(!article||article.dataset.madaCommentsHydrating||article.querySelector('.comments'))return;
    const id=article.id.replace(/^post-/,'');if(!id)return;
    const sb=getSB();if(!sb)return;article.dataset.madaCommentsHydrating='1';
    try{
      const r=await sb.from('comments').select('id,author_id,body,created_at').eq('post_id',id).order('created_at',{ascending:true}).limit(100);
      if(r.error)throw r.error;
      const rows=r.data||[], authors=[...new Set(rows.map(x=>x.author_id).filter(Boolean))];let pm=new Map();
      if(authors.length){const p=await sb.from('profiles').select('id,display_name,avatar_url').in('id',authors);pm=new Map((p.data||[]).map(x=>[x.id,x]))}
      const mapped=rows.map(x=>({...x,name:pm.get(x.author_id)?.display_name||'مستخدم Mada'}));
      const box=document.createElement('div');box.className='comments mada-comments-collapsed';box.dataset.madaCommentsV2='';
      box.innerHTML=`${commentsMarkup(mapped)}<div class="comment-box"><input data-comment="${esc(id)}" class="mada-comment-input" placeholder="اكتب تعليقًا…" autocomplete="off"><button type="button" data-send="${esc(id)}" class="mada-comment-send">إرسال</button></div>`;
      article.appendChild(box);enhance(article);
      const counter=article.querySelector('[data-comments-open]');if(counter)counter.textContent=`${rows.length} تعليق`;
    }catch(e){delete article.dataset.madaCommentsHydrating}
  }
  function addEmojiPicker(box,input){
    if(box.querySelector('.mada-emoji-picker'))return;
    const bar=document.createElement('div');bar.className='mada-comment-emoji-bar';
    bar.innerHTML='<button type="button" class="mada-emoji-toggle" aria-label="إضافة رمز تعبيري">😊</button><div class="mada-emoji-picker" hidden>'+emojis.map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div>';
    const form=box.querySelector('.comment-box');form?box.insertBefore(bar,form):box.appendChild(bar);
    const toggle=bar.querySelector('.mada-emoji-toggle'),picker=bar.querySelector('.mada-emoji-picker');
    toggle.addEventListener('click',e=>{e.preventDefault();picker.hidden=!picker.hidden});
    picker.addEventListener('click',e=>{const b=e.target.closest('[data-emoji]');if(!b)return;const pos=input.selectionStart??input.value.length;const end=input.selectionEnd??pos;input.value=input.value.slice(0,pos)+b.dataset.emoji+input.value.slice(end);input.focus();input.selectionStart=input.selectionEnd=pos+b.dataset.emoji.length;picker.hidden=true});
  }
  function openComments(article){const box=article.querySelector('.comments');if(!box)return;box.classList.remove('mada-comments-collapsed');article.classList.add('mada-comments-open');box.querySelector('[data-comment]')?.focus()}
  function enhance(article){
    const box=article.querySelector('.comments');if(!box)return;
    const input=box.querySelector('[data-comment]'),send=box.querySelector('[data-send]');
    if(input&&!input.dataset.madaEnter){input.dataset.madaEnter='1';input.classList.add('mada-comment-input');input.setAttribute('aria-label','اكتب تعليقًا');input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.value.trim())window.addComment?.(article.id.slice(5))}})}
    if(send&&!send.dataset.madaSend){send.dataset.madaSend='1';send.classList.add('mada-comment-send');send.addEventListener('click',()=>window.addComment?.(article.id.slice(5)))}
    if(input)addEmojiPicker(box,input);
    const toggle=article.querySelector('[data-comment-toggle]');
    if(toggle&&!toggle.dataset.madaCommentOpen){toggle.dataset.madaCommentOpen='1';toggle.addEventListener('click',e=>{e.preventDefault();openComments(article)})}
    const meta=article.querySelector('[data-comments-open]');
    if(meta&&!meta.dataset.madaCommentMeta){meta.dataset.madaCommentMeta='1';meta.addEventListener('click',e=>{e.preventDefault();openComments(article)})}
    if(!article.dataset.madaCommentClick){article.dataset.madaCommentClick='1';box.addEventListener('click',e=>{const reply=e.target.closest('[data-comment-reply]');if(reply){e.preventDefault();if(input){input.focus();input.placeholder='اكتب ردك…';input.dataset.replyTo=reply.closest('.comment')?.dataset.commentId||''}}const like=e.target.closest('[data-comment-like]');if(like){like.classList.toggle('active');like.textContent=like.classList.contains('active')?'♥':'♡'}})}
  }
  function scan(){document.querySelectorAll('#feed article.post').forEach(a=>{hydrateComments(a);enhance(a)})}
  function boot(){const feed=document.getElementById('feed');if(!feed)return;scan();let timer=0;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,150)});obs.observe(feed,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
