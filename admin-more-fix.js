(()=>{
  const sb=window.supabase.createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const card=(title,body)=>{const c=$('content');if(c)c.innerHTML=`<div class="card"><h2>${title}</h2>${body}</div>`};
  async function support(){
    const {data,error}=await sb.from('support_tickets').select('id,user_id,subject,body,status,admin_note,created_at,updated_at').order('created_at',{ascending:false}).limit(200);
    if(error){card('🎟️ الدعم والشكاوى',`<p>تعذر تحميل طلبات الدعم: ${esc(error.message)}</p>`);return;}
    const ids=[...new Set((data||[]).map(x=>x.user_id).filter(Boolean))];let names={};
    if(ids.length){const r=await sb.from('profiles').select('id,display_name,username').in('id',ids);(r.data||[]).forEach(x=>names[x.id]=x)}
    card('🎟️ إدارة الدعم والشكاوى',`<p class="mini">${data?.length||0} طلب دعم</p><div class="more-grid">${(data||[]).map(x=>`<article class="more-item"><b>${esc(x.subject)}</b><p>${esc(x.body)}</p><small>${esc(names[x.user_id]?.display_name||names[x.user_id]?.username||'مستخدم')} · ${x.created_at?new Date(x.created_at).toLocaleString('ar-EG'):''}</small><div class="more-actions"><select onchange="window.madaSupportStatus('${x.id}',this.value)"><option value="open" ${x.status==='open'?'selected':''}>مفتوح</option><option value="pending" ${x.status==='pending'?'selected':''}>قيد المتابعة</option><option value="resolved" ${x.status==='resolved'?'selected':''}>تم الحل</option><option value="closed" ${x.status==='closed'?'selected':''}>مغلق</option></select><button class="more-muted" onclick="window.madaSupportNote('${x.id}')">📝 ملاحظة</button></div></article>`).join('')||'<p>لا توجد شكاوى أو طلبات دعم.</p>'}</div>`);
  }
  window.madaSupportStatus=async(id,status)=>{const {error}=await sb.from('support_tickets').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert('تعذر تحديث الحالة');else support()};
  window.madaSupportNote=async id=>{const note=prompt('اكتب ملاحظة الإدارة:');if(note===null)return;const {error}=await sb.from('support_tickets').update({admin_note:note,updated_at:new Date().toISOString()}).eq('id',id);if(error)alert('تعذر حفظ الملاحظة');else support()};
  async function errors(){
    const {data,error}=await sb.from('system_errors').select('id,level,message,details,source,created_at').order('created_at',{ascending:false}).limit(200);
    if(error){card('⚠️ أخطاء النظام',`<p>تعذر تحميل سجل الأخطاء: ${esc(error.message)}</p>`);return;}
    card('⚠️ مركز مراقبة النظام والأخطاء',`<p class="mini">${data?.length||0} سجل</p>${(data||[]).map(x=>`<article class="more-item" style="margin:8px 0"><b>${esc(x.level||'ERROR')}</b> — ${esc(x.message)}<br><small>${esc(x.source||'غير محدد')} · ${x.created_at?new Date(x.created_at).toLocaleString('ar-EG'):''}</small>${x.details?`<div class="more-code">${esc(JSON.stringify(x.details,null,2))}</div>`:''}</article>`).join('')||'<p>لا توجد أخطاء مسجلة حاليًا.</p>'}`);
  }
  async function messages(){
    const {data,error}=await sb.from('admin_messages').select('id,user_id,sender_id,title,body,message_type,read_at,created_at').order('created_at',{ascending:false}).limit(200);
    if(error){card('📨 رسائل الأدمن',`<p>تعذر تحميل الرسائل: ${esc(error.message)}</p>`);return;}
    const ids=[...new Set((data||[]).map(x=>x.user_id).filter(Boolean))];let names={};
    if(ids.length){const r=await sb.from('profiles').select('id,display_name,username').in('id',ids);(r.data||[]).forEach(x=>names[x.id]=x)}
    card('📨 رسائل الأدمن للمستخدمين',`<div class="more-actions"><button class="more-primary" onclick="window.madaOpenAdminMessageForm()">✉️ رسالة جديدة</button></div><div class="more-grid">${(data||[]).map(x=>`<article class="more-item"><b>${esc(x.title)}</b><p>${esc(x.body)}</p><small>إلى: ${esc(names[x.user_id]?.display_name||names[x.user_id]?.username||x.user_id||'مستخدم')} · ${x.created_at?new Date(x.created_at).toLocaleString('ar-EG'):''}</small></article>`).join('')||'<p>لا توجد رسائل.</p>'}</div>`);
  }
  window.madaOpenAdminMessageForm=async()=>{
    const {data,error}=await sb.from('profiles').select('id,display_name,username').order('created_at',{ascending:false}).limit(500);
    if(error){alert('تعذر تحميل المستخدمين');return;}
    $('content').innerHTML=`<div class="card"><h2>📨 رسالة أدمن جديدة</h2><div class="more-form"><select id="admMsgUser">${(data||[]).map(x=>`<option value="${x.id}">${esc(x.display_name||x.username||x.id)}</option>`).join('')}</select><input id="admMsgTitle" placeholder="عنوان الرسالة"><textarea id="admMsgBody" placeholder="نص الرسالة"></textarea><div class="more-actions"><button class="more-primary" onclick="window.madaSendAdminMessage()">إرسال</button><button class="more-muted" onclick="window.madaMoreFixMessages()">إلغاء</button></div><div id="admMsgStatus"></div></div></div>`;
  };
  window.madaSendAdminMessage=async()=>{const user_id=$('admMsgUser')?.value,title=$('admMsgTitle')?.value.trim(),body=$('admMsgBody')?.value.trim();if(!user_id||!title||!body){$('admMsgStatus').innerHTML='<span class="more-status more-warn">أكمل البيانات أولًا.</span>';return}const {data:{user}}=await sb.auth.getUser();if(!user){return}const {error}=await sb.from('admin_messages').insert({user_id,sender_id:user.id,title,body});$('admMsgStatus').innerHTML=error?`<span class="more-status more-bad">${esc(error.message)}</span>`:'<span class="more-status more-ok">تم إرسال الرسالة.</span>';};
  async function announcement(){
    $('content').innerHTML=`<div class="card"><h2>📣 إرسال إعلان لجميع المستخدمين</h2><p>سيتم إنشاء إشعار لكل مستخدم موجود حاليًا.</p><div class="more-form"><input id="annTitle" placeholder="عنوان الإعلان"><textarea id="annBody" placeholder="نص الإعلان"></textarea><div class="more-actions"><button class="more-primary" onclick="window.madaSendAnnouncementFix()">📣 إرسال للجميع</button></div><div id="annMsg"></div></div></div>`;
  }
  window.madaSendAnnouncementFix=async()=>{const title=$('annTitle')?.value.trim(),body=$('annBody')?.value.trim();if(!title||!body){$('annMsg').innerHTML='<span class="more-status more-warn">اكتب العنوان والنص أولًا.</span>';return}const {data:users,error:uerr}=await sb.from('profiles').select('id');if(uerr){$('annMsg').innerHTML=`<span class="more-status more-bad">${esc(uerr.message)}</span>`;return}const rows=(users||[]).map(u=>({user_id:u.id,title,body,type:'announcement'}));if(!rows.length){$('annMsg').innerHTML='<span class="more-status more-warn">لا يوجد مستخدمون.</span>';return}let ok=0;for(let i=0;i<rows.length;i+=200){const {error}=await sb.from('notifications').insert(rows.slice(i,i+200));if(error){$('annMsg').innerHTML=`<span class="more-status more-bad">تعذر الإرسال: ${esc(error.message)}</span>`;return}ok+=Math.min(200,rows.length-i)}$('annMsg').innerHTML=`<span class="more-status more-ok">تم إرسال الإعلان إلى ${ok} مستخدم.</span>`};
  function replaceTab(id,fn){const b=document.querySelector(`aside button[data-more-tab="${id}"]`);if(b)b.onclick=fn;}
  function boot(){replaceTab('support',support);replaceTab('errors',errors);replaceTab('admin-messages',messages);replaceTab('announcement',announcement);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));else setTimeout(boot,50);
})();
