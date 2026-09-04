(() => {
  const css=`
    .mada-notify-badge{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:#ef476f;color:#fff;font-size:10px;font-weight:900;display:grid;place-items:center;border:2px solid var(--mada-surface,#fff);z-index:3}
    .mada-notify-wrap{position:relative;display:inline-flex}
    .mada-notify-list{display:grid;gap:8px;max-height:65vh;overflow:auto;padding:4px}
    .mada-notify-item{width:100%;display:flex;gap:12px;align-items:center;text-align:right;border:1px solid var(--mada-line,rgba(0,0,0,.08));background:var(--mada-surface,#fff);color:inherit;border-radius:18px;padding:12px;cursor:pointer;transition:.18s;box-sizing:border-box}
    .mada-notify-item:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,40,80,.08)}
    .mada-notify-item.unread{background:linear-gradient(135deg,rgba(124,92,255,.10),rgba(239,71,111,.06));border-color:rgba(124,92,255,.22)}
    .mada-notify-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:21px;background:rgba(124,92,255,.10);flex:none}
    .mada-notify-copy{min-width:0;flex:1}.mada-notify-title{font-weight:900;line-height:1.45}.mada-notify-body{opacity:.72;font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mada-notify-time{opacity:.5;font-size:11px;margin-top:5px}
    .mada-notify-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.mada-notify-head button{border:0;background:none;color:#6d5dfc;font-weight:800;cursor:pointer}.mada-notify-empty{text-align:center;padding:35px 12px;opacity:.6}.mada-notify-error{padding:20px;text-align:center;color:#b42318}
    .dark .mada-notify-item{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.1)}.dark .mada-notify-badge{border-color:#16161a}
  `;
  if(!document.getElementById('mada-notify-style')){const s=document.createElement('style');s.id='mada-notify-style';s.textContent=css;document.head.appendChild(s)}
  const client=()=>window.sb||window.MADA_SUPABASE_CLIENT;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const icons={like:'❤️',comment:'💬',reply:'↩️',comment_like:'❤️',group_invite:'👥',friend_request:'👋',message:'💬'};
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  async function getUser(){if(window.user?.id)return window.user;const s=client();const r=await s?.auth?.getUser?.();return r?.data?.user||null}
  function modal(title,body){if(window.showModal)return window.showModal(title,body);const m=q('#modal');if(m){q('#modalTitle').textContent=title;q('#modalBody').innerHTML=body;m.hidden=false}}
  function timeAgo(v){const d=Math.max(0,Date.now()-new Date(v).getTime()),m=Math.floor(d/60000);if(m<1)return'الآن';if(m<60)return`منذ ${m} د`;const h=Math.floor(m/60);if(h<24)return`منذ ${h} س`;const days=Math.floor(h/24);return`منذ ${days} يوم`}
  function typeIcon(n){return icons[n]||'🔔'}
  async function unreadCount(){const s=client(),u=await getUser();if(!s||!u)return 0;const r=await s.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',u.id).is('read_at',null);return r.error?0:(r.count||0)}
  function setBadges(n){qa('[data-notify-badge]').forEach(b=>{b.textContent=n>99?'99+':String(n);b.hidden=!n})}
  async function refreshBadge(){setBadges(await unreadCount())}
  function wireBadges(){qa('#notifyBtn,#notifyNav,#notifyBottom').forEach(btn=>{if(!btn||btn.dataset.madaNotifyWired)return;btn.dataset.madaNotifyWired='1';btn.style.position='relative';const badge=document.createElement('span');badge.className='mada-notify-badge';badge.dataset.notifyBadge='1';badge.hidden=true;btn.appendChild(badge);btn.addEventListener('click',e=>{e.preventDefault();openCenter()})})}
  async function markRead(id){const s=client(),u=await getUser();if(!s||!u)return;await s.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',u.id)}
  async function markAll(){const s=client(),u=await getUser();if(!s||!u)return;await s.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',u.id).is('read_at',null);refreshBadge();qa('.mada-notify-item.unread').forEach(x=>x.classList.remove('unread'))}
  function goTo(n){const id=n?.data?.post_id;if(!id)return;const post=q('#post-'+CSS.escape(id));if(post){post.scrollIntoView({behavior:'smooth',block:'center'});post.animate([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:450});return}if(window.showModal){const close=q('#closeModal');close?.click();setTimeout(()=>q('#post-'+CSS.escape(id))?.scrollIntoView({behavior:'smooth',block:'center'}),150)}}
  async function openCenter(){
    const s=client(),u=await getUser();if(!s||!u){alert('سجّل الدخول أولاً.');return}
    modal('🔔 الإشعارات','<div id="madaNotifyCenter"><div class="mada-notify-head"><b>آخر التنبيهات</b><button type="button" data-notify-readall>تحديد الكل كمقروء</button></div><div class="mada-notify-list"><div class="mada-notify-empty">جاري التحميل…</div></div></div>');
    const root=q('#madaNotifyCenter'),list=root?.querySelector('.mada-notify-list');if(!list)return;
    const r=await s.from('notifications').select('id,user_id,type,title,body,data,read_at,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(60);
    if(r.error){list.innerHTML=`<div class="mada-notify-error">تعذر تحميل الإشعارات.</div>`;return}
    const rows=r.data||[];
    list.innerHTML=rows.length?rows.map(n=>`<button type="button" class="mada-notify-item ${n.read_at?'':'unread'}" data-notify-id="${esc(n.id)}" data-notify-post="${esc(n.data?.post_id||'')}"><span class="mada-notify-icon">${typeIcon(n.type)}</span><span class="mada-notify-copy"><span class="mada-notify-title">${esc(n.title||'إشعار جديد')}</span><span class="mada-notify-body">${esc(n.body||'')}</span><span class="mada-notify-time">${timeAgo(n.created_at)}</span></span></button>`).join(''):'<div class="mada-notify-empty">لا توجد إشعارات جديدة 🎉<br>كل جديد هيظهر هنا.</div>';
    root.querySelector('[data-notify-readall]')?.addEventListener('click',markAll);
    list.querySelectorAll('[data-notify-id]').forEach(item=>item.addEventListener('click',async()=>{const id=item.dataset.notifyId,post=item.dataset.notifyPost;await markRead(id);item.classList.remove('unread');refreshBadge();if(post){q('#closeModal')?.click();setTimeout(()=>goTo({data:{post_id:post}}),120)}}));
  }
  function boot(){
    wireBadges();refreshBadge();
    setInterval(refreshBadge,30000);
    document.addEventListener('mada-auth-ready',()=>{wireBadges();refreshBadge()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,600));else setTimeout(boot,600);
  window.MadaNotifications={open:openCenter,refresh:refreshBadge};
})();
