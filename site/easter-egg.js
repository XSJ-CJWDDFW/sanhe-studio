// Six different encounters. IndexedDB commits make the one draw atomic across tabs.
(() => {
  'use strict';
  const BASE = 'assets/easter-egg/';
  const DB = 'sanhe-laosan-v1';
  const REWARDS = ['合作立减200！','免费直播课程纸质版一套！','免费加剪一条片子！','免费加两条文案！','免费梳理品牌逻辑！','随机赠送skills！','免费加拍5个镜头！'];
  const POSES = ['探头','偷偷观察','蜷着睡觉','伸爪玩耍','坐着守候','悄悄溜走'];
  // The illustrated poses have unequal bounds. Map each sprite's real rectangle
  // instead of assuming a strict grid, which can expose a neighbouring ear.
  const FRAMES = [[50,140,450,302],[590,0,382,451],[995,145,539,310],[40,469,505,487],[610,455,370,544],[1018,501,516,507]];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = ['welcome','founders','tianpian','ranran','jiajia','project-progress','cooperation'].map(id => document.getElementById(id)).filter(Boolean);
  let state = clean(), current = null, spawnTimer = 0, leaveTimer = 0, scrollTimer = 0, progressTimer = 0, rewardTimer = 0, confettiFrame = 0;
  let storageReady = false, busy = false, opening = false, lastPetScene = '', oldOverflow = '', resumeVideos = [];
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(DB) : null;
  const host = document.createElement('div');
  host.innerHTML = `<button type="button" id="laosan-visitor" class="laosan-visitor" hidden aria-label="发现老三"><span class="laosan-sprite" aria-hidden="true"></span></button>
    <div class="laosan-progress" aria-hidden="true">${'<i></i>'.repeat(6)}</div>
    <button type="button" class="laosan-keepsake" hidden aria-label="查看已解锁的隐藏彩蛋"><span class="laosan-sprite" aria-hidden="true"></span></button>
    <p class="laosan-sr-only" aria-live="polite" id="laosan-status"></p>
    <dialog class="sanhe-gacha" aria-label="叁合隐藏彩蛋扭蛋机">
      <button type="button" class="gacha-close" aria-label="关闭彩蛋"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <canvas class="gacha-canvas" aria-hidden="true"></canvas>
      <div class="gacha-stage"><div class="gacha-machine"><img src="${BASE}cat-gacha-v2.png" alt="四只猫趴在扭蛋机上。恭喜你解锁我们的隐藏彩蛋！转动扭蛋机，会有惊喜！" width="1086" height="1448" loading="lazy" draggable="false"><button type="button" class="gacha-knob" aria-label="转动扭蛋机，抽取一次合作福利"><span class="gacha-knob-face" aria-hidden="true"></span></button><span class="gacha-capsule" aria-hidden="true"></span></div></div>
      <div class="gacha-reward" hidden><img alt="" draggable="false"><button type="button" class="gacha-cooperate">带着这份福利聊合作<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><p class="gacha-error" hidden role="alert"></p>
    </dialog>`;
  document.body.appendChild(host);
  const pet = host.querySelector('.laosan-visitor'), sprite = pet.firstElementChild, progress = host.querySelector('.laosan-progress'), keepsake = host.querySelector('.laosan-keepsake');
  const dialog = host.querySelector('dialog'), knob = host.querySelector('.gacha-knob'), reward = host.querySelector('.gacha-reward'), status = host.querySelector('#laosan-status'), canvas = host.querySelector('canvas');
  function renderSprite(target,pose,name) {
    if (target.dataset.frame === String(pose)) return;
    const [x,y,w,h] = FRAMES[pose];
    const clip = `laosan-cut-${name}`;
    target.innerHTML = `<svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="${BASE}laosan-states-v1.png" width="1536" height="1024" clip-path="url(#${clip})"/></svg>`;
    target.dataset.frame = String(pose);
  }

  function clean(raw = {}) {
    const found = [...new Set((Array.isArray(raw.found) ? raw.found : []).filter(n => Number.isInteger(n) && n >= 0 && n < 6))];
    const prize = raw.reward && Number.isInteger(raw.reward.index) && raw.reward.index >= 0 && raw.reward.index < 7 ? raw.reward : null;
    return {version:1,found,unlockedAt:found.length === 6 ? raw.unlockedAt || Date.now() : null,reward:prize};
  }
  const database = new Promise((resolve,reject) => {
    const request = indexedDB.open(DB,1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('storage blocked'));
  });
  async function stored(mutator) {
    const db = await database;
    return new Promise((resolve,reject) => {
      const tx = db.transaction('state',mutator ? 'readwrite' : 'readonly');
      const store = tx.objectStore('state');
      const request = store.get('main');
      let next;
      request.onsuccess = () => {
        next = clean(request.result);
        if (mutator) { next = clean(mutator(next)); store.put(next,'main'); }
      };
      tx.oncomplete = () => resolve(next);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('storage write failed'));
    });
  }
  function sync(next) {
    state = next;
    if (state.found.length >= 5) host.querySelector('.gacha-machine > img').loading = 'eager';
    keepsake.hidden = state.found.length < 6;
    if (state.found.length === 6) renderSprite(keepsake.firstElementChild,0,'keepsake');
    if (state.found.length === 6) hidePet();
    if (state.reward) document.dispatchEvent(new CustomEvent('sanhe-reward-selected',{detail:state.reward}));
    if (dialog.open && state.reward && !busy) showReward();
  }
  async function refresh() {
    try { sync(await stored()); } catch { /* Leave an existing result intact if storage is temporarily unavailable. */ }
  }
  channel?.addEventListener('message',refresh);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) { hidePet(); stopConfetti(); clearTimeout(spawnTimer); clearTimeout(scrollTimer); }
    else { refresh(); schedule(4500); }
  });
  function announce(text) { status.textContent = text; }
  function nextRandom(length) {
    const limit = 0x100000000 - (0x100000000 % length);
    const value = new Uint32Array(1);
    do { crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % length;
  }
  function currentScene() {
    return scenes.map(el => ({el,r:el.getBoundingClientRect()})).filter(({el,r}) => !el.hidden && r.width > 0 && r.bottom > 0 && r.top < innerHeight).sort((a,b) => (Math.min(b.r.bottom,innerHeight)-Math.max(b.r.top,0))-(Math.min(a.r.bottom,innerHeight)-Math.max(a.r.top,0)))[0]?.el;
  }
  function canAppear(scene) {
    if (!storageReady || state.found.length === 6 || dialog.open || document.hidden || !scene || document.querySelector('dialog[open]')) return false;
    if (document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) return false;
    // Respect the film, including the homepage welcome sequence.
    return ![...scene.querySelectorAll('video')].some(video => !video.paused && !video.ended);
  }
  function placePet(pose) {
    const size = innerWidth < 701 ? 84 : 112, margin = innerWidth < 701 ? 8 : 18;
    const candidates = [
      [margin,innerHeight-size-20], [innerWidth-size-margin,innerHeight-size-88],
      [margin,innerHeight*.31], [innerWidth-size-margin,innerHeight*.36],
      [margin+12,innerHeight-size-80], [innerWidth-size-margin,innerHeight*.23]
    ];
    const controls = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"],h1,h2,h3,p,legend,.co-intro,.co-brief,.co-modes,.co-team,.magic-bento__card')].filter(el => !host.contains(el)).map(el => el.getBoundingClientRect()).filter(r => r.width && r.height && r.bottom > 0 && r.top < innerHeight);
    for (let n=0;n<candidates.length;n++) {
      let [x,y] = candidates[(pose+n)%candidates.length];
      const side = x < innerWidth/2 ? 'left' : 'right';
      // A peeking shoulder must continue behind a real page edge, rather than
      // ending in a cutout in open space. Keep the same corner and height.
      if (pose === 1) x = side === 'left' ? -size*.075 : innerWidth-size*.925;
      if (controls.some(r => x < r.right+10 && x+size > r.left-10 && y < r.bottom+10 && y+size > r.top-10)) continue;
      pet.style.left = `${Math.round(x)}px`; pet.style.top = `${Math.round(y)}px`;
      pet.dataset.side = side;
      return true;
    }
    return false;
  }
  function hidePet() {
    clearTimeout(leaveTimer);
    pet.classList.remove('is-visible','is-leaving'); pet.hidden = true; pet.disabled = false; current = null;
  }
  function schedule(delay = 12000 + nextRandom(10001)) {
    clearTimeout(spawnTimer);
    if (state.found.length < 6 && !document.hidden) spawnTimer = setTimeout(appear,delay);
  }
  function appear() {
    const scene = currentScene();
    if (!canAppear(scene)) { schedule(3500); return; }
    const remaining = [0,1,2,3,4,5].filter(p => !state.found.includes(p));
    const pose = remaining[nextRandom(remaining.length)];
    if (!placePet(pose)) { schedule(6000); return; }
    current = {pose,scene:scene.id};
    lastPetScene = scene.id;
    pet.dataset.pose = String(pose); pet.dataset.scene = scene.id;
    const dark = (scene.id === 'jiajia' && scene.classList.contains('is-workbench')) ||
      (scene.id === 'ranran' && scene.querySelector('#rr-editor')?.classList.contains('is-ready'));
    pet.dataset.surface = dark ? 'dark' : 'light';
    renderSprite(sprite,pose,'visitor');
    pet.setAttribute('aria-label',`老三正在${POSES[pose]}，点击发现它`);
    pet.hidden = false;
    requestAnimationFrame(() => pet.classList.add('is-visible'));
    leaveTimer = setTimeout(() => { hidePet(); schedule(); },14000);
  }
  pet.addEventListener('click',async () => {
    if (!current || pet.disabled) return;
    const encounter = current;
    pet.disabled = true;
    clearTimeout(leaveTimer);
    const position = pet.getBoundingClientRect();
    try {
      const next = await stored(old => {
        if (!old.found.includes(encounter.pose)) old.found.push(encounter.pose);
        if (old.found.length === 6 && !old.unlockedAt) old.unlockedAt = Date.now();
        return old;
      });
      sync(next); channel?.postMessage('changed');
      pet.classList.add('is-leaving');
      announce(`发现老三的第 ${state.found.length} 种状态，共 6 种。`);
      [...progress.children].forEach((dot,i) => dot.classList.toggle('is-found',i<state.found.length));
      progress.style.left = `${Math.max(8,Math.min(innerWidth-90,position.x+12))}px`;
      progress.style.top = `${Math.max(10,position.y)}px`;
      progress.classList.add('is-visible'); clearTimeout(progressTimer);
      progressTimer = setTimeout(() => progress.classList.remove('is-visible'),1800);
      setTimeout(hidePet,350);
      if (state.found.length === 6) { setTimeout(() => openEgg(true),400); }
      else schedule();
    } catch {
      pet.disabled = false; announce('浏览器暂时无法保存发现记录，请允许网站存储后再试。');
      leaveTimer = setTimeout(() => {hidePet();schedule();},10000);
    }
  });
  // While scrolling, stay out of the way and relocate only after the page settles.
  addEventListener('scroll',() => {
    if (dialog.open) return;
    hidePet(); clearTimeout(spawnTimer); clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const freshScene = currentScene()?.id !== lastPetScene;
      schedule(freshScene ? 1400 + nextRandom(1201) : 3800 + nextRandom(3201));
    },500);
  },{passive:true});
  addEventListener('resize',() => { if (!dialog.open) { hidePet(); schedule(4500); } });
  const modalObserver = new MutationObserver(() => {
    if (current && document.querySelector('dialog[open]')) { hidePet(); schedule(5000); }
  });
  modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('play',event => {
    if (event.target.tagName === 'VIDEO') { hidePet(); schedule(5000); }
  },true);
  document.addEventListener('focusin',event => {
    if (event.target.matches('input,textarea,select,[contenteditable="true"]')) hidePet();
  });
  function showReward() {
    if (!state.reward) return;
    dialog.classList.remove('is-drawing'); dialog.classList.add('has-reward');
    knob.disabled = true; knob.setAttribute('aria-label','已经抽取，不能重复抽取');
    reward.firstElementChild.src = `${BASE}reward-${state.reward.index+1}.png`;
    reward.firstElementChild.alt = REWARDS[state.reward.index]; reward.hidden = false;
    if (dialog.open && (!dialog.contains(document.activeElement) || document.activeElement === knob)) host.querySelector('.gacha-cooperate').focus({preventScroll:true});
    announce(`你的奖励是：${REWARDS[state.reward.index]}。该浏览器已经抽取过一次。`);
  }
  async function openEgg(celebrate = false) {
    if (dialog.open || opening) return;
    opening = true;
    try {
    await refresh();
    if (state.found.length < 6 || document.querySelector('dialog[open]')) return;
    hidePet(); progress.classList.remove('is-visible');
    clearTimeout(spawnTimer); clearTimeout(rewardTimer);
    dialog.classList.remove('has-reward','is-drawing'); reward.hidden = true;
    host.querySelector('.gacha-error').hidden = true;
    knob.disabled = !!state.reward;
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    resumeVideos = [...document.querySelectorAll('video')].filter(video => !video.paused && !video.ended);
    resumeVideos.forEach(video => video.pause());
    dialog.showModal();
    if (state.reward) showReward();
    requestAnimationFrame(() => (state.reward ? host.querySelector('.gacha-close') : knob).focus({preventScroll:true}));
    if (celebrate) { burst(); announce('集齐老三的六种状态，隐藏彩蛋已经解锁。'); }
    } finally { opening = false; }
  }
  function closed() {
    clearTimeout(rewardTimer); stopConfetti(); busy = false;
    document.body.style.overflow = oldOverflow;
    const pending = resumeVideos; resumeVideos = [];
    if (!document.hidden) pending.forEach(video => {
      const rect = video.getBoundingClientRect();
      if (!video.closest('[hidden]') && rect.width && rect.bottom > 0 && rect.top < innerHeight) video.play().catch(() => {});
    });
    keepsake.focus({preventScroll:true});
  }
  host.querySelector('.gacha-close').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',closed);
  keepsake.addEventListener('click',() => openEgg());
  host.querySelector('.gacha-cooperate').addEventListener('click',() => {
    if (!state.reward) return;
    dialog.close();
    document.dispatchEvent(new CustomEvent('sanhe-reward-selected',{detail:state.reward}));
    document.dispatchEvent(new Event('sanhe-go-cooperation'));
    history.replaceState(null,'','#cooperation');
    requestAnimationFrame(() => {
      document.getElementById('cooperation')?.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
      document.getElementById('co-description')?.focus({preventScroll:true});
    });
  });
  knob.addEventListener('click',async () => {
    if (busy || state.reward) return;
    busy = true; knob.disabled = true;
    try {
      // A read/write transaction serializes simultaneous clicks in separate tabs.
      sync(await stored(old => {
        if (old.found.length === 6 && !old.reward) old.reward = {index:nextRandom(7),drawnAt:Date.now()};
        return old;
      }));
      channel?.postMessage('changed');
      if (!state.reward) throw new Error('not unlocked');
      if (!dialog.open) { busy = false; showReward(); return; }
      reward.firstElementChild.src = `${BASE}reward-${state.reward.index+1}.png`;
      reward.firstElementChild.alt = REWARDS[state.reward.index];
      dialog.classList.add('is-drawing');
      rewardTimer = setTimeout(() => { busy = false; showReward(); if (dialog.open) burst(); },reduced.matches ? 0 : 2100);
    } catch {
      busy = false; knob.disabled = false;
      const error = host.querySelector('.gacha-error'); error.textContent = '暂时无法保存抽取结果，请允许网站存储后再试。'; error.hidden = false;
    }
  });
  function stopConfetti() { cancelAnimationFrame(confettiFrame); canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height); }
  function burst() {
    stopConfetti();
    if (reduced.matches) return;
    const width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio,1.5);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr,dpr);
    const colors = ['#75d4b7','#ffbf8b','#ef88ab','#f5d36d','#78b9ea','#c29cea'];
    const pieces = Array.from({length:innerWidth<700?100:200},(_,i) => ({x:i%2?width*.06:width*.94,y:height*.7,vx:(i%2?1:-1)*(2+Math.random()*9),vy:-6-Math.random()*14,w:4+Math.random()*6,h:6+Math.random()*9,r:Math.random()*Math.PI,spin:(Math.random()-.5)*.2,color:colors[i%colors.length]}));
    let previous = performance.now(), started = previous;
    function frame(now) {
      const dt = Math.min((now-previous)/16.67,2); previous = now;
      ctx.clearRect(0,0,width,height);
      for (const p of pieces) {
        p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=.19*dt; p.r+=p.spin*dt;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.color;
        ctx.globalAlpha = Math.max(0,Math.min(1,(3600-(now-started))/700)); ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.max(.25,Math.abs(Math.cos(p.r)))); ctx.restore();
      }
      if (now-started<3600 && dialog.open && !document.hidden) confettiFrame=requestAnimationFrame(frame);
      else ctx.clearRect(0,0,width,height);
    }
    confettiFrame=requestAnimationFrame(frame);
  }
  stored().then(next => { storageReady = true; sync(next); schedule(currentScene()?.id === 'welcome' ? 10000 : 2500); }).catch(() => { storageReady = false; });
})();
