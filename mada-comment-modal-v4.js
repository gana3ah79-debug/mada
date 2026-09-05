/* Mada comment modal v4 - one clean comments sheet, no nested old UI. */
(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨'];
function open(id){const a=document.getElementById('post-'+id),m=$('#modal');if(!a||!m)return;let box=a.querySelector('.comments');if(!box)return;
 m.classList.add('mada-comment-modal');m.hidden=false;m.style.display='grid';document.body.classList.add('modal-open');
 $('#modalTitle').textContent='💬 التعليقات';
 $('#modalBody').innerHTML='<div class="mada-comments-panel"><div class="mada-comments-list"></div><div class="mada-comment-compose"><button type="button" class="mada-emoji-btn">😊</button><input class="mada-modal-comment-input" placeholder="اكتب تعليقًا…" autocomplete="off"><button type="button" class="mada-modal-send">إرسال</button><div class="mada-emoji-picker" hidden>'+emojis.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('')+'</div></div></div>';
 const list=$('.mada-comments-list',m); $$('.comment',box).forEach(c=>{const clone=c.cloneNode(true);clone.querySelectorAll('.comment-box,.mada-comment-emoji-bar').forEach(x=>x.remove());list.appendChild(clone)});
 if(!list.children.length)list.innerHTML='<div class="mada-live-comment"><span>لا توجد تعليقات بعد 👋</span><small>كن أول من يشارك رأيه</small></div>';
 const input=$('.mada-modal-comment-input',m),send=$('.mada-modal-send',m),picker=$('.mada-emoji-picker',m);
 $('.mada-emoji-btn',m).onclick=()=>picker.hidden=!picker.hidden;picker.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){input.value+=b.dataset.emoji;input.focus();picker.hidden=true}};
 const submit=async()=>{const text=input.value.trim(),u=window.user,s=window.sb;if(!text)return;if(!u||!s){alert('سجّل الدخول أولاً.');return}send.disabled=true;send.textContent='جارٍ…';const temp=document.createElement('div');temp.className='mada-live-comment';temp.innerHTML=`<b>${esc(window.profile?.display_name||'أنت')}</b><span>${esc(text)}</span><small>جارٍ النشر…</small>`;list.appendChild(temp);list.scrollTop=list.scrollHeight;input.value='';try{const r=await s.from('comments').insert({post_id:id,author_id:u.id,body:text}).select('id,created_at').single();if(r.error)throw r.error;temp.classList.add('sent');temp.querySelector('small').textContent='الآن';const counter=a.querySelector(`[data-comments-open="${CSS.escape(id)}"]`);if(counter){const n=parseInt(counter.textContent.replace(/[^0-9]/g,''),10)||0;counter.textContent=`${n+1} تعليق`}}catch(e){temp.remove();input.value=text;alert('تعذر إضافة التعليق: '+(e.message||'حدث خطأ'))}finally{send.disabled=false;send.textContent='إرسال'}};
 send.onclick=submit;input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit()}};
}
function close(){const m=$('#modal');if(!m)return;m.hidden=true;m.style.display='';m.classList.remove('mada-comment-modal');document.body.classList.remove('modal-open')}
function bind(){const feed=$('#feed');if(!feed)return;feed.addEventListener('click',e=>{const b=e.target.closest('[data-comment-toggle],[data-comments-open]');if(!b)return;const a=b.closest('article.post'),id=a?.id?.slice(5);if(id){e.preventDefault();e.stopPropagation();open(id)}},false);$('#closeModal')?.addEventListener('click',close);$('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')close()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();window.MadaCommentModalV4={open:open,close:close};
})();
