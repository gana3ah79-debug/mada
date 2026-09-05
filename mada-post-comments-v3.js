/* Mada Posts & Comments v3: safe progressive enhancement. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
const me=()=>window.user;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
function openComments(id){
 const article=document.getElementById('post-'+id),modal=$('#modal'); if(!article||!modal)return;
 const comments=$(`.comments[data-comments="${CSS.escape(id)}"]`,article); if(!comments)return;
 const copy=comments.cloneNode(true); copy.querySelectorAll('.comment-box').forEach(x=>x.remove());
 $('#modalTitle').textContent='💬 التعليقات'; $('#modalBody').innerHTML='';
 const wrap=document.createElement('div');wrap.className='mada-comments-panel';
 wrap.innerHTML='<div class="mada-comments-list"></div><div class="mada-comment-compose"><button type="button" class="mada-emoji-btn" aria-label="إيموجي">😊</button><input class="mada-modal-comment-input" placeholder="اكتب تعليقًا…" autocomplete="off"><button type="button" class="mada-modal-send">إرسال</button><div class="mada-emoji-picker" hidden>'+['😀','😂','😍','🥰','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯'].map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div></div>';
 const list=$('.mada-comments-list',wrap); $$('.comment',copy).forEach(c=>list.appendChild(c));
 $('#modalBody').appendChild(wrap); modal.hidden=false;modal.style.display='grid';document.body.classList.add('modal-open');
 const input=$('.mada-modal-comment-input',wrap),picker=$('.mada-emoji-picker',wrap);
 $('.mada-emoji-btn',wrap).onclick=()=>picker.hidden=!picker.hidden;
 picker.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){input.value+=b.dataset.emoji;input.focus();picker.hidden=true}};
 const send=async()=>{const body=input.value.trim(),u=me(),s=client();if(!body)return;if(!u||!s){alert('سجّل الدخول أولاً.');return}const b=$('.mada-modal-send',wrap);b.disabled=true;b.textContent='جارٍ…';
   const temp=document.createElement('div');temp.className='mada-live-comment';temp.innerHTML=`<b>${esc(window.profile?.display_name||'أنت')}</b><span>${esc(body)}</span><small>جارٍ النشر…</small>`;list.appendChild(temp);list.scrollTop=list.scrollHeight;input.value='';
   const r=await s.from('comments').insert({post_id:id,author_id:u.id,body}).select('id,created_at').single();
   if(r.error){temp.remove();input.value=body;alert('تعذر إضافة التعليق: '+r.error.message)}else{temp.classList.add('sent');$('small',temp).textContent='الآن';const count=$(`[data-comments-open="${CSS.escape(id)}"]`,article);if(count){const n=parseInt(count.textContent,10)||0;count.textContent=(n+1)+' تعليق'}}
   b.disabled=false;b.textContent='إرسال';};
 $('.mada-modal-send',wrap).onclick=send;input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
}
function enhance(){
 $$('#feed article.post').forEach(article=>{
  const id=article.id.replace(/^post-/,''); if(!id)return;
  const toggle=$(`[data-comment-toggle="${CSS.escape(id)}"]`,article); const open=$(`[data-comments-open="${CSS.escape(id)}"]`,article);
  [toggle,open].forEach(btn=>{if(btn&&!btn.dataset.commentsV3){btn.dataset.commentsV3='1';btn.addEventListener('click',e=>{e.preventDefault();openComments(id)})}});
 });
}
function boot(){enhance();const feed=$('#feed');if(!feed)return;feed.addEventListener('click',e=>{const b=e.target.closest('[data-comment-toggle],[data-comments-open]');if(!b||b.dataset.commentsV3)return;const a=b.closest('article.post');if(a){e.preventDefault();openComments(a.id.replace('post-',''))}},false);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.MadaPostCommentsV3={openComments,enhance};
})();
