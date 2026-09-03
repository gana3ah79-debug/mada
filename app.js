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

function renderPost(p, likes, comments) {
  const mine = likes.find(x => x.user_id === user.id), liked = !!mine, author = p.profiles || {}, likeCount = likes.length;
  const commentHtml = comments.slice(0,20).map(c => `<div class="comment"><b>${esc(c.profiles?.display_name || 'مستخدم')}</b> ${esc(c.body)}</div>`).join('');
  const el = document.createElement('article'); el.className = 'card post'; el.dataset.postId = p.id;
  el.innerHTML = `<div class="post-head"><div class="avatar">${initials(author.display_name)}</div><div><div class="post-name">${esc(author.display_name || 'مستخدم Mada')}</div><div class="post-time">${formatDate(p.created_at)}</div></div></div><div class="post-text">${esc(p.body || '')}</div>${p.media_url ? `<img class="post-image" loading="lazy" src="${esc(p.media_url)}" alt="صورة المنشور">` : ''}<div class="post-actions"><button class="like ${liked?'liked':''}" data-id="${p.id}" data-liked="${liked}" ${mine?.reaction_type ? `data-reaction="${esc(mine.reaction_type)}"` : ''}>👍 إعجاب ${likeCount}</button><button class="comment-toggle" data-id="${p.id}">💬 تعليق ${comments.length}</button><button class="share" data-id="${p.id}">↗️ مشاركة</button></div><div class="comments"><div class="comment-list">${commentHtml}</div><div class="comment-box"><input data-comment="${p.id}" maxlength="1000" placeholder="اكتب تعليقًا..."><button data-send="${p.id}">إرسال</button></div></div>`;
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
async function acceptFriend(id){const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب');const{error}=await sb.from('friendships').update({status:'accepted'}).eq('id',id).eq('addressee_id',active.id).eq('status','pending');if(error)return alert('تعذر قبول الطلب: '+safeError(error));await openFriends();}
async function rejectFriend(id){const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب');const{error}=await sb.from('friendships').delete().eq('id',id).eq('addressee_id',active.id).eq('status','pending');if(error)return alert('تعذر حذف الطلب: '+safeError(error));await openFriends();}
async function openFriends(){
  try{
    const rows=await getFriendRows();
    const ids=[...new Set(rows.flatMap(r=>[r.requester_id,r.addressee_id]).filter(id=>id!==user.id))];
    const{data:people}=ids.length?await sb.from('profiles').select('id,username,display_name,avatar_url').in('id',ids):{data:[]};
    const byId=new Map((people||[]).map(p=>[p.id,p]));
    const incoming=rows.filter(r=>r.status==='pending'&&r.addressee_id===user.id);
    const friends=rows.filter(r=>r.status==='accepted');
    const sent=rows.filter(r=>r.status==='pending'&&r.requester_id===user.id);
    const incomingHtml=incoming.map(r=>{const p=byId.get(r.requester_id)||{};return `<div class="comment" style="display:flex;align-items:center;gap:8px"><b>${esc(p.display_name||'مستخدم')}</b><button class="accept-friend admin-action" data-id="${r.id}">قبول</button><button class="reject-friend admin-action" data-id="${r.id}">حذف</button></div>`}).join('');
    const friendHtml=friends.map(r=>{const oid=r.requester_id===user.id?r.addressee_id:r.requester_id,p=byId.get(oid)||{};return `<div class="comment" style="display:flex;align-items:center;gap:8px"><b>${esc(p.display_name||'مستخدم')}</b><button class="message-user admin-action" data-user="${oid}">رسالة</button></div>`}).join('');
    const sentHtml=sent.map(r=>{const p=byId.get(r.addressee_id)||{};return `<div class="comment"><b>${esc(p.display_name||'مستخدم')}</b> <small>طلب مُرسل</small></div>`}).join('');
    showModal('👥 الأصدقاء',`<h3>طلبات واردة</h3>${incomingHtml||'<p>لا توجد طلبات واردة.</p>'}<h3>أصدقاؤك</h3>${friendHtml||'<p>لم تتم إضافة أصدقاء بعد.</p>'}<h3>طلبات أرسلتها</h3>${sentHtml||'<p>لا توجد طلبات معلقة.</p>'}`);
  }catch(e){showModal('👥 الأصدقاء',`<p>تعذر تحميل الأصدقاء: ${esc(safeError(e))}</p>`);}
}
async function getOrCreateConversation(otherId){const{data,error}=await sb.rpc('get_or_create_direct_conversation',{p_target_user:otherId});if(error)throw error;return data;}
async function openMessages(){try{const active=await syncAuthUser();if(!active?.id)return;const{data:members,error}=await sb.from('conversation_members').select('conversation_id').eq('user_id',active.id).limit(50);if(error)throw error;const cids=(members||[]).map(m=>m.conversation_id);if(!cids.length){showModal('💬 الرسائل','<p>لا توجد محادثات بعد. ابحث عن مستخدم وابدأ رسالة جديدة.</p>');return;}const{data:msgs,error:me}=await sb.from('messages').select('conversation_id,sender_id,body,created_at').in('conversation_id',cids).order('created_at',{ascending:false}).limit(200);if(me)throw me;const latest=new Map();(msgs||[]).forEach(m=>{if(!latest.has(m.conversation_id))latest.set(m.conversation_id,m);});const otherIds=[...new Set((msgs||[]).map(m=>m.sender_id).filter(id=>id!==active.id))];const{data:ps}=otherIds.length?await sb.from('profiles').select('id,display_name').in('id',otherIds):{data:[]};const pmap=new Map((ps||[]).map(p=>[p.id,p]));const html=[...latest.entries()].map(([cid,m])=>{const p=pmap.get(m.sender_id)||{};return `<button class="admin-action message-user" data-user="${m.sender_id}" data-conv="${cid}" style="display:flex;width:100%;justify-content:space-between;margin:6px 0">💬 ${esc(p.display_name||'محادثة')}<small>${esc((m.body||'').slice(0,45))}</small></button>`}).join('');showModal('💬 الرسائل',html||'<p>لا توجد رسائل بعد. ابحث عن مستخدم وابدأ رسالة جديدة.</p>');}catch(e){showModal('💬 الرسائل',`<p>تعذر تحميل الرسائل: ${esc(safeError(e))}</p>`);}}
async function openConversation(otherId,convId){try{const active=await syncAuthUser();if(!active?.id)return;const cid=convId||await getOrCreateConversation(otherId);activeConversation=cid;const{data:msgs,error}=await sb.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',cid).order('created_at',{ascending:true}).limit(100);if(error)throw error;const{data:other}=await sb.from('profiles').select('display_name').eq('id',otherId).maybeSingle();showModal('💬 '+esc(other?.display_name||'محادثة'),`<div id="chatList" style="max-height:55vh;overflow:auto">${(msgs||[]).map(m=>`<div class="comment" style="text-align:${m.sender_id===active.id?'right':'left'}"><span>${esc(m.body)}</span><br><small>${formatDate(m.created_at)}</small></div>`).join('')||'<p>لا توجد رسائل بعد.</p>'}</div><div class="comment-box"><input id="messageInput" maxlength="2000" placeholder="اكتب رسالة…"><button id="sendMessage">إرسال</button></div>`);$('sendMessage').onclick=async()=>{const b=$('messageInput'),text=b.value.trim();if(!text)return;const send=$('sendMessage');setBusy(send,true,'…');try{const{error}=await sb.from('messages').insert({conversation_id:cid,sender_id:active.id,body:text});if(error)throw error;b.value='';const list=$('chatList');const row=document.createElement('div');row.className='comment';row.style.textAlign='right';row.innerHTML=`<span>${esc(text)}</span><br><small>الآن</small>`;list.appendChild(row);list.scrollTop=list.scrollHeight;}catch(e){alert('تعذر إرسال الرسالة: '+safeError(e));}finally{setBusy(send,false);}};subscribeMessages(cid);}catch(e){alert('تعذر فتح المحادثة: '+safeError(e));}}
function subscribeMessages(cid){realtimeChannels.filter(c=>c.__madaChat).forEach(c=>sb.removeChannel(c));realtimeChannels=realtimeChannels.filter(c=>!c.__madaChat);try{const ch=sb.channel('mada-chat-'+cid).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${cid}`},payload=>{if(payload.new.sender_id===user.id)return;const list=$('chatList');if(!list)return;const row=document.createElement('div');row.className='comment';row.style.textAlign='left';row.innerHTML=`<span>${esc(payload.new.body)}</span><br><small>الآن</small>`;list.appendChild(row);list.scrollTop=list.scrollHeight;}).subscribe();ch.__madaChat=true;realtimeChannels.push(ch);}catch(e){console.warn(e);}}
async function loadNotificationCount(){if(!user)return;const{count,error}=await sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null);if(error)return;const setBadge=id=>{const el=$(id);if(!el)return;el.dataset.count=String(count||0);el.title=count?`لديك ${count} إشعار غير مقروء`:'لا توجد إشعارات جديدة';};setBadge('notifyBtn');setBadge('notifyNav');}
async function openNotifications(){const{data,error}=await sb.from('notifications').select('id,type,title,body,read_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);if(error)return showModal('الإشعارات',`<p>تعذر تحميل الإشعارات: ${esc(safeError(error))}</p>`);showModal('🔔 الإشعارات',(data?.length?data.map(n=>`<div class="comment" style="opacity:${n.read_at?'0.65':'1'}"><b>${esc(n.title||'إشعار')}</b><br>${esc(n.body||'')}<br><small>${formatDate(n.created_at)}</small></div>`).join(''):'<p>لا توجد إشعارات.</p>'));if(data?.some(n=>!n.read_at)){await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',user.id).is('read_at',null);await loadNotificationCount();}}
async function searchUsers(term){const active=await syncAuthUser();if(!active?.id)return alert('انتهت جلسة الحساب');const q=term.trim();if(q.length<2)return alert('اكتب حرفين على الأقل');const box=$('results');if(box)box.innerHTML='<p>جاري البحث…</p>';const clean=q.replace(/[(),]/g,'');const{data,error}=await sb.from('profiles').select('id,username,display_name,avatar_url').or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`).neq('id',active.id).limit(15);if(error){if(box)box.innerHTML=`<p>تعذر البحث: ${esc(safeError(error))}</p>`;return;}const rows=await getFriendRows();if(!data?.length){if(box)box.innerHTML='<p>لا توجد نتائج.</p>';return;}if(box)box.innerHTML=data.map(p=>{const state=friendState(rows,p.id);const friendLabel=state.type==='accepted'?'✓ صديق':state.type==='outgoing'?'✓ تم إرسال الطلب':state.type==='incoming'?'قبول الطلب':'إضافة صديق';return `<div class="comment" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b>${esc(p.display_name||p.username||'مستخدم')}</b><button class="friend-action admin-action" data-user="${p.id}" ${state.type==='accepted'||state.type==='outgoing'?'disabled':''}>${friendLabel}</button><button class="message-user admin-action" data-user="${p.id}">رسالة</button></div>`}).join('');}
async function refreshSearchResults(){const inp=$('searchInput');if(inp?.value)await searchUsers(inp.value);}
async function claimFirstAdmin(){const{data,error}=await sb.functions.invoke('claim-first-admin',{body:{}});if(error||!data?.success){alert('لا يمكن إنشاء مسؤول أول. قد يكون هناك مسؤول موجود بالفعل.');return false}alert('تم تحويل هذا الحساب إلى أول مسؤول في Mada.');return true;}
async function adminLogin(){showModal('⚙️ دخول الإدارة',`<input id="adminEmail" type="email" placeholder="البريد الإداري" style="width:100%;padding:12px;margin:6px 0"><input id="adminPass" type="password" placeholder="كلمة المرور" style="width:100%;padding:12px;margin:6px 0"><button id="adminSubmit" class="primary wide">دخول</button><button id="claimAdmin" class="admin-action" style="width:100%;margin-top:8px">👑 إنشاء أول مسؤول (مرة واحدة)</button>`);$('adminSubmit').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error){alert('بيانات الدخول غير صحيحة');return}const{data:p}=await sb.from('profiles').select('role,is_banned').eq('id',(await sb.auth.getUser()).data.user.id).single();if(p?.role==='admin'&&!p.is_banned){location.href='admin.html';return}alert('هذا الحساب ليس مسؤولاً.');await sb.auth.signOut()};$('claimAdmin').onclick=async()=>{const email=$('adminEmail').value.trim(),pass=$('adminPass').value;if(!email||!pass)return alert('اكتب البريد وكلمة المرور أولاً');const{error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return alert('سجّل الحساب أولاً من شاشة Mada ثم استخدمه هنا.');const ok=await claimFirstAdmin();if(ok)location.href='admin.html';else await sb.auth.signOut();}}

async function start(){
  try{
    const active=await syncAuthUser();
    if(!active){await new Promise(r=>setTimeout(r,500));if(!await syncAuthUser()){auth.hidden=false;app.hidden=true;return;}}
    user=active||user;window.user=user;window.sb=sb;auth.hidden=true;app.hidden=false;
    await loadProfile();checkAdminStatus();await loadFeed();if(typeof window.madaLoadStories==='function')await window.madaLoadStories();subscribeAppRealtime();await loadNotificationCount();
  }catch(e){console.error(e);auth.hidden=false;app.hidden=true;checkAdminStatus();$('authMsg').textContent='تعذر تشغيل Mada الآن. تحقق من الاتصال ثم حاول مرة أخرى.';}
}
function subscribeAppRealtime(){realtimeChannels.filter(c=>c.__madaApp).forEach(c=>sb.removeChannel(c));realtimeChannels=realtimeChannels.filter(c=>!c.__madaApp);try{const ch=sb.channel('mada-app-'+user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},()=>loadNotificationCount()).subscribe();ch.__madaApp=true;realtimeChannels.push(ch);}catch(e){console.warn(e);}}
$('loginBtn').onclick=async()=>{const name=$('nameInput').value.trim(),email=$('emailInput').value.trim(),password=$('passwordInput').value;if(!email||password.length<6)return alert('اكتب بريدًا صحيحًا وكلمة مرور 6 أحرف على الأقل');const btn=$('loginBtn');setBusy(btn,true,'جارٍ الدخول…');try{let r=await sb.auth.signInWithPassword({email,password});if(r.error){r=await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});if(r.error)throw r.error;if(!r.data.session)return $('authMsg').textContent='تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.';}await start();}catch(e){alert('تعذر تسجيل الدخول: '+safeError(e));}finally{setBusy(btn,false)}};
$('adminLoginBtn').onclick=adminLogin;$('admin-btn').onclick=openAdminPanel;$('postBtn').onclick=addPost;$('createNav').onclick=()=>input.focus();$('photoBtn').onclick=()=>imageInput.click();imageInput.onchange=()=>{selectedFile=imageInput.files?.[0]||null;if(selectedFile)input.placeholder='اكتب وصف الصورة ثم اضغط نشر'};$('premiumBtn').onclick=premiumView;$('premiumBannerBtn').onclick=premiumView;$('closeModal').onclick=closeModal;
feed.onclick=async e=>{const send=e.target.closest('[data-send]');if(send){await addComment(send.dataset.send);return}const share=e.target.closest('.share');if(share){await sharePost(share.dataset.id);return}const ct=e.target.closest('.comment-toggle');if(ct){feed.querySelector(`[data-comment="${CSS.escape(ct.dataset.id)}"]`)?.focus();return}};
$('profileNav').onclick=()=>showModal('الملف الشخصي',`<div style="text-align:center"><div class="avatar" style="margin:auto;width:70px;height:70px;font-size:28px">${initials(profile?.display_name)}</div><h3>${esc(profile?.display_name||'مستخدم')} ${premium?'💎':''}</h3><p>${esc(user?.email||'')}</p>${profile?.bio?`<p>${esc(profile.bio)}</p>`:''}${profile?.role==='admin'?'<p>👑 مسؤول Mada</p>':''}<button id="logout" class="primary wide">تسجيل الخروج</button></div>`);
$('modal').onclick=async e=>{if(e.target.id==='logout'){await sb.auth.signOut();closeModal();location.reload();return}const friend=e.target.closest('.friend-action');if(friend&&!friend.disabled)await addFriend(friend.dataset.user);const accept=e.target.closest('.accept-friend');if(accept)await acceptFriend(accept.dataset.id);const reject=e.target.closest('.reject-friend');if(reject)await rejectFriend(reject.dataset.id);const mu=e.target.closest('.message-user');if(mu)await openConversation(mu.dataset.user,mu.dataset.conv);if(e.target.id==='doSearch')await searchUsers($('searchInput').value);};
$('friendsNav').onclick=openFriends;$('notifyNav').onclick=openNotifications;$('notifyBtn').onclick=openNotifications;
$('searchBtn').onclick=()=>showModal('🔎 البحث عن مستخدم',`<input id="searchInput" placeholder="اسم المستخدم أو الاسم…" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px"><button id="doSearch" class="primary wide" style="margin-top:8px">بحث</button><div id="results"></div>`);
$('msgBtn').onclick=openMessages;
/* IMPORTANT: do not treat transient null sessions as logout. Only an explicit SIGNED_OUT logs the user out. */
sb.auth.onAuthStateChange((event,session)=>{
  if(session){ user=session.user; window.user=user; window.sb=sb; auth.hidden=true; app.hidden=false; return; }
  if(event==='SIGNED_OUT'){
    user=null;profile=null;window.user=null;checkAdminStatus();auth.hidden=false;app.hidden=true;
  }
});
start();

/* Android/browser Back: keep Mada as a single-page app and close the active sheet first. */
(function installMadaBackGuard(){
  const key='madaBackGuard';
  function armed(){return !!history.state?.[key];}
  function arm(){try{if(!armed()){history.replaceState({...history.state,[key]:true},'',location.href);history.pushState({...history.state,[key]:true},'',location.href);}}catch(e){}}
  function closeActiveLayer(){
    const modal=$('modal');
    if(modal&&!modal.hidden){closeModal();return true;}
    const share=document.getElementById('share-modal');
    if(share&&!share.hidden){if(typeof window.closeShareModal==='function')window.closeShareModal();else share.hidden=true;return true;}
    const reels=document.getElementById('reelsSection');
    if(reels&&!reels.hidden){if(typeof window.closeReelsSection==='function')window.closeReelsSection();else reels.hidden=true;return true;}
    return false;
  }
  function init(){if(!app.hidden)arm();}
  window.addEventListener('popstate',()=>{closeActiveLayer();arm();setTimeout(arm,20);});
  window.addEventListener('pageshow',()=>{if(!auth.hidden&&!app.hidden)syncAuthUser().then(()=>{});if(!app.hidden)arm();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,50);
})();