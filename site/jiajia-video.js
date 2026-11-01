// The original film plays continuously, then hands the same viewport to the workspace.
(() => {
  const section = document.getElementById('jiajia');
  const video = document.getElementById('jiajia-video');
  const workspace = document.getElementById('jiajia-workspace');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = false;
  let visible = false;
  let handedOff = false;
  let resetFrame = 0;
  let pauseTimer = 0;
  let frameCallback = 0;
  // The first inviting hand lift begins here in the approved 4747 film.
  const HANDOFF_TIME = 6.3;

  function handoff() {
    if (handedOff || section.hidden) return;
    handedOff = true;
    // Let the hand continue moving while the next space slides into view.
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => video.pause(), reduced ? 0 : 1000);
    section.classList.add('is-workbench');
    workspace.inert = false;
    workspace.setAttribute('aria-hidden', 'false');
    section.dispatchEvent(new Event('jiajia-workspace-open'));
  }
  function reset() {
    cancelAnimationFrame(resetFrame);
    clearTimeout(pauseTimer);
    if (frameCallback && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameCallback);
    frameCallback = 0;
    section.classList.add('is-resetting');
    section.classList.remove('is-workbench');
    workspace.inert = true;
    workspace.setAttribute('aria-hidden', 'true');
    handedOff = false;
    started = false;
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
    resetFrame = requestAnimationFrame(() => requestAnimationFrame(() => section.classList.remove('is-resetting')));
  }
  function play() {
    window.SANHEMedia?.prepareVideo(video);
    video.play().then(() => {
      if (!visible || document.hidden || handedOff) video.pause();
    }).catch(error => {
      if (error.name !== 'AbortError' && visible) {
        video.controls = true;
      }
    });
  }
  section.addEventListener('founder-close', reset);
  section.addEventListener('jiajia-replay', () => {
    reset();
    started = true;
    if (visible) play();
  });
  function checkFrame(_, metadata) {
    frameCallback = 0;
    if (metadata.mediaTime >= HANDOFF_TIME) handoff();
    else if (!handedOff) frameCallback = video.requestVideoFrameCallback(checkFrame);
  }
  video.addEventListener('playing', () => {
    if (!handedOff && !frameCallback && video.requestVideoFrameCallback) frameCallback = video.requestVideoFrameCallback(checkFrame);
  });
  video.addEventListener('timeupdate', () => {
    if (!handedOff && video.currentTime >= HANDOFF_TIME) handoff();
  });
  video.addEventListener('ended', () => handoff());
  if (reduced) video.controls = true;
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .25;
    if (!entry.isIntersecting) {
      // The founder controller resets only on collapse or founder switch.
      // A visitor scrolling up to the avatars should not lose the open details.
      video.pause();
    } else if (visible && !handedOff && !reduced) {
      if (!started) { started = true; video.currentTime = 0; }
      if (!video.ended) play();
    }
  }, { threshold: [0, .25] });
  observer.observe(section);
  video.addEventListener('loadedmetadata', () => { if (!started) video.currentTime = 0; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (visible && started && !video.ended && !reduced && !handedOff) play();
  });
})();
