(() => {
  const navigation = document.getElementById('founders');
  const buttons = [...navigation.querySelectorAll('[data-founder]')];
  const panels = new Map(buttons.map(button => [button.dataset.founder, document.getElementById(button.dataset.founder)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const projects = document.getElementById('project-progress');
  let active = null;
  let touchTimer;
  let introduced = false;
  let scrollFrame = 0;
  let previousY = scrollY;

  function select(id, { scroll = true, updateHash = true } = {}) {
    if (id !== null && !panels.has(id)) return;
    const previous = active;
    active = id;
    if (previous && previous !== id) panels.get(previous).dispatchEvent(new Event('founder-close'));
    panels.forEach((panel, key) => {
      panel.hidden = key !== id;
      if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
    });
    navigation.classList.toggle('has-selection', !!id);
    buttons.forEach(button => {
      const selected = button.dataset.founder === id;
      button.setAttribute('aria-expanded', String(selected));
      button.querySelector('.founder-badge').textContent = selected ? '已展开' : '点我';
    });
    if (id) panels.get(id).dispatchEvent(new Event('founder-open'));
    if (updateHash) history.replaceState(null, '', `#${id || 'founders'}`);
    if (!scroll) return;
    requestAnimationFrame(() => {
      const target = id ? panels.get(id) : navigation;
      target.scrollIntoView({ block:'start', behavior:reduced.matches ? 'instant' : 'smooth' });
      if (id) target.querySelector('.founder-collapse').focus({ preventScroll:true });
      else buttons.find(button => button.dataset.founder === select.lastClosed)?.focus({ preventScroll:true });
    });
  }

  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      clearTimeout(touchTimer);
      buttons.forEach(item => item.classList.remove('is-touched'));
      button.classList.add('is-touched');
      touchTimer = setTimeout(() => button.classList.remove('is-touched'), 1400);
    });
    button.addEventListener('click', () => {
      introduced = true;
      const id = button.dataset.founder;
      select.lastClosed = active;
      select(active === id ? null : id);
    });
  });

  panels.forEach((panel, id) => {
    const close = document.createElement('button');
    close.className = 'founder-collapse';
    close.type = 'button';
    close.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h14M7 17l5-5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    close.setAttribute('aria-label', `收起${buttons.find(button => button.dataset.founder === id).querySelector('.founder-name').textContent}的履历`);
    close.addEventListener('click', () => {
      introduced = true;
      select.lastClosed = id;
      select(null);
    });
    panel.appendChild(close);
  });

  // Default expansion happens on entry to the avatar area, without scrolling
  // the visitor away from the part they are currently reading.
  const entryObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || entry.intersectionRatio < .35 || introduced) return;
    introduced = true;
    if (!active) select(buttons[0].dataset.founder, { scroll:false, updateHash:false });
  }, { threshold:[0,.35] });
  entryObserver.observe(navigation);

  function checkProgress() {
    scrollFrame = 0;
    const y = scrollY;
    const down = y > previousY;
    previousY = y;
    if (!active) return;
    const panel = panels.get(active);
    const rect = panel.getBoundingClientRect();
    const projectTop = projects.getBoundingClientRect().top;
    if (!down || projectTop > innerHeight * .72 || rect.bottom > innerHeight * .72) return;

    // Keep the project heading at the same screen coordinate while removing
    // the expanded film above it. Native anchoring is disabled for this update.
    const anchorMode = document.documentElement.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = 'none';
    select.lastClosed = active;
    select(null, { scroll:false, updateHash:false });
    // Hiding a viewport-tall panel can clamp scrollY to the new page maximum.
    // Use the post-layout document coordinate, not the old scroll offset.
    const projectDocumentTop = scrollY + projects.getBoundingClientRect().top;
    window.scrollTo({top:projectDocumentTop - projectTop, behavior:'instant'});
    previousY = scrollY;
    if (panels.has(location.hash.slice(1))) history.replaceState(null, '', '#project-progress');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.style.overflowAnchor = anchorMode;
    }));
  }
  addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(checkProgress);
  }, {passive:true});

  function readHash() {
    const id = location.hash.slice(1);
    if (panels.has(id)) {
      introduced = true;
      select(id, { updateHash:false });
    }
    else if (id === 'founders') select(null, { scroll:false, updateHash:false });
  }
  readHash();
  addEventListener('hashchange', readHash);
  document.addEventListener('sanhe-go-cooperation', () => {
    // Close through the same controller before calculating the destination.
    // Otherwise automatic collapse can cancel an in-flight smooth scroll.
    introduced = true;
    select.lastClosed = active;
    if (active) select(null, {scroll:false, updateHash:false});
    previousY = scrollY;
  });
})();
