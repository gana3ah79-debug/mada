/* Mada Comments Modal v4 - polished comments window. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const client=()=>window.sb||window.MADA_SUPABASE_CLIENT, me=()=>window.user;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨'];
function openComments(id){
 const article=document.getElementById('post-'+id),modal=$('#modal');if(!article||!modal)return;
 const source=article.querySelector('.comments');$('#modalTitle').innerHTML='💬 التعليقات';$('#modalBody').innerHTML='';
 const panel=document.createElement('div');panel.className='mada-comments-panel';panel.innerHTML='<div class="mada-comments-modal-head"><div><b>التعليقات</b><small>شارك رأيك في المنشور</small></div><button type="button" class="mada-modal-close-inner">×</button></div><div class="mada-comments-list"></div><div class="mada-comment-compose"><button type="button" class="mada-emoji-btn">😊</button><input class="mada-modal-comment-input" placeholder="اكتب تعليقًا…" autocomplete="off"><button type="button" class="mada-modal-send">إرسال</button><div class="mada-emoji-picker" hidden>'+emojis.map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div></div>';
 const list=$('.mada-comments-list',panel);if(source){$$('.comment',source).forEach(c=>list.appendChild(c.cloneNode(true)))}if(!list.children.length)list.innerHTML='<div class="mada-modal-empty">لا توجد تعليقات بعد 👋<br><small>كن أول من يشارك رأيه</small></div>';
 $('#modalBody').appendChild(panel);modal.hidden=false;modal.style.display='grid';document.body.classList.add('modal-open');
 const input=$('.mada-modal-comment-input',panel),picker=$('.mada-emoji-picker',panel);$('.mada-emoji-btn',panel).onclick=()=>picker.hidden=!picker.hidden;picker.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){input.value+=b.dataset.emoji;input.focus();picker.hidden=true}};$('.mada-modal-close-inner',panel).onclick=close;
 const send=async()=>{const body=input.value.trim(),u=me(),s=client();if(!body)return;if(!u||!s){alert('سجّل الدخول أولاً.');return}const b=$('.mada-modal-send',panel);b.disabled=true;b.textContent='جارٍ…';const temp=document.createElement('div');temp.className='mada-live-comment';temp.innerHTML=`<b><span class="mada-live-avatar">${esc((window.profile?.display_name||'أنت').trim().charAt(0)||'أ')}</span>${esc(window.profile?.display_name||'أنت')}</b><span>${esc(body)}</span><small>جارٍ النشر…</small>`;list.appendChild(temp);list.scrollTop=list.scrollHeight;input.value='';const r=await s.from('comments').insert({post_id:id,author_id:u.id,body}).select('id,created_at').single();if(r.error){temp.remove();input.value=body;alert('تعذر إضافة التعليق: '+r.error.message)}else{temp.classList.add('sent');temp.querySelector('small').textContent='الآن';const count=article.querySelector('[data-comments-open]');if(count){const n=parseInt(count.textContent,10)||0;count.textContent=(n+1)+' تعليق'}}b.disabled=false;b.textContent='إرسال'};
 $('.mada-modal-send',panel).onclick=send;input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};setTimeout(()=>input.focus(),80);
}
function close(){const modal=$('#modal');if(!modal)return;modal.hidden=true;modal.style.display='';document.body.classList.remove('modal-open')}
function enhance(){
 $$('#feed article.post').forEach(a=>{const id=a.id.replace(/^post-/,'');if(!id)return;$$('[data-comment-toggle],[data-comments-open]',a).forEach(btn=>{if(btn.dataset.commentsModalV4)return;btn.dataset.commentsModalV4='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openComments(id)},true)})})
}
function boot(){enhance();const feed=$('#feed');if(feed)new MutationObserver(enhance).observe(feed,{childList:true,subtree:true});$('#closeModal')?.addEventListener('click',close);$('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')close()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.MadaCommentsModalV4={openComments,close,enhance};
})();
