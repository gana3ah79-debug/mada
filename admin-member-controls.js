(()=>{
  if(window.__madaMemberControlsLoaded)return;window.__madaMemberControlsLoaded=true;
  const sb=window.sb||window.supabaseClient||window.__madaSupabase||null;
  const client=sb&&sb.from?sb:(window.supabase?.createClient&&window.MADA_SUPABASE_URL?window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY):null);
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const fmt=x=>x?new Date(x).toLocaleString('ar-EG'):'—';
  if(!client)return;

  async function getUser(id){const{data,error}=await client.from('profiles').select('id,username,display_name,role,is_banned,is_verified,is_premium,created_at,city').eq('id',id).single();return error?null:data}
  async function audit(action,id,details={}){try{await client.from('admin_audit_log').insert({admin_id:window.admin?.id,action,target_type:'member',target_id:id,details})}catch(e){}}

  async function openMember(id){
    const u=await getUser(id);if(!u){alert('تعذر تحميل بيانات العضو');return}
    const [cr,wr,nr,sr]=await Promise.all([
      client.from('member_controls').select('*').eq('user_id',id).maybeSingle(),
      client.from('member_warnings').select('id,level,reason,created_at,admin_id').eq('user_id',id).order('created_at',{ascending:false}).limit(30),
      client.from('admin_member_notes').select('id,note,created_at,admin_id').eq('user_id',id).order('created_at',{ascending:false}).limit(30),
      client.from('account_sessions').select('id,session_label,last_seen_at,created_at,revoked_at').eq('user_id',id).order('last_seen_at',{ascending:false}).limit(20)
    ]);
    const c=cr.data||{};
    const warnings=wr.data||[],notes=nr.data||[],sessions=sr.data||[];
    $('content').innerHTML=`<div class="admin-title"><div><h2>🎛️ إدارة العضو</h2><small>${esc(u.display_name)} · @${esc(u.username||'بدون-يوزر')}</small></div><button onclick="window.madaBackUsers()">↩️ رجوع للأعضاء</button></div>
      <div class="grid">
        <div class="card"><h3>👤 معلومات الحساب</h3><p><b>الاسم:</b> ${esc(u.display_name)}</p><p><b>اليوزر:</b> @${esc(u.username||'—')}</p><p><b>الدور:</b> ${esc(u.role)}</p><p><b>الحالة:</b> ${u.is_banned?'⛔ محظور':'🟢 نشط'}</p><p><b>Premium:</b> ${u.is_premium?'💎 نعم':'لا'} · <b>موثق:</b> ${u.is_verified?'✅ نعم':'لا'}</p><p><b>المدينة:</b> ${esc(u.city||'—')}</p><small>عضو منذ ${fmt(u.created_at)}</small></div>
        <div class="card"><h3>⏸️ التجميد</h3><p>${c.frozen_until&&new Date(c.frozen_until)>new Date()?`🔴 مجمد حتى ${fmt(c.frozen_until)}`:'🟢 غير مجمد'}</p><div class="toolbar"><select id="freezeChoice"><option value="">اختار مدة التجميد</option><option value="1">ساعة</option><option value="24">24 ساعة</option><option value="168">7 أيام</option><option value="720">30 يوم</option><option value="permanent">دائم</option></select><button class="danger" id="freezeBtn">⏸️ تجميد</button><button id="unfreezeBtn">▶️ رفع التجميد</button></div></div>
      </div>
      <div class="card"><h3>🔓 تقييد وظائف العضو</h3><div class="grid fc-grid"><label><input type="checkbox" id="rPost" ${c.posting_disabled?'checked':''}> منع النشر</label><label><input type="checkbox" id="rComment" ${c.commenting_disabled?'checked':''}> منع التعليق</label><label><input type="checkbox" id="rMessage" ${c.messaging_disabled?'checked':''}> منع الرسائل</label><label><input type="checkbox" id="rMedia" ${c.media_disabled?'checked':''}> منع رفع الوسائط</label><label><input type="checkbox" id="rMonitor" ${c.monitored?'checked':''}> 🛡️ تحت المراقبة</label></div><button class="save" id="saveRestrictions">💾 حفظ القيود</button><span id="restrictionMsg"></span></div>
      <div class="grid">
        <div class="card"><h3>⚠️ الإنذارات <small>(${warnings.length})</small></h3><div class="form"><select id="warningLevel"><option value="1">إنذار 1</option><option value="2">إنذار 2</option><option value="3">إنذار 3</option></select><input id="warningReason" placeholder="سبب الإنذار"><button id="addWarning">➕ إضافة إنذار</button></div><div>${warnings.map(w=>`<div class="fc-user"><div><b>⚠️ مستوى ${w.level}</b><small>${esc(w.reason)} · ${fmt(w.created_at)}</small></div></div>`).join('')||'<small>لا توجد إنذارات.</small>'}</div>
        <div class="card"><h3>📝 ملاحظات الأدمن <small>(${notes.length})</small></h3><div class="form"><textarea id="memberNote" rows="3" placeholder="ملاحظة داخلية لا يراها العضو"></textarea><button id="addNote">📝 حفظ الملاحظة</button></div><div>${notes.map(n=>`<div class="fc-user"><div><small>${fmt(n.created_at)}</small><p>${esc(n.note)}</p></div></div>`).join('')||'<small>لا توجد ملاحظات.</small>'}</div>
      </div>
      <div class="card"><h3>📱 الأجهزة والجلسات</h3>${sessions.map(s=>`<div class="fc-user"><div><b>${esc(s.session_label||'جهاز غير مسمى')}</b><small>آخر نشاط: ${fmt(s.last_seen_at)} · بدأ: ${fmt(s.created_at)} ${s.revoked_at?'· 🔴 تم الإلغاء':''}</small></div>${s.revoked_at?'':'<button onclick="window.madaRevokeSession(\''+s.id+'\',\''+id+'\')">🚪 تسجيل خروج</button>'}</div>`).join('')||'<small>لا توجد جلسات مسجلة.</small>'}</div>`;
    $('freezeBtn').onclick=()=>setFreeze(id,$('freezeChoice').value);
    $('unfreezeBtn').onclick=()=>setFreeze(id,'unfreeze');
    $('saveRestrictions').onclick=()=>saveRestrictions(id);
    $('addWarning').onclick=()=>addWarning(id);
    $('addNote').onclick=()=>addNote(id);
  }

  async function setFreeze(id,value){
    let until=null;
    if(value==='unfreeze'){until=null}
    else if(value==='permanent'){until='9999-12-31T23:59:59.999Z'}
    else if(value){until=new Date(Date.now()+Number(value)*3600000).toISOString()}
    else {alert('اختار مدة التجميد أولاً');return}
    const{error}=await client.from('member_controls').upsert({user_id:id,frozen_until:until,updated_at:new Date().toISOString(),updated_by:window.admin?.id},{onConflict:'user_id'});
    if(error){alert('تعذر تحديث التجميد: '+error.message);return}
    await audit(value==='unfreeze'?'member_unfrozen':'member_frozen',id,{frozen_until:until});await openMember(id);
  }

  async function saveRestrictions(id){
    const payload={user_id:id,posting_disabled:$('rPost').checked,commenting_disabled:$('rComment').checked,messaging_disabled:$('rMessage').checked,media_disabled:$('rMedia').checked,monitored:$('rMonitor').checked,updated_at:new Date().toISOString(),updated_by:window.admin?.id};
    const{error}=await client.from('member_controls').upsert(payload,{onConflict:'user_id'});
    $('restrictionMsg').textContent=error?'❌ '+error.message:' ✅ تم الحفظ';
    if(!error)await audit('member_restrictions_updated',id,payload);
  }
  async function addWarning(id){
    const reason=$('warningReason').value.trim();if(!reason){alert('اكتب سبب الإنذار');return}
    const level=Number($('warningLevel').value)||1;const{error}=await client.from('member_warnings').insert({user_id:id,admin_id:window.admin?.id,level,reason});
    if(error){alert('تعذر إضافة الإنذار: '+error.message);return}await audit('member_warning_added',id,{level,reason});await openMember(id);
  }
  async function addNote(id){
    const note=$('memberNote').value.trim();if(!note){alert('اكتب الملاحظة');return}
    const{error}=await client.from('admin_member_notes').insert({user_id:id,admin_id:window.admin?.id,note});
    if(error){alert('تعذر حفظ الملاحظة: '+error.message);return}await audit('member_note_added',id,{});await openMember(id);
  }
  window.madaRevokeSession=async(sid,uid)=>{if(!confirm('تسجيل خروج هذه الجلسة؟'))return;const{error}=await client.from('account_sessions').update({revoked_at:new Date().toISOString()}).eq('id',sid).eq('user_id',uid);if(error){alert('تعذر إلغاء الجلسة: '+error.message);return}await audit('member_session_revoked',uid,{session_id:sid});await openMember(uid)};
  window.madaOpenMember=openMember;
  window.madaBackUsers=()=>{if(window.tab)window.tab('users');else location.reload()};

  function enhanceRows(){document.querySelectorAll('#userRows tr').forEach(tr=>{const action=tr.lastElementChild;if(!action||action.querySelector('.mada-manage-member'))return;const idMatch=(action.innerHTML.match(/toggleBan\('([^']+)'/)||[])[1];if(!idMatch)return;const b=document.createElement('button');b.className='mada-manage-member';b.textContent='🎛️ إدارة';b.onclick=()=>openMember(idMatch);action.appendChild(document.createTextNode(' '));action.appendChild(b)})}
  const obs=new MutationObserver(()=>enhanceRows());obs.observe(document.getElementById('content')||document.body,{childList:true,subtree:true});enhanceRows();
})();