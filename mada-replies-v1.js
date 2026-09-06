/* Mada Replies v1 - independent dynamic reply list inside the comment modal. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
const me=()=>window.user;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const emojis=['😀','😂','😍','🥰','😘','😎','😭','😡','😮','😢','👏','🔥','❤️','👍','🙏','🎉','💯','✨'];
let state={postId:null,commentId:null,commentAuthor:''};
function repliesBox(c){return c.querySelector('.mada-replies-list')}
function ensureReplyUI(c){
 if(c.querySelector('.mada-reply-actions'))return;
 const id=c.dataset.commentId||c.querySelector('[data-comment-id]')?.dataset.commentId||'';if(!id)return;
 c.dataset.commentId=id;
 const actions=document.createElement('div');actions.className='mada-reply-actions';actions.innerHTML='<button type="button" data-reply-open>↩ رد</button><button type="button" data-replies-toggle hidden>عرض الردود</button>';
 c.appendChild(actions);
 const box=document.createElement('div');box.className='mada-replies-list';c.appendChild(box);
 actions.querySelector('[data-reply-open]').onclick=()=>openComposer(c);
 actions.querySelector('[data-replies-toggle]').onclick=()=>{box.hidden=!box.hidden;actions.querySelector('[data-replies-toggle]').textContent=box.hidden?'عرض الردود':'إخفاء الردود'};
}
function openComposer(c){
 let old=c.querySelector('.mada-reply-compose');if(old){old.querySelector('input').focus();return}
 const name=c.querySelector('b')?.textContent?.trim()||'هذا الشخص';
 const box=document.createElement('div');box.className='mada-reply-compose';box.innerHTML='<button type="button" class="mada-reply-emoji">😊</button><input placeholder="الرد على '+esc(name)+'…" autocomplete="off"><button type="button" class="mada-reply-send">إرسال</button><div class="mada-reply-picker" hidden>'+emojis.map(x=>`<button type="button" data-emoji="${x}">${x}</button>`).join('')+'</div>';
 c.appendChild(box);const input=box.querySelector('input'),picker=box.querySelector('.mada-reply-picker');box.querySelector('.mada-reply-emoji').onclick=()=>picker.hidden=!picker.hidden;picker.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){input.value+=b.dataset.emoji;input.focus();picker.hidden=true}};const send=async()=>{const body=input.value.trim(),u=me(),s=client();if(!body)return;if(!u||!s){alert('سجّل الدخول أولاً.');return}const id=c.dataset.commentId;if(!id){alert('التعليق غير متاح للرد.');return}const b=box.querySelector('.mada-reply-send');b.disabled=true;b.textContent='جارٍ…';const temp=document.createElement('div');temp.className='mada-reply pending';temp.innerHTML='<b>'+esc(window.profile?.display_name||'أنت')+'</b><span>'+esc(body)+'</span><small>جارٍ النشر…</small>';let list=repliesBox(c);list.hidden=false;list.appendChild(temp);const r=await s.from('comments').insert({post_id:state.postId,author_id:u.id,body,parent_id:id}).select('id,created_at').single();if(r.error){temp.remove();alert('تعذر إضافة الرد: '+r.error.message)}else{temp.dataset.commentId=r.data?.id||'';temp.classList.remove('pending');temp.querySelector('small').textContent='الآن';const t=c.querySelector('[data-replies-toggle]');t.hidden=false;const n=parseInt(t.dataset.count||'0',10)+1;t.dataset.count=n;t.textContent='إخفاء الردود';}b.disabled=false;b.textContent='إرسال';if(!r.error){input.value='';box.remove()}};box.querySelector('.mada-reply-send').onclick=send;input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};input.focus();}
async function loadReplies(c){const id=c.dataset.commentId;if(!id)return;const s=client();if(!s)return;const box=repliesBox(c);if(!box)return;const r=await s.from('comments').select('id,body,author_id,created_at').eq('parent_id',id).order('created_at',{ascending:true});if(r.error)return;box.innerHTML='';if(!r.data?.length){box.hidden=true;return}const ids=[...new Set(r.data.map(x=>x.author_id).filter(Boolean))];let names={};if(ids.length){const p=await s.from('profiles').select('id,display_name').in('id',ids);(p.data||[]).forEach(x=>names[x.id]=x.display_name||'مستخدم')}r.data.forEach(x=>{const d=document.createElement('div');d.className='mada-reply';d.dataset.commentId=x.id;d.innerHTML='<b>'+esc(names[x.author_id]||'مستخدم')+'</b><span>'+esc(x.body)+'</span><small>'+new Date(x.created_at).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'})+'</small>';box.appendChild(d)});box.hidden=false;const t=c.querySelector('[data-replies-toggle]');t.hidden=false;t.dataset.count=r.data.length;t.textContent='إخفاء الردود'}
function enhance(){
 $$('.mada-comments-list .comment').forEach(c=>{const id=c.dataset.commentId||c.getAttribute('data-comment-id')||c.querySelector('[data-comment-id]')?.getAttribute('data-comment-id');if(!id)return;c.dataset.commentId=id;ensureReplyUI(c);if(c.dataset.repliesLoaded)return;c.dataset.repliesLoaded='1';loadReplies(c)})
}
function boot(){const feed=$('#feed');if(feed)new MutationObserver(()=>setTimeout(enhance,30)).observe(feed,{childList:true,subtree:true});document.addEventListener('modal:comments-open',()=>setTimeout(enhance,30));setInterval(enhance,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.MadaRepliesV1={enhance,loadReplies,openComposer};
})();