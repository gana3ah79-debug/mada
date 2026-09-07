/* Mada Profile Post Social v1 — live likes, comments and shares without profile reload. */
(function(){'use strict';
if(window.__MADA_PROFILE_POST_SOCIAL_V1)return;window.__MADA_PROFILE_POST_SOCIAL_V1=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const toast=(t)=>window.showModal?.('',`<div class="fb-empty">${esc(t)}</div>`);
const state=new Map();
async function user(){try{return(await C().auth.getUser()).data?.user||null}catch{return null}}
async function stats(article){
 const id=article?.dataset?.postId;if(!id)return;
 const c=C();
 const [likes,comments,shares,me]=await Promise.all([
  c.from('post_likes').select('id',{count:'exact',head:true}).eq('post_id',id),
  c.from('comments').select('id',{count:'exact',head:true}).eq('post_id',id),
  c.from('post_shares').select('id',{count:'exact',head:true}).eq('post_id',id),
  user()
 ]);
 let liked=false;
 if(me){const q=await c.from('post_likes').select('id').eq('post_id',id).eq('user_id',me.id).maybeSingle();liked=!!q.data}
 state.set(id,{liked});
 const box=article.querySelector('.mada-profile-post-actions');
 if(box){box.querySelector('[data-action="like"]')?.classList.toggle('active',liked);box.querySelector('[data-action="like"] .count').textContent=likes.count||0;box.querySelector('[data-action="comment"] .count').textContent=comments.count||0;box.querySelector('[data-action="share"] .count').textContent=shares.count||0}
}
function inject(article){if(!article||article.querySelector('.mada-profile-post-actions'))return;const statsEl=article.querySelector('.fb-post-stats');if(!statsEl)return;
 statsEl.innerHTML='<span class="mada-profile-count-summary">👍 <span data-summary="likes">0</span> &nbsp; 💬 <span data-summary="comments">0</span> &nbsp; ↗ <span data-summary="shares">0</span></span>';
 const row=document.createElement('div');row.className='mada-profile-post-actions';row.innerHTML='<button type="button" data-action="like">👍 إعجاب <span class="count">0</span></button><button type="button" data-action="comment">💬 تعليق <span class="count">0</span></button><button type="button" data-action="share">↗ مشاركة <span class="count">0</span></button>';
 statsEl.insertAdjacentElement('afterend',row);stats(article);
}
async function like(article){const u=await user();if(!u)return toast('يجب تسجيل الدخول أولاً.');const id=article.dataset.postId,btn=article.querySelector('[data-action="like"]'),was=state.get(id)?.liked||false;btn.disabled=true;try{if(was){const q=await C().from('post_likes').delete().eq('post_id',id).eq('user_id',u.id);if(q.error)throw q.error}else{const q=await C().from('post_likes').insert({post_id:id,user_id:u.id});if(q.error)throw q.error}state.set(id,{liked:!was});await stats(article)}catch(e){console.error('[Mada Profile Social]',e);toast('تعذر تحديث الإعجاب.')}finally{btn.disabled=false}}
async function comments(article){const id=article.dataset.postId;const q=await C().from('comments').select('id,body,user_id,created_at').eq('post_id',id).order('created_at',{ascending:true}).limit(50);if(q.error)return toast('تعذر تحميل التعليقات.');const rows=q.data||[];const ids=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];let profiles=[];if(ids.length){const p=await C().from('profiles').select('id,display_name,username,avatar_url').in('id',ids);profiles=p.data||[]}const map=new Map(profiles.map(x=>[x.id,x]));const html=rows.map(x=>{const p=map.get(x.user_id);return `<div class="mada-profile-comment"><b>${esc(p?.display_name||p?.username||'مستخدم')}</b><span>${esc(x.body||'')}</span></div>`}).join('')||'<div class="fb-empty">لا توجد تعليقات بعد.</div>';window.showModal?.('💬 التعليقات',`<div class="mada-profile-comments" data-post-comments="${esc(id)}">${html}</div><div class="mada-profile-comment-form"><textarea id="madaProfileCommentInput" rows="2" placeholder="اكتب تعليقك..."></textarea><button id="madaProfileCommentSend" class="primary" type="button">إرسال</button></div>`);document.getElementById('madaProfileCommentSend')?.addEventListener('click',async()=>{const u=await user(),input=document.getElementById('madaProfileCommentInput'),body=input?.value?.trim();if(!u)return toast('يجب تسجيل الدخول أولاً.');if(!body)return;const ins=await C().from('comments').insert({post_id:id,user_id:u.id,body});if(ins.error)return toast('تعذر إضافة التعليق.');input.value='';await comments(article);await stats(article)})}
async function share(article){const id=article.dataset.postId;if(typeof window.sharePost==='function'){try{await window.sharePost(id);await stats(article);return}catch(e){console.warn(e)}}const u=await user();if(!u)return toast('يجب تسجيل الدخول أولاً.');const q=await C().from('post_shares').insert({post_id:id,user_id:u.id});if(q.error)return toast('تعذر مشاركة المنشور.');await stats(article);toast('تمت مشاركة المنشور بنجاح.');}
function scan(){document.querySelectorAll('.fb-post[data-post-id]').forEach(inject)}
document.addEventListener('click',e=>{const b=e.target.closest('.mada-profile-post-actions [data-action]');if(!b)return;const a=b.closest('.fb-post');if(!a)return;e.preventDefault();e.stopPropagation();const act=b.dataset.action;if(act==='like')like(a);else if(act==='comment')comments(a);else if(act==='share')share(a)},true);
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
scan();window.MadaProfilePostSocialV1={refresh:scan};
})();