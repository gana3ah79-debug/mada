(() => {
  'use strict';

  let startY = 0;
  let pulling = false;
  let refreshing = false;
  let indicator = null;

  function getIndicator() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.id = 'pullRefreshIndicator';
    indicator.innerHTML = '<span class="pull-refresh-icon">↻</span><span class="pull-refresh-text">اسحب للتحديث</span>';
    document.body.appendChild(indicator);
    return indicator;
  }

  function setState(text, active) {
    const el = getIndicator();
    el.querySelector('.pull-refresh-text').textContent = text;
    el.classList.toggle('active', !!active);
  }

  async function refreshPage() {
    if (refreshing) return;
    refreshing = true;
    setState('جاري التحديث…', true);
    try {
      if (typeof window.loadPosts === 'function') await window.loadPosts();
      if (typeof window.loadReels === 'function') await window.loadReels();
      if (typeof window.loadStories === 'function') await window.loadStories();
      if (typeof window.loadNotifications === 'function') await window.loadNotifications();
      window.dispatchEvent(new CustomEvent('mada:refresh'));
    } catch (e) {
      console.warn('Pull refresh:', e);
    } finally {
      setState('تم التحديث ✓', true);
      setTimeout(() => {
        const el = getIndicator();
        el.classList.remove('active');
        el.classList.add('done');
        setTimeout(() => el.classList.remove('done'), 350);
      }, 450);
      refreshing = false;
    }
  }

  function isAtTop() {
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 2;
  }

  document.addEventListener('touchstart', (e) => {
    if (refreshing || !e.touches || e.touches.length !== 1) return;
    if (!isAtTop()) return;
    startY = e.touches[0].clientY;
    pulling = true;
    getIndicator();
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling || refreshing || !e.touches || e.touches.length !== 1) return;
    if (!isAtTop()) {
      pulling = false;
      return;
    }
    const distance = e.touches[0].clientY - startY;
    if (distance <= 0) return;
    const progress = Math.min(distance / 85, 1);
    const el = getIndicator();
    el.style.transform = `translate(-50%, ${Math.round(-48 + progress * 58)}px)`;
    el.style.opacity = String(Math.min(1, 0.2 + progress));
    el.querySelector('.pull-refresh-icon').style.transform = `rotate(${Math.round(progress * 180)}deg)`;
    setState(progress >= 1 ? 'اترك للتحديث' : 'اسحب للتحديث', progress >= 1);
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!pulling || refreshing) return;
    pulling = false;
    const el = getIndicator();
    const current = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : startY;
    const distance = current - startY;
    el.style.transform = '';
    el.style.opacity = '';
    if (distance >= 85 && isAtTop()) refreshPage();
    else setState('اسحب للتحديث', false);
  }, { passive: true });

  window.madaPullToRefresh = refreshPage;
})();
