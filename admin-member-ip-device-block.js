(function(){
'use strict';
const URL=window.MADA_SUPABASE_URL,KEY=window.MADA_SUPABASE_ANON_KEY||window.MADA_SUPABASE_KEY;if(!URL||!KEY||!window.supabase)return;
const sb=window.supabase.createClient(URL,KEY);const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
async function admin(){const{data}=await sb.auth.getUser();return data?.user?.id||null}
async function audit(uid,action,metadata){const a=await admin();if(a)await sb.from('admin_audit_log').insert({admin_id:a,action,target_type:'member',target_id:uid,metadata:metadata||{}})}
async function open(uid){
 const[{data:p},{data:s}]=await Promise.all([sb.from('profiles').select('display_name,username').eq('id',uid).maybeSingle(),sb.from('account_sessions').select('*').eq('user_id',uid).order('last_seen_at',{ascending:false}).limit(30)]);
 const box=document.createElement('div');box.style='position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:100000;overflow:auto;padding:14px';
 const rows=(s||[]).map(x=>{const m=x.session_label||'جهاز غير مسمى';return `<div style="padding:10px;border-bottom:1px solid #ddd"><b>${esc(m)}</b><br><small>آخر نشاط: ${x.last_seen_at?new Date(x.last_seen_at).toLocaleString('ar-EG'):'غير معروف'} ${x.revoked_at?' — 🚫 مسحوبة':''}</small><br><button data-id="${x.id}" class="revoke">🚪 سحب الجلسة</button></div>`}).join('');
 box.innerHTML=`<div style="max-width:720px;margin:20px auto;background:var(--card-bg,#fff);color:inherit;border-radius:18px;padding:18px"><h2>🚫 حظر الجهاز / الجلسة</h2><p><b>${esc(p?.display_name||p?.username||'العضو')}</b></p><h3>📱 الجلسات</h3>${rows||'<p>لا توجد جلسات مسجلة.</p>'}<hr><h3>🔒 حظر جهاز/بصمة</h3><input id="device" placeholder="معرّف الجهاز أو البصمة" style="width:100%;padding:10px;box-sizing:border-box"><button id="block" style="margin-top:8px">🚫 حظر المعرّف</button><div id="msg"></div><button id="close" style="margin-top:12px">إغلاق</button></div>`;
 document.body.appendChild(box);box.querySelector('#close').onclick=()=>box.remove();
 box.querySelectorAll('.revoke').forEach(b=>b.onclick=async()=>{const id=b.dataset.id;const{error}=await sb.from('account_sessions').update({revoked_at:new Date().toISOString()}).eq('id',id).eq('user_id',uid);if(error)alert(error.message);else{await audit(uid,'member_device_session_revoked',{session_id:id});b.disabled=true;b.textContent='تم السحب';}});
 box.querySelector('#block').onclick=async()=>{const value=box.querySelector('#device').value.trim();if(!value)return;const a=await admin();const{error}=await sb.from('member_device_blocks').insert({user_id:uid,device_key:value,created_by:a});if(error)alert(error.message);else{await audit(uid,'member_device_block',{device_key:value});box.querySelector('#msg').textContent='✅ تم تسجيل حظر الجهاز';box.querySelector('#device').value='';}};
}
window.madaOpenMemberDeviceBlock=open;
function inject(){const rows=document.querySelector('#userRows');if(!rows)return;rows.querySelectorAll('tr').forEach(tr=>{if(tr.dataset.deviceAdded)return;const btn=tr.querySelector('[onclick*="madaOpenMember"]');if(!btn)return;const m=String(btn.getAttribute('onclick')||'').match(/madaOpenMember\(['\"]([^'\"]+)/);if(!m)return;const b=document.createElement('button');b.textContent='🚫 جهاز';b.style.margin='2px';b.onclick=()=>open(m[1]);btn.parentElement.appendChild(b);tr.dataset.deviceAdded='1';});}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});setTimeout(inject,1200);
})();