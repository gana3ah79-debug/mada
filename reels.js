(() => {
  let reelsObserver = null;
  let reelTimers = new WeakMap();

  function setupAutoPreviewReels(root = document) {
    if (reelsObserver) reelsObserver.disconnect();
    const videos = root.querySelectorAll('.reel-video-preview');
    reelsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (reelTimers.has(video)) {
          clearTimeout(reelTimers.get(video));
          reelTimers.delete(video);
        }
        if (entry.isIntersecting) {
          video.muted = true;
          video.currentTime = 0;
          video.play().then(() => {
            const timer = setTimeout(() => {
              video.pause();
              video.currentTime = 0;
              reelTimers.delete(video);
            }, 2000);
            reelTimers.set(video, timer);
          }).catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }, { threshold: 0.6 });
    videos.forEach(v => reelsObserver.observe(v));
  }

  window.openReelsSection = function () {
    const section = document.getElementById('reelsSection');
    if (!section) return;
    section.classList.add('is-open');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setupAutoPreviewReels(section);
  };

  window.openFullReel = function (videoElement) {
    if (!videoElement) return;
    videoElement.currentTime = 0;
    videoElement.muted = false;
    const p = videoElement.play();
    if (p && p.catch) p.catch(() => {});
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen().catch?.(() => {});
    }
  };

  window.setupAutoPreviewReels = setupAutoPreviewReels;
  document.addEventListener('DOMContentLoaded', () => setupAutoPreviewReels());
})();