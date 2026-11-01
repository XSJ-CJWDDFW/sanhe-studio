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
  const modules = new Map();
  function loadModule(url) {
    if (!modules.has(url)) modules.set(url, import(url).catch(error=>{modules.delete(url);console.error('Chapter could not load:',error)}));
    return modules.get(url);
  }
  window.SANHEMedia = {prepareVideo,prepareImage,warmFounder,lightMedia};
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
