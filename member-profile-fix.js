/* Mada: clicking a member name opens that member's profile. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function openMemberProfile(id){
    if(!id||!window.sb)return;
    if(id===window.user?.id){if(typeof window.loadProfile==='function')return window.loadProfile();return;}
    try{
      const {data:p,error}=await window.sb.from('profiles').select('id,username,display_name,avatar_url,bio,created_at').eq('id',id).maybeSingle();
      if(error)throw error;
      if(!p)return alert('العضو غير موجود');
      const {data:posts}=await window.sb.from('posts').select('id,body,media_url,created_at,visibility').eq('author_id',id).eq('visibility','public').order('created_at',{ascending:false}).limit(12);
      let old=document.getElementById('madaMemberProfileOverlay');if(old)old.remove();
      const o=document.createElement('div');o.id='madaMemberProfileOverlay';
      const avatar=p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:`<span>${esc((p.display_name||'م').charAt(0))}</span>`;
      o.innerHTML=`<div class="mada-member-profile-card"><header><button class="mada-member-close" type="button">×</button><h2>الملف الشخصي</h2></header><div class="mada-member-hero"><div class="mada-member-avatar">${avatar}</div><h3>${esc(p.display_name||'مستخدم Mada')}</h3><div class="mada-member-username">${p.username?'@'+esc(p.username):''}</div>${p.bio?`<p>${esc(p.bio)}</p>`:''}<div class="mada-member-actions"><button class="mada-member-add" type="button" data-user="${esc(id)}">👥 صداقة</button><button class="mada-member-chat" type="button" data-user="${esc(id)}">💬 رسالة</button></div></div><section class="mada-member-posts"><h3>المنشورات</h3>${posts?.length?posts.map(x=>`<article><p>${esc(x.body||'')}</p>${x.media_url?`<img src="${esc(x.media_url)}" alt="صورة المنشور">`:''}<small>${new Date(x.created_at).toLocaleString('ar-EG',{dateStyle:'medium'})}</small></article>`).join(''):'<p class="mada-member-empty">لا توجد منشورات عامة بعد.</p>'}</section></div>`;
      document.body.appendChild(o);
      o.querySelector('.mada-member-close').onclick=()=>o.remove();
      o.addEventListener('click',e=>{if(e.target===o)o.remove()});
      const add=o.querySelector('.mada-member-add');
      add.onclick=async()=>{if(typeof window.addFriend==='function')await window.addFriend(id);};
      o.querySelector('.mada-member-chat').onclick=async()=>{try{const cid=await window.getOrCreateConversation(id);await window.openConversation(id,cid);o.remove()}catch(e){alert('تعذر فتح المحادثة: '+(e?.message||''))}};
    }catch(e){console.error('member profile',e);alert('تعذر تحميل الملف الشخصي: '+(e?.message||'حاول مرة أخرى'))}
  }
  function bind(){
    document.addEventListener('click',e=>{
      const el=e.target.closest('[data-member-id]');
      if(!el)return;
      e.preventDefault();e.stopPropagation();openMemberProfile(el.dataset.memberId);
    },true);
  }
  window.madaOpenMemberProfile=openMemberProfile;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();