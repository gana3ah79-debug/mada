(() => {
const sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const originalTab=window.tab;
window.tab=async t=>{
 if(t==='settings'){
  const {data:s}=await sb.from('payment_settings').select('*').eq('id',true).single();
  $('content').innerHTML=`<h2>⚙️ إعدادات الدفع</h2><div class="card"><label>📱 محفظة كاش</label><input id="cash" value="${esc(s?.cash_wallet||'')}" placeholder="رقم المحفظة"><label>🟢 InstaPay</label><input id="insta" value="${esc(s?.instapay_address||'')}" placeholder="عنوان InstaPay"><label>🏦 اسم البنك</label><input id="bank" value="${esc(s?.bank_name||'')}" placeholder="اسم البنك"><label>👤 اسم صاحب الحساب</label><input id="holder" value="${esc(s?.bank_account_name||'')}" placeholder="اسم صاحب الحساب"><label>🔢 رقم الحساب</label><input id="account" value="${esc(s?.bank_account_number||'')}" placeholder="رقم الحساب"><label>IBAN</label><input id="iban" value="${esc(s?.bank_iban||'')}" placeholder="IBAN"><label>💰 سعر Premium بالجنيه</label><input id="price" type="number" min="0" step="0.01" value="${s?.premium_price_egp??99}"><label>📅 مدة Premium بالشهور</label><input id="months" type="number" min="1" value="${s?.premium_duration_months??1}"><button id="savePay" class="primary wide" style="margin-top:12px">💾 حفظ إعدادات الدفع</button><p id="saveMsg"></p></div>`;
  $('savePay').onclick=async()=>{const {data:{user}}=await sb.auth.getUser();const payload={cash_wallet:$('cash').value.trim()||null,instapay_address:$('insta').value.trim()||null,bank_name:$('bank').value.trim()||null,bank_account_name:$('holder').value.trim()||null,bank_account_number:$('account').value.trim()||null,bank_iban:$('iban').value.trim()||null,premium_price_egp:Number($('price').value),premium_duration_months:Number($('months').value),updated_by:user.id,updated_at:new Date().toISOString()};const {error}=await sb.from('payment_settings').update(payload).eq('id',true);$('saveMsg').textContent=error?'تعذر الحفظ: '+error.message:'تم حفظ إعدادات الدفع بنجاح ✓'};
  return;
 }
 if(t==='payments'){
  const [legacy,newReq]=await Promise.all([
   sb.from('payment_requests').select('*').order('created_at',{ascending:false}).limit(100),
   sb.from('subscription_requests').select('id,user_id,transaction_ref,receipt_image_url,status,created_at,profiles(display_name,username)').order('created_at',{ascending:false}).limit(100)
  ]);
  const oldRows=legacy.data||[], premiumRows=newReq.data||[];
  $('content').innerHTML=`<h2>🧾 المدفوعات وطلبات Premium</h2><p class="muted">طلبات الدفع من التطبيق تظهر هنا، ويمكن تأكيدها من نفس شاشة المدفوعات.</p><div class="grid">${premiumRows.map(x=>`<div class="card"><b>💎 Mada Premium</b><p>المستخدم: ${esc(x.profiles?.display_name||x.profiles?.username||'مستخدم')}</p><p>رقم العملية: ${esc(x.transaction_ref)}</p><p>الحالة: ${x.status==='pending'?'⏳ معلق':x.status==='approved'?'✅ مقبول':'❌ مرفوض'}</p>${x.receipt_image_url?`<button onclick="viewReceipt('${esc(x.receipt_image_url)}')">🧾 عرض الإيصال</button>`:''}${x.status==='pending'?`<button onclick="reviewPremiumPayment('${esc(x.id)}','approve')">✅ تأكيد الدفع وتفعيل Premium</button><button onclick="reviewPremiumPayment('${esc(x.id)}','reject')">❌ رفض</button>`:''}</div>`).join('')}${oldRows.map(x=>`<div class="card"><b>${x.method==='cash_wallet'?'📱 محفظة كاش':x.method==='instapay'?'🟢 InstaPay':'🏦 بنك'}</b><p>المبلغ: ${esc(x.amount_egp)} جنيه</p><p>المرجع: ${esc(x.reference)}</p><p>الحالة: ${esc(x.status)}</p><button onclick="reviewPayment('${esc(x.id)}','approve')">✅ قبول</button> <button onclick="reviewPayment('${esc(x.id)}','reject')">❌ رفض</button>${x.receipt_url?`<button onclick="viewReceipt('${esc(x.receipt_url)}')">🧾 عرض الإيصال</button>`:''}</div>`).join('')}${!premiumRows.length&&!oldRows.length?'<div class="card">لا توجد مدفوعات</div>':''}</div>`;
  return;
 }
 return originalTab(t);
};
window.reviewPremiumPayment=async(id,action)=>{
 if(action==='approve'){
  const {data,error}=await sb.rpc('approve_subscription_request',{p_request_id:id});
  if(error)alert('تعذر تأكيد الدفع: '+error.message);else alert(`تم تأكيد الدفع وتفعيل Premium ✓\nينتهي الاشتراك: ${new Date(data.expires_at).toLocaleDateString('ar-EG')}`);
 }else{
  const {error}=await sb.from('subscription_requests').update({status:'rejected',reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','pending');
  if(error)alert('تعذر رفض الطلب: '+error.message);else alert('تم رفض طلب الدفع ✓');
 }
 window.tab('payments');
};
window.reviewPayment=async(id,action)=>{if(action==='approve'){const {data,error}=await sb.rpc('approve_payment_request',{p_request_id:id});if(error)alert(error.message);else alert('تم قبول الدفع وتفعيل Premium ✓')}else{const {error}=await sb.from('payment_requests').update({status:'rejected',reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','pending');if(error)alert(error.message)}window.tab('payments')};
window.viewReceipt=async path=>{const {data,error}=await sb.storage.from('payment-receipts').createSignedUrl(path,600);if(error){alert('تعذر فتح الإيصال');return}window.open(data.signedUrl,'_blank')};
})();