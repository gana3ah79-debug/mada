/* Mada Reels Comments v1 — comments + replies */
(function(){'use strict';
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb, me=()=>window.madaUser?.()||window.user;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function load(postId){const s=sb(),u=me();if(!s)return;
 const r=await s.from('comments').select('id,author_id,body,created_at,parent_id').eq('post_id',postId).order('created_at',{ascending:true});
 const rows=r.data||[],ids=[...new Set(rows.map(x=>x.author_id))];
 const pr=ids.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};
 const pm=new Map((pr.data||[]).map(x=>[x.id,x]));
 const roots=rows.filter(x=>!x.parent_id),children=id=>rows.filter(x=>x.parent_id===id);
 const render=x=>{const p=pm.get(x.author_id)||{};const rs=children(x.id).map(render).join('');return `<div class="mrc-item"><div class="mrc-main"><b>${esc(p.display_name||'مستخدم Mada')}</b><span>${esc(x.body)}</span><button type="button" class="mrc-reply" data-reply="${x.id}">رد</button></div>${rs?`<div class="mrc-replies">${rs}</div>`:''}</div>`};
 window.showModal?.('تعليقات الريلز',`<div class="mrc-wrap"><div class="mrc-list">${roots.map(render).join('')||'<div class="empty">لا توجد تعليقات بعد.</div>'}</div><div class="mrc-compose"><input id="mrcInput" maxlength="500" placeholder="اكتب تعليقك…"><button id="mrcSend" class="primary">إرسال</button></div></div>`);
 const input=document.getElementById('mrcInput'),send=document.getElementById('mrcSend');let parent=null;
 document.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{parent=b.dataset.reply;input.focus();input.placeholder='اكتب ردك…';});
 send.onclick=async()=>{const body=input.value.trim();if(!u||!body)return;send.disabled=true;const payload={post_id:postId,author_id:u.id,body};if(parent)payload.parent_id=parent;const ins=await s.from('comments').insert(payload);if(ins.error){alert('تعذر إضافة التعليق: '+ins.error.message);send.disabled=false;return}load(postId)};
}
function enhance(){document.querySelectorAll('.mada-reels-v3 .mr-reel [data-mri-comment]').forEach(b=>{if(b.dataset.mrc)return;b.dataset.mrc='1';b.addEventListener('click',e=>{e.stopPropagation();load(b.dataset.mriComment)})})}
function css(){if(document.getElementById('mrc-style'))return;const s=document.createElement('style');s.id='mrc-style';s.textContent=`
.mrc-wrap{display:grid;gap:12px}.mrc-list{max-height:58vh;overflow:auto;display:grid;gap:9px}.mrc-item{display:grid;gap:5px}.mrc-main{padding:10px 12px;border-radius:14px;background:#f3f3f3;display:grid;gap:4px}.mrc-main b{font-size:13px}.mrc-main span{font-size:14px;line-height:1.5;word-break:break-word}.mrc-reply{width:max-content;border:0;background:transparent;font-size:12px;font-weight:700;padding:2px 0;color:#555}.mrc-replies{margin-right:18px;display:grid;gap:6px}.mrc-compose{display:grid;grid-template-columns:1fr auto;gap:8px;position:sticky;bottom:0}.mrc-compose input{min-width:0;padding:12px;border-radius:14px;border:1px solid #ddd;outline:none}.mrc-compose input:focus{border-color:#999}
`;document.head.appendChild(s)}
function boot(){css();enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();