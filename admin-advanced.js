(()=>{
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  const tabs=[
    ['advanced-analytics','📈','التحليلات المتقدمة'],
    ['comments','💬','التعليقات'],
    ['admin-roles','🔐','صلاحيات الأدمن'],
    ['audit-log','📜','سجل العمليات'],
    ['media-center','🖼️','مركز الوسائط'],
    ['system-health','🛡️','مراقبة النظام']
  ];
  const style=document.createElement('style');
  style.textContent=`.advanced-sep{margin:10px 4px 4px;padding:8px 10px;color:#8a95a6;font-size:11px;font-weight:900;border-top:1px solid #edf1f5}.adv-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.adv-actions button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.health-ok{color:#087443;background:#eaf8f0;padding:5px 9px;border-radius:15px}.health-bad{color:#b42318;background:#fff0f0;padding:5px 9px;border-radius:15px}.mini{color:#7d8899;font-size:12px}.media-thumb{width:100%;height:170px;object-fit:cover;border-radius:14px;margin-top:8px}.role-select{padding:7px;border:1px solid #dde4ed;border-radius:9px}.metric{display:flex;justify-content:space-between;align-items:center}.metric b{font-size:28px;color:#1872e8}`;
  document.head.appendChild(style);
  function addTabs(){
    const aside=document.querySelector('aside'); if(!aside)return;
    if(aside.querySelector('.advanced-sep'))return;
    const sep=document.createElement('div');sep.className='advanced-sep';sep.textContent='إضافات الإدارة';aside.appendChild(sep);
    tabs.forEach(([id,icon,label])=>{const b=document.createElement('button');b.dataset.advancedTab=id;b.innerHTML=`<i>${icon}</i> ${label}`;b.onclick=()=>render(id);aside.appendChild(b)});
  }
  async function count(table,filter){let q=sb.from(table).select('*',{count:'exact',head:true});if(filter)q=filter(q);const r=await q;return r.count||0}
  async function render(id){
    document.querySelectorAll('aside button').forEach(b=>b.classList.toggle('active',b.dataset.advancedTab===id));
    $('content').innerHTML='<div class="card empty">جاري تحميل البيانات…</div>';
    if(id==='advanced-analytics')return analytics();
    if(id==='comments')return comments();
    if(id==='admin-roles')return roles();
    if(id==='audit-log')return audit();
    if(id==='media-center')return media();
    if(id==='system-health')return health();
  }
  async function analytics(){
    const [u,p,c,l,r,pr,pay]=await Promise.all([count('profiles'),count('posts'),count('comments'),count('post_likes'),count('reports'),count('subscriptions',q=>q.in('status',['active','trialing'])),count('payments',q=>q.eq('status','succeeded'))]);
    $('content').innerHTML=`<div class="admin-title"><div><h2>📈 التحليلات المتقدمة</h2><small>مؤشرات حية من بيانات Mada</small></div></div><div class="grid">${[['👥','المستخدمون',u],['📝','المنشورات',p],['💬','التعليقات',c],['👍','الإعجابات',l],['🚩','البلاغات',r],['💎','Premium نشط',pr],['💰','المدفوعات الناجحة',pay]].map(x=>`<div class="card metric"><span>${x[0]} ${x[1]}</span><b>${x[2]}</b></div>`).join('')}</div><div class="card" style="margin-top:14px"><h3>📊 نسب التفاعل</h3><p>تعليقات لكل منشور: <b>${p?((c/p)*100).toFixed(1):'0'}%</b></p><p>إعجابات لكل منشور: <b>${p?((l/p)*100).toFixed(1):'0'}%</b></p><p>بلاغات لكل 100 مستخدم: <b>${u?((r/u)*100).toFixed(1):'0'}</b></p></div>`;
  }
  async function comments(){
    const {data,error}=await sb.from('comments').select('id,post_id,user_id,body,created_at').order('created_at',{ascending:false}).limit(200);
    if(error){$('content').innerHTML=`<div class="card"><h2>💬 التعليقات</h2><p>تعذر قراءة جدول التعليقات: ${esc(error.message)}</p></div>`;return}
    const ids=[...new Set((data||[]).map(x=>x.user_id).filter(Boolean))];let profiles={};if(ids.length){const r=await sb.from('profiles').select('id,display_name,username').in('id',ids);(r.data||[]).forEach(x=>profiles[x.id]=x)}
    $('content').innerHTML=`<div class="admin-title"><div><h2>💬 إدارة التعليقات</h2><small>${data?.length||0} تعليق حديث</small></div></div><div class="grid">${(data||[]).map(x=>`<article class="card"><b>${esc(profiles[x.user_id]?.display_name||'مستخدم')}</b> <small>@${esc(profiles[x.user_id]?.username||'')}</small><p>${esc(x.body||'')}</p><small>${new Date(x.created_at).toLocaleString('ar-EG')}</small><div class="adv-actions"><button class="danger" onclick="window.madaAdvancedDeleteComment('${x.id}')">🗑️ حذف</button></div></article>`).join('')||'<div class="card empty">لا توجد تعليقات.</div>'}</div>`;
  }
  window.madaAdvancedDeleteComment=async id=>{if(!confirm('حذف هذا التعليق؟'))return;const {error}=await sb.from('comments').delete().eq('id',id);if(error){alert('تعذر حذف التعليق');return}render('comments')};
  async function roles(){
    const {data,error}=await sb.from('profiles').select('id,display_name,username,role,is_banned,created_at').eq('role','admin').order('created_at',{ascending:false});
    if(error){$('content').innerHTML=`<div class="card">تعذر تحميل صلاحيات الأدمن: ${esc(error.message)}</div>`;return}
    $('content').innerHTML=`<div class="admin-title"><div><h2>🔐 صلاحيات الأدمن</h2><small>إدارة الحسابات التي تحمل دور admin</small></div></div><div class="card"><table class="table"><thead><tr><th>المسؤول</th><th>الحالة</th><th>الدور</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td><b>${esc(x.display_name)}</b><br><small>@${esc(x.username||'')}</small></td><td>${x.is_banned?'<span class="danger">محظور</span>':'<span class="ok">نشط</span>'}</td><td><span class="badge">👑 مسؤول</span></td></tr>`).join('')||'<tr><td colspan="3">لا يوجد مسؤولو إدارة.</td></tr>'}</tbody></table></div><div class="notice">لأمان التطبيق، تغيير الأدوار سيتم في خطوة لاحقة عبر وظيفة آمنة على الخادم، ولن نفتح ترقية الحسابات من الواجهة مباشرة.</div>`;
  }
  async function audit(){
    const {data,error}=await sb.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(200);
    if(error){$('content').innerHTML=`<div class="card"><h2>📜 سجل العمليات</h2><p>تعذر تحميل السجل: ${esc(error.message)}</p></div>`;return}
    $('content').innerHTML=`<div class="admin-title"><div><h2>📜 سجل عمليات الأدمن</h2><small>آخر 200 عملية</small></div></div><div class="card"><table class="table"><thead><tr><th>العملية</th><th>النوع</th><th>المعرّف</th><th>التاريخ</th></tr></thead><tbody>${(data||[]).map(x=>`<tr><td><b>${esc(x.action)}</b></td><td>${esc(x.target_type||'-')}</td><td><small>${esc(x.target_id||'-')}</small></td><td>${x.created_at?new Date(x.created_at).toLocaleString('ar-EG'):'-'}</td></tr>`).join('')||'<tr><td colspan="4">لا توجد عمليات مسجلة.</td></tr>'}</tbody></table></div>`;
  }
  async function media(){
    const {data,error}=await sb.from('posts').select('id,author_id,body,media_url,created_at').not('media_url','is',null).order('created_at',{ascending:false}).limit(100);
    if(error){$('content').innerHTML=`<div class="card"><h2>🖼️ مركز الوسائط</h2><p>تعذر تحميل الوسائط: ${esc(error.message)}</p></div>`;return}
    $('content').innerHTML=`<div class="admin-title"><div><h2>🖼️ مركز الوسائط</h2><small>الصور والفيديوهات المرتبطة بالمنشورات</small></div></div><div class="grid">${(data||[]).map(x=>`<article class="card"><small>${new Date(x.created_at).toLocaleString('ar-EG')}</small><img class="media-thumb" src="${esc(x.media_url)}" alt="وسائط المنشور" onerror="this.style.display='none'"><p>${esc((x.body||'').slice(0,120))}</p><button class="danger" onclick="window.madaAdvancedDeletePostMedia('${x.id}')">🗑️ حذف المنشور</button></article>`).join('')||'<div class="card empty">لا توجد وسائط.</div>'}</div>`;
  }
  window.madaAdvancedDeletePostMedia=async id=>{if(!confirm('حذف المنشور والوسائط المرتبطة به؟'))return;const {error}=await sb.from('posts').delete().eq('id',id);if(error){alert('تعذر الحذف');return}render('media-center')};
  async function health(){
    const tables=['profiles','posts','comments','reports','subscriptions','payments','admin_audit_log'];
    const rows=await Promise.all(tables.map(async t=>{try{const {error}=await sb.from(t).select('*',{count:'exact',head:true});return [t,!error,error?.message||''] }catch(e){return [t,false,e.message]}}));
    $('content').innerHTML=`<div class="admin-title"><div><h2>🛡️ مراقبة النظام</h2><small>فحص اتصال لوحة الإدارة بالجداول الأساسية</small></div></div><div class="card"><table class="table"><thead><tr><th>المكوّن</th><th>الحالة</th><th>التفاصيل</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x[0])}</b></td><td>${x[1]?'<span class="health-ok">● يعمل</span>':'<span class="health-bad">● مشكلة</span>'}</td><td class="mini">${esc(x[2]||'الاتصال والقراءة متاحان')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function boot(){addTabs();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
