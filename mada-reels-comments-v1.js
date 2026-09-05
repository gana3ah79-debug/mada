/* Mada Reels Comments v2 — isolated overlay, no page navigation, keyboard safe */
(function(){'use strict';
const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb,me=()=>window.madaUser?.()||window.user;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let overlay=null;
function close(){overlay?.remove();overlay=null;document.body.classList.remove('mrc-open')}
async function load(postId){const s=sb(),u=me();if(!s)return;
 const r=await s.from('comments').select('id,author_id,body,created_at,parent_id').eq('post_id',postId).order('created_at',{ascending:true});
 const rows=r.data||[],ids=[...new Set(rows.map(x=>x.author_id))];
 const pr=ids.length?await s.from('profiles').select('id,display_name,avatar_url').in('id',ids):{data:[]};
 const pm=new Map((pr.data||[]).map(x=>[x.id,x]));
 const roots=rows.filter(x=>!x.parent_id),children=id=>rows.filter(x=>x.parent_id===id);
 const render=x=>{const p=pm.get(x.author_id)||{},rs=children(x.id).map(render).join('');return `<div class="mrc-item"><div class="mrc-main"><b>${esc(p.display_name||'مستخدم Mada')}</b><span>${esc(x.body)}</span><button type="button" class="mrc-reply" data-reply="${x.id}">رد</button></div>${rs?`<div class="mrc-replies">${rs}</div>`:''}</div>`};
 close();overlay=document.createElement('div');overlay.className='mrc-overlay';overlay.innerHTML=`<div class="mrc-sheet" role="dialog" aria-modal="true"><div class="mrc-head"><b>تعليقات الريلز</b><button type="button" class="mrc-close">×</button></div><div class="mrc-list">${roots.map(render).join('')||'<div class="mrc-empty">لا توجد تعليقات بعد.</div>'}</div><div class="mrc-compose"><input class="mrc-input" maxlength="500" placeholder="اكتب تعليقك…"><button type="button" class="mrc-send">إرسال</button></div></div>`;
 document.body.appendChild(overlay);document.body.classList.add('mrc-open');
 const sheet=overlay.querySelector('.mrc-sheet'),input=overlay.querySelector('.mrc-input'),send=overlay.querySelector('.mrc-send');let parent=null;
 overlay.querySelector('.mrc-close').onclick=e=>{e.preventDefault();e.stopPropagation();close()};overlay.addEventListener('click',e=>{if(e.target===overlay)close()});sheet.addEventListener('click',e=>e.stopPropagation());
 overlay.querySelectorAll('[data-reply]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();parent=b.dataset.reply;input.placeholder='اكتب ردك…';input.focus()});
 send.onclick=async e=>{e.preventDefault();e.stopPropagation();const body=input.value.trim();if(!u||!body)return;send.disabled=true;const payload={post_id:postId,author_id:u.id,body};if(parent)payload.parent_id=parent;const ins=await s.from('comments').insert(payload);if(ins.error){alert('تعذر إضافة التعليق: '+ins.error.message);send.disabled=false;return}load(postId)};
 setTimeout(()=>input.focus(),80);
}
function enhance(){document.querySelectorAll('.mada-reels-v3 .mr-reel [data-mri-comment]').forEach(b=>{if(b.dataset.mrc)return;b.dataset.mrc='1';b.onclick=null;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();load(b.dataset.mriComment)},true)})}
function css(){if(document.getElementById('mrc-style'))return;const s=document.createElement('style');s.id='mrc-style';s.textContent=`
body.mrc-open{overflow:hidden!important}.mrc-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.42);display:flex;align-items:flex-end;justify-content:center;direction:rtl;padding:0;overscroll-behavior:contain}.mrc-sheet{width:min(100%,620px);max-height:82dvh;background:#fff;border-radius:22px 22px 0 0;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;box-shadow:0 -8px 35px #0004;touch-action:auto}.mrc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee;font-size:18px}.mrc-close{border:0;background:transparent;font-size:30px;line-height:1;color:#555;padding:4px 10px}.mrc-list{min-height:0;max-height:58dvh;overflow:auto;padding:12px;display:grid;align-content:start;gap:9px;-webkit-overflow-scrolling:touch}.mrc-item{display:grid;gap:5px}.mrc-main{padding:10px 12px;border-radius:14px;background:#f3f4f6;display:grid;gap:4px}.mrc-main b{font-size:13px}.mrc-main span{font-size:14px;line-height:1.5;word-break:break-word}.mrc-reply{width:max-content;border:0;background:transparent;font-size:12px;font-weight:700;padding:2px 0;color:#2563eb}.mrc-replies{margin-right:18px;display:grid;gap:6px}.mrc-compose{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 12px;border-top:1px solid #eee;background:#fff}.mrc-input{min-width:0;padding:12px;border-radius:14px;border:1px solid #ddd;outline:none;font-size:15px}.mrc-input:focus{border-color:#2563eb}.mrc-send{border:0;border-radius:14px;padding:0 16px;background:#2563eb;color:#fff;font-weight:700}.mrc-send:disabled{opacity:.55}.mrc-empty{padding:25px;text-align:center;color:#777}
`;document.head.appendChild(s)}
function boot(){css();enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.MadaReelsComments={open:load,close};
})();