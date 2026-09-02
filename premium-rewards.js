/* Mada Premium: paid member reward controls */
(function(){
  const {createClient}=window.supabase;
  const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function isAdmin(){
    const {data:{session}}=await sb.auth.getSession(); if(!session)return false;
    const {data:p}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();
    return p?.role==='admin'&&!p?.is_banned;
  }
  const rewards=[
    ['reward_premium_tag','👑 تاج Premium'],['reward_gold_frame','🟨 إطار ذهبي'],['reward_fire','🔥 شارة الحماسة'],
    ['reward_pinned_posts','📌 تثبيت المنشورات'],['reward_advanced_stats','📊 إحصائيات متقدمة'],['reward_exclusive_styles','🎨 ألوان وخلفيات حصرية'],
    ['reward_boost','🚀 Boost'],['reward_edit_posts','✏️ تعديل المنشورات']
  ];
  async function appendRewards(){
    const c=$('content'); if(!c||!(await isAdmin()))return;
    const cols='id,display_name,username,is_premium,'+rewards.map(x=>x[0]).join(',');
    const {data:users,error}=await sb.from('profiles').select(cols).eq('is_premium',true).order('created_at',{ascending:false}).limit(100);
    const old=c.querySelector('.premium-rewards-section'); if(old)old.remove();
    const section=document.createElement('section'); section.className='admin-card premium-admin-section premium-rewards-section';
    if(error){section.innerHTML='<h3>👑 أعضاء Premium المدفوعين</h3><div class="notice">تعذر تحميل أعضاء Premium: '+esc(error.message)+'</div>';c.appendChild(section);return;}
    section.innerHTML=`<div class="section-title-row"><div><h3>👑 أعضاء Premium المدفوعين</h3><p class="rewards-help">تحكم في كل ميزة لكل عضو مدفوع. عند تأكيد الدفع تُفعّل جميع المزايا تلقائيًا.</p></div></div><div class="rewards-list">${(users||[]).map(u=>`<div class="reward-user" data-user="${esc(u.id)}"><div class="reward-user-info"><strong>${esc(u.display_name||u.username||'مستخدم')}</strong><small>${u.username?'@'+esc(u.username):''} · 💎 Premium مدفوع</small></div><div class="reward-checks">${rewards.map(([key,label])=>`<label><input type="checkbox" data-key="${key}" ${u[key]?'checked':''}> ${label}</label>`).join('')}</div><button class="btn-primary reward-save" data-id="${esc(u.id)}">حفظ المكافآت</button></div>`).join('')||'<div class="notice">لا يوجد أعضاء Premium مدفوعون حاليًا.</div>'}</div>`;
    c.appendChild(section);
    section.querySelectorAll('.reward-save').forEach(btn=>btn.onclick=async()=>{
      const row=btn.closest('.reward-user'),patch={}; row.querySelectorAll('input[data-key]').forEach(i=>patch[i.dataset.key]=i.checked);
      btn.disabled=true; const {error:e}=await sb.from('profiles').update(patch).eq('id',btn.dataset.id).eq('is_premium',true); btn.disabled=false;
      btn.textContent=e?'تعذر الحفظ':'✅ تم الحفظ'; setTimeout(()=>btn.textContent='حفظ المكافآت',1500);
    });
  }
  window.madaPaidPremiumRewards=appendRewards;
  document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('#dash aside button[data-tab="premium"]');if(b)b.addEventListener('click',()=>setTimeout(appendRewards,0));});
})();