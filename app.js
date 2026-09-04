const { createClient } = window.supabase;
const sb = createClient(window.MADA_SUPABASE_URL, window.MADA_SUPABASE_KEY);
const $ = id => document.getElementById(id);
const auth = $('auth'), app = $('app'), feed = $('feed'), input = $('postInput'), imageInput = $('imageInput');
let user = null, profile = null, premium = false, selectedFile = null;
let feedPosts = new Map(), activeConversation = null, realtimeChannels = [];

/* Keep the authoritative user in sync with Supabase. */
async function syncAuthUser(){
  try{
    const {data:{session}} = await sb.auth.getSession();
    if(session?.user){
      user=session.user; window.user=user; window.sb=sb;
      auth.hidden=true; app.hidden=false;
      return user;
    }
  }catch(e){ console.warn('Mada auth sync',e); }
  return null;
}

const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const initials = n => (n || 'م').trim().charAt(0);
const safeError = e => e?.message || 'حدث خطأ غير متوقع';

function showModal(title, body) { $('modalTitle').textContent = title; $('modalBody').innerHTML = body; $('modal').hidden = false; }
function closeModal() { $('modal').hidden = true; }
function setBusy(btn, busy, text) { if (!btn) return; btn.disabled = busy; if (busy) btn.dataset.oldText = btn.textContent; btn.textContent = busy ? text : (btn.dataset.oldText || btn.textContent); }
function formatDate(value) { try { return new Date(value).toLocaleString('ar-EG', {dateStyle:'short', timeStyle:'short'}); } catch { return ''; } }
function handleError(message, error) { console.error(message, error); alert(message); }

async function loadProfile() {
  const { data, error } = await sb.from('profiles').select('id,username,display_name,avatar_url,bio,role,is_banned').eq('id', user.id).maybeSingle();
  if (error) throw error;
  profile = data || { display_name: user.email?.split('@')[0] || 'مستخدم Mada' };
  const { data: sub, error: subError } = await sb.from('subscriptions').select('status,current_period_end').eq('user_id', user.id).in('status', ['trialing','active']).order('current_period_end', { ascending:false }).limit(1).maybeSingle();
  if (subError) console.warn('subscription check failed', subError);
  premium = !!sub && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
  $('userAvatar').textContent = initials(profile.display_name);
  updatePremiumUI();
}
function checkAdminStatus() { const btn = $('admin-btn'); if (!btn) return; btn.style.display = 'none'; if (!user || profile?.is_banned || profile?.role !== 'admin') return; btn.style.display = 'inline-flex'; }
function openAdminPanel() { if (profile?.role !== 'admin' || profile?.is_banned) return; window.location.href = 'admin.html'; }

/* Post-author profile opener: the author id is embedded directly on both the avatar and name. */
async function openPostAuthorProfile(id){
  if(!id) return;
  if(typeof window.madaOpenMemberProfile === 'function') return window.madaOpenMemberProfile(id);
  try{
    let s=document.querySelector('script[data-mada-post-author-profile-fallback]');
    if(!s){
      s=document.createElement('script');
      s.src='member-profile-fix.js?v=20260904-03';
      s.async=true;
      s.dataset.madaPostAuthorProfileFallback='1';
      document.head.appendChild(s);
      await new Promise((resolve,reject)=>{s.addEventListener('load',resolve,{once:true});s.addEventListener('error',reject,{once:true});});
    }
    if(typeof window.madaOpenMemberProfile === 'function') await window.madaOpenMemberProfile(id);
  }catch(e){ console.error('Mada author profile opener',e); alert('تعذر فتح الملف الشخصي للعضو.'); }
}

function renderPost(p, likes, comments) {
  const mine = likes.find(x => x.user_id === user.id), liked = !!mine, author = p.profiles || {}, likeCount = likes.length;
  const authorId = p.author_id;
  const authorAvatar = `<div class="avatar mada-post-author-link" data-member-id="${esc(authorId)}" role="button" tabindex="0" title="فتح الملف الشخصي">${initials(author.display_name)}</div>`;
  const authorName = `<div class="post-name mada-post-author-link" data-member-id="${esc(authorId)}" role="button" tabindex="0" title="فتح الملف الشخصي">${esc(author.display_name || 'مستخدم Mada')}</div>`;
  const commentHtml = comments.slice(0,20).map(c => `<div class="comment"><b>${esc(c.profiles?.display_name || 'مستخدم')}</b> ${esc(c.body)}</div>`).join('');
  const el = document.createElement('article'); el.className = 'card post'; el.dataset.postId = p.id;
  el.innerHTML = `<div class="post-head">${authorAvatar}<div>${authorName}<div class="post-time">${formatDate(p.created_at)}</div></div></div><div class="post-text">${esc(p.body || '')}</div>${p.media_url ? `<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">` : ''}<div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}" ${mine?.reaction_type ? `data-reaction="${esc(mine.reaction_type)}"` : ''}>👍 إعجاب ${likeCount}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments"><div class="comment-list">${commentHtml}</div><div class="comment-box"><input data-comment="${p.id}" maxlength="1000" placeholder="اكتب تعليقًا..."><button data-send="${p.id}">إرسال</button></div></div>`;
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
  feedPosts.clear(); data.forEach(p=>feedPosts.set(p.id,p)); const frag=document.createDocumentFragment(); data.forEach(p=>frag.appendChild(renderPost(p,likesByPost.get(p.id)||[],commentsByPost.get(p.id)||[]))); feed.replaceChildren(frag);
}
function updatePremiumUI() { $('premiumBanner').hidden = premium; $('premiumBtn').title = premium ? 'Mada Premium مفعل' : 'اشترك في Mada Premium'; }
async function addPost() { const active=await syncAuthUser(); if(!active?.id)return alert('تعذر استعادة جلسة الحساب. جرّب تحديث الصفحة مرة واحدة.'); const text=input.value.trim(),max=premium?5000:1000;if(text.length>max)return alert(`الحد الأقصى ${max} حرف`);if(!text&&!selectedFile)return;const btn=$('postBtn');setBusy(btn,true,'جارٍ النشر…');try{let media_url=null;if(selectedFile){if(!selectedFile.type.startsWith('image/'))throw new Error('اختر صورة صحيحة');if(selectedFile.size>8*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 8 ميجابايت');const ext=(selectedFile.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=`${active.id}/${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from('mada-media').upload(path,selectedFile,{contentType:selectedFile.type,upsert:false});if(up.error)throw up.error;media_url=sb.storage.from('mada-media').getPublicUrl(path).data.publicUrl;}const{error}=await sb.from('posts').insert({author_id:active.id,body:text||null,media_url,visibility:'public'});if(error)throw error;input.value='';selectedFile=null;imageInput.value='';input.placeholder='بماذا تفكر؟';await loadFeed();}catch(e){handleError('تعذر نشر المنشور: '+safeError(e),e);}finally{setBusy(btn,false);}}
async function addComment(postId){const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب.');const box=feed.querySelector(`[data-comment="${CSS.escape(postId)}"]`),text=box?.value.trim();if(!text)return;const send=feed.querySelector(`[data-send="${CSS.escape(postId)}"]`);setBusy(send,true,'…');try{const{error}=await sb.from('comments').insert({post_id:postId,author_id:active.id,body:text});if(error)throw error;box.value='';const list=feed.querySelector(`article[data-post-id="${CSS.escape(postId)}"] .comment-list`);if(list){const row=document.createElement('div');row.className='comment';row.innerHTML=`<b>${esc(profile?.display_name||'مستخدم')}</b> ${esc(text)}`;list.appendChild(row);}}catch(e){handleError('تعذر إضافة التعليق: '+safeError(e),e);}finally{setBusy(send,false);}}
async function sharePost(postId){if(typeof window.openShareModal==='function'){window.openShareModal(postId);return;}alert('ميزة المشاركة غير جاهزة. حدّث الصفحة ثم جرّب مرة أخرى.');}
async function premiumView(){const{data:plan,error}=await sb.from('premium_plans').select('name,price_egp,interval_months,features').eq('code','monthly').maybeSingle();if(error)console.warn(error);const price=plan?.price_egp??99,months=plan?.interval_months??1;showModal('💎 Mada Premium',`<div class="premium-card"><h3>ارتقِ بتجربة Mada</h3><ul class="feature-list"><li>💎 شارة Premium</li><li>🚫 تجربة بدون إعلانات</li><li>📝 منشورات حتى 5000 حرف</li><li>🎨 مزايا وتخصيصات حصرية</li><li>⚡ أولوية للمزايا الجديدة</li></ul><div class="price-box"><b>${esc(plan?.name||'Mada Premium')}</b><br><strong>${esc(price)} جنيه مصري / ${months===1?'شهر':months+' أشهر'}</strong></div><button id="payBtn" class="premium-btn wide">${premium?'Premium مفعل ✓':'الاشتراك والدفع'}</button><p id="payMsg"></p></div>`);if(!premium)$('payBtn').onclick=startCheckout;}
async function startCheckout(){const msg=$('payMsg');if(msg)msg.textContent='سيتم تجهيز الدفع الآمن…';const{data,error}=await sb.functions.invoke('create-checkout',{body:{plan_code:'monthly'}});if(error||!data?.url){if(msg)msg.textContent='الدفع الإلكتروني غير مفعّل حاليًا.';console.error(error||data);return}location.href=data.url;}
async function claimFirstAdmin(){const{data,error}=await sb.functions.invoke('claim-first-admin',{body:{}});if(error||!data?.success){alert('لا يمكن إنشاء مسؤول أول. قد يكون هناك مسؤول موجود بالفعل.');return false}alert('تم تحويل هذا الحساب إلى أول مسؤول في Mada.');return true;}
async function adminLogin(){showModal('⚙️ دخول الإدارة',`<input id="adminEmail" type="email" placeholder="البريد الإداري" style="width:100%;padding:12px;margin:6px 0"><input id="adminPass" type="password" placeholder="كلمة المرور" style="width:100%;padding:12px;margin:6px 0"><button id="adminSubmit" class="primary wide">دخول</button><button id="claimAdmin" class="admin-action" style="width:100%;margin-top:8px">👑 إنشاء أول مسؤول (مرة واحدة)</button>`);$('adminSubmit').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error){alert('بيانات الدخول غير صحيحة');return}const{data:p}=await sb.from('profiles').select('role,is_banned').eq('id',(await sb.auth.getUser()).data.user.id).single();if(p?.role==='admin'&&!p.is_banned){location.href='admin.html';return}alert('هذا الحساب ليس مسؤولاً.');await sb.auth.signOut()};$('claimAdmin').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;if(!email||!pass)return alert('اكتب البريد وكلمة المرور أولاً');const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert('سجّل الحساب أولاً من شاشة Mada ثم استخدمه هنا.');const ok=await claimFirstAdmin();if(ok)location.href='admin.html';else await sb.auth.signOut();}}

async function getFriendRows() {
  const active=await syncAuthUser(); if(!active?.id) throw new Error('انتهت جلسة الحساب');
  const {data,error}=await sb.from('friendships').select('id,requester_id,addressee_id,status,created_at,updated_at').or(`requester_id.eq.${active.id},addressee_id.eq.${active.id}`).order('updated_at',{ascending:false}).limit(100);
  if(error) throw error;
  return data||[];
}
function friendState(rows, otherId){const row=rows.find(r=>r.requester_id===otherId||r.addressee_id===otherId);if(!row)return {type:'none',row:null};if(row.status==='accepted')return {type:'accepted',row};if(row.status==='pending')return {type:row.requester_id===user.id?'outgoing':'incoming',row};return {type:'none',row};}
async function addFriend(otherId){
  const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب');const rows=await getFriendRows(); const state=friendState(rows,otherId);
  if(state.type==='accepted')return alert('هذا المستخدم صديق بالفعل.');
  if(state.type==='outgoing')return alert('تم إرسال طلب الصداقة بالفعل.');
  if(state.type==='incoming')return acceptFriend(state.row.id);
  const{error}=await sb.from('friendships').insert({requester_id:active.id,addressee_id:otherId,status:'pending'});
  if(error)return alert('تعذر إرسال طلب الصداقة: '+safeError(error));
  alert('تم إرسال طلب الصداقة بنجاح.');
  await refreshSearchResults();
}
async function acceptFriend(id){const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب');const{error}=await sb.from('friendships').... (truncated)