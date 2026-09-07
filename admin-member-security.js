(function(){
'use strict';
const URL=window.MADA_SUPABASE_URL, KEY=window.MADA_SUPABASE_ANON_KEY||window.MADA_SUPABASE_KEY;
if(!URL||!KEY||!window.supabase)return;
const sb=window.supabase.createClient(URL,KEY);
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
async function admin(){const {data}=await sb.auth.getUser();return data?.user?.id||null}
async function audit(uid,action,meta){const a=await admin();if(!a)return;await sb.from('admin_audit_log').insert({admin_id:a,action,target_type:'member',target_id:uid,metadata:meta||{}})}
async function security(uid){
 const [{data:p},{data:c},{data:w},{data:s},{data:e},{data:f}]=await Promise.all([
  sb.from('profiles').select('id,display_name,username,is_banned,is_verified,is_premium,created_at,city').eq('id',uid).maybeSingle(),
  sb.from('member_controls').select('*').eq('user_id',uid).maybeSingle(),
  sb.from('member_warnings').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(20),
  sb.from('account_sessions').select('*').eq('user_id',uid).order('last_seen_at',{ascending:false}).limit(20),
  sb.from('account_security_events').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(30),
  sb.from('member_security_flags').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(30)
 ]);
 let score=0; if(p?.is_banned)score+=100; if(c?.frozen_until&&new Date(c.frozen_until)>new Date())score+=35; if(c?.monitored)score+=20; if(c?.posting_disabled||c?.commenting_disabled||c?.messaging_disabled||c?.media_disabled)score+=15; score+=(w||[]).reduce((n,x)=>n+Number(x.level||1)*10,0); score+=(f||[]).filter(x=>x.status==='open').reduce((n,x)=>n+({low:5,medium:10,high:20,critical:40}[x.severity]||10),0); score=Math.min(100,score);
 const risk=score>=70?'مرتفع جداً':score>=40?'مرتفع':score>=20?'متوسط':'منخفض';
 return {p,c,w:w||[],s:s||[],e:e||[],f:f||[],score,risk};
}
async function openSecurity(uid){
 const x=await security(uid); if(!x.p)return alert('العضو غير موجود');
 const box=document.createElement('div');box.id='memberSecurityModal';box.style='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;overflow:auto;padding:14px';
 const events=[...x.e.map(v=>({t:v.created_at,k:'أمان',d:v.event_type+' '+(v.metadata?JSON.stringify(v.metadata):'')})),...x.s.map(v=>({t:v.last_seen_at||v.created_at,k:'جلسة',d:v.session_label||'جهاز'})),...x.w.map(v=>({t:v.created_at,k:'إنذار',d:'المستوى '+v.level+' — '+(v.reason||'')}))].sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,40);
 box.innerHTML=`<div style="max-width:760px;margin:20px auto;background:var(--card-bg,#fff);color:inherit;border-radius:18px;padding:18px"><h2>🛡️ مركز أمان العضو</h2><div><b>${esc(x.p.display_name||x.p.username||'عضو')}</b> @${esc(x.p.username||'')} — ${esc(x.p.city||'')}</div><div style="margin:12px 0;padding:12px;border-radius:12px;background:${x.score>=40?'#fff0f0':'#f3fff4'}"><b>درجة المخاطر: ${x.score}/100 — ${x.risk}</b></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="secMonitor">👁️ ${x.c?.monitored?'إلغاء المراقبة':'تفعيل المراقبة'}</button><button id="secRevoke">🚪 سحب كل الجلسات</button><button id="secFlag">🚩 إضافة علامة خطر</button></div><h3>🚩 العلامات</h3><div>${x.f.length?x.f.map(v=>`<div style="padding:8px;border-bottom:1px solid #ddd"><b>${esc(v.severity)}</b> ${esc(v.flag_type)} — ${esc(v.reason||'')} <small>${esc(v.status)}</small></div>`).join(''):'لا توجد علامات'}</div><h3>🕒 آخر النشاطات الأمنية</h3><div>${events.length?events.map(v=>`<div style="padding:7px;border-bottom:1px solid #ddd"><b>${esc(v.k)}</b> — ${esc(v.d)}<br><small>${new Date(v.t).toLocaleString('ar-EG')}</small></div>`).join(''):'لا توجد أحداث'}</div><div style="margin-top:16px"><button id="secClose">إغلاق</button></div></div>`;
 document.body.appendChild(box);
 box.querySelector('#secClose').onclick=()=>box.remove();
 box.querySelector('#secMonitor').onclick=async()=>{const a=await admin();await sb.from('member_controls').upsert({user_id:uid,monitored:!x.c?.monitored,updated_by:a,updated_at:new Date().toISOString()},{onConflict:'user_id'});await audit(uid,'member_security_monitor',{enabled:!x.c?.monitored});box.remove();openSecurity(uid)};
 box.querySelector('#secRevoke').onclick=async()=>{if(!confirm('سحب كل جلسات هذا العضو؟'))return;const {data,error}=await sb.rpc('admin_revoke_all_member_sessions',{p_user_id:uid});if(error)alert(error.message);else{await audit(uid,'member_revoke_all_sessions',{count:data});alert('تم سحب '+data+' جلسة');box.remove();openSecurity(uid)}};
 box.querySelector('#secFlag').onclick=async()=>{const reason=prompt('سبب علامة الخطر؟');if(!reason)return;const a=await admin();await sb.from('member_security_flags').insert({user_id:uid,flag_type:'manual_review',severity:'medium',reason,created_by:a});await audit(uid,'member_security_flag',{reason});box.remove();openSecurity(uid)};
}
window.madaOpenMemberSecurity=openSecurity;
function inject(){const rows=document.querySelector('#userRows');if(!rows)return;rows.querySelectorAll('tr').forEach(tr=>{if(tr.dataset.secAdded)return;const btn=tr.querySelector('[onclick*="madaOpenMember"]');if(!btn)return;const m=String(btn.getAttribute('onclick')||'').match(/madaOpenMember\(['\"]([^'\"]+)/);if(!m)return;const b=document.createElement('button');b.textContent='🛡️ أمان';b.style.margin='2px';b.onclick=()=>openSecurity(m[1]);btn.parentElement.appendChild(b);tr.dataset.secAdded='1';});}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});setTimeout(inject,1200);
})();