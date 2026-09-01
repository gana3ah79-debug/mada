(() => {
  const sb = window.supabase.createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const originalTab = window.tab;

  async function loadPaymentSettings() {
    const { data } = await sb.from('payment_settings').select('*').eq('id', true).single();
    return data || {};
  }

  window.tab = async t => {
    if (t === 'settings') {
      const s = await loadPaymentSettings();
      $('content').innerHTML = `<h2>⚙️ إعدادات الدفع</h2><div class="card">
        <label>📱 محفظة كاش</label><input id="cash" value="${esc(s.cash_wallet || '')}" placeholder="رقم المحفظة">
        <label>🟢 InstaPay</label><input id="insta" value="${esc(s.instapay_address || '')}" placeholder="عنوان InstaPay">
        <label>🏦 اسم البنك</label><input id="bank" value="${esc(s.bank_name || '')}" placeholder="اسم البنك">
        <label>👤 اسم صاحب الحساب</label><input id="holder" value="${esc(s.bank_account_name || '')}" placeholder="اسم صاحب الحساب">
        <label>🔢 رقم الحساب</label><input id="account" value="${esc(s.bank_account_number || '')}" placeholder="رقم الحساب">
        <label>IBAN</label><input id="iban" value="${esc(s.bank_iban || '')}" placeholder="IBAN">
        <label>💰 سعر Premium بالجنيه</label><input id="price" type="number" min="0" step="0.01" value="${s.premium_price_egp ?? 99}">
        <label>📅 مدة Premium بالشهور</label><input id="months" type="number" min="1" value="${s.premium_duration_months ?? 1}">
        <button id="savePay" class="primary wide" style="margin-top:12px">💾 حفظ إعدادات الدفع</button><p id="saveMsg"></p>
      </div>`;
      $('savePay').onclick = async () => {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const payload = {
          cash_wallet: $('cash').value.trim() || null,
          instapay_address: $('insta').value.trim() || null,
          bank_name: $('bank').value.trim() || null,
          bank_account_name: $('holder').value.trim() || null,
          bank_account_number: $('account').value.trim() || null,
          bank_iban: $('iban').value.trim() || null,
          premium_price_egp: Number($('price').value),
          premium_duration_months: Number($('months').value),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        };
        const { error } = await sb.from('payment_settings').update(payload).eq('id', true);
        $('saveMsg').textContent = error ? 'تعذر الحفظ: ' + error.message : 'تم حفظ إعدادات الدفع بنجاح ✓';
      };
      return;
    }

    if (t === 'payments') {
      const { data, error } = await sb.from('manual_payment_requests')
        .select('id,user_id,method,amount_egp,reference,receipt_path,status,admin_note,created_at')
        .order('created_at', { ascending: false }).limit(100);
      if (error) {
        $('content').innerHTML = `<div class="card">تعذر تحميل طلبات الدفع: ${esc(error.message)}</div>`;
        return;
      }
      $('content').innerHTML = `<h2>🧾 طلبات التحويل اليدوي</h2><div class="grid">${(data || []).map(x => `
        <div class="card">
          <b>${x.method === 'wallet' ? '📱 محفظة كاش' : x.method === 'instapay' ? '🟢 InstaPay' : '🏦 بنك'}</b>
          <p>المبلغ: ${esc(x.amount_egp)} جنيه</p><p>المرجع: ${esc(x.reference)}</p>
          <p>الحالة: <span class="badge">${esc(x.status)}</span></p>
          <small>${new Date(x.created_at).toLocaleString('ar-EG')}</small>
          <div class="toolbar">
            ${x.receipt_path ? `<button onclick="viewReceipt('${encodeURIComponent(x.receipt_path)}')">🧾 عرض الإيصال</button>` : ''}
            ${x.status === 'pending' ? `<button class="primary" onclick="reviewManual('${x.id}','approve')">✅ قبول وتفعيل Premium</button><button class="danger" onclick="reviewManual('${x.id}','reject')">❌ رفض</button>` : ''}
          </div>
        </div>`).join('') || '<div class="card">لا توجد طلبات دفع.</div>'}</div>`;
      return;
    }
    return originalTab(t);
  };

  window.reviewManual = async (id, action) => {
    if (action === 'approve') {
      if (!confirm('تأكيد الإيصال وتفعيل Premium لهذا المستخدم؟')) return;
      const { data, error } = await sb.rpc('approve_manual_payment_request', { p_request_id: id, p_note: null });
      if (error) alert('تعذر التفعيل: ' + error.message);
      else alert(`تم قبول الدفع وتفعيل Premium ✓\nينتهي الاشتراك: ${new Date(data.expires_at).toLocaleDateString('ar-EG')}`);
    } else {
      if (!confirm('رفض طلب الدفع؟')) return;
      const { data: { user } } = await sb.auth.getUser();
      const { error } = await sb.from('manual_payment_requests').update({
        status: 'rejected', reviewed_by: user?.id || null, reviewed_at: new Date().toISOString()
      }).eq('id', id).eq('status', 'pending');
      if (error) alert('تعذر رفض الطلب: ' + error.message);
    }
    window.tab('payments');
  };

  window.viewReceipt = async encodedPath => {
    const path = decodeURIComponent(encodedPath);
    const { data, error } = await sb.storage.from('payment-receipts').createSignedUrl(path, 600);
    if (error) { alert('تعذر فتح الإيصال'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  };
})();