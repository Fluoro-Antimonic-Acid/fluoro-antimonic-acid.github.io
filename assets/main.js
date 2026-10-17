(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll progress + header border
  const bar = document.getElementById('progress');
  const top = document.getElementById('top');
  const onScroll = () => {
    if (bar) {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1);
      bar.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1)})`;
    }
    if (top) top.classList.toggle('scrolled', window.scrollY > 40);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // typed text (home only)
  const typed = document.getElementById('typed');
  if (typed) {
    const words = ['电机驱动控制', '嵌入式固件', 'STM32 + FDCAN', '大功率电源', 'Linux 板级调试', '六层高速 Layout'];
    if (reduce) {
      typed.textContent = words[0];
    } else {
      let w = 0, c = 0, del = false;
      const tick = () => {
        const word = words[w];
        if (!del) {
          c++;
          typed.textContent = word.slice(0, c);
          if (c === word.length) { del = true; return setTimeout(tick, 1600); }
          setTimeout(tick, 110);
        } else {
          c--;
          typed.textContent = word.slice(0, c);
          if (c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(tick, 380); }
          setTimeout(tick, 45);
        }
      };
      setTimeout(tick, 1400);
    }
  }

  // count up
  const runCount = (el) => {
    const target = +el.dataset.count;
    if (reduce) { el.textContent = target; return; }
    const start = performance.now(), dur = 1100;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countEls = [...document.querySelectorAll('[data-count]')];
  if (countEls.length) {
    const countObs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); o.unobserve(e.target); } });
    }, { threshold: 0.6 });
    countEls.forEach((el) => countObs.observe(el));
  }

  // replay the hero animation when the page is restored from the back/forward cache
  addEventListener('pageshow', (e) => {
    if (!e.persisted || reduce) return;
    const hero = document.querySelector('.hero');
    if (hero) hero.getAnimations({ subtree: true }).forEach((a) => { a.cancel(); a.play(); });
    countEls.forEach(runCount);
  });

  // reveal on scroll
  const revEls = [...document.querySelectorAll('.reveal')];
  if (reduce || !('IntersectionObserver' in window)) {
    revEls.forEach((el) => el.classList.add('in'));
  } else {
    const revObs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      revObs.observe(el);
    });
  }

  // project filter (projects index)
  const chips = [...document.querySelectorAll('[data-filter]')];
  const pgroups = [...document.querySelectorAll('.pgroup')];
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const f = c.dataset.filter;
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      pgroups.forEach((g) => {
        const show = f === 'all' || g.dataset.group === f;
        g.hidden = !show;
        if (show) g.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      });
    })
  );

  // back to top
  const totop = document.getElementById('totop');
  if (totop) {
    const t = () => totop.classList.toggle('show', window.scrollY > 600);
    addEventListener('scroll', t, { passive: true });
    t();
    totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
