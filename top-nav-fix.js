/* Mada top navigation safety net: keeps the visible header buttons functional even when legacy listeners fail. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let bound=false;
  function toast(m){if(typeof window.madaToast==='function')window.madaToast(m);else if(typeof window.showToast==='function')window.showToast(m);else alert(m)}
  function openSearch(){if(typeof window.madaSearchFix==='function')return window.madaSearchFix();if(typeof window.openSearch==='function')return window.openSearch();}
  function openMessages(){if(typeof window.madaMessenger==='function')return window.madaMessenger();if(typeof window.openMessages==='function'&&window.openMessages!==openMessages)return window.openMessages();if(typeof window.showMessages==='function')return window.showMessages();}
  function openNotifications(){if(typeof window.madaOpenNotifications==='function')return window.madaOpenNotifications();if(typeof window.openNotifications==='function')return window.openNotifications();toast('تعذر فتح الإشعارات حالياً')}
  async function openFriends(){
    const s=window.sb;if(!s||!window.user?.id)return toast('سجّل الدخول أولاً');
    try{
      const {data:rows,error}=await s.from('friendships').select('id,requester_id,addressee_id,status,updated_at').or(`requester_id.eq.${window.user.id},addressee_id.eq.${window.user.id}`).order('updated_at',{ascending:false}).limit(100);
      if(error)throw error;
      const ids=[...new Set((rows||[]).map(r=>r.requester_id===window.user.id?r.addressee_id:r.requester_id))];
      let people=[]; if(ids.length){const r=await s.from('profiles').select('id,display_name,username,avatar_url').in('id',ids);if(r.error)throw r.error;people=r.data||[]}
      const byId=new Map(people.map(p=>[p.id,p]));
      const accepted=(rows||[]).filter(r=>r.status==='accepted');
      const incoming=(rows||[]).filter(r=>r.status==='pending'&&r.addressee_id===window.user.id);
      const person=id=>byId.get(id)||{display_name:'مستخدم Mada',username:''};
      let old=$('madaFriendsOverlay');if(old)old.remove();
      const o=document.createElement('div');o.id='madaFriendsOverlay';
      o.innerHTML=`<div class="mada-friends-card"><header><button id="madaFriendsClose">×</button><h2>👥 الأصدقاء</h2></header><div class="mada-friends-body"><section><h3>طلبات الصداقة ${incoming.length?`(${incoming.length})`:''}</h3>${incoming.length?incoming.map(r=>{const p=person(r.requester_id);return `<div class="mada-friend-row"><span class="mada-friend-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:esc((p.display_name||'م').charAt(0))}</span><button class="mada-friend-name" data-member-id="${esc(p.id)}"><b>${esc(p.display_name)}</b><small>@${esc(p.username||'')}</small></button><button class="mada-accept" data-id="${r.id}">قبول</button></div>`}).join(''):'<p class="mada-muted">لا توجد طلبات جديدة.</p>'}</section><section><h3>أصدقائي ${accepted.length?`(${accepted.length})`:''}</h3>${accepted.length?accepted.map(r=>{const id=r.requester_id===window.user.id?r.addressee_id:r.requester_id,p=person(id);return `<div class="mada-friend-row"><span class="mada-friend-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}">`:esc((p.display_name||'م').charAt(0))}</span><button class="mada-friend-name" data-member-id="${esc(id)}"><b>${esc(p.display_name)}</b><small>@${esc(p.username||'')}</small></button><button class="mada-chat" data-user="${id}">💬</button></div>`}).join(''):'<p class="mada-muted">لسه مفيش أصدقاء. استخدم البحث لإضافة أشخاص.</p>'}</section></div></div>`;
      document.body.appendChild(o);
      if(!$('madaFriendsStyle')){const st=document.createElement('style');st.id='madaFriendsStyle';st.textContent='#madaFriendsOverlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center} .mada-friends-card{width:100%;max-width:680px;max-height:86vh;background:#fff;color:#111;border-radius:26px 26px 0 0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.2)} .mada-friends-card header{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #eee} .mada-friends-card header h2{margin:0;flex:1;text-align:center;font-size:20px} .mada-friends-card header button{border:0;background:#f2f3f5;border-radius:50%;width:40px;height:40px;font-size:28px} .mada-friends-body{overflow:auto;padding:12px 16px 28px} .mada-friends-body section{margin-bottom:20px} .mada-friends-body h3{margin:10px 2px;font-size:16px} .mada-friend-row{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid #eee} .mada-friend-avatar{width:48px;height:48px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#e9eef7;font-weight:800;flex:none}.mada-friend-name{flex:1;display:flex;flex-direction:column;gap:3px;border:0;background:transparent;color:inherit;text-align:right;padding:0}.mada-friend-name small{opacity:.6}.mada-friend-avatar img{width:100%;height:100%;object-fit:cover}.mada-accept,.mada-chat{border:0;border-radius:12px;padding:9px 13px;font-weight:800;background:#1677ff;color:#fff}.mada-chat{font-size:18px;padding:8px 12px}.mada-muted{text-align:center;opacity:.6;padding:16px}@media(prefers-color-scheme:dark){.mada-friends-card{background:#111318;color:#f5f5f5}.mada-friends-card header{border-color:#292c33}.mada-friend-row{border-color:#292c33}.mada-friend-avatar{background:#292c33}}';document.head.appendChild(st)}
      $('madaFriendsClose').onclick=()=>o.remove();o.addEventListener('click',e=>{if(e.target===o)o.remove()});
      o.querySelectorAll('.mada-accept').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await s.from('friendships').update({status:'accepted'}).eq('id',b.dataset.id).eq('addressee_id',window.user.id).eq('status','pending');if(r.error){b.disabled=false;return toast('تعذر قبول الطلب: '+r.error.message)}toast('تم قبول طلب الصداقة ✅');o.remove();openFriends()});
      o.querySelectorAll('.mada-chat').forEach(b=>b.onclick=async()=>{try{const cid=await window.getOrCreateConversation(b.dataset.user);await window.openConversation(b.dataset.user,cid);o.remove()}catch(e){toast('تعذر فتح المحادثة: '+(e?.message||''))}});
    }catch(e){console.error('friends',e);toast('تعذر تحميل قائمة الأصدقاء: '+(e?.message||'حاول مرة أخرى'))}
  }
  function bind(){
    if(bound)return;bound=true;
    const actions=[['notifyBtn',openNotifications],['msgBtn',openMessages],['searchBtn',openSearch],['premiumBtn',()=>{if(typeof window.premiumView==='function')window.premiumView()}],['friendsNav',openFriends],['notifyNav',openNotifications],['profileNav',()=>{if(typeof window.openProfile==='function')return window.openProfile();if(typeof window.loadProfile==='function')return window.loadProfile();toast('الملف الشخصي متاح من زر الملف أسفل الشاشة')}],['photoBtn',()=>{$('imageInput')?.click()}]];
    actions.forEach(([id,fn])=>{const b=$(id);if(!b)return;b.type='button';b.disabled=false;b.style.pointerEvents='auto';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();Promise.resolve(fn()).catch(err=>console.error('Mada nav action',id,err))},true)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();[100,500,1000,2000,4000].forEach(ms=>setTimeout(bind,ms));
})();
(function(){
  if(document.querySelector('script[data-mada-social-unified]'))return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='social-unified-fix.css?v=20260904-01';document.head.appendChild(css);
  const s=document.createElement('script');s.src='social-unified-fix.js?v=20260904-01';s.async=false;s.dataset.madaSocialUnified='1';document.head.appendChild(s);
})();
(function(){
  if(document.querySelector('script[data-mada-member-profile]'))return;
  const s=document.createElement('script');s.src='member-profile-fix.js?v=20260904-01';s.async=false;s.dataset.madaMemberProfile='1';document.head.appendChild(s);
})();