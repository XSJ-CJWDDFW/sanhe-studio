import { TOOLS, REEL, TOTAL } from './data.js?v=20261028h';

const ASSET = 'assets/ranran/';
const section = document.getElementById('ranran');
const stage = document.getElementById('rr-sticky');
const scene = document.getElementById('rr-scene');
const scrub = document.getElementById('rr-scrub');
const transition = document.getElementById('rr-transition');
const pov = document.getElementById('rr-pov');
const screen = document.getElementById('rr-screen');
const boot = document.getElementById('rr-boot');
const bootFill = document.getElementById('rr-boot-fill');
const editor = document.getElementById('rr-editor');
const assets = document.getElementById('rr-assets');
const preview = document.getElementById('rr-preview');
const timeline = document.getElementById('rr-timeline');
const toolsBox = document.getElementById('rr-tools');
const toolboxTrigger = document.getElementById('rr-toolbox-trigger');
const fullVideo = document.getElementById('rr-full-video');
const poster = document.getElementById('rr-work-poster');
const sound = document.getElementById('rr-sound');
const playButton = document.getElementById('rr-preview-play');
const playFullButton = document.getElementById('rr-play-full');
const track = document.getElementById('rr-video-track');
const trackContent = document.getElementById('rr-timeline-content');
const trackWindow = document.getElementById('rr-timeline-window');
const waveTrack = document.getElementById('rr-audio-track');
const ruler = document.getElementById('rr-ruler');
const playhead = document.getElementById('rr-playhead');
const cat = document.getElementById('rr-cat');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const totalReel = REEL.at(-1).to;
const chapters = REEL.reduce((list, item, index) => {
  const previous = list.at(-1);
  if (previous?.label === item.label && previous.to === item.from) {
    previous.to = item.to;
    previous.lastIndex = index;
  } else {
    list.push({ label:item.label, from:item.from, to:item.to, firstIndex:index, lastIndex:index });
  }
  return list;
}, []);
const REEL_START = .1;
const REEL_END = .84;
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const smooth = t => t*t*(3-2*t);
let config;
let waveform = [];
let activeIndex = -1;
let fullIndex = -1;
let pendingSeek = null;
let guideTimer = 0;
let timelineShift = 0;
let dragShift = 0;
let dragClientX = 0;
let dragFrame = 0;
let resumeVisible = false;
let latestRawP = 0;
let openingStarted = false;
let openingComplete = false;
let transitionStarted = false;
let handoffStarted = 0;
let draggingHead = false;

function timecode(seconds) {
  const frames = Math.max(0, Math.round(seconds * 30));
  const f = frames % 30;
  const s = Math.floor(frames / 30) % 60;
  const m = Math.floor(frames / 1800) % 60;
  const h = Math.floor(frames / 108000);
  return [h,m,s,f].map(n => String(n).padStart(2,'0')).join(':');
}
function setOpacity(el, value) { el.style.opacity = String(clamp(value)); }
function setMode(mode) { if (preview.dataset.mode !== mode) preview.dataset.mode = mode; }
function showVideo(index) {
  if (activeIndex === index) return;
  activeIndex = index;
  const item = REEL[index];
  poster.src = `${ASSET}reel/posters/${item.id}.jpg`;
  poster.alt = `${item.label}片段封面`;
  const chapterIndex = chapters.findIndex(chapter => index >= chapter.firstIndex && index <= chapter.lastIndex);
  document.getElementById('rr-segment-index').textContent = `作品片段 ${String(chapterIndex+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
  document.getElementById('rr-segment-label').textContent = item.label;
  document.getElementById('rr-segment-type').textContent = item.type;
  document.getElementById('rr-work-time').textContent = `${timecode(item.from)}\n→\n${timecode(item.to)}`;
}
function updatePlaybackControls() {
  sound.textContent = fullVideo.muted ? '声音关闭' : '声音开启';
  sound.setAttribute('aria-label', fullVideo.muted ? '开启视频声音' : '关闭视频声音');
  playButton.textContent = fullVideo.paused ? '▶' : 'Ⅱ';
  playButton.setAttribute('aria-label', fullVideo.paused ? '播放完整混剪合辑' : '暂停混剪合辑');
}
function requestPlayback() {
  fullVideo.play().catch(() => {
    // Mobile browsers may reject audible playback after an asynchronous entry.
    if (!fullVideo.muted) {
      fullVideo.muted = true;
      updatePlaybackControls();
      fullVideo.play().catch(updatePlaybackControls);
    } else updatePlaybackControls();
  });
}
function stopFull() {
  fullVideo.pause();
  fullVideo.classList.remove('is-active');
  sound.classList.remove('is-visible');
  fullIndex = -1;
}
function seekReel(seconds, {play = true, unmute = false} = {}) {
  clearTimeout(guideTimer);
  window.SANHEMedia?.prepareVideo(fullVideo);
  const duration = Number.isFinite(fullVideo.duration) ? fullVideo.duration : totalReel;
  const targetTime = clamp(seconds, 0, Math.max(0, duration - .01));
  pendingSeek = targetTime;
  if (fullVideo.readyState >= 1) {
    fullVideo.currentTime = targetTime;
    pendingSeek = null;
  }
  if (unmute) fullVideo.muted = false;
  const p = REEL_START + Math.min(targetTime / totalReel, .999999) * (REEL_END-REEL_START);
  render(p);
  fullIndex = Math.max(0, REEL.findIndex(item => targetTime < item.to));
  fullVideo.classList.add('is-active');
  sound.classList.add('is-visible');
  if (play) requestPlayback();
  updatePlaybackControls();
}
function startReelAfterIntro() {
  clearTimeout(guideTimer);
  guideTimer = setTimeout(() => {
    if (openingComplete && !section.hidden && preview.dataset.mode === 'guide') seekReel(0);
  }, 1100);
}
function buildTools() {
  toolsBox.hidden = false;
  TOOLS.forEach((tool, index) => {
    const card = document.createElement('div');
    card.className = 'rr-tool';
    card.style.setProperty('--fan-index',index);
    card.setAttribute('role','img');
    card.setAttribute('aria-label',tool.name);
    card.innerHTML = `<img class="rr-tool-body" data-src="assets/performance/tool-token-v1.webp" alt=""><img class="rr-tool-brand" data-src="${ASSET}icons/${tool.icon}" alt=""><span>${tool.short}</span>`;
    toolsBox.appendChild(card);
  });
}
function timelinePctAt(seconds) {
  return 6 + 78*clamp(seconds/totalReel);
}
function secondsAtTimelinePct(percent) {
  if (percent <= 6) return 0;
  if (percent >= 84) return totalReel;
  return totalReel*clamp((percent-6)/78);
}
function buildTimeline() {
  const makeClip = (label, width, cls, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rr-clip ${cls}`;
    button.style.width = width + '%';
    button.textContent = label;
    button.title = index >= 0 ? `${REEL[index].label} · 点击播放` : label;
    button.dataset.label = index >= 0 ? REEL[index].label : label;
    if (index >= 0) {
      button.dataset.segment = String(index);
      button.addEventListener('click', () => {
        seekReel(REEL[index].from, {unmute:true});
      });
    } else {
      button.addEventListener('click', () => setProgress(cls === 'is-intro' ? 0 : cls === 'is-export' ? 1 : .875));
    }
    track.appendChild(button);
  };
  makeClip('片头', 6, 'is-intro', -1);
  chapters.forEach(chapter => {
    const width = ((chapter.to-chapter.from)/totalReel)*78;
    makeClip(chapter.label, width, chapter.lastIndex > chapter.firstIndex ? 'is-combined' : '', chapter.firstIndex);
  });
  makeClip('片尾 · 合作名单', 8, 'is-credit', -1);
  makeClip('5000+ 成片', 8, 'is-export', -1);
  const tail = document.createElement('span');
  tail.style.cssText = 'flex:1';
  track.appendChild(tail);
  waveTrack.style.paddingLeft = '6%';
  waveTrack.style.paddingRight = '16%';
  for (let second=0; second<=Math.ceil(totalReel); second++) {
    const mark = document.createElement('i');
    mark.className = 'rr-tick' + (second%5===0 ? ' is-long' : '');
    mark.style.left = timelinePctAt(second) + '%';
    ruler.appendChild(mark);
    if (second%5===0) {
      const label = document.createElement('small');
      label.className = 'rr-tick-label';
      label.style.left = mark.style.left;
      label.textContent = String(second).padStart(2,'0');
      ruler.appendChild(label);
    }
  }
}
function addWaveform() {
  waveform.forEach((value, i) => {
    const bar = document.createElement('i');
    bar.className = 'rr-wave';
    bar.style.height = (16 + value*84) + '%';
    bar.dataset.index = String(i);
    waveTrack.appendChild(bar);
  });
}
function setPlayhead(percent) {
  playhead.dataset.percent = String(percent);
  const pct = clamp(percent/100);
  const isMobile = innerWidth < 768;
  const contentWidth = trackContent.offsetWidth;
  const viewportWidth = trackWindow.offsetWidth;
  const x = contentWidth * pct;
  if (draggingHead) {
    timelineShift = dragShift;
    trackContent.style.transform = `translateX(${timelineShift}px)`;
    playhead.style.left = `${Math.max(14, Math.min(viewportWidth-14, x+timelineShift))}px`;
  } else if (isMobile) {
    const offset = viewportWidth/2 - x;
    timelineShift = offset;
    trackContent.style.transform = `translateX(${offset}px)`;
    playhead.style.left = '50%';
  } else {
    const shift = Math.max(viewportWidth-contentWidth, Math.min(0, viewportWidth/2-x));
    timelineShift = shift;
    trackContent.style.transform = `translateX(${shift}px)`;
    playhead.style.left = `${Math.max(19,Math.min(viewportWidth-19,x+shift))}px`;
  }
  const clips = [...track.querySelectorAll('.rr-clip')];
  let cursor = 0;
  clips.forEach(button => {
    const width = parseFloat(button.style.width) || 0;
    const passed = percent >= cursor+width;
    const current = percent >= cursor && percent < cursor+width;
    button.classList.toggle('is-past', passed);
    button.classList.toggle('is-current', current);
    cursor += width;
  });
  const seconds = secondsAtTimelinePct(percent);
  playhead.setAttribute('aria-valuenow', String(Math.round(seconds)));
  playhead.setAttribute('aria-valuetext', `${Math.round(seconds)} 秒，${REEL[Math.max(0,REEL.findIndex(item=>seconds<item.to))]?.label || REEL.at(-1).label}`);
  const waveProgress = clamp(seconds/totalReel);
  waveTrack.querySelectorAll('.rr-wave').forEach((bar, i) => {
    bar.classList.toggle('is-past', i/240 <= waveProgress);
  });
}
function setProgress(p) {
  clearTimeout(guideTimer);
  render(clamp(p));
}
function startOpening() {
  if (openingStarted) return;
  openingStarted = true;
  window.SANHEMedia?.prepareVideo(scrub);
  if (reduced) {
    openingComplete = true;
    render(0);
    startReelAfterIntro();
    return;
  }
  openingComplete = false;
  transitionStarted = false;
  transition.classList.remove('is-active');
  transition.pause();
  try { transition.currentTime = 0; } catch {}
  scrub.currentTime = 0;
  render(0);
  (window.SANHEMedia.play ? window.SANHEMedia.play(scrub) : scrub.play()).catch(() => {});
}
function startTransition() {
  if (!openingStarted || transitionStarted) return;
  transitionStarted = true;
  window.SANHEMedia?.prepareVideo(transition);
  transition.classList.add('is-active');
  try { transition.currentTime = 0; } catch {}
  (window.SANHEMedia.play ? window.SANHEMedia.play(transition) : transition.play()).catch(() => {});
  render(latestRawP);
}
function finishTransition() {
  if (!openingStarted || !transitionStarted || openingComplete) return;
  openingComplete = true;
  latestRawP = 0;
  handoffStarted = performance.now();
  render(latestRawP);
  startReelAfterIntro();
}
function resetOpening() {
  clearTimeout(guideTimer);
  scrub.pause();
  transition.pause();
  stopFull();
  activeIndex = -1;
  pendingSeek = null;
  cancelAnimationFrame(dragFrame);
  draggingHead = false;
  try { scrub.currentTime = 0; } catch {}
  try { transition.currentTime = 0; } catch {}
  transition.classList.remove('is-active');
  openingStarted = false;
  openingComplete = false;
  transitionStarted = false;
  handoffStarted = 0;
}
function render(rawP) {
  latestRawP = clamp(rawP);
  // The two opening films run at their native frame rate; scrolling never seeks them.
  const p = openingComplete ? latestRawP : 0;
  const mobile = innerWidth < 768;
  const movieShade = transitionStarted && Number.isFinite(transition.duration) ? smooth(clamp((transition.currentTime-2.2)/2.5)) : 0;
  const shade = openingComplete ? 1 : movieShade;
  stage.style.backgroundColor = `rgb(${Math.round(255+(25-255)*shade)},${Math.round(255+(31-255)*shade)},${Math.round(255+(47-255)*shade)})`;
  const handoff = openingComplete ? (handoffStarted ? smooth(clamp((performance.now()-handoffStarted)/650)) : 1) : 0;
  if (handoffStarted && handoff < 1) requestAnimationFrame(() => render(latestRawP));
  if (handoff === 1) handoffStarted = 0;
  setOpacity(pov, openingComplete ? 1 : 0);
  scrub.style.visibility = openingComplete ? 'hidden' : 'visible';
  transition.style.visibility = openingComplete && handoff === 1 ? 'hidden' : 'visible';
  screen.classList.toggle('is-visible', openingComplete);
  setOpacity(screen, handoff);
  if (mobile) {
    screen.style.left = '0%';
    screen.style.top = '0%';
    screen.style.width = '100%';
    screen.style.height = '100%';
  } else {
    screen.style.left = config.left+'%';
    screen.style.top = config.top+'%';
    screen.style.width = config.width+'%';
    screen.style.height = config.height+'%';
  }
  setOpacity(boot, 0);
  setOpacity(editor, 1);
  editor.classList.toggle('is-ready', openingComplete);
  setOpacity(preview, 1);
  setOpacity(assets, 1);
  assets.style.transform = 'none';
  setOpacity(timeline, 1);
  timeline.style.transform = 'none';
  if (!openingComplete) {
    setMode('guide');
    return;
  }

  let headPct = 0;
  let currentSeconds = 0;
  if (p < .1) {
    setMode('guide');
    stopFull();
    headPct = 0;
  } else if (p < REEL_END) {
    setMode('work');
    const reelP = clamp((p-REEL_START)/(REEL_END-REEL_START));
    currentSeconds = reelP * totalReel;
    headPct = timelinePctAt(currentSeconds);
    let index = REEL.findIndex(item => currentSeconds < item.to);
    if (index < 0) index = REEL.length-1;
    showVideo(index);
    fullIndex = index;
  } else if (p < .91) {
    setMode('credits');
    stopFull();
    headPct = 84 + 8*clamp((p-REEL_END)/(.91-REEL_END));
    currentSeconds = totalReel;
    document.getElementById('rr-credits-scroll').style.transform = `translateY(${(1-clamp((p-REEL_END)/(.91-REEL_END)))*26-26}%)`;
  } else {
    setMode('export');
    if (fullIndex >= 0) stopFull();
    headPct = 100;
    currentSeconds = totalReel;
    const exportP = clamp((p-.91)/.09);
    const fill = smooth(exportP);
    document.getElementById('rr-export-count').textContent = String(Math.round(TOTAL*fill));
    document.getElementById('rr-export-fill').style.width = `${fill*100}%`;
    setOpacity(document.getElementById('rr-export-row'), 1);
    setOpacity(document.getElementById('rr-export-success'), clamp((exportP-.85)/.1));
    playFullButton.classList.toggle('is-visible', exportP > .95);
    const plane = document.getElementById('rr-plane');
    setOpacity(plane, clamp((exportP-.83)/.1));
    plane.style.transform = `translate(${(exportP-.83)*25}px,${-(exportP-.83)*32}px) rotate(-30deg)`;
  }
  if (p < .91) {
    setOpacity(document.getElementById('rr-export-row'),0);
    playFullButton.classList.remove('is-visible');
  }
  document.getElementById('rr-current-time').textContent = timecode(currentSeconds);
  setPlayhead(headPct);
}
function setupEntry() {
  section.addEventListener('founder-open', () => render(latestRawP));
  section.addEventListener('founder-close', () => { resetOpening(); latestRawP=0; render(0); });
  addEventListener('resize', () => render(latestRawP), { passive: true });
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) resetOpening();
    else if (entry.intersectionRatio >= .25) startOpening();
  }, { threshold: [0, .25] });
  observer.observe(section);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeVisible = !fullVideo.paused;
      clearTimeout(guideTimer);
      [scrub, transition, fullVideo].forEach(v => v.pause());
    } else if (openingStarted) {
      if (!openingComplete) (window.SANHEMedia.play ? window.SANHEMedia.play(transitionStarted ? transition : scrub) : (transitionStarted ? transition : scrub).play()).catch(() => {});
      else if (preview.dataset.mode === 'guide') startReelAfterIntro();
      else if (resumeVisible && fullIndex !== -1) requestPlayback();
    }
  });
}
function setupPlayheadDrag() {
  const seekAt = (clientX) => {
    const rect = track.getBoundingClientRect();
    const percent = clamp((clientX-rect.left)/rect.width)*100;
    const seconds = secondsAtTimelinePct(percent);
    if (percent < 6) setProgress(percent/6*REEL_START);
    else if (percent < 84) seekReel(seconds, {play:false});
    else setProgress(REEL_END + (percent-84)/16*(1-REEL_END));
  };
  const moveAtEdge = () => {
    if (!draggingHead) return;
    const rect = trackWindow.getBoundingClientRect();
    const direction = dragClientX < rect.left+30 ? -1 : dragClientX > rect.right-30 ? 1 : 0;
    if (direction && trackContent.offsetWidth > rect.width) {
      dragShift = clamp(dragShift-direction*7, rect.width/2-trackContent.offsetWidth, rect.width/2);
      trackContent.style.transform = `translateX(${dragShift}px)`;
      seekAt(dragClientX);
    }
    dragFrame = requestAnimationFrame(moveAtEdge);
  };
  playhead.addEventListener('pointerdown',(event)=>{
    if (!openingComplete) return;
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(guideTimer);
    fullVideo.pause();
    draggingHead = true;
    dragShift = timelineShift;
    dragClientX = event.clientX;
    playhead.setPointerCapture(event.pointerId);
    dragFrame = requestAnimationFrame(moveAtEdge);
  });
  playhead.addEventListener('pointermove',(event)=>{
    if (!draggingHead) return;
    dragClientX = event.clientX;
    seekAt(dragClientX);
  });
  const endDrag = ()=>{
    if (!draggingHead) return;
    draggingHead = false;
    cancelAnimationFrame(dragFrame);
    render(latestRawP);
    if (preview.dataset.mode === 'work') requestPlayback();
  };
  playhead.addEventListener('pointerup',endDrag);
  playhead.addEventListener('pointercancel',endDrag);
  playhead.addEventListener('lostpointercapture',endDrag);
  playhead.addEventListener('keydown',(event)=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = secondsAtTimelinePct(parseFloat(playhead.dataset.percent || '6'));
    const seconds = event.key==='Home' ? 0 : event.key==='End' ? totalReel : clamp(current+(event.key==='ArrowRight'?1:-1),0,totalReel);
    seekReel(seconds);
  });
}
async function init() {
  config = await fetch('screen.config.json').then(r=>{if(!r.ok)throw Error('Missing screen config');return r.json()});
  waveform = await fetch(`${ASSET}reel/waveform.json`).then(r=>{if(!r.ok)throw Error('Missing waveform');return r.json()});
  section.style.setProperty('--screen',config.color);
  const channels = config.color.match(/[A-Fa-f0-9]{2}/g).map(v=>parseInt(v,16));
  const lighter = channels.map(v=>Math.round(v+(255-v)*.06));
  section.style.setProperty('--screen-2',`rgb(${lighter.join(',')})`);
  buildTools();
  buildTimeline();
  addWaveform();
  setupPlayheadDrag();
  fullVideo.muted = true;
  fullVideo.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== null) {
      fullVideo.currentTime = Math.min(pendingSeek, Math.max(0, fullVideo.duration-.01));
      pendingSeek = null;
    }
  });
  fullVideo.addEventListener('timeupdate', () => {
    if (draggingHead || pendingSeek !== null || fullIndex === -1 || preview.dataset.mode !== 'work') return;
    render(REEL_START + Math.min(fullVideo.currentTime/totalReel, .999999)*(REEL_END-REEL_START));
  });
  ['play','pause','ended','volumechange'].forEach(name => fullVideo.addEventListener(name, updatePlaybackControls));
  fullVideo.addEventListener('error', () => {
    playButton.textContent = '↻';
    playButton.setAttribute('aria-label','重新加载混剪合辑');
  });
  toolboxTrigger.addEventListener('click',()=>{
    toolsBox.querySelectorAll('img[data-src]').forEach(image=>window.SANHEMedia?.prepareImage(image));
    const expanded = toolboxTrigger.getAttribute('aria-expanded')==='true';
    toolboxTrigger.setAttribute('aria-expanded',String(!expanded));
    toolboxTrigger.setAttribute('aria-label',expanded?'打开然然的剪辑工具箱':'收起然然的剪辑工具箱');
    assets.classList.toggle('is-toolbox-open',!expanded);
  });
  preview.addEventListener('click',()=>{
    if (!assets.classList.contains('is-toolbox-open')) return;
    assets.classList.remove('is-toolbox-open');
    toolboxTrigger.setAttribute('aria-expanded','false');
    toolboxTrigger.setAttribute('aria-label','打开然然的剪辑工具箱');
  });
  sound.addEventListener('click',()=>{fullVideo.muted=!fullVideo.muted;updatePlaybackControls()});
  playButton.addEventListener('click',()=>{
    if (fullVideo.error) {fullVideo.load();seekReel(0);return;}
    if (fullVideo.paused) {if (fullVideo.ended) seekReel(0);else requestPlayback();}
    else fullVideo.pause();
  });
  playFullButton.addEventListener('click',()=>seekReel(0,{unmute:true}));
  cat.addEventListener('click',()=>{cat.classList.remove('is-hop');void cat.offsetWidth;cat.classList.add('is-hop');dispatchEvent(new CustomEvent('cat-found',{detail:{id:'cat-ranran'}}))});
  scrub.addEventListener('error',()=>window.SANHEMedia.offerRetry?.(scrub));
  scrub.addEventListener('timeupdate',()=>{
    if (scrub.currentTime>1.5 && !transitionStarted) window.SANHEMedia?.prepareVideo(transition);
  });
  scrub.addEventListener('ended',startTransition);
  transition.addEventListener('timeupdate',()=>render(latestRawP));
  transition.addEventListener('playing',()=>window.SANHEMedia?.prepareVideo(fullVideo,'metadata'));
  transition.addEventListener('error',()=>window.SANHEMedia.offerRetry?.(transition));
  transition.addEventListener('ended',finishTransition);
  document.getElementById('rr-guide-open').addEventListener('click', () => {
    seekReel(0,{unmute:true});
  });
  setupEntry();
}
init().catch(error=>{console.error('Ranran editor could not start:',error);section.classList.add('is-error');pov.style.opacity='1'});

