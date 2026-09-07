(function(){
'use strict';
const URL=window.MADA_SUPABASE_URL,KEY=window.MADA_SUPABASE_ANON_KEY||window.MADA_SUPABASE_KEY;
if(!URL||!KEY||!window.supabase)return;
const sb=window.supabase.createClient(URL,KEY);
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
async function admin(){const {data}=await sb.auth.getUser();return data?.user?.id||null}
async function audit(uid,action,metadata){const a=await admin();if(a)await sb.from('admin_audit_log').insert({admin_id:a,action,target_type:'member',target_id:uid,metadata:metadata||{}})}
async function tags(uid){const {data,error}=await sb.from('member_admin_tags').select('*').eq('user_id',uid).order('created_at',{ascending:false});if(error)throw error;return data||[]}
async function openTags(uid){
 const t=await tags(uid);const box=document.createElement('div');box.style='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100000;overflow:auto;padding:14px';
 box.innerHTML=`<div style="max-width:650px;margin:20px auto;background:var(--card-bg,#fff);color:inherit;border-radius:18px;padding:18px"><h2>🏷️ علامات العضو</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${t.length?t.map(x=>`<span style="display:inline-flex;gap:6px;align-items:center;padding:7px 10px;border-radius:999px;background:#eef2f7;border:1px solid #d9e0ea"><b>${esc(x.tag)}</b><small>${esc(x.color)}</small><button data-del="${esc(x.id)}">×</button></span>`).join(''):'لا توجد علامات'}</div><hr><input id="tagName" placeholder="اسم العلامة مثل: عضو موثوق" style="width:100%;padding:11px;border:1px solid #dbe2ec;border-radius:10px"><input id="tagNote" placeholder="ملاحظة اختيارية" style="width:100%;padding:11px;border:1px solid #dbe2ec;border-radius:10px;margin-top:8px"><select id="tagColor" style="width:100%;padding:11px;border:1px solid #dbe2ec;border-radius:10px;margin-top:8px"><option value="gray">رمادي</option><option value="blue">أزرق</option><option value="green">أخضر</option><option value="yellow">أصفر</option><option value="red">أحمر</option></select><div style="display:flex;gap:8px;margin-top:10px"><button id="tagAdd">➕ إضافة</button><button id="tagClose">إغلاق</button></div></div>`;
 document.body.appendChild(box);box.querySelector('#tagClose').onclick=()=>box.remove();
 box.querySelector('#tagAdd').onclick=async()=>{const tag=box.querySelector('#tagName').value.trim();if(!tag)return alert('اكتب اسم العلامة');const a=await admin();const {error}=await sb.from('member_admin_tags').insert({user_id:uid,tag,color:box.querySelector('#tagColor').value,note:box.querySelector('#tagNote').value.trim()||null,created_by:a});if(error)return alert(error.message);await audit(uid,'member_tag_add',{tag});box.remove();openTags(uid)};
 box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{const id=b.dataset.del;if(!confirm('حذف هذه العلامة؟'))return;const {error}=await sb.from('member_admin_tags').delete().eq('id',id);if(error)return alert(error.message);await audit(uid,'member_tag_delete',{id});box.remove();openTags(uid)});
}
window.madaOpenMemberTags=openTags;
function inject(){const rows=document.querySelector('#userRows');if(!rows)return;rows.querySelectorAll('tr').forEach(tr=>{if(tr.dataset.tagsAdded)return;const btn=tr.querySelector('[onclick*="madaOpenMember"]');if(!btn)return;const m=String(btn.getAttribute('onclick')||'').match(/madaOpenMember\(['\"]([^'\"]+)/);if(!m)return;const b=document.createElement('button');b.textContent='🏷️ علامات';b.style.margin='2px';b.onclick=()=>openTags(m[1]);btn.parentElement.appendChild(b);tr.dataset.tagsAdded='1';});}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});setTimeout(inject,1200);
})();