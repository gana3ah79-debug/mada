const { createClient } = window.supabase;
const sb = createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
const $ = id => document.getElementById(id);
const auth = $('auth'), app = $('app'), feed = $('feed'), input = $('postInput'), imageInput = $('imageInput');
let user = null, profile = null, premium = false, selectedFile = null;
let feedPosts = new Map(), activeConversation = null, realtimeChannels = [];

const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const initials = n => (n || 'م').trim().charAt(0);
const safeError = e => e?.message || 'حدث خطأ غير متوقع';

function showModal(title, body) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = body;
  $('modal').hidden = false;
}
function closeModal() { $('modal').hidden = true; }
function setBusy(btn, busy, text) {
  if (!btn) return;
  btn.disabled = busy;
  if (busy && text) btn.textContent = text;
}
function handleError(message, e) { console.error(e); alert(message); }
function formatDate(v) { try { return new Date(v).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'}); } catch { return ''; } }

async function loadProfile() {
  if (!user) return;
  const { data, error } = await sb.from('profiles').select('id,username,display_name,avatar_url,cover_url,bio,role,is_banned,is_premium,badge,custom_color,reward_crown,reward_fire,reward_bold,reward_gold_frame,pinned_post_id,premium_name_color,premium_post_style,premium_ads_disabled').eq('id',user.id).maybeSingle();
  if (error) { console.warn('profile load',error); return; }
  profile = data || null;
  const { data: sub } = await sb.from('subscriptions').select('status,current_period_end').eq('user_id',user.id).in('status',['trialing','active']).order('current_period_end',{ascending:false}).limit(1).maybeSingle();
  premium = !!(profile?.is_premium || (sub?.current_period_end && new Date(sub.current_period_end) > new Date()));
  if ($('userAvatar')) $('userAvatar').innerHTML = profile?.avatar_url ? `<img src="${esc(profile.avatar_url)}" alt="">` : initials(profile?.display_name);
  updatePremiumUI(); checkAdminStatus();
}

function checkAdminStatus() {
  const btn = $('admin-btn');
  if (!btn) return;
  btn.style.display = 'none';
  if (!user || profile?.is_banned || profile?.role !== 'admin') return;
  btn.style.display = 'inline-flex';
}
function openAdminPanel() { if (profile?.role !== 'admin' || profile?.is_banned) return; window.location.href = 'admin.html'; }

function renderPost(p, likes, comments) {
  const liked = likes.some(x => x.user_id === user.id);
  const author = p.profiles || {};
  const likeCount = likes.length;
  const commentHtml = comments.slice(0,20).map(c => `<div class="comment"><b>${esc(c.profiles?.display_name || 'مستخدم')}</b> ${esc(c.body)}</div>`).join('');
  const el = document.createElement('article');
  el.className = 'card post'; el.dataset.postId = p.id;
  el.innerHTML = `<div class="post-head"><div class="avatar">${initials(author.display_name)}</div><div><div class="post-name">${esc(author.display_name || 'مستخدم Mada')}</div><div class="post-time">${formatDate(p.created_at)}</div></div></div><div class="post-text">${esc(p.body || '')}</div>${p.media_url ? `<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">` : ''}<div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}">👍 إعجاب ${likeCount}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments"><div class="comment-list">${commentHtml}</div><div class="comment-box"><input data-comment="${p.id}" maxlength="1000" placeholder="اكتب تعليقًا..."><button data-send="${p.id}">إرسال</button></div></div>`;
  return el;
}

async function loadFeed() {
  feed.innerHTML = '<div class="card empty">جاري تحميل المنشورات…</div>';
  const { data, error } = await sb.from('posts').select('id,author_id,body,media_url,created_at,profiles!posts_author_id_fkey(display_name,avatar_url)').eq('visibility','public').order('created_at',{ascending:false}).limit(20);
  if (error) { feed.innerHTML = `<div class="card empty">تعذر تحميل المنشورات.<br><small>${esc(safeError(error))}</small></div>`; return; }
  if (!data?.length) { feed.innerHTML = '<div class="card empty">لا توجد منشورات بعد. كن أول من ينشر في Mada 👋</div>'; return; }
  const ids = data.map(p => p.id);
  const [likesRes, commentsRes] = await Promise.all([sb.from('post_likes').select('post_id,user_id,reaction_type').in('post_id',ids),sb.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name)').in('post_id',ids).order('created_at',{ascending:true})]);
  const likesByPost = new Map(), commentsByPost = new Map();
  (likesRes.data||[]).forEach(x=>{if(!likesByPost.has(x.post_id))likesByPost.set(x.post_id,[]);likesByPost.get(x.post_id).push(x);});
  (commentsRes.data||[]).forEach(x=>{if(!commentsByPost.has(x.post_id))commentsByPost.set(x.post_id,[]);commentsByPost.get(x.post_id).push(x);});
  feedPosts.clear(); data.forEach(p=>feedPosts.set(p.id,p));
  const frag=document.createDocumentFragment(); data.forEach(p=>frag.appendChild(renderPost(p,likesByPost.get(p.id)||[],commentsByPost.get(p.id)||[]))); feed.replaceChildren(frag);
}

function updatePremiumUI() { if($('premiumBanner'))$('premiumBanner').hidden=premium; if($('premiumBtn'))$('premiumBtn').title=premium?'Mada Premium مفعل':'اشترك في Mada Premium'; }

async function addPost() {
  const text=input.value.trim(), max=premium?5000:1000;
  if(text.length>max)return alert(`الحد الأقصى ${max} حرف`);
  if(!text&&!selectedFile)return;
  const btn=$('postBtn');setBusy(btn,true,'جارٍ النشر…');
  try{let media_url=null;if(selectedFile){if(!selectedFile.type.startsWith('image/'))throw new Error('اختر صورة صحيحة');if(selectedFile.size>8*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');const ext=(selectedFile.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=`${user.id}/${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from('mada-media').upload(path,selectedFile,{contentType:selectedFile.type,upsert:false});if(up.error)throw up.error;media_url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;}const{error}=await sb.from('posts').insert({author_id:user.id,body:text||null,media_url,visibility:'public'});if(error)throw error;input.value='';selectedFile=null;imageInput.value='';input.placeholder='بماذا تفكر؟';await loadFeed();}catch(e){handleError('تعذر نشر المنشور: '+safeError(e),e);}finally{setBusy(btn,false);}
}

async function toggleLike(postId,liked){const btn=feed.querySelector(`.like[data-id="${CSS.escape(postId)}"]`);if(btn)btn.disabled=true;try{const q=liked?sb.from('post_likes').delete().eq('post_id',postId).eq('user_id',user.id):sb.from('post_likes').insert({post_id:postId,user_id:user.id,reaction_type:'like'});const{error}=await q;if(error)throw error;if(btn){btn.dataset.liked=String(!liked);btn.classList.toggle('liked',!liked);const n=Number((btn.textContent.match(/\d+$/)||['0'])[0]);btn.textContent=`👍 إعجاب ${Math.max(0,n+(liked?-1:1))}`;}}catch(e){handleError('تعذر تحديث الإعجاب: '+safeError(e),e);}finally{if(btn)btn.disabled=false;}}
async function addComment(postId){const box=feed.querySelector(`[data-comment="${CSS.escape(postId)}"]`),text=box?.value.trim();if(!text)return;const send=feed.querySelector(`[data-send="${CSS.escape(postId)}"]`);setBusy(send,true,'…');try{const{error}=await sb.from('comments').insert({post_id:postId,author_id:user.id,body:text});if(error)throw error;box.value='';const list=feed.querySelector(`article[data-post-id="${CSS.escape(postId)}"] .comment-list`);if(list){const row=document.createElement('div');row.className='comment';row.innerHTML=`<b>${esc(profile?.display_name||'مستخدم')}</b> ${esc(text)}`;list.appendChild(row);}}catch(e){handleError('تعذر إضافة التعليق: '+safeError(e),e);}finally{setBusy(send,false);}}

async function sharePost(postId) {
  if (typeof window.openShareModal === 'function') { window.openShareModal(postId); return; }
  alert('ميزة المشاركة غير جاهزة. حدّث الصفحة ثم جرّب مرة أخرى.');
}

async function premiumView(){const{data:plan,error}=await sb.from('premium_plans').select('name,price_egp,interval_months,features').eq('code','monthly').maybeSingle();if(error)console.warn(error);const price=plan?.price_egp??99,months=plan?.interval_months??1;showModal('💎 Mada Premium',`<div class="premium-card"><h3>ارتقِ بتجربة Mada</h3><ul class="feature-list"><li>💎 شارة Premium</li><li>🚫 تجربة بدون إعلانات</li><li>📝 منشورات حتى 5000 حرف</li><li>🎨 مزايا وتخصيصات حصرية</li><li>⚡ أولوية للمزايا الجديدة</li></ul><div class="price-box"><b>${esc(plan?.name||'Mada Premium')}</b><br><strong>${esc(price)} جنيه مصري / ${months===1?'شهر':months+' أشهر'}</strong></div><button id="payBtn" class="premium-btn wide">${premium?'Premium مفعل ✓':'الاشتراك والدفع'}</button><p id="payMsg"></p></div>`);if(!premium)$('payBtn').onclick=startCheckout;}
async function startCheckout(){const msg=$('payMsg');if(msg)msg.textContent='سيتم تجهيز الدفع الآمن…';const{data,error}=await sb.functions.invoke('create-checkout',{body:{plan_code:'monthly'}});if(error||!data?.url){if(msg)msg.textContent='الدفع الإلكتروني غير مفعّل حاليًا.';console.error(error||data);return}location.href=data.url;}
async function claimFirstAdmin(){const{data,error}=await sb.functions.invoke('claim-first-admin',{body:{}});if(error||!data?.success){alert('لا يمكن إنشاء مسؤول أول. قد يكون هناك مسؤول موجود بالفعل.');return false}alert('تم تحويل هذا الحساب إلى أول مسؤول في Mada.');return true;}
async function adminLogin(){showModal('⚙️ دخول الإدارة',`<input id="adminEmail" type="email" placeholder="البريد الإداري" style="width:100%;padding:12px;margin:6px 0"><input id="adminPass" type="password" placeholder="كلمة المرور" style="width:100%;padding:12px;margin:6px 0"><button id="adminSubmit" class="primary wide">دخول</button><button id="claimAdmin" class="admin-action" style="width:100%;margin-top:8px">👑 إنشاء أول مسؤول (مرة واحدة)</button>`);$('adminSubmit').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error){alert('بيانات الدخول غير صحيحة');return}const{data:p}=await sb.from('profiles').select('role,is_banned').eq('id',(await sb.auth.getUser()).data.user.id).single();if(p?.role==='admin'&&!p.is_banned){location.href='admin.html';return}alert('هذا الحساب ليس مسؤولاً.');await sb.auth.signOut()};$('claimAdmin').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;if(!email||!pass)return alert('اكتب البريد وكلمة المرور أولاً');const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert('سجّل الحساب أولاً من شاشة Mada ثم استخدمه هنا.');const ok=await claimFirstAdmin();if(ok)location.href='admin.html';else await sb.auth.signOut();}}

async function searchUsers(term){const q=term.trim();if(q.length<2)return alert('اكتب حرفين على الأقل');const box=$('results');if(box)box.innerHTML='<p>جاري البحث…</p>';const{data,error}=await sb.from('profiles').select('id,username,display_name,avatar_url').or(`username.ilike.%${q.replace(/[,()]/g,'')}%,display_name.ilike.%${q.replace(/[,()]/g,'')}%`).neq('id',user.id).limit(15);if(error){if(box)box.innerHTML=`<p>تعذر البحث: ${esc(safeError(error))}</p>`;return;}if(!data?.length){if(box)box.innerHTML='<p>لا توجد نتائج.</p>';return;}if(box)box.innerHTML=data.map(p=>`<div class="comment" style="display:flex;align-items:center;gap:8px"><span>${esc(p.display_name)}</span><button class="friend-action admin-action" data-user="${p.id}">إضافة صديق</button><button class="message-user admin-action" data-user="${p.id}">رسالة</button></div>`).join('');
}
