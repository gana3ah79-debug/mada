/* Mada modern comments interactions v1 — dynamic reply/likes UI + post-owner badge. */
(function(){'use strict';
let client=null,postId=null,ownerId=null,openPop=null,booted=false;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const name=p=>p?.display_name||p?.name||p?.username||'مستخدم';
function getClient(){return window.MADA_SUPABASE_CLIENT||window.sb||null}
function closePop(){if(openPop){openPop.remove();openPop=null}}
async function showLikes(id,button){
  closePop();
  if(!client||!id)return;
  const r=await client.from('comment_likes').select('user_id,created_at').eq('comment_id',id).order('created_at',{ascending:false}).limit(50);
  if(r.error)return;
  const rows=r.data||[];
  if(!rows.length){return}
  const ids=[...new Set(rows.map(x=>x.user_id).filter(Boolean))];
  const p=ids.length?(await client.from('profiles').select('id,display_name,username,avatar_url').in('id',ids)).data||[]:[];
  const map=new Map(p.map(x=>[x.id,x]));
  const pop=document.createElement('div');pop.className='comment-likes-popover';pop.dataset.side='left';
  const title=document.createElement('div');title.className='comment-likes-title';title.textContent=`الإعجابات · ${rows.length}`;pop.appendChild(title);
  const list=document.createElement('div');list.className='comment-likes-list';
  rows.forEach(x=>{const u=map.get(x.user_id)||{};const n=name(u);const item=document.createElement('div');item.className='comment-like-user';const av=u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="" loading="lazy">`:`<span class="like-avatar">${esc((n[0]||'م').toUpperCase())}</span>`;item.innerHTML=av+`<strong>${esc(n)}</strong>`+(x.user_id===ownerId?'<span class="comment-like-owner">صاحب المنشور</span>':'');list.appendChild(item)});
  pop.appendChild(list);document.body.appendChild(pop);openPop=pop;
  if(window.innerWidth>600){const r=button.getBoundingClientRect();const w=Math.min(310,window.innerWidth-28);let left=r.left;left=Math.max(14,Math.min(left,window.innerWidth-w-14));pop.style.width=w+'px';pop.style.left=left+'px';pop.style.top=Math.max(12,r.top-pop.offsetHeight-8)+'px';pop.dataset.side='left'}
}
function addOwnerBadges(){if(!ownerId)return;document.querySelectorAll('.comment-row[data-author]').forEach(row=>{if(row.dataset.author!==ownerId||row.querySelector('.comment-owner-badge'))return;const strong=row.querySelector('.comment-author strong');if(!strong)return;const b=document.createElement('span');b.className='comment-owner-badge';b.textContent='صاحب المنشور';strong.insertAdjacentElement('afterend',b)})}
function arrange(){document.querySelectorAll('.comment-actions').forEach(a=>{if(a.dataset.modernized)return;a.dataset.modernized='1';const like=a.querySelector('[data-like-comment]');if(!like)return;const buttons=[...a.children];const left=document.createElement('div');left.className='comment-action-group';const right=document.createElement('div');right.className='comment-action-group';buttons.forEach(b=>{if(b===like)left.appendChild(b);else right.appendChild(b)});a.append(left,right)})}
function observe(){const list=document.getElementById('commentsList');if(!list)return;new MutationObserver(()=>{arrange();addOwnerBadges()}).observe(list,{childList:true,subtree:true});arrange();addOwnerBadges()}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-like-comment]');if(b){setTimeout(()=>showLikes(b.dataset.likeComment,b),120);return}if(!e.target.closest('.comment-likes-popover'))closePop()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closePop()})}
async function boot(){if(booted||!location.pathname.endsWith('comments.html'))return;booted=true;client=getClient();postId=new URLSearchParams(location.search).get('post');if(!client||!postId)return;try{const r=await client.from('posts').select('author_id').eq('id',postId).maybeSingle();ownerId=r.data?.author_id||null}catch{}bind();observe()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();