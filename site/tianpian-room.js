(() => {
  const root = 'assets/tianpian/room/';
  const section = document.getElementById('tianpian');
  const room = document.getElementById('tp-room');
  const stage = document.getElementById('tp-room-stage');
  const hotspots = document.getElementById('tp-room-hotspots');
  const mobileNav = document.getElementById('tp-room-mobile-nav');
  const glow = document.getElementById('tp-room-glow');
  const dialog = document.getElementById('tp-detail');
  const shell = document.getElementById('tp-detail-shell');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const W = 1920, H = 1080;
  const img = (name, alt = '') => `<img src="${root}${name}" alt="${alt}" loading="lazy" draggable="false">`;
  const visual = (name, className = '', alt = '') => `<div class="tp-slide-visual ${className}">${img(name, alt)}</div>`;
  const words = (eyebrow, title, line = '', extra = '') => `<div class="tp-slide-words"><span class="tp-eyebrow">${eyebrow}</span><h2>${title}</h2>${line ? `<p>${line}</p>` : ''}${extra}</div>`;
  const slide = (a, b, className = '') => `<article class="tp-slide ${className}">${a}${b}</article>`;
  const facts = (...items) => `<div class="tp-facts">${items.map(x => `<span>${x}</span>`).join('')}</div>`;
  const grid = (...items) => `<div class="tp-slide-visual is-gallery"><div class="tp-shot-grid">${items.map(item => {
    const shot = typeof item === 'string' ? {file:item, label:''} : item;
    return `<figure><button class="tp-shot-trigger" type="button" data-photo="${shot.file}" data-photo-label="${shot.label || '甜片项目实拍'}" aria-label="放大查看${shot.label || '项目照片'}">${img(shot.file, shot.label || '甜片项目实拍')}${shot.label ? `<figcaption>${shot.label}</figcaption>` : ''}</button></figure>`;
  }).join('')}</div></div>`;
  const timeline = (...items) => `<div class="tp-career">${items.map(([date, role]) => `<div><time>${date}</time><strong>${role}</strong></div>`).join('')}</div>`;
  const metrics = (...items) => `<div class="tp-metrics">${items.map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>`;
  const accounts = (...items) => `<div class="tp-accounts">${items.map(([name, field, detail]) => `<div><strong>${name}</strong><span>${field}</span><p>${detail}</p></div>`).join('')}</div>`;
  const link = (url, label) => `<a class="tp-source-link" href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;

  const entries = {
    profile: {
      label: '甜片',
      focus: [950, 540],
      polygon: [[760,681],[755,580],[784,461],[814,385],[885,340],[969,339],[1046,386],[1094,479],[1102,611],[1062,694]],
      slides: [
        slide(visual('room-v4.png', 'is-room-person', '甜片坐在工作桌后'), words('甜片 / 自媒体编导 · 拍摄', '甜片', '', metrics(['6 年','自媒体经验'],['10+','覆盖行业'],['3 个','自己的账号'])), 'is-cover'),
        slide(visual('yaoxu-life.jpg', 'is-portrait is-photo', '甜片的工作记录'), words('做过的内容', '内容成绩', '', metrics(['1000 万+','单条最高播放'],['10 万','带过的账号单月涨粉'],['142 万','服务账号最高粉丝数'])), 'is-cover')
      ]
    },
    storyboard: {
      label: '分镜本',
      focus: [745, 830],
      polygon: [[523,710],[700,717],[941,738],[1128,819],[1110,920],[476,915]],
      slides: [
        slide(visual('room-v4.png', 'is-room-book', '桌上打开的分镜本'), words('编导 / 拍摄', '分镜本', '从选题走到现场。', timeline(['01','账号定位'],['02','选题与脚本'],['03','分镜与拍摄'],['04','发布与复盘']))),
        slide(visual('tianpian-filming-client-v1.png', 'is-portrait is-photo', '甜片手持相机拍摄客户的 3D 动漫画面'), words('镜头', '亲手拍', '内容策划与现场拍摄都在她的工作范围里。'))
      ]
    },
    collaborations: {
      label: '合作与成绩',
      focus: [958, 249],
      polygon: [[571,67],[1353,67],[1353,344],[570,344]],
      slides: [
        slide(grid({file:'source-02.jpg',label:'姚小姐和她的猫'},{file:'source-01.jpg',label:'甜片 PhotoBooth'}), words('账号 / 01', '自己的号', '', accounts(['姚小姐和她的猫','宠物','拍家里的猫。1.2 万粉丝，单条最高 62.6 万播放。'],['甜片 PhotoBooth','婚礼摄影','婚礼、生日、企业活动现场拍照，即拍即印。'],['甜一片','电子产品','数码类内容，自己拍、自己剪。'])), 'is-accounts'),
        slide(grid({file:'source-04.jpg',label:'卑微老董地位极高'}), words('帮别人做的号 / 01', '教育内容', '', accounts(['洁然老师教育规划','教育','142 万粉丝，187 万获赞。'],['卑微老董地位极高','家庭教育','15.5 万粉丝，单条最高 612.2 万播放。'])), 'is-accounts'),
        slide(grid({file:'source-03.jpg',label:'王金龙女士'},{file:'source-07.jpg',label:'韩雨台球'},{file:'source-06.jpg',label:'梁德刚医生'}), words('帮别人做的号 / 02', '专业账号', '', accounts(['王金龙女士','星座 / 生命数字','23.9 万粉丝。'],['韩雨台球','体育','台球世锦赛冠军的账号，单条最高 82.2 万播放。'],['梁德刚医生','医疗健康','心血管外科主任医师，4.3 万粉丝。'])), 'is-accounts'),
        slide(grid({file:'source-09.jpg',label:'余香兄妹'},{file:'source-05.jpg',label:'老董都懂'}), words('帮别人做的号 / 03', '内容与电商', '', accounts(['余香兄妹','花茶电商','3.6 万粉丝，14.7 万获赞。'],['老董都懂','生命数字','2.6 万粉丝，单条最高 30.8 万播放。'])), 'is-accounts'),
        slide(grid({file:'source-10.jpg',label:'总修井盖的刘丕'},{file:'source-11.jpg',label:'武清眉老板妮妮'}), words('帮别人做的号 / 04', '更多合作', '', accounts(['总修井盖的刘丕','市政工程','8.5 万获赞。'],['武清眉老板妮妮','美业','本地门店引流号。'],['小柯工作室','音乐','小柯 30 周年巡回演唱会宣传。'])), 'is-accounts')
      ]
    },
    bracelets: {
      label: '甜序集',
      focus: [1240, 814],
      polygon: [[1075,727],[1410,727],[1450,868],[1360,910],[1071,901]],
      slides: [
        slide(visual('bracelet-2.jpg', 'is-photo', '甜序集手串实拍'), words('自营项目 / 0→1', '甜序集', '甜片从打板开始主导设计与定制沟通。', facts('已有成交', '品牌开发中'))),
        slide(grid('bracelet-1.jpg','bracelet-4.jpg','bracelet-5.jpg','bracelet-6.jpg'), words('实拍 / 01', '佩戴与细节', '款式、配色、组合。')),
        slide(grid('tianpian-bracelet-color.jpg','tianpian-bracelet-gift.jpg','yaoxu-bracelet-process.jpg','bracelet-3.jpg'), words('实拍 / 02', '作品与呈现', '彩色搭配 · 礼盒 · 佩戴'))
      ]
    },
    photobooth: {
      label: 'PhotoBooth',
      focus: [1552, 783],
      polygon: [[1450,701],[1670,702],[1730,842],[1530,885],[1439,850]],
      slides: [
        slide(visual('photobooth-3.jpg', 'is-portrait is-photo', '甜片 PhotoBooth 婚礼摄影作品'), words('京津冀接单', 'PhotoBooth', '在婚礼、订婚、生日和企业活动现场，架一台互动相机。宾客自己拍，拍完当场打印，活动结束还能带走一本当天的相册。')),
        slide(grid('photobooth-1.jpg','photobooth-5.jpg'), words('服务', '现场服务', '', accounts(['互动拍照','现场','宾客自己拍，即时打印。'],['专属相册','当天','当天出专属相册。'],['婚礼跟拍','拍摄','记录婚礼现场。'])), 'is-accounts'),
        slide(grid('photobooth-6.jpg','photobooth-4.jpg','photobooth-2.jpg'), words('拍摄作品', '现场与交付', '甜片本人或她的设备拍摄。'))
      ]
    }
  };

  let activeTrigger = null;
  let activeKey = null;
  let index = 0;
  let closeTimer = null;
  let focusedPhoto = false;
  let photoReturnIndex = 0;
  let photoReturnFile = '';
  let lastBodyOverflow = '';
  const label = document.createElement('span');
  label.className = 'tp-room-hover-label';
  label.setAttribute('aria-hidden', 'true');
  stage.appendChild(label);

  function light(entry) {
    const [x,y] = entry.focus;
    glow.style.setProperty('--glow-x', `${x/W*100}%`);
    glow.style.setProperty('--glow-y', `${y/H*100}%`);
    glow.classList.add('is-on');
    label.textContent = entry.label;
    label.style.left = `${x/W*100}%`;
    label.style.top = `${y/H*100}%`;
    label.classList.add('is-on');
  }
  function unlight() { glow.classList.remove('is-on'); label.classList.remove('is-on'); }

  for (const [key, entry] of Object.entries(entries)) {
    const xs = entry.polygon.map(p => p[0]), ys = entry.polygon.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const button = document.createElement('button');
    button.className = 'tp-hotspot';
    button.type = 'button';
    button.setAttribute('aria-label', `查看${entry.label}`);
    button.style.left = `${minX/W*100}%`;
    button.style.top = `${minY/H*100}%`;
    button.style.width = `${(maxX-minX)/W*100}%`;
    button.style.height = `${(maxY-minY)/H*100}%`;
    button.style.clipPath = `polygon(${entry.polygon.map(([x,y]) => `${(x-minX)/(maxX-minX)*100}% ${(y-minY)/(maxY-minY)*100}%`).join(',')})`;
    button.addEventListener('pointerenter', () => light(entry));
    button.addEventListener('pointerleave', unlight);
    button.addEventListener('focus', () => light(entry));
    button.addEventListener('blur', unlight);
    button.addEventListener('click', () => open(key, button));
    hotspots.appendChild(button);
    const mobile = document.createElement('button');
    mobile.type = 'button';
    mobile.textContent = entry.label;
    mobile.addEventListener('click', () => open(key, mobile));
    mobileNav.appendChild(mobile);
  }

  function open(key, trigger) {
    if (!section.classList.contains('is-room') || dialog.open) return;
    activeKey = key;
    activeTrigger = trigger;
    index = 0;
    focusedPhoto = false;
    const entry = entries[key];
    const rect = stage.getBoundingClientRect();
    const focusX = rect.left + rect.width * entry.focus[0]/W;
    const focusY = rect.top + rect.height * entry.focus[1]/H;
    dialog.style.setProperty('--focus-dx', `${focusX - innerWidth / 2}px`);
    dialog.style.setProperty('--focus-dy', `${focusY - innerHeight / 2}px`);
    room.style.setProperty('--room-shift-x', `${(innerWidth / 2 - focusX) * .16}px`);
    room.style.setProperty('--room-shift-y', `${(innerHeight / 2 - focusY) * .16}px`);
    room.classList.add('is-focusing');
    unlight();
    dialog.classList.remove('is-closing');
    dialog.setAttribute('aria-label', entry.label);
    shell.innerHTML = `<div class="tp-detail-head"><button class="tp-back" type="button">← 返回房间</button><span class="tp-detail-title">${entry.label}</span></div><div class="tp-detail-rail" tabindex="0">${entry.slides.join('')}</div><div class="tp-detail-foot"><span class="tp-count"></span><div class="tp-detail-arrows"><button class="tp-prev" type="button" aria-label="上一页">←</button><button class="tp-next" type="button" aria-label="下一页">→</button></div></div>`;
    lastBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    shell.querySelector('.tp-back').focus();
    shell.querySelector('.tp-back').addEventListener('click', close);
    shell.querySelector('.tp-prev').addEventListener('click', () => go(index - 1));
    shell.querySelector('.tp-next').addEventListener('click', () => go(index + 1));
    bindRail(shell.querySelector('.tp-detail-rail'));
    updateNav();
  }
  function updateNav() {
    if (focusedPhoto) return;
    const count = entries[activeKey].slides.length;
    shell.querySelector('.tp-count').textContent = `${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
    shell.querySelector('.tp-prev').disabled = index === 0;
    shell.querySelector('.tp-next').disabled = index === count - 1;
  }
  function go(next) {
    if (focusedPhoto) return;
    index = Math.max(0, Math.min(entries[activeKey].slides.length - 1, next));
    const rail = shell.querySelector('.tp-detail-rail');
    rail.scrollTo({left:index*rail.clientWidth,behavior:reducedMotion.matches?'instant':'smooth'});
    updateNav();
  }
  function close() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reducedMotion.matches) { finishClose(); return; }
    dialog.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(finishClose, 420);
  }
  function finishClose() {
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-closing');
    room.classList.remove('is-focusing');
    document.body.style.overflow = lastBodyOverflow;
    if (activeTrigger && activeTrigger.isConnected) activeTrigger.focus({preventScroll:true});
    activeKey = null;
    focusedPhoto = false;
  }
  function showPhoto(button) {
    if (!activeKey || focusedPhoto) return;
    const file = button.dataset.photo;
    const label = button.dataset.photoLabel;
    if (!/^[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(file)) return;
    focusedPhoto = true;
    photoReturnIndex = index;
    photoReturnFile = file;
    const rail = shell.querySelector('.tp-detail-rail');
    rail.classList.add('is-image-focus');
    rail.innerHTML = `<div class="tp-photo-focus"><button class="tp-photo-back" type="button">← 返回资料</button>${img(file, label)}<span>${label}</span></div>`;
    shell.querySelector('.tp-count').textContent = '原图';
    shell.querySelector('.tp-detail-arrows').hidden = true;
    rail.querySelector('.tp-photo-back').focus();
  }
  function hidePhoto() {
    if (!focusedPhoto || !activeKey) return;
    focusedPhoto = false;
    index = photoReturnIndex;
    const rail = shell.querySelector('.tp-detail-rail');
    rail.classList.remove('is-image-focus');
    rail.innerHTML = entries[activeKey].slides.join('');
    rail.scrollLeft = index * rail.clientWidth;
    shell.querySelector('.tp-detail-arrows').hidden = false;
    updateNav();
    [...rail.querySelectorAll('.tp-shot-trigger')].find(button => button.dataset.photo === photoReturnFile)?.focus({preventScroll:true});
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (focusedPhoto) hidePhoto(); else close(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { close(); return; }
    const photo = event.target.closest('.tp-shot-trigger');
    if (photo) showPhoto(photo);
    if (event.target.closest('.tp-photo-back')) hidePhoto();
  });
  dialog.addEventListener('keydown', event => {
    if (focusedPhoto) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(index+1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(index-1); }
  });
  function bindRail(rail) {
    let startX = 0, startScroll = 0, dragging = false;
    rail.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') return;
      if (event.target.closest('button,a,video')) return;
      startX = event.clientX; startScroll = rail.scrollLeft; dragging = true;
      rail.classList.add('is-dragging'); rail.setPointerCapture(event.pointerId);
    });
    rail.addEventListener('pointermove', event => { if (dragging) rail.scrollLeft = startScroll - (event.clientX-startX); });
    const end = () => {
      if (!dragging) return;
      dragging = false; rail.classList.remove('is-dragging');
      index = Math.max(0,Math.min(entries[activeKey].slides.length-1,Math.round(rail.scrollLeft/rail.clientWidth)));
      go(index);
    };
    rail.addEventListener('pointerup',end);
    rail.addEventListener('pointercancel',end);
    rail.addEventListener('scroll',() => {
      if (dragging || focusedPhoto) return;
      const next = Math.round(rail.scrollLeft/rail.clientWidth);
      if (activeKey && next !== index) { index = next; updateNav(); }
    },{passive:true});
  }

  if (reducedMotion.matches) {
    section.classList.add('is-white','is-room');
    room.setAttribute('aria-hidden','false');
  }
})();
