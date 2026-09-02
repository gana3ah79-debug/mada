/* Mada Premium: user payment request flow */
(function(){
 const {createClient}=window.supabase;
 const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 async function settings(){
  const {data,error}=await sb.from('admin_settings').select('cash_wallet,subscription_price_egp').eq('id',true).maybeSingle();
  if(error)console.warn('premium settings unavailable',error);
  return data||{cash_wallet:null,subscription_price_egp:99};
 }
 async function myRequest(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return null;
  const {data,error}=await sb.from('subscription_requests').select('id,transaction_ref,receipt_image_url,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)console.warn('premium request unavailable',error);
  return data||null;
 }
 async function open(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return alert('سجّل الدخول أولاً.');
  const {data:profile}=await sb.from('profiles').select('is_premium').eq('id',user.id).maybeSingle();
  if(profile?.is_premium){showModal('💎 Mada Premium','<div class="premium-card"><h3>أنت مشترك في Premium 👑</h3><p>حسابك مفعل بالفعل.</p></div>');return;}
  const s=await settings(),req=await myRequest();
  const status=req?.status==='pending'?'<div class="premium-status pending">⏳ لديك طلب قيد المراجعة بالفعل.</div>':req?.status==='rejected'?'<div class="premium-status rejected">❌ آخر طلب تم رفضه. يمكنك إرسال طلب جديد.</div>':'';
  showModal('💎 الاشتراك في Mada Premium',`<div class="premium-card"><h3>Premium لمدة شهر</h3><div class="price-box"><strong>${esc(s.subscription_price_egp)} جنيه مصري</strong></div><div class="premium-payment-box"><b>📱 التحويل عبر Vodafone Cash</b><div class="wallet-value">${esc(s.cash_wallet||'لم يضف المسؤول رقم المحفظة بعد')}</div><small>حوّل المبلغ ثم اكتب رقم العملية وارفع صورة الإيصال.</small></div>${status}<label for="pref">رقم العملية / المرجع</label><input id="pref" placeholder="مثال: 123456789"><label for="preceipt">إيصال الدفع</label><input id="preceipt" type="file" accept="image/*" style="width:100%"><button id="sendPayment" class="premium-btn wide" style="margin-top:12px">إرسال طلب الاشتراك</button><p id="paymentMsg"></p></div>`);
  $('sendPayment').onclick=submit;
 }
 async function submit(){
  const s=await settings(),ref=$('pref').value.trim(),file=$('preceipt').files?.[0];
  if(!ref||!file)return $('paymentMsg').textContent='اكتب رقم العملية وارفع صورة الإيصال أولاً.';
  if(file.size>8*1024*1024)return $('paymentMsg').textContent='حجم الإيصال يجب ألا يتجاوز 8MB.';
  if(!file.type.startsWith('image/'))return $('paymentMsg').textContent='ارفع صورة إيصال فقط.';
  const {data:{user}}=await sb.auth.getUser();if(!user)return $('paymentMsg').textContent='سجّل الدخول أولاً.';
  const {data:profile}=await sb.from('profiles').select('is_premium').eq('id',user.id).maybeSingle();
  if(profile?.is_premium)return $('paymentMsg').textContent='حسابك Premium بالفعل.';
  $('sendPayment').disabled=true;$('paymentMsg').textContent='جاري رفع الإيصال وإرسال الطلب…';
  try{
   const path=`${user.id}/${crypto.randomUUID()}.${(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'}`;
   const up=await sb.storage.from('payment-receipts').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
   const {error}=await sb.from('subscription_requests').insert({user_id:user.id,transaction_ref:ref,receipt_image_url:sb.storage.from('payment-receipts').getPublicUrl(path).data.publicUrl,status:'pending'});
   if(error){await sb.storage.from('payment-receipts').remove([path]);throw error;}
   $('paymentMsg').textContent='✅ تم إرسال طلبك بنجاح. سيظهر للإدارة للمراجعة.';$('sendPayment').textContent='تم إرسال الطلب ✓';
  }catch(e){console.error(e);$('paymentMsg').textContent='تعذر إرسال الطلب: '+(e?.message||'خطأ غير متوقع');$('sendPayment').disabled=false;}
 }
 window.addManualPayment=open;
 const hook=()=>['premiumBtn','premiumBannerBtn'].forEach(id=>{const e=$(id);if(e)e.onclick=open});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
})();