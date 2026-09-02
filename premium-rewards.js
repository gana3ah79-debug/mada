/* Mada Premium: admin reward controls */
(function(){
  const {createClient}=window.supabase;
  const sb=createClient(window.MADA_SUPABASE_URL,window.MADA_SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function isAdmin(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return false;
    const {data:p}=await sb.from('profiles').select('role,is_banned').eq('id',session.user.id).maybeSingle();
    return p?.role==='admin'&&!p?.is_banned;
  }
  async function appendRewards(){
    const c=$('content'); if(!c||!(await isAdmin()))return;
    const {data:users,error}=await sb.from('profiles').select('id,display_name,username,is_premium,reward_crown,reward_fire,reward_bold,reward_gold_frame').order('created_at',{ascending:false}).limit(100);
    const old=c.querySelector('.premium-rewards-section'); if(old)old.remove();
    const section=document.createElement('section');
    section.className='admin-card premium-admin-section premium-rewards-section';
    if(error){section.innerHTML='<h3>🎁 مكافآت Premium</h3><div class="notice">تعذر تحميل المكافآت: '+esc(error.message)+'</div>';c.appendChild(section);return;}
    section.innerHTML=`<div class="section-title-row"><div><h3>🎁 مكافآت المستخدمين</h3><p class="rewards-help">اختر المكافآت التي تريد منحها لكل مستخدم. التغييرات تظهر على منشوراته.</p></div></div><div class="rewards-list">${(users||[]).map(u=>`<div class="reward-user" data-user="${esc(u.id)}"><div class="reward-user-info"><strong>${esc(u.display_name||u.username||'مستخدم')}</strong><small>${u.username?'@'+esc(u.username):''}${u.is_premium?' · 💎 Premium':''}</small></div><label><input type="checkbox" data-key="reward_crown" ${u.reward_crown?'checked':''}> 👑 التاج</label><label><input type="checkbox" data-key="reward_fire" ${u.reward_fire?'checked':''}> 🔥 الحماسة</label><label><input type="checkbox" data-key="reward_bold" ${u.reward_bold?'checked':''}> **خط غليظ**</label><label><input type="checkbox" data-key="reward_gold_frame" ${u.reward_gold_frame?'checked':''}> 🟨 المستطيل الذهبي</label><button class="btn-primary reward-save" data-id="${esc(u.id)}">حفظ المكافآت</button></div>`).join('')||'<div class="notice">لا يوجد مستخدمون.</div>'}</div>`;
    c.appendChild(section);
    section.querySelectorAll('.reward-save').forEach(btn=>btn.onclick=async()=>{
      const row=btn.closest('.reward-user');
      const patch={}; row.querySelectorAll('input[data-key]').forEach(i=>patch[i.dataset.key]=i.checked);
      btn.disabled=true; const {error:e}=await sb.from('profiles').update(patch).eq('id',btn.dataset.id); btn.disabled=false;
      btn.textContent=e?'تعذر الحفظ':'✅ تم الحفظ'; setTimeout(()=>btn.textContent='حفظ المكافآت',1500);
    });
  }
  async function openPremium(){
    if(typeof window.madaAdminPremium==='function')await window.madaAdminPremium();
    await appendRewards();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const b=document.querySelector('#dash aside button[data-tab="premium"]');
    if(b)b.onclick=openPremium;
  });
})();
