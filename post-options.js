/* Mada — Post options bottom sheet */
let currentSelectedPostId = null;
let currentSelectedPostOwnerId = null;

function postOptionsMessage(message, type = 'info') {
  const msg = document.getElementById('authMsg');
  if (typeof window.showMadaToast === 'function') return window.showMadaToast(message, type);
  if (msg) { msg.textContent = message; msg.style.color = type === 'error' ? '#ef4444' : '#2563eb'; }
  else alert(message);
}

async function openPostOptions(postId, postAuthorId) {
  currentSelectedPostId = postId;
  currentSelectedPostOwnerId = postAuthorId;
  const overlay = document.getElementById('post-options-overlay');
  const ownerActions = document.getElementById('owner-actions');
  if (!overlay) return;
  if (ownerActions) ownerActions.style.display = 'none';

  try {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const isOwner = user.id === postAuthorId;
      const isAdmin = profile?.role === 'admin';
      if (ownerActions && (isOwner || isAdmin)) ownerActions.style.display = 'block';
    }
  } catch (e) { console.warn('post options permission check failed', e); }

  overlay.style.display = 'flex';
  document.body.classList.add('post-sheet-open');
}

function closePostOptions() {
  const overlay = document.getElementById('post-options-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('post-sheet-open');
  currentSelectedPostId = null;
  currentSelectedPostOwnerId = null;
}

async function handleInterest(isInterested) {
  if (!currentSelectedPostId) return;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return postOptionsMessage('يجب تسجيل الدخول أولاً.', 'error');
    const { error } = await sb.from('post_interests').upsert({
      post_id: currentSelectedPostId,
      user_id: user.id,
      is_interested: !!isInterested
    }, { onConflict: 'post_id,user_id' });
    if (error) throw error;
    postOptionsMessage(isInterested ? 'تم تسجيل اهتمامك بالمنشور.' : 'تم تسجيل أنك غير مهتم بهذا المنشور.');
    closePostOptions();
  } catch (e) { console.error(e); postOptionsMessage('تعذر حفظ تفضيلك: ' + (e.message || 'حدث خطأ'), 'error'); }
}

async function handleSavePost() {
  if (!currentSelectedPostId) return;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return postOptionsMessage('يجب تسجيل الدخول أولاً.', 'error');
    const { data: existing, error: findError } = await sb.from('post_saves').select('post_id').eq('post_id', currentSelectedPostId).eq('user_id', user.id).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { error } = await sb.from('post_saves').delete().eq('post_id', currentSelectedPostId).eq('user_id', user.id);
      if (error) throw error;
      postOptionsMessage('تم إلغاء حفظ المنشور.');
    } else {
      const { error } = await sb.from('post_saves').insert({ post_id: currentSelectedPostId, user_id: user.id });
      if (error) throw error;
      postOptionsMessage('تم حفظ المنشور. 🔖');
    }
    closePostOptions();
  } catch (e) { console.error(e); postOptionsMessage('تعذر حفظ المنشور: ' + (e.message || 'حدث خطأ'), 'error'); }
}

async function handleReportPost() {
  if (!currentSelectedPostId) return;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return postOptionsMessage('يجب تسجيل الدخول أولاً.', 'error');
    const { error } = await sb.from('post_reports').upsert({
      post_id: currentSelectedPostId,
      reporter_id: user.id,
      reason: 'إبلاغ من قائمة خيارات المنشور'
    }, { onConflict: 'post_id,reporter_id' });
    if (error) throw error;
    postOptionsMessage('تم إرسال البلاغ إلى مسؤولي Mada. شكرًا لمساعدتنا.');
    closePostOptions();
  } catch (e) { console.error(e); postOptionsMessage('تعذر إرسال البلاغ: ' + (e.message || 'حدث خطأ'), 'error'); }
}

async function confirmDeletePost() {
  if (!currentSelectedPostId) return;
  const postId = currentSelectedPostId;
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return postOptionsMessage('يجب تسجيل الدخول أولاً.', 'error');
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const allowed = user.id === currentSelectedPostOwnerId || profile?.role === 'admin';
    if (!allowed) return postOptionsMessage('ليس لديك صلاحية حذف هذا المنشور.', 'error');
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور نهائياً؟')) return;
    const { error } = await sb.from('posts').delete().eq('id', postId);
    if (error) throw error;
    document.querySelector(`[data-post-id="${CSS.escape(postId)}"]`)?.remove();
    postOptionsMessage('تم حذف المنشور بنجاح.');
  } catch (e) { console.error(e); postOptionsMessage('تعذر حذف المنشور: ' + (e.message || 'حدث خطأ'), 'error'); }
  finally { closePostOptions(); }
}

function installPostOptionButtons(root = document) {
  root.querySelectorAll('.post').forEach(card => {
    if (card.querySelector('.three-dots-btn')) return;
    const postId = card.dataset.postId;
    if (!postId) return;
    let ownerId = card.dataset.authorId || '';
    try { ownerId = ownerId || window.feedPosts?.get?.(postId)?.author_id || ''; } catch (_) {}
    card.dataset.authorId = ownerId;
    const head = card.querySelector('.post-head');
    if (!head) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'three-dots-btn';
    btn.setAttribute('aria-label', 'خيارات المنشور');
    btn.title = 'خيارات المنشور';
    btn.textContent = '•••';
    btn.onclick = ev => { ev.stopPropagation(); openPostOptions(postId, ownerId); };
    head.appendChild(btn);
  });
}

const postOptionsObserver = new MutationObserver(() => installPostOptionButtons());
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => {
  installPostOptionButtons();
  postOptionsObserver.observe(document.body, { childList: true, subtree: true });
}); else {
  installPostOptionButtons();
  postOptionsObserver.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePostOptions(); });
