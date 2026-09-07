/* Mada Profile Post Social v3 — real counters, stable actions and no duplicate listeners. */
(function(){'use strict';
if(window.__MADA_PROFILE_POST_SOCIAL_V3)return;window.__MADA_PROFILE_POST_SOCIAL_V3=true;
const C=()=>window.MADA_SUPABASE_CLIENT||window.sb;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const toast=t=>window.showModal?.('',`<div class="fb-empty">${esc(t)}</div>`);
const state=new Map();
const pendingStats=new Map();
let currentUser=null;
async function user(){if(currentUser)return currentUser;try{currentUser=(await C().auth.getUser()).data?.user||null}catch{currentUser=null}return currentUser}
function setCount(article,key,value){const n=Math.max(0,Number(value)||0);article.querySelector(`[data-summary="${key}"]`)?.replaceChildren(String(n));article.querySelector(`[data-action="${key}"] .count`)?.replaceChildren(String(n));}
function scheduleStats(article){const id=article?.dataset?.postId;if(!id)return;clearTimeout(pendingStats.get(id));pendingStats.set(id,setTimeout(()=>{pendingStats.delete(id);stats(article)},80))}
async function stats(article){
 const id=article?.dataset?.postId;if(!id||!C())return;
 try{
  const c=C(),me=await user();
  const [l,co,s,m]=await Promise.all([
   c.from('post_likes').select('id',{count:'exact',head:true}).eq('post_id',id),
   c.from('comments').select('id',{count:'exact',head:true}).eq('post_id',id),
   c.from('post_shares').select('id',{count:'exact',head:true}).eq('post_id',id),
   me?c.from('post_likes').select('id').eq('post_id',id).eq('user_id',me.id).maybeSingle():Promise.resolve({data:null,error:null})
  ]);
  if(l.error||co.error||s.error){console.warn('[Mada Profile Social] counter error',l.error||co.error||s.error);return}
  const liked=!!m.data,counts={likes:l.count||0,comments:co.count||0,shares:s.count||0};
  state.set(id,{liked,...counts});
  setCount(article,'likes',counts.likes);setCount(article,'comments',counts.comments);setCount(article,'shares',counts.shares);
  article.querySelector('[data-action="like"]')?.classList.toggle('active',liked);
 }catch(e){console.warn('[Mada Profile Social] stats failed',e)}
}
function inject(article){
 if(!article||article.querySelector('.mada-profile-post-actions'))return;
 const statsEl=article.querySelector('.fb-post-stats');if(!statsEl)return;
 statsEl.innerHTML='<span class="mada-profile-count-summary">👍 <span data-summary="likes">0</span> &nbsp; 💬 <span data-summary="comments">0</span> &nbsp; ↗ <span data-summary="shares">0</span></span>';
 const row=document.createElement('div');row.className='mada-profile-post-actions';row.innerHTML='<button type="button" data-action="likes" aria-label="إعجاب">👍 إعجاب <span class="count">0</span></button><button type="button" data-action="comments" aria-label="تعليق">💬 تعليق <span class="count">0</span></button><button type="button" data-action="shares" aria-label="مشاركة">↗ مشاركة <span class="count">0</span></button>';
 statsEl.insertAdjacentElement('afterend',row);scheduleStats(article);
}
async function like(article){
 const u=await user();if(!u)return toast('يجب تسجيل الدخول أولاً.');
 const id=article.dataset.postId,btn=article.querySelector('[data-action="likes"]'),old=state.get(id)||{},was=!!old.liked; if(btn)btn.disabled=true;
 try{
  const q=was?await C().from('post_likes').delete().eq('post_id',id).eq('user_id',u.id):await C().from('post_likes').insert({post_id:id,user_id:u.id});
  if(q.error)throw q.error;
  state.set(id,{...old,liked:!was,likes:Math.max(0,(old.likes||0)+(was?-1:1))});
  article.querySelector('[data-action="likes"]')?.classList.toggle('active',!was);scheduleStats(article);
 }catch(e){console.error('[Mada Profile Social] like',e);toast('تعذر تحديث الإعجاب.')}finally{if(btn)btn.disabled=false}
}
async function comments(article){
 const id=article.dataset.postId,q=await C().from('comments').select('id,body,user_id,created_at').eq('post_id',id).order('created_at',{ascending:true}).limit(50);
 if(q.error)return toast('تعذر تحميل التعليقات.');
 const rows=q.data||[],ids=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];let profiles=[];
 if(ids.length){const p=await C().from('profiles').select('id,display_name,username,avatar_url').in('id',ids);profiles=p.data||[]}
 const map=new Map(profiles.map(x=>[x.id,x]));
 const html=rows.map(x=>{const p=map.get(x.user_id);return `<div class="mada-profile-comment"><b>${esc(p?.display_name||p?.username||'مستخدم')}</b><span>${esc(x.body||'')}</span></div>`}).join('')||'<div class="fb-empty">لا توجد تعليقات بعد.</div>';
 window.showModal?.('💬 التعليقات',`<div class="mada-profile-comments" data-post-comments="${esc(id)}">${html}</div><div class="mada-profile-comment-form"><textarea id="madaProfileCommentInput" rows="2" placeholder="اكتب تعليقك..."></textarea><button id="madaProfileCommentSend" class="primary" type="button">إرسال</button></div>`);
 const send=document.getElementById('madaProfileCommentSend');if(!send)return;
 send.addEventListener('click',async()=>{const u=await user(),input=document.getElementById('madaProfileCommentInput'),body=input?.value?.trim();if(!u)return toast('يجب تسجيل الدخول أولاً.');if(!body)return;send.disabled=true;const ins=await C().from('comments').insert({post_id:id,user_id:u.id,body});if(ins.error){send.disabled=false;return toast('تعذر إضافة التعليق.')}input.value='';await comments(article);scheduleStats(article)}, {once:true});
}
async function share(article){
 const id=article.dataset.postId;
 if(typeof window.sharePost==='function'){try{await window.sharePost(id);scheduleStats(article);return}catch(e){console.warn('[Mada Profile Share]',e)}}
 const u=await user();if(!u)return toast('يجب تسجيل الدخول أولاً.');
 const q=await C().from('post_shares').insert({post_id:id,user_id:u.id});if(q.error)return toast('تعذر مشاركة المنشور.');scheduleStats(article);toast('تمت مشاركة المنشور بنجاح.');
}
function scan(){document.querySelectorAll('.fb-post[data-post-id]').forEach(inject)}
document.addEventListener('click',e=>{const b=e.target.closest('.mada-profile-post-actions [data-action]');if(!b)return;const a=b.closest('.fb-post');if(!a)return;e.preventDefault();e.stopImmediatePropagation();const act=b.dataset.action;if(act==='likes')like(a);else if(act==='comments')comments(a);else if(act==='shares')share(a)},true);
const mo=new MutationObserver(()=>{clearTimeout(window.__MADA_PROFILE_SOCIAL_SCAN);window.__MADA_PROFILE_SOCIAL_SCAN=setTimeout(scan,60)});if(document.body)mo.observe(document.body,{childList:true,subtree:true});
scan();window.MadaProfilePostSocialV3={refresh:scan,refreshPost:stats};
const s=document.createElement('style');s.textContent='.mada-profile-post-actions{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #e4e6eb;margin-top:8px}.mada-profile-post-actions button{border:0;background:transparent;padding:10px 4px;font:700 13px inherit;color:#65676b;cursor:pointer}.mada-profile-post-actions button.active{color:#1877f2}.mada-profile-post-actions button:disabled{opacity:.55}.mada-profile-count-summary{font-size:12px;color:#65676b}.mada-profile-comments{display:grid;gap:8px;max-height:55vh;overflow:auto}.mada-profile-comment{background:#f0f2f5;border-radius:12px;padding:9px 11px;display:grid;gap:3px}.mada-profile-comment span{white-space:pre-wrap;word-break:break-word}.mada-profile-comment-form{display:grid;gap:8px;margin-top:12px}.mada-profile-comment-form textarea{width:100%;box-sizing:border-box;border:1px solid #ccd0d5;border-radius:10px;padding:9px;font:inherit;resize:vertical}.mada-profile-comment-form button{border:0;border-radius:10px;padding:10px;font:inherit;font-weight:800}';document.head.appendChild(s);
})();