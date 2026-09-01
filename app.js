const { createClient } = window.supabase;
const sb = createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
const $ = id => document.getElementById(id);
const auth = $('auth'), app = $('app'), feed = $('feed'), input = $('postInput'), imageInput = $('imageInput');
let user = null, profile = null, premium = false, selectedFile = null;

function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
function initials(n){return (n||'م').trim().charAt(0)}
function showModal(title,body){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modal').hidden=false}
function closeModal(){$('modal').hidden=true}
async function loadProfile(){
  const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).single();
  if(error){console.error(error);return}
  profile=data;
  const {data:sub}=await sb.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).in('status',['trialing','active']).order('current_period_end',{ascending:false}).limit(1).maybeSingle();
  premium=!!sub && (!sub.current_period_end || new Date(sub.current_period_end)>new Date());
  $('userAvatar').textContent=initials(profile.display_name); updatePremiumUI();
}
async function loadFeed(){
  feed.innerHTML='<div class="card empty">جاري تحميل المنشورات…</div>';
  const {data,error}=await sb.from('posts').select('id,author_id,body,media_url,created_at,profiles(display_name,avatar_url)').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
  if(error){feed.innerHTML='<div class="card empty">تعذر تحميل المنشورات. حاول مرة أخرى.</div>';console.error(error);return}
  const ids=(data||[]).map(p=>p.id);
  let likes=[],comments=[];
  if(ids.length){
    const l=await sb.from('post_likes').select('post_id,user_id').in('post_id',ids);likes=l.data||[];
    const c=await sb.from('comments').select('id,post_id,author_id,body,created_at,profiles(display_name)').in('post_id',ids).order('created_at',{ascending:true});comments=c.data||[];
  }
  if(!data?.length){feed.innerHTML='<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>';return}
  feed.innerHTML='';
  data.forEach(p=>{
    const pl=likes.filter(x=>x.post_id===p.id), cs=comments.filter(x=>x.post_id===p.id), liked=pl.some(x=>x.user_id===user.id);
    const el=document.createElement('article');el.className='card post';
    el.innerHTML=`<div class="post-head"><div class="avatar">${initials(p.profiles?.display_name)}</div><div><div class="post-name">${esc(p.profiles?.display_name||'مستخدم Mada')}</div><div class="post-time">${new Date(p.created_at).toLocaleString('ar-EG')}</div></div></div><div class="post-text">${esc(p.body||'')}</div>${p.media_url?`<img class="post-image" src="${esc(p.media_url)}" alt="صورة المنشور">`:''}<div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}">👍 إعجاب ${pl.length}</button><button>${'💬 تعليق '+cs.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments">${cs.map(c=>`<div class="comment"><b>${esc(c.profiles?.display_name||'مستخدم')}</b> ${esc(c.body)}</div>`).join('')}<div class="comment-box"><input data-comment="${p.id}" placeholder="اكتب تعليقًا..."><button data-send="${p.id}">إرسال</button></div></div>`;
    feed.appendChild(el);
  });
}
function updatePremiumUI(){$('premiumBanner').hidden=premium;$('premiumBtn').title=premium?'Mada Premium مفعل':'اشترك في Mada Premium'}
async function addPost(){
  const text=input.value.trim();
  const max=premium?5000:1000;
  if(text.length>max){alert(`الحد الأقصى ${max} حرف`);return}
  if(!text&&!selectedFile)return;
  let media_url=null;
  if(selectedFile){
    const ext=(selectedFile.name.split('.').pop()||'jpg').toLowerCase();
    const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
    const up=await sb.storage.from('mada-media').upload(path,selectedFile,{contentType:selectedFile.type,upsert:false});
    if(up.error){alert('تعذر رفع الصورة');console.error(up.error);return}
    media_url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;
  }
  const {error}=await sb.from('posts').insert({author_id:user.id,body:text||null,media_url,visibility:'public'});
  if(error){alert('تعذر نشر المنشور');console.error(error);return}
  input.value='';selectedFile=null;imageInput.value='';input.placeholder='بماذا تفكر؟';await loadFeed();
}
async function toggleLike(postId,liked){
  if(liked) await sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id);
  else await sb.from('post_likes').insert({post_id:postId,user_id:user.id});
  await loadFeed();
}
async function addComment(postId){const box=document.querySelector(`[data-comment="${postId}"]`);const text=box?.value.trim();if(!text)return;const {error}=await sb.from('comments').insert({post_id:postId,author_id:user.id,body:text});if(error){alert('تعذر إضافة التعليق');return}await loadFeed()}
async function premiumView(){
  const {data:plan}=await sb.from('premium_plans').select('*').eq('code','monthly').single();
  showModal('💎 Mada Premium',`<div class="premium-card"><h3>ارتقِ بتجربة Mada</h3><ul class="feature-list"><li>💎 شارة Premium</li><li>🚫 تجربة بدون إعلانات</li><li>📝 منشورات حتى 5000 حرف</li><li>🎨 مزايا وتخصيصات حصرية</li><li>⚡ أولوية للمزايا الجديدة</li></ul><div class="price-box"><b>${esc(plan?.name||'Mada Premium')}</b><br><strong>${plan?.price_egp||99} جنيه مصري / شهر</strong></div><button id="payBtn" class="premium-btn wide">${premium?'Premium مفعل ✓':'الاشتراك والدفع'}</button><p id="payMsg"></p></div>`);
  if(!premium)$('payBtn').onclick=()=>startCheckout();
}
async function startCheckout(){
  $('payMsg').textContent='سيتم تجهيز الدفع الآمن…';
  const {data,error}=await sb.functions.invoke('create-checkout',{body:{plan_code:'monthly'}});
  if(error||!data?.url){$('payMsg').textContent='لم يتم إعداد بوابة الدفع بعد. سنربطها بعد اختيار مزود الدفع.';return}
  location.href=data.url;
}
async function adminLogin(){
  showModal('⚙️ دخول الإدارة',`<input id="adminEmail" type="email" placeholder="البريد الإداري" style="width:100%;padding:12px;margin:6px 0"><input id="adminPass" type="password" placeholder="كلمة المرور" style="width:100%;padding:12px;margin:6px 0"><button id="adminSubmit" class="primary wide">دخول</button>`);
  $('adminSubmit').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;const {error}=await sb.auth.signInWithPassword({email,password:pass});if(error){alert('بيانات الدخول غير صحيحة');return}location.href='admin.html'};
}
async function start(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){auth.hidden=false;app.hidden=true;return}
  user=session.user;auth.hidden=true;app.hidden=false;await loadProfile();await loadFeed();
}
$('loginBtn').onclick=async()=>{
  const name=$('nameInput').value.trim(),email=$('emailInput').value.trim(),password=$('passwordInput').value;
  if(!email||password.length<6){alert('اكتب بريدًا صحيحًا وكلمة مرور 6 أحرف على الأقل');return}
  let r=await sb.auth.signInWithPassword({email,password});
  if(r.error){r=await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});if(r.error){alert(r.error.message);return}if(!r.data.session){$('authMsg').textContent='تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.';return}}
  await start();
};
$('adminLoginBtn').onclick=adminLogin;$('postBtn').onclick=addPost;$('createNav').onclick=()=>input.focus();$('photoBtn').onclick=()=>imageInput.click();imageInput.onchange=()=>{selectedFile=imageInput.files?.[0]||null;if(selectedFile)input.placeholder='اكتب وصف الصورة ثم اضغط نشر'};
$('premiumBtn').onclick=premiumView;$('premiumBannerBtn').onclick=premiumView;$('closeModal').onclick=closeModal;
feed.onclick=async e=>{const like=e.target.closest('.like');if(like){await toggleLike(like.dataset.id,like.dataset.liked==='true');return}const send=e.target.closest('[data-send]');if(send){await addComment(send.dataset.send);return}const share=e.target.closest('.share');if(share){const url=location.href+'#post-'+share.dataset.id;if(navigator.share)await navigator.share({title:'Mada',url});else{await navigator.clipboard?.writeText(url);alert('تم نسخ رابط المنشور')}}};
$('profileNav').onclick=()=>showModal('الملف الشخصي',`<div style="text-align:center"><div class="avatar" style="margin:auto;width:70px;height:70px;font-size:28px">${initials(profile?.display_name)}</div><h3>${esc(profile?.display_name)} ${premium?'💎':''}</h3><p>${esc(user?.email)}</p><button id="logout" class="primary wide">تسجيل الخروج</button></div>`);
$('modal').onclick=async e=>{if(e.target.id==='logout'){await sb.auth.signOut();closeModal();location.reload()}};
$('friendsNav').onclick=()=>showModal('الأصدقاء','<p>نظام الأصدقاء سيتم ربطه بجدول friendships الموجود في قاعدة البيانات.</p>');
$('notifyNav').onclick=async()=>{const {data}=await sb.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);showModal('الإشعارات',(data?.length?data.map(n=>`<div class="comment"><b>${esc(n.title)}</b><br>${esc(n.body||'')}</div>`).join(''):'<p>لا توجد إشعارات.</p>'))};
$('notifyBtn').onclick=$('notifyNav').onclick;$('searchBtn').onclick=()=>showModal('البحث','<input id="searchInput" placeholder="ابحث عن مستخدم…" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px"><button id="doSearch" class="primary wide" style="margin-top:8px">بحث</button><div id="results"></div>');
$('msgBtn').onclick=()=>showModal('الرسائل','<p>سنضيف المحادثات الفورية باستخدام Realtime بعد تجهيز شاشة المحادثات.</p>');
start();