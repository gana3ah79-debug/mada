/* Mada notifications: modern list, unread count, mark read, no page reload. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let busy=false;
  const icon={like:'👍',comment:'💬',share:'↗️',friend_request:'👥',follow:'➕',group_message:'👥',message:'💬'};
  const title=n=>n?.title||({like:'إعجاب جديد',comment:'تعليق جديد',share:'مشاركة جديدة',friend_request:'طلب صداقة',follow:'متابعة جديدة',group_message:'رسالة في مجموعة',message:'رسالة جديدة'}[n?.type]||'إشعار جديد');
  const fmt=v=>{try{return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'})}catch{return''}};
  async function count(){if(!window.sb||!window.user)return 0;const{count}=await sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null);const n=count||0;['notifyNav','notifyBtn'].forEach(id=>{const b=document.getElementById(id);if(b){b.dataset.count=String(n);b.classList.toggle('has-badge',n>0);}});return n;}
  async function markAll(){if(!window.sb||!window.user||busy)return;busy=true;try{await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',user.id).is('read_at',null);await count();}finally{busy=false;}}
  async function open(){if(!window.sb||!window.user)return;let box=document.getElementById('madaNotificationsSheet');if(!box){box=document.createElement('div');box.id='madaNotificationsSheet';box.className='mada-notifications-sheet';box.innerHTML='<div class="mada-notifications-backdrop"></div><section class="mada-notifications-panel" role="dialog" aria-modal="true"><header><b>الإشعارات</b><button type="button" class="mada-notifications-close">×</button></header><div class="mada-notifications-actions"><button type="button" class="mada-notifications-read">تحديد الكل كمقروء</button></div><div class="mada-notifications-list"><div class="mada-notifications-loading">جارٍ التحميل…</div></div></section>';document.body.appendChild(box);box.querySelector('.mada-notifications-backdrop').onclick=close;box.querySelector('.mada-notifications-close').onclick=close;box.querySelector('.mada-notifications-read').onclick=markAll;}
    box.classList.add('open');const list=box.querySelector('.mada-notifications-list');list.innerHTML='<div class="mada-notifications-loading">جارٍ التحميل…</div>';
    const{data,error}=await sb.from('notifications').select('id,type,title,body,data,created_at,read_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50);
    if(error){list.innerHTML='<div class="mada-notifications-empty">تعذر تحميل الإشعارات.</div>';return;}
    list.innerHTML=(data||[]).length?(data||[]).map(n=>`<button type="button" class="mada-notification ${n.read_at?'':'unread'}" data-notification-id="${esc(n.id)}"><span class="mada-notification-icon">${icon[n.type]||'🔔'}</span><span class="mada-notification-copy"><b>${esc(title(n))}</b><span>${esc(n.body||'')}</span><small>${fmt(n.created_at)}</small></span></button>`).join(''):'<div class="mada-notifications-empty">لا توجد إشعارات حتى الآن.</div>';
    list.querySelectorAll('.mada-notification').forEach(b=>b.onclick=async()=>{const id=b.dataset.notificationId;await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id);b.classList.remove('unread');await count();});
    await count();
  }
  function close(){document.getElementById('madaNotificationsSheet')?.classList.remove('open');}
  document.addEventListener('click',e=>{if(e.target.closest('#notifyNav,#notifyBtn')){e.preventDefault();e.stopImmediatePropagation();open();}},true);
  window.madaOpenNotifications=open;window.madaRefreshNotificationCount=count;
  const init=()=>{setTimeout(count,1800);setInterval(count,5000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
