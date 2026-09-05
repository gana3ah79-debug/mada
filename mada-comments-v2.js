/* Mada comments v3 - active comments, replies, emoji picker and mobile sheet. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨'];
  function addEmojiPicker(box,input){
    if(box.querySelector('.mada-emoji-picker'))return;
    const bar=document.createElement('div');bar.className='mada-comment-emoji-bar';
    bar.innerHTML='<button type="button" class="mada-emoji-toggle" aria-label="إضافة رمز تعبيري">😊</button><div class="mada-emoji-picker" hidden>'+emojis.map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div>';
    box.insertBefore(bar,box.querySelector('.comment-box')||null);
    const toggle=bar.querySelector('.mada-emoji-toggle'),picker=bar.querySelector('.mada-emoji-picker');
    toggle.addEventListener('click',e=>{e.preventDefault();picker.hidden=!picker.hidden});
    picker.addEventListener('click',e=>{const b=e.target.closest('[data-emoji]');if(!b)return;const pos=input.selectionStart??input.value.length;input.value=input.value.slice(0,pos)+b.dataset.emoji+input.value.slice(input.selectionEnd??pos);input.focus();input.selectionStart=input.selectionEnd=pos+b.dataset.emoji.length;picker.hidden=true});
  }
  function openComments(article){
    const box=article.querySelector('.comments');if(!box)return;
    box.classList.remove('mada-comments-collapsed');
    article.classList.add('mada-comments-open');
    box.querySelector('[data-comment]')?.focus();
  }
  function enhance(article){
    const box=article.querySelector('.comments'); if(!box)return;
    if(!box.dataset.madaCommentsV2){
      box.dataset.madaCommentsV2='1';
      [...box.querySelectorAll(':scope > .comment')].forEach((row,i)=>{
        row.dataset.commentIndex=String(i);row.classList.add('mada-comment-v2');
        const b=row.querySelector('b');
        if(b&&!b.querySelector('.mada-comment-avatar')){const name=b.textContent||'مستخدم';b.textContent='';b.insertAdjacentHTML('afterbegin',`<span class="mada-comment-avatar">${esc(name.trim().charAt(0)||'م')}</span>`);row.insertAdjacentHTML('beforeend',`<div class="mada-comment-tools"><button type="button" data-comment-reply>رد</button><button type="button" data-comment-like aria-label="إعجاب بالتعليق">♡</button></div>`)}
      });
    }
    const input=box.querySelector('[data-comment]'),send=box.querySelector('[data-send]');
    if(input&&!input.dataset.madaEnter){input.dataset.madaEnter='1';input.classList.add('mada-comment-input');input.setAttribute('aria-label','اكتب تعليقًا');input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.value.trim())window.addComment?.(article.id.slice(5));}})}
    if(send&&!send.dataset.madaSend){send.dataset.madaSend='1';send.classList.add('mada-comment-send');}
    if(input)addEmojiPicker(box,input);
    const toggle=article.querySelector('[data-comment-toggle]');
    if(toggle&&!toggle.dataset.madaCommentOpen){toggle.dataset.madaCommentOpen='1';toggle.addEventListener('click',()=>openComments(article));}
    const meta=article.querySelector('[data-comments-open]');
    if(meta&&!meta.dataset.madaCommentMeta){meta.dataset.madaCommentMeta='1';meta.addEventListener('click',()=>openComments(article));}
    if(!article.dataset.madaCommentClick){
      article.dataset.madaCommentClick='1';
      box.addEventListener('click',e=>{
        const reply=e.target.closest('[data-comment-reply]');
        if(reply){e.preventDefault();if(input){input.focus();input.placeholder='اكتب ردك…';input.dataset.replyTo=reply.closest('.comment')?.dataset.commentId||'';}}
        const like=e.target.closest('[data-comment-like]');
        if(like){like.classList.toggle('active');like.textContent=like.classList.contains('active')?'♥':'♡';}
      });
    }
  }
  function scan(){document.querySelectorAll('#feed article.post').forEach(enhance)}
  function boot(){const feed=document.getElementById('feed');if(!feed)return;scan();let timer=0;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,120)});obs.observe(feed,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
