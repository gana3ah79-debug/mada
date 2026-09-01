const $=id=>document.getElementById(id);
const auth=$('auth'),app=$('app'),feed=$('feed'),input=$('postInput'),imageInput=$('imageInput');
let user=JSON.parse(localStorage.getItem('mada_user')||'null');
let posts=JSON.parse(localStorage.getItem('mada_posts')||'[]');
let premium=JSON.parse(localStorage.getItem('mada_premium')||'false');
let selectedImage='';
const ADMIN_USER='admin1';
const ADMIN_PASS='Ahmed1979';
let isAdmin=sessionStorage.getItem('mada_admin')==='1';

function save(){localStorage.setItem('mada_posts',JSON.stringify(posts))}
function initials(n){return(n||'م').trim().charAt(0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function showModal(title,body){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modal').hidden=false}
function render(){
  feed.innerHTML='';
  if(!posts.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return}
  posts.forEach((p,i)=>{
    const el=document.createElement('article');el.className='card post';
    const comments=(p.comments||[]).map(c=>`<div class="comment"><b>${esc(c.name)}</b> ${esc(c.text)}</div>`).join('');
    el.innerHTML=`<div class="post-head"><div class="avatar">${initials(p.name)}</div><div><div class="post-name">${esc(p.name||'مستخدم Mada')} ${p.verified?'💎':''}</div><div class="post-time">${p.time||'الآن'}</div></div></div><div class="post-text"></div>${p.image?`<img class="post-image" src="${p.image}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${p.liked?'liked':''}" data-i="${i}">👍 إعجاب ${p.likes||0}</button><button class="comment-btn" data-i="${i}">💬 تعليق ${p.comments?.length||0}</button><button class="share-btn" data-i="${i}">↗️ مشاركة</button></div><div class="comments">${comments}<div class="comment-box"><input data-comment="${i}" placeholder="اكتب تعليقًا..."><button data-send="${i}">إرسال</button></div></div>`;
    el.querySelector('.post-text').textContent=p.text;feed.appendChild(el)
  })
}
function updatePremiumUI(){
  $('premiumBanner').hidden=premium;
  $('premiumBtn').title=premium?'Mada Premium مفعل':'اشترك في Mada Premium';
}
function addPost(){
  const text=input.value.trim();
  const max=premium?5000:1000;
  if(text.length>max){alert(`الحد الأقصى ${max} حرف${premium?'':' — اشترك في Premium لزيادة الحد'}`);return}
  if(!text&&!selectedImage)return;
  posts.unshift({name:user.name,text,image:selectedImage,likes:0,liked:false,comments:[],time:'الآن',verified:premium});
  save();input.value='';input.placeholder='بماذا تفكر؟';selectedImage='';imageInput.value='';render()
}
function premiumView(){
  showModal('💎 Mada Premium',`<div class="premium-card"><h3>ارتقِ بتجربة Mada</h3><p>مميزات الخطة المدفوعة:</p><ul class="feature-list"><li>💎 شارة Premium بجانب اسمك</li><li>🚫 تجربة بدون إعلانات</li><li>📝 منشورات أطول حتى 5000 حرف</li><li>🎨 تخصيصات ومزايا حصرية للملف الشخصي</li><li>⚡ أولوية في المزايا الجديدة</li><li>🔒 إعدادات خصوصية متقدمة مستقبلًا</li></ul><div class="price-box"><b>الخطة الشهرية</b><br><strong>99 جنيه مصري / شهر</strong><br><small>نسخة تجريبية — لا يوجد دفع حقيقي الآن</small></div><button id="activatePremium" class="premium-btn wide">${premium?'Premium مفعل ✓':'تفعيل Premium تجريبي'}</button></div>`);
  const btn=$('activatePremium');if(btn&&!premium)btn.onclick=()=>{premium=true;localStorage.setItem('mada_premium','true');updatePremiumUI();showModal('تم التفعيل 🎉','<p>تم تفعيل Mada Premium على هذا الجهاز في النسخة التجريبية.</p>')}
}
function adminLogin(){
  showModal('⚙️ لوحة تحكم Mada',`<div><p>تسجيل دخول المسؤول</p><input id="adminUser" placeholder="اسم المستخدم" autocomplete="username" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:6px 0"><input id="adminPass" type="password" placeholder="كلمة المرور" autocomplete="current-password" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin:6px 0"><button id="adminSubmit" class="primary wide">دخول لوحة التحكم</button></div>`);
  $('adminSubmit').onclick=()=>{if($('adminUser').value===ADMIN_USER&&$('adminPass').value===ADMIN_PASS){isAdmin=true;sessionStorage.setItem('mada_admin','1');adminDashboard()}else alert('اسم المستخدم أو كلمة المرور غير صحيحة')}
}
function adminDashboard(){
  const premiumCount=localStorage.getItem('mada_premium')==='true'?1:0;
  showModal('لوحة تحكم Mada',`<div class="admin-head"><b>مرحبًا ${ADMIN_USER}</b><div>لوحة الإدارة</div></div><div class="admin-grid"><div class="admin-stat"><b>${posts.length}</b>منشور</div><div class="admin-stat"><b>${user?1:0}</b>مستخدم محلي</div><div class="admin-stat"><b>${premiumCount}</b>Premium تجريبي</div><div class="admin-stat"><b>✓</b>النظام</div></div><hr><button id="adminPremium" class="admin-action">💎 ${premium?'إلغاء Premium لهذا الجهاز':'تفعيل Premium لهذا الجهاز'}</button><button id="adminClearPosts" class="admin-action danger">🗑️ حذف كل المنشورات المحلية</button><button id="adminLogout" class="admin-action">🚪 تسجيل خروج الإدارة</button>`);
  $('adminPremium').onclick=()=>{premium=!premium;localStorage.setItem('mada_premium',String(premium));updatePremiumUI();adminDashboard()};
  $('adminClearPosts').onclick=()=>{if(confirm('هل تريد حذف كل المنشورات المحفوظة على هذا الجهاز؟')){posts=[];save();render();adminDashboard()}};
  $('adminLogout').onclick=()=>{isAdmin=false;sessionStorage.removeItem('mada_admin');$('modal').hidden=true}
}
$('loginBtn').onclick=()=>{const name=$('nameInput').value.trim();const email=$('emailInput').value.trim();const password=$('passwordInput').value;if(!name||!email||password.length<4){alert('اكتب الاسم والبريد وكلمة مرور 4 أحرف على الأقل');return}user={name,email};localStorage.setItem('mada_user',JSON.stringify(user));start()};
$('adminLoginBtn').onclick=adminLogin;
function start(){if(!user){auth.hidden=false;app.hidden=true;return}auth.hidden=true;app.hidden=false;$('userAvatar').textContent=initials(user.name);updatePremiumUI();render()}
$('postBtn').onclick=addPost;input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addPost()}});$('photoBtn').onclick=()=>imageInput.click();$('createNav').onclick=()=>input.focus();imageInput.onchange=()=>{const f=imageInput.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{selectedImage=r.result;input.placeholder='اكتب وصف الصورة ثم اضغط نشر'};r.readAsDataURL(f)};
$('premiumBtn').onclick=premiumView;$('premiumBannerBtn').onclick=premiumView;
feed.onclick=e=>{const like=e.target.closest('.like');if(like){const i=+like.dataset.i;posts[i].liked=!posts[i].liked;posts[i].likes=(posts[i].likes||0)+(posts[i].liked?1:-1);save();render();return}const send=e.target.closest('[data-send]');if(send){const i=+send.dataset.send;const box=document.querySelector(`[data-comment="${i}"]`);const text=box.value.trim();if(text){posts[i].comments=posts[i].comments||[];posts[i].comments.push({name:user.name,text});box.value='';save();render()}return}const share=e.target.closest('.share-btn');if(share){const p=posts[+share.dataset.i];navigator.clipboard?.writeText(`${p.name}: ${p.text}`);alert('تم نسخ نص المنشور');return}};
$('profileNav').onclick=()=>showModal('الملف الشخصي',`<div style="text-align:center"><div class="avatar" style="margin:auto;width:70px;height:70px;font-size:28px">${initials(user?.name)}</div><h3>${esc(user?.name)} ${premium?'💎':''}</h3><p>${esc(user?.email)}</p>${premium?'<p>💎 عضو Mada Premium</p>':''}<button id="logout" class="primary wide">تسجيل الخروج</button>${isAdmin?'<button id="openAdmin" class="admin-action">⚙️ لوحة التحكم</button>':''}</div>`); 
$('modal').onclick=e=>{if(e.target.id==='logout'){localStorage.removeItem('mada_user');user=null;$('modal').hidden=true;start()}if(e.target.id==='openAdmin')adminDashboard()};
$('closeModal').onclick=()=>$('modal').hidden=true;
$('friendsNav').onclick=()=>showModal('الأصدقاء','<p>ميزة الأصدقاء قيد التطوير. سنضيف البحث وطلبات الصداقة قريبًا 👥</p>');
$('notifyNav').onclick=()=>showModal('الإشعارات','<p>لا توجد إشعارات جديدة 🔔</p>');
$('searchBtn').onclick=()=>showModal('البحث','<input id="search" placeholder="ابحث في Mada..." style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px">');
$('msgBtn').onclick=()=>showModal('الرسائل','<p>المحادثات قيد التطوير 💬</p>');
$('notifyBtn').onclick=$('notifyNav').onclick;
start();