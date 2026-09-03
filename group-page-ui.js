/* Mada Groups - visible dashboard controls */
(function(){
 const S=()=>{try{return sb}catch(e){return window.sb||null}};
 const U=()=>{try{return user}catch(e){return window.user||null}};
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
 function css(){if(document.getElementById('mada-group-page-css'))return;const st=document.createElement('style');st.id='mada-group-page-css';st.textContent=`#madaGroupDashboard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}.mgd-btn{border:0;border-radius:16px;padding:12px 8px;background:var(--card,#fff);box-shadow:0 4px 16px #0001;font-weight:800;cursor:pointer;color:inherit}.mgd-btn b{display:block;font-size:18px;margin-bottom:3px}.mgd-btn small{opacity:.65}.mgd-btn.primary{background:#1877f2;color:#fff}.mgd-stat{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:16px;background:var(--card,#fff);margin:8px 0;font-weight:800}.mgd-stat span{opacity:.65;font-weight:600}.mgd-unread{background:#e53935;color:#fff;border-radius:99px;padding:3px 8px;font-size:11px}body.dark .mgd-btn,body.dark .mgd-stat{background:#17191d;color:#fff}`;document.head.appendChild(st)}
 async function add(){
  css(); const shell=document.querySelector('.groups-shell'); if(!shell||document.getElementById('madaGroupDashboard'))return;
  const host=shell.querySelector('.group-buttons')||shell.querySelector('.groups-list')||shell;
  const d=document.createElement('div');d.id='madaGroupDashboard';
  d.innerHTML='<button class="mgd-btn primary" id="mgdChat"><b>💬</b><small>دردشة المجموعة</small></button><button class="mgd-btn" id="mgdMembers"><b>👥</b><small>الأعضاء والمشرفون</small></button><button class="mgd-btn" id="mgdPosts"><b>📝</b><small>منشورات المجموعة</small></button><button class="mgd-btn" id="mgdNotify"><b>🔔</b><small>إشعارات المجموعة</small></button>';
  host.prepend(d);
  d.querySelector('#mgdChat').onclick=()=>document.getElementById('geChat')?.click()||window.madaToast?.('افتح المجموعة أولاً');
  d.querySelector('#mgdMembers').onclick=()=>document.querySelector('.gmmi')?.remove()||document.getElementById('mmChatUser')?.click()||window.madaToast?.('الأعضاء متاحون من دردشة المجموعة');
  d.querySelector('#mgdPosts').onclick=()=>{const el=document.querySelector('.group-posts,.group-feed,#groupPosts');if(el)el.scrollIntoView({behavior:'smooth'});else window.madaToast?.('منشورات المجموعة تظهر أسفل بيانات المجموعة');};
  d.querySelector('#mgdNotify').onclick=async()=>{const s=S(),u=U(),gid=window.__madaActiveGroupId;if(!s||!u||!gid)return;const r=await s.from('group_members').select('muted_until').eq('group_id',gid).eq('user_id',u.id).maybeSingle();if(r.data?.muted_until&&new Date(r.data.muted_until)>new Date()){window.madaToast?.('إشعارات المجموعة مكتومة حالياً');return}window.madaToast?.('إشعارات المجموعة مفعّلة 🔔');};
 }
 const obs=new MutationObserver(add);if(document.body)obs.observe(document.body,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',add);setInterval(add,1200);
})();