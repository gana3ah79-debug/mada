(() => {
  let reelsObserver = null;
  let reelTimers = new WeakMap();

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const currentUser = () => (typeof user !== 'undefined' ? user : null);

  function toast(message) {
    if (typeof window.showMadaToast === 'function') window.showMadaToast(message);
    else if (typeof window.showToast === 'function') window.showToast(message);
    else console.log(message);
  }

  function setupAutoPreviewReels(root = document) {
    if (reelsObserver) reelsObserver.disconnect();
    const videos = root.querySelectorAll('.reel-video-preview');
    if (!('IntersectionObserver' in window)) return;
    reelsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (reelTimers.has(video)) { clearTimeout(reelTimers.get(video)); reelTimers.delete(video); }
        if (entry.isIntersecting) {
          video.muted = true;
          video.currentTime = 0;
          video.play().then(() => {
            const timer = setTimeout(() => { video.pause(); video.currentTime = 0; reelTimers.delete(video); }, 2000);
            reelTimers.set(video, timer);
          }).catch(() => {});
        } else { video.pause(); video.currentTime = 0; }
      });
    }, { threshold: 0.6 });
    videos.forEach(v => reelsObserver.observe(v));
  }

  async function loadReels() {
    const row = document.getElementById('reelsRow');
    if (!row || typeof sb === 'undefined') return;
    const { data, error } = await sb.from('reels').select('id,author_id,video_url,caption,created_at,profiles(display_name)').order('created_at',{ascending:false}).limit(30);
    if (error) { console.error('Reels load error', error); row.innerHTML = '<div class="reel-empty">تعذر تحميل الريلز</div>'; return; }
    if (!data?.length) { row.innerHTML = '<div class="reel-empty">لا توجد ريلز متاحة حالياً</div>'; return; }
    row.innerHTML = data.map(reel => `
      <article class="reel-card" data-reel-id="${esc(reel.id)}">
        <video class="reel-video-preview" src="${esc(reel.video_url)}" muted playsinline preload="metadata" onclick="openFullReel(this)"></video>
        <div class="reel-badge">🎬 ريلز</div>
        <div class="reel-overlay-info"><span class="reel-author">@${esc(reel.profiles?.display_name || 'مستخدم')}</span>${reel.caption ? `<div>${esc(reel.caption)}</div>` : ''}</div>
        <div class="reel-actions">
          <button type="button" onclick="toggleReelLike('${esc(reel.id)}',this)">❤️ <span class="reel-like-count">0</span></button>
          <button type="button" onclick="showReelComments('${esc(reel.id)}')">💬 <span class="reel-comment-count">0</span></button>
          <button type="button" onclick="shareReel('${esc(reel.id)}')">↗️</button>
        </div>
      </article>`).join('');
    await loadReelCounts(data);
    setupAutoPreviewReels(row);
  }

  async function loadReelCounts(reels) {
    if (!reels?.length) return;
    const ids = reels.map(r => r.id);
    const [{data: likes},{data: comments}] = await Promise.all([
      sb.from('reel_likes').select('reel_id').in('reel_id',ids),
      sb.from('reel_comments').select('reel_id').in('reel_id',ids)
    ]);
    const lc = {}, cc = {};
    (likes||[]).forEach(x => lc[x.reel_id]=(lc[x.reel_id]||0)+1);
    (comments||[]).forEach(x => cc[x.reel_id]=(cc[x.reel_id]||0)+1);
    reels.forEach(r => { const card=document.querySelector(`.reel-card[data-reel-id="${r.id}"]`); if(card){card.querySelector('.reel-like-count').textContent=lc[r.id]||0;card.querySelector('.reel-comment-count').textContent=cc[r.id]||0;} });
  }

  window.openReelsSection = function () {
    const section = document.getElementById('reelsSection');
    if (!section) return;
    section.classList.add('is-open');
    section.scrollIntoView({behavior:'smooth',block:'start'});
    loadReels();
  };

  window.toggleReelLike = async function(id, button) {
    const u=currentUser(); if(!u){toast('سجل الدخول أولاً');return;}
    const {data:existing}=await sb.from('reel_likes').select('reel_id').eq('reel_id',id).eq('user_id',u.id).maybeSingle();
    if(existing) await sb.from('reel_likes').delete().eq('reel_id',id).eq('user_id',u.id);
    else await sb.from('reel_likes').insert({reel_id:id,user_id:u.id});
    const {count}=await sb.from('reel_likes').select('*',{count:'exact',head:true}).eq('reel_id',id);
    button.querySelector('.reel-like-count').textContent=count||0;
  };

  window.showReelComments = async function(id) {
    const rows = document.getElementById('reelsRow');
    const u=currentUser(); if(!u){toast('سجل الدخول أولاً');return;}
    const body=prompt('اكتب تعليقك على الريلز');
    if(!body?.trim()) return;
    const {error}=await sb.from('reel_comments').insert({reel_id:id,user_id:u.id,body:body.trim()});
    if(error) toast('تعذر إضافة التعليق'); else { toast('تم إضافة التعليق'); loadReels(); }
    if(rows) rows.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.shareReel = async function(id) {
    const u=currentUser(); if(!u){toast('سجل الدخول أولاً');return;}
    const {error}=await sb.from('reel_shares').upsert({reel_id:id,user_id:u.id},{onConflict:'reel_id,user_id'});
    if(error){toast('تعذر تسجيل المشاركة');return;}
    const reel=await sb.from('reels').select('video_url,caption').eq('id',id).single();
    if(reel.data) {
      try { await navigator.clipboard.writeText(reel.data.video_url); toast('تم تسجيل المشاركة ونسخ رابط الريلز'); }
      catch { toast('تم تسجيل المشاركة'); }
    }
  };

  window.createReel = async function(file, caption='') {
    const u=currentUser();
    if(!u || !file){toast(!u?'سجل الدخول أولاً':'اختر فيديو');return false;}
    if(!file.type.startsWith('video/')) { toast('اختر ملف فيديو فقط'); return false; }
    if(file.size > 50*1024*1024) { toast('حجم الفيديو يجب ألا يتجاوز 50MB'); return false; }
    const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'') || 'mp4';
    const path=`${u.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await sb.storage.from('reels').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){toast('تعذر رفع الفيديو: تأكد من إنشاء Storage Bucket باسم reels');return false;}
    const {data:publicData}=sb.storage.from('reels').getPublicUrl(path);
    const {error}=await sb.from('reels').insert({author_id:u.id,video_url:publicData.publicUrl,caption:caption.trim()||null});
    if(error){toast('تعذر حفظ الريلز');return false;}
    toast('تم نشر الريلز بنجاح 🎬');
    await loadReels();
    return true;
  };

  window.openReelUploader = function() {
    let input=document.getElementById('reelUploadInput');
    if(!input){
      input=document.createElement('input'); input.id='reelUploadInput'; input.type='file'; input.accept='video/*'; input.hidden=true; document.body.appendChild(input);
      input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;const caption=prompt('اكتب وصف الريلز (اختياري)')||'';await createReel(file,caption);input.value='';});
    }
    input.click();
  };

  window.openFullReel = function(videoElement) {
    if(!videoElement)return;
    videoElement.currentTime=0; videoElement.muted=false;
    const p=videoElement.play(); if(p?.catch)p.catch(()=>{});
    if(videoElement.requestFullscreen) videoElement.requestFullscreen().catch?.(()=>{});
  };

  window.setupAutoPreviewReels=setupAutoPreviewReels;
  window.loadReels=loadReels;
  document.addEventListener('DOMContentLoaded',()=>{setupAutoPreviewReels(); setTimeout(()=>loadReels(),500);});
})();