// A blocked autoplay or interrupted connection must leave a usable picture.
(() => {
  const media = window.SANHEMedia;
  const entries = new Map();
  const hosts = {
    intro: '.media', 'tianpian-video': '#tianpian',
    'rr-scrub': '#rr-scene', 'rr-transition': '#rr-scene',
    'rr-full-video': '.rr-work-media', 'jiajia-video': '#jiajia'
  };
  const style = document.createElement('style');
  style.textContent = `.media-retry{position:absolute;z-index:15;left:50%;top:65%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:9px;max-width:90%;min-height:44px;padding:10px 17px;border:1px solid #ccd7d6;border-radius:24px;background:rgba(247,248,252,.95);color:#254b45;font:500 13px/1.4 "Microsoft YaHei",sans-serif;cursor:pointer;box-shadow:0 3px 18px #152a3510}.media-retry[hidden]{display:none}.media-retry::before{content:'▶';font-size:11px}.media-retry:focus-visible{outline:2px solid #5cc8a8;outline-offset:4px}.rr-work-media .media-retry{top:50%;padding:10px;font-size:11px}`;
  document.head.appendChild(style);
  function clear(video) {
    const entry = entries.get(video);
    if (!entry) return;
    clearTimeout(entry.timer);
    entry.button.hidden = true;
  }
  function offerRetry(video, blocked = false) {
    const entry = entries.get(video);
    if (!entry || !video.getAttribute('src')) return;
    const appearance = getComputedStyle(video);
    if (video.closest('[hidden]') || appearance.visibility === 'hidden' || appearance.opacity === '0') return;
    clearTimeout(entry.timer);
    entry.button.textContent = blocked ? '点击播放' : '点击继续播放';
    entry.button.hidden = false;
  }
  async function play(video) {
    media.prepareVideo(video);
    try { await video.play(); }
    catch (error) {
      if (error.name !== 'AbortError') offerRetry(video, true);
      throw error;
    }
  }
  for (const [id, selector] of Object.entries(hosts)) {
    const video = document.getElementById(id);
    const host = video?.closest(selector);
    if (!host) continue;
    video.setAttribute('webkit-playsinline', '');
    video.disablePictureInPicture = true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-retry';
    button.hidden = true;
    button.setAttribute('aria-label', `继续播放：${video.getAttribute('aria-label') || '开场动画'}`);
    host.appendChild(button);
    entries.set(video, {button, timer:0});
    button.addEventListener('click', () => {
      clear(video);
      if (video.error || video.networkState === 3) video.load();
      play(video).catch(() => {});
    });
    ['playing', 'ended', 'emptied'].forEach(event => video.addEventListener(event, () => clear(video)));
    video.addEventListener('error', () => offerRetry(video));
    ['waiting', 'stalled'].forEach(event => video.addEventListener(event, () => {
      const entry = entries.get(video);
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        if (!video.paused && video.readyState < 3 && !document.hidden) offerRetry(video);
      }, 5000);
    }));
    video.closest('.founder-panel')?.addEventListener('founder-close', () => clear(video));
  }
  Object.assign(media, {play, offerRetry});
  // Pause hidden tabs, and resume the hero only while it is actually on screen.
  const intro = document.getElementById('intro');
  let onScreen = true;
  const resumeHero = () => {
    if (onScreen && !document.hidden && !intro.ended && !document.querySelector('.hero').classList.contains('is-finished')) play(intro).catch(() => {});
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (!onScreen) intro.pause();
    else if (intro.currentTime > 0) resumeHero();
  }).observe(intro);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) intro.pause();
    else resumeHero();
  });
})();
