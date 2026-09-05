/* Mada Comments Modal v5 - standalone comment window, no nested legacy UI. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const client=()=>window.sb||window.MADA_SUPABASE_CLIENT, me=()=>window.user;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨','🤣','😉','🙌','💙'];
let activeId=null;
function close(){const modal=$('#modal');if(!modal)return;modal.hidden=true;modal.style.display='';document.body.classList.remove('modal-open');activeId=null}
function openComments(id){
 const article=document.getElementById('post-'+id),modal=$('#modal');if(!article||!modal)return;activeId=id;
 const source=article.querySelector('.comments');
 $('#modalTitle').textContent='';$('#modalTitle').style.display='none';
 $('#modalBody').innerHTML='';
 const panel=document.createElement('section');panel.className='mada-standalone-comments';
 panel.innerHTML='<header class="mada-standalone-head"><div><div class="mada-standalone-title">التعليقات 💬</div><div class="mada-standalone-subtitle">شارك رأيك في المنشور</div></div><button type="button" class="mada-standalone-close" aria-label="إغلاق">×</button></header><div class="mada-standalone-post"></div><div class="mada-standalone-list"></div><footer class="mada-standalone-compose"><button type="button" class="mada-standalone-emoji" aria-label="الإيموجي">😊</button><input class="mada-standalone-input" placeholder="اكتب تعليقًا..." autocomplete="off"><button type="button" class="mada-standalone-send">إرسال</button><div class="mada-standalone-picker" hidden>'+emojis.map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div></footer>';
 const postBox=$('.mada-standalone-post',panel),list=$('.mada-standalone-list',panel);
 const text=article.querySelector('.post-text')?.textContent?.trim()||'';const author=article.querySelector('.post-author,.post-name,[data-profile]')?.textContent?.trim()||'صاحب المنشور';
 postBox.innerHTML=`<div class="mada-standalone-post-author">${esc(author)}</div>${text?`<div class="mada-standalone-post-text">${esc(text)}</div>`:''}`;
 if(source){$$('.comment',source).forEach(c=>list.appendChild(c.cloneNode(true)))}
 if(!list.children.length)list.innerHTML='<div class="mada-standalone-empty"><div>💬</div><b>لا توجد تعليقات بعد</b><span>كن أول من يشارك رأيه</span></div>';
 $('#modalBody').appendChild(panel);modal.classList.add('mada-standalone-modal');modal.hidden=false;modal.style.display='grid';document.body.classList.add('modal-open');
 const input=$('.mada-standalone-input',panel),picker=$('.mada-standalone-picker',panel),sendBtn=$('.mada-standalone-send',panel);
 $('.mada-standalone-close',panel).onclick=close;
 $('.mada-standalone-emoji',panel).onclick=()=>picker.hidden=!picker.hidden;
 picker.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){input.value+=b.dataset.emoji;input.focus();picker.hidden=true}};
 const send=async()=>{const body=input.value.trim(),u=me(),s=client();if(!body)return;if(!u||!s){alert('سجّل الدخول أولاً.');return}sendBtn.disabled=true;sendBtn.textContent='...';
   const temp=document.createElement('article');temp.className='mada-standalone-live';temp.innerHTML=`<div class="mada-live-avatar">${esc((window.profile?.display_name||'أنت').trim().charAt(0)||'أ')}</div><div class="mada-live-main"><b>${esc(window.profile?.display_name||'أنت')}</b><span>${esc(body)}</span><small>جارٍ النشر...</small></div>`;list.appendChild(temp);list.scrollTop=list.scrollHeight;input.value='';
   const r=await s.from('comments').insert({post_id:id,author_id:u.id,body}).select('id,created_at').single();
   if(r.error){temp.remove();input.value=body;alert('تعذر إضافة التعليق: '+r.error.message)}else{temp.classList.add('sent');temp.querySelector('small').textContent='الآن';const count=article.querySelector('[data-comments-open]');if(count){const n=parseInt(count.textContent,10)||0;count.textContent=(n+1)+' تعليق'}}
   sendBtn.disabled=false;sendBtn.textContent='إرسال';
 };
 sendBtn.onclick=send;input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};setTimeout(()=>input.focus(),120);
}
function enhance(){
 $$('#feed article.post').forEach(a=>{const id=a.id.replace(/^post-/,'');if(!id)return;$$('[data-comment-toggle],[data-comments-open]',a).forEach(btn=>{if(btn.dataset.standaloneComments)return;btn.dataset.standaloneComments='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openComments(id)},true)})})
}
function boot(){enhance();const feed=$('#feed');if(feed)new MutationObserver(enhance).observe(feed,{childList:true,subtree:true});$('#closeModal')?.addEventListener('click',close);$('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')close()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.MadaCommentsModalV5={openComments,close,enhance};
})();
