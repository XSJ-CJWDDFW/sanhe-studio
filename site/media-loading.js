// Assign URLs only when their chapter is requested. preload="none" alone is
// insufficient on browsers that still fetch metadata for hidden video sources.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection;
  const lightMedia = innerWidth <= 900 || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  function prepareImage(image) {
    if (image?.dataset.src) {
      image.src = image.dataset.src;
      delete image.dataset.src;
    }
  }
  function prepareVideo(video, preload = 'auto') {
    if (!video) return;
    if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster;
    const source = lightMedia ? video.dataset.srcMobile || video.dataset.srcDesktop : video.dataset.srcDesktop || video.dataset.srcMobile;
    if (!video.getAttribute('src') && source) {
      video.preload = preload;
      video.src = source;
      video.load();
    } else if (video.preload !== preload) video.preload = preload;
  }
  function warmFounder(id, intentOnly = false) {
    const section = document.getElementById(id);
    if (!section) return;
    const first = section.querySelector('video');
    prepareVideo(first, intentOnly ? 'metadata' : 'auto');
    if (!intentOnly) section.querySelectorAll('img[data-src]').forEach(prepareImage);
    if (id === 'jiajia') loadModule('./jiajia-panel.js?v=20261101-performance');
  }
  function releaseFounder(id) {
    document.getElementById(id)?.querySelectorAll('video').forEach(video=>{
      video.pause();
      video.preload = 'none';
      if (video.hasAttribute('src')) {video.removeAttribute('src');video.load();}
    });
  }
  const modules = new Map();
  const attempts = new Map();
  function loadModule(url) {
    if (!modules.has(url)) {
      const attempt = attempts.get(url) || 0;
      attempts.set(url, attempt + 1);
      const source = attempt ? `${url}&retry=${attempt}` : url;
      modules.set(url, import(source).catch(error => {
        modules.delete(url);
        console.error('Chapter could not load:', error);
        const host = document.getElementById(url.includes('jiajia') ? 'jiajia-workspace' : 'project-gallery-root');
        if (!host || host.querySelector('[data-module-retry]')) return;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.dataset.moduleRetry = '';
        retry.textContent = '重新打开';
        retry.style.cssText = 'display:block;margin:20px auto;padding:12px 20px;border:1px solid #819b97;border-radius:24px;background:#f7f8fc;color:#254b45;cursor:pointer';
        retry.addEventListener('click', () => { retry.remove(); loadModule(url); });
        host.appendChild(retry);
      }));
    }
    return modules.get(url);
  }
  window.SANHEMedia = {prepareVideo,prepareImage,warmFounder,releaseFounder,lightMedia};
  // Warm only the next film when the visitor signals an intent to open it.
  document.querySelectorAll('[data-founder]').forEach(button => {
    button.addEventListener('pointerenter', () => warmFounder(button.dataset.founder,true), {once:true});
    button.addEventListener('pointerdown', () => warmFounder(button.dataset.founder), {passive:true});
  });
  const intro = document.getElementById('intro');
  if (!reduced) prepareVideo(intro);
  const finishImage = () => prepareImage(document.getElementById('intro-end'));
  intro.addEventListener('ended', finishImage, {once:true});
  intro.addEventListener('error', finishImage, {once:true});
  if (reduced) finishImage();
  const projects = document.getElementById('project-progress');
  const projectObserver = new IntersectionObserver(([entry])=>{
    if (!entry.isIntersecting) return;
    loadModule('./project-carousel.js?v=20261101-performance');
    projectObserver.disconnect();
  },{rootMargin:'400px'});
  projectObserver.observe(projects);
})();
