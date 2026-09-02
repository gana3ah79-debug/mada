/* Mada Admin: Premium dashboard */
(function(){
 const {createClient}=window.supabase; const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
 const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 let realtime=null;
 async function isAdmin(){const {data:{session}}=await sb.auth.getSession();if(!session)return false;const {data:p,error}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();if(error){console.warn('admin check',error);return false}return p?.role==='admin'&&!p?.is_banned}
 async function count(table,filter){let q=sb.from(table).select('*',{count:'exact',head:true});if(filter)q=q.eq(filter[0],filter[1]);const {count,error}=await q;if(error)throw error;return count||0}
 async function receiptUrl(path){if(!path)return null;if(/^https?:\/\//i.test(path))return path;const {data,error}=await sb.storage.from('payment-receipts').createSignedUrl(path,600);if(error){console.warn('receipt url',error);return null}return data?.signedUrl||null}
 async function render(){
  const c=$('content'); if(!c)return;
  c.innerHTML='<div class="card">جاري تحميل لوحة Premium…</div>';
  try{
   if(!(await isAdmin())){c.innerHTML='<div class="card">غير مصرح بالدخول إلى لوحة Premium.</div>';return;}
   const results=await Promise.allSettled([
    sb.from('admin_settings').select('*').eq('id',true).maybeSingle(),
    sb.from('subscription_requests').select('id,user_id,transaction_ref,receipt_image_url,status,created_at,profiles(display_name,username)').order('created_at',{ascending:false}).limit(100),
    count('profiles',['is_premium',true]),count('profiles'),count('posts')
   ]);
   const value=i=>results[i].status==='fulfilled'?results[i].value:null;
   const settingsRes=value(0), requestsRes=value(1);
   const settingsError=results[0].status==='rejected'?results[0].reason:null;
   const requestsError=results[1].status==='rejected'?results[1].reason:null;
   const s=settingsRes?.data||null, requests=requestsRes?.data||[];
   const premiumUsers=results[2].status==='fulfilled'?results[2].value:0;
   const totalUsers=results[3].status==='fulfilled'?results[3].value:0;
   const posts=results[4].status==='fulfilled'?results[4].value:0;
   if(settingsError)console.error('admin_settings',settingsError);
   if(requestsError)console.error('subscription_requests',requestsError);
   const pending=requests.filter(x=>x.status==='pending').length;
   const rows=await Promise.all(requests.map(async x=>({...x,receiptLink:await receiptUrl(x.receipt_image_url)})));
   c.innerHTML=`<div class="admin-premium-head"><div><h2>💎 Premium</h2><p>إدارة الاشتراكات والدفع من مكان واحد</p></div><span class="badge-admin">Mada Admin</span></div><section class="premium-admin-section"><div class="stats-grid"><div class="stat-card"><span class="stat-title">إجمالي المستخدمين</span><h3>${totalUsers}</h3></div><div class="stat-card gold"><span class="stat-title">مشتركو Premium 💎</span><h3>${premiumUsers}</h3></div><div class="stat-card orange"><span class="stat-title">طلبات معلقة ⏳</span><h3>${pending}</h3></div><div class="stat-card"><span class="stat-title">إجمالي المنشورات</span><h3>${posts}</h3></div></div></section><section class="admin-card premium-admin-section"><h3>💳 إعدادات الدفع والاشتراك</h3>${settingsError?'<div class="notice">تعذر تحميل إعدادات الدفع. تحقق من صلاحيات جدول admin_settings.</div>':`<div class="form-row"><div class="form-group"><label>رقم المحفظة (Vodafone Cash)</label><input id="premiumWallet" value="${esc(s?.cash_wallet)}" placeholder="010xxxxxxxx"></div><div class="form-group"><label>قيمة الاشتراك الشهري (جنيه)</label><input id="premiumPrice" type="number" min="0" step="0.01" value="${s?.subscription_price_egp??99}"></div></div><button class="btn-primary" id="savePremiumSettings">💾 حفظ التعديلات</button><p id="premiumSaveMsg"></p>`}</section><section class="admin-card premium-admin-section"><div class="section-title-row"><h3>📥 طلبات Premium</h3><span class="pending-chip">${pending} معلقة</span></div>${requestsError?'<div class="notice">تعذر تحميل طلبات Premium. تحقق من صلاحيات جدول subscription_requests.</div>':`<div class="table-responsive"><table class="admin-table"><thead><tr><th>المستخدم</th><th>رقم العملية</th><th>الإيصال</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.profiles?.display_name||x.profiles?.username||'مستخدم')}</strong><small>${esc(x.profiles?.username?('@'+x.profiles.username):'')}</small></td><td>${esc(x.transaction_ref||'-')}</td><td>${x.receiptLink?`<a href="${esc(x.receiptLink)}" target="_blank" rel="noopener" class="view-link">عرض الإيصال 🖼️</a>`:'بدون إيصال'}</td><td><span class="status-${esc(x.status)}">${x.status==='pending'?'معلق':x.status==='approved'?'مقبول':'مرفوض'}</span></td><td>${x.status==='pending'?`<button class="btn-action approve" data-id="${esc(x.id)}" data-user="${esc(x.user_id)}">قبول 👑</button><button class="btn-action reject" data-id="${esc(x.id)}">رفض ❌</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="5">لا توجد طلبات حتى الآن.</td></tr>'}</tbody></table></div>`}</section>`;
   const save=$('savePremiumSettings'); if(save)save.onclick=async()=>{const {data:{session}}=await sb.auth.getSession();const price=Number($('premiumPrice').value);if(!Number.isFinite(price)||price<0)return $('premiumSaveMsg').textContent='اكتب سعراً صحيحاً.';const {error}=await sb.from('admin_settings').update({cash_wallet:$('premiumWallet').value.trim()||null,subscription_price_egp:price,updated_at:new Date().toISOString(),updated_by:session.user.id}).eq('id',true);$('premiumSaveMsg').textContent=error?'تعذر الحفظ: '+error.message:'✅ تم حفظ الإعدادات.'};
   c.querySelectorAll('.approve').forEach(b=>b.onclick=()=>review(b.dataset.id,b.dataset.user,'approved'));c.querySelectorAll('.reject').forEach(b=>b.onclick=()=>review(b.dataset.id,null,'rejected'));
  }catch(e){console.error('Premium render failed',e);c.innerHTML=`<div class="card"><h3>تعذر تحميل لوحة Premium</h3><p>${esc(e?.message||e)}</p><button class="btn-primary" onclick="window.madaAdminPremium()">إعادة المحاولة</button></div>`}
 }
 async function review(id,userId,status){if(!(await isAdmin()))return alert('غير مصرح');if(status==='rejected'&&!confirm('تأكيد رفض طلب Premium؟'))return;const {data:{session}}=await sb.auth.getSession();const patch={status,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id};const {error}=await sb.from('subscription_requests').update(patch).eq('id',id);if(error)return alert('تعذر تحديث الطلب: '+error.message);if(status==='approved'&&userId){const {error:e}=await sb.from('profiles').update({is_premium:true,badge:'diamond'}).eq('id',userId);if(e)return alert('تم قبول الطلب لكن تعذر تفعيل Premium: '+e.message)}render()}
 function startRealtime(){if(realtime||!window.supabase)return;realtime=sb.channel('mada-premium-requests').on('postgres_changes',{event:'*',schema:'public',table:'subscription_requests'},()=>{if(document.querySelector('#dash:not([hidden])')&&document.querySelector('#content'))render()}).subscribe()}
 window.madaAdminPremium=render; document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('#dash aside button[data-tab="premium"]');if(b)b.onclick=render;startRealtime()});
})();