/* Mada safe profile opener - bypasses the legacy heavy ProfileUI pipeline. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const ini=n=>(n||'م').trim().charAt(0);
  const sb=()=>window.MADA_SUPABASE_CLIENT||window.sb;
  function style(){
    if($('mada-safe-profile-style'))return;
    const s=document.createElement('style');s.id='mada-safe-profile-style';s.textContent=`
      .mada-safe-profile{width:100%;background:#fff;overflow:hidden;border-radius:16px}
      .mada-safe-cover{height:145px;background:#e9edf3 center/cover no-repeat}
      .mada-safe-main{padding:0 16px 20px;text-align:right;position:relative}
      .mada-safe-avatar{width:104px;height:104px;margin:-52px 0 10px auto;border:5px solid #fff;border-radius:50%;overflow:hidden;background:#e9edf5;display:grid;place-items:center;font-size:38px;font-weight:800;box-shadow:0 3px 14px rgba(0,0,0,.18)}
      .mada-safe-avatar img{width:100%;height:100%;object-fit:cover;display:block}
      .mada-safe-main h2{margin:0;font-size:23px;font-weight:800}.mada-safe-username{color:#718096;font-size:13px;margin-top:2px}.mada-safe-main p{color:#596579;line-height:1.7;margin:8px 0}.mada-safe-meta{color:#68768a;font-size:13px;margin:6px 0}.mada-safe-actions{margin-top:14px}.mada-safe-note{margin-top:12px;text-align:center;color:#9aa4b2;font-size:11px}
      @media(max-width:600px){.mada-safe-cover{height:125px}.mada-safe-avatar{width:96px;height:96px;margin-top:-48px}.mada-safe-main h2{font-size:21px}}
      body.dark .mada-safe-profile{background:#111d31}body.dark .mada-safe-main h2{color:#fff}body.dark .mada-safe-main p,body.dark .mada-safe-username,body.dark .mada-safe-meta,body.dark .mada-safe-note{color:#aeb8c7}
    `;document.head.appendChild(s);
  }
  async function open(id){
    const s=sb(),uid=id||window.user?.id;
    if(!s||!uid){alert('لم يتم تسجيل الدخول بعد.');return}
    style();
    window.showModal?.('👤 الملف الشخصي','<div class="empty">جاري فتح الملف الشخصي…</div>');
    try{
      const r=await Promise.race([
        s.from('profiles').select('id,display_name,username,bio,avatar_url,cover_url,location').eq('id',uid).maybeSingle(),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهى وقت تحميل الملف الشخصي')),7000))
      ]);
      if(r.error)throw r.error;
      const p=r.data||{},name=p.display_name||p.username||'مستخدم Mada';
      const avatar=p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:ini(name);
      const cover=p.cover_url?`background-image:url('${esc(p.cover_url)}')`:'';
      window.showModal?.('👤 الملف الشخصي',`<div class="mada-safe-profile"><div class="mada-safe-cover" style="${cover}"></div><div class="mada-safe-main"><div class="mada-safe-avatar">${avatar}</div><h2>${esc(name)}</h2>${p.username?`<div class="mada-safe-username">@${esc(p.username)}</div>`:''}<p>${esc(p.bio||'لا توجد نبذة حتى الآن.')}</p>${p.location?`<div class="mada-safe-meta">📍 ${esc(p.location)}</div>`:''}<div class="mada-safe-actions"><button class="primary wide" type="button" id="madaSafeEdit">✏️ تعديل الملف</button></div></div></div>`);
      $('madaSafeEdit')?.addEventListener('click',()=>window.ProfileUI?.edit?.());
    }catch(e){
      console.error('Mada safe profile',e);
      window.showModal?.('👤 الملف الشخصي',`<div class="empty">تعذر فتح الملف الشخصي.<br><small>${esc(e?.message||'حدث خطأ غير معروف')}</small><br><button class="primary" type="button" id="madaSafeRetry">إعادة المحاولة</button></div>`);
      $('madaSafeRetry')?.addEventListener('click',()=>open(uid));
    }
  }
  window.MadaSafeProfile={open};
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('[data-mada-menu="profile"]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    open(window.user?.id);
  },true);
})();
