(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  document.documentElement.classList.add('js');
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Build dynamic content first ---------- */
  buildHowScreens();
  buildFaq();
  buildQr();
  buildBank();
  if (window.lucide) lucide.createIcons();

  /* ---------- Toast for CTA (prototype) ---------- */
  const toast = $('#toast');
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cta]');
    if (a) closeMenu(); // ссылки настоящие — уходим по href
  });

  /* ---------- Header ---------- */
  const header = $('#header');
  const ctaBtn = $('#headerCta');
  const menu = $('#headerMenu');
  function closeMenu() { menu.hidden = true; ctaBtn.setAttribute('aria-expanded', 'false'); }
  ctaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    ctaBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.header__cta')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  const darkZones = $$('[data-theme="dark"]');
  const navLinks = $$('.nav a');
  const spyTargets = navLinks.map((a) => $(a.getAttribute('href')));

  /* ---------- Sky (background follows the evening) ---------- */
  const sky = $('.sky');
  const glow = $('.sky__glow');
  const skySecs = $$('[data-sky]');
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const skyCols = skySecs.map((s) => hex(s.dataset.sky));
  const skyGlow = skySecs.map((s) => (s.dataset.glow ? 1 : 0));

  function onScroll() {
    const y = scrollY;
    const vh = innerHeight;
    header.classList.toggle('is-scrolled', y > 80);
    const hy = 40;
    header.classList.toggle('is-dark', darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= hy && r.bottom >= hy; }));

    // sky
    const probe = vh * 0.6;
    let col = skyCols[0], g = 0;
    for (let i = 0; i < skySecs.length; i++) {
      const r = skySecs[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) {
        const t = (probe - r.top) / r.height;
        const next = Math.min(i + 1, skySecs.length - 1);
        const k = t > 0.55 ? (t - 0.55) / 0.45 : 0;
        const ks = k * k * (3 - 2 * k);
        col = mix(skyCols[i], skyCols[next], ks);
        g = skyGlow[i] + (skyGlow[next] - skyGlow[i]) * ks;
        break;
      }
      if (i === skySecs.length - 1 && r.bottom <= probe) col = skyCols[i];
    }
    sky.style.backgroundColor = `rgb(${col.join(',')})`;
    glow.style.opacity = g.toFixed(3);

    // scroll spy
    let active = -1;
    spyTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < vh * 0.4) active = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === active));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced && hasGsap) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(b, { x: dx * 0.12, y: dy * 0.2, duration: 0.3, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ---------- Accordion ---------- */
  $$('.acc__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc__item');
      const open = !item.classList.contains('is-open');
      $$('.acc__item').forEach((i) => { i.classList.remove('is-open'); $('.acc__btn', i).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Message tabs ---------- */
  const variants = {
    review: `<p class="bm-title">🗺️ География · Маша, 7 класс<span class="badge-n">1</span></p>
      <p>Параграф «Климат». Тест пройден.</p>
      <p class="res-line">13 верных из 15. Осталось закрепить 2 вопроса:<span class="badge-n">2</span></p>
      <ol class="qa"><li>1. Почему зимой у моря теплее, чем в глубине материка?<span>Верный ответ: вода остывает медленнее суши.</span></li>
      <li>2. Как называются ветры, которые меняют направление по сезонам?<span>Верный ответ: муссоны.</span><span class="badge-n" style="display:inline-grid;margin:4px 0 0">3</span></li></ol>`,
    ok: `<p class="bm-title">🧲 Физика · Артём, 8 класс<span class="badge-n">1</span></p>
      <p>Параграф «Сила трения». Тема освоена.</p>
      <p class="res-line">15 верных из 15. Сложных вопросов нет.<span class="badge-n">2</span></p>`,
    retry: `<p class="bm-title">🏰 История · Софья, 6 класс<span class="badge-n">1</span></p>
      <p>Параграф «Древний Рим». Тест пройден.</p>
      <p class="res-line">10 верных из 15.<span class="badge-n">2</span></p>
      <p class="bm-review">Сложных вопросов больше трёх — тему лучше пройти ещё раз</p>`
  };
  const msgBody = $('#msgBody');
  const msgBubble = $('#msgBubble');
  const msgTyping = $('#msgTyping');
  const tabs = $$('.seg button');
  const pill = $('#segPill');
  function placePill() {
    const a = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  function setVariant(v, animate) {
    if (!animate || !hasGsap || reduced) { msgBody.innerHTML = variants[v]; return; }
    const h0 = msgBubble.offsetHeight;
    msgBody.innerHTML = variants[v];
    const h1 = msgBubble.offsetHeight;
    gsap.fromTo(msgBubble, { height: h0 }, { height: h1, duration: 0.35, ease: 'power3.out', clearProps: 'height' });
    gsap.from(msgBody.children, { opacity: 0, y: 6, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.05 });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      placePill();
      setVariant(t.dataset.v, true);
    });
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); n.click();
      }
    });
  });
  setVariant('review', false);
  placePill();
  addEventListener('resize', placePill);
  document.fonts && document.fonts.ready.then(placePill);

  /* ---------- Bank shuffle ---------- */
  let attempt = 1;
  function shuffleBank(anim) {
    const cards = $$('.bcard');
    const idx = cards.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 15);
    cards.forEach((c) => { c.classList.remove('is-in'); c.textContent = ''; });
    idx.forEach((ci, order) => {
      const c = cards[ci];
      const set = () => { c.classList.add('is-in'); c.textContent = order + 1; };
      if (anim && hasGsap && !reduced) {
        gsap.delayedCall(order * 0.045, () => { set(); gsap.fromTo(c, { scale: 0.6 }, { scale: 1, duration: 0.4, ease: 'back.out(2.4)' }); });
      } else set();
    });
    $('#bankLabel').textContent = `Попытка ${attempt} · 15 из 24`;
  }
  $('#shuffle').addEventListener('click', () => { attempt++; shuffleBank(true); });

  /* ---------- Reduced motion / no GSAP: static states ---------- */
  if (!hasGsap || reduced) {
    $$('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.say').forEach((s) => { s.style.opacity = 1; s.style.transform = 'none'; });
    $('#painMin').classList.add('is-flipped');
    // hero: final frame
    $('#hq').classList.remove('is-on'); $('#hr').classList.add('is-on');
    $('#hrRing').style.strokeDashoffset = 21.8;
    $('#heroBubble').style.opacity = 1; $('#heroTyping').style.display = 'none'; $('#heroMsg').style.display = 'block';
    $('#msgTyping').style.display = 'none';
    $$('.flip-card').forEach((f) => f.classList.add('is-flipped'));
    $$('.ht__not').forEach((n) => n.classList.add('is-dim'));
    $('#qr').classList.add('is-done');
    $('#finalBubble').style.opacity = 1;
    $$('.how__screen-wrap .scr, #howScreens .scr').forEach((s, i) => s.classList.toggle('is-on', i === 3));
    $('#howBubble').style.opacity = 1; $('#howBubble').style.transform = 'none';
    shuffleBank(false);
    return;
  }

  /* ================= Motion ================= */
  gsap.defaults({ ease: 'power3.out' });

  // Generic reveal
  $$('section:not(.hero) .h2, section:not(.hero) .sec-head .lead, .how__head .lead, .msg__text .lead, .kid .lead, .price .lead').forEach((el) => el.classList.add('reveal'));
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 })
  });

  /* ---------- Hero intro ---------- */
  const title = $('#heroTitle');
  (function splitWords(node) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  })(title);
  gsap.timeline({ delay: 0.1 })
    .from('.hero .eyebrow', { opacity: 0, y: 10, duration: 0.6 })
    .from('#heroTitle .w', { opacity: 0, yPercent: 40, duration: 0.8, stagger: 0.06 }, 0.1)
    .from('.hero__lead', { opacity: 0, y: 14, duration: 0.7 }, 0.45)
    .fromTo('.hero__btns > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.6)
    .from('.hero__terms', { opacity: 0, duration: 0.6 }, 0.75)
    .from('#heroPhone', { opacity: 0, y: 40, rotate: -8, duration: 1.1, ease: 'power4.out' }, 0.35)
    .from('.marquee', { opacity: 0, duration: 0.8 }, 0.9);

  // Hero parallax
  const scene = $('#heroScene');
  if (finePointer) {
    scene.addEventListener('mousemove', (e) => {
      const r = scene.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to('#heroPhone', { x: px * 10, y: py * 8, rotateY: px * 6, rotateX: -py * 4, duration: 0.8 });
      gsap.to('#heroBubble', { x: px * 18, y: py * 14, duration: 0.8 });
    });
    scene.addEventListener('mouseleave', () => {
      gsap.to('#heroPhone', { x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 1 });
      gsap.to('#heroBubble', { x: 0, y: 0, duration: 1 });
    });
  }

  /* ---------- Hero loop ---------- */
  const hq = $('#hq'), hr = $('#hr'), hqRight = $('#hqRight'), hqFb = $('#hqFb'), hqTap = $('#hqTap');
  const hqProg = $('#hqProg'), hrRing = $('#hrRing'), hrNum = $('#hrNum');
  const hBubble = $('#heroBubble'), hTyping = $('#heroTyping'), hMsg = $('#heroMsg');
  const hSignal = $('#heroSignal'), hPath = $('#heroPath');
  let heroTl = null, heroVisible = true;

  function rel(el) {
    const s = scene.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }
  function computePath() {
    const ring = rel($('.ring', hr));
    const b = rel(hBubble);
    const x1 = ring.x + ring.w / 2, y1 = ring.y + ring.h / 2;
    const x2 = b.x + 18, y2 = b.y + 26;
    const cx = (x1 + x2) / 2 + 30, cy = Math.min(y1, y2) - 120;
    hPath.setAttribute('d', `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`);
  }
  function placeSignal(t) {
    const len = hPath.getTotalLength();
    const p = hPath.getPointAtLength(len * t);
    gsap.set(hSignal, { x: p.x - 6, y: p.y - 6 });
  }
  function heroReset() {
    gsap.set(hq, { autoAlpha: 1, x: 0 }); hq.classList.add('is-on');
    gsap.set(hr, { autoAlpha: 0, x: 24 }); hr.classList.remove('is-on');
    $$('.opt', hq).forEach((o) => o.classList.remove('is-sel', 'is-ok'));
    gsap.set(hqFb, { opacity: 0, y: 10 });
    gsap.set(hqProg, { '--p': 0.93 });
    gsap.set(hrRing, { strokeDashoffset: 326.7 });
    hrNum.textContent = '0';
    gsap.set(hBubble, { autoAlpha: 0, y: 10, scale: 0.96 });
    hTyping.style.display = 'flex'; hMsg.style.display = 'none';
    gsap.set(hSignal, { autoAlpha: 0, scale: 0 });
    gsap.set(hPath, { opacity: 0 });
  }
  function heroCycle() {
    heroReset();
    const tl = gsap.timeline({ onComplete: () => { if (heroVisible) heroCycle(); else heroTl = null; } });
    heroTl = tl;
    tl.call(() => {
      const s = rel($('.phone__screen', $('#heroPhone')));
      const o = rel(hqRight);
      // tap position in screen coords (approx, phone rotated slightly)
      gsap.set(hqTap, { left: o.x - s.x + o.w * 0.62 - 18, top: o.y - s.y + o.h / 2 - 18 });
    }, null, 0.8)
      .fromTo(hqTap, { scale: 0.4, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.9)
      .call(() => hqRight.classList.add('is-sel'), null, 1.0)
      .call(() => { hqRight.classList.remove('is-sel'); hqRight.classList.add('is-ok'); }, null, 1.5)
      .to(hqFb, { opacity: 1, y: 0, duration: 0.45 }, 1.7)
      .to(hqProg, { '--p': 1, duration: 0.8, ease: 'power2.inOut' }, 2.6)
      .to(hq, { autoAlpha: 0, x: -24, duration: 0.45, ease: 'power2.in' }, 3.2)
      .call(() => hr.classList.add('is-on'), null, 3.3)
      .to(hr, { autoAlpha: 1, x: 0, duration: 0.5 }, 3.3)
      .to(hrRing, { strokeDashoffset: 21.8, duration: 1.0, ease: 'power2.out' }, 3.45)
      .to({ v: 0 }, { v: 14, duration: 1.0, ease: 'power2.out', onUpdate() { hrNum.textContent = Math.round(this.targets()[0].v); } }, 3.45)
      .call(() => { computePath(); placeSignal(0); }, null, 4.55)
      .to(hSignal, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, 4.6)
      .to(hPath, { opacity: 1, duration: 0.5 }, 4.75)
      .to({ t: 0 }, { t: 1, duration: 0.95, ease: 'power2.inOut', onUpdate() { placeSignal(this.targets()[0].t); } }, 4.8)
      .to(hSignal, { scale: 2.2, autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 5.72)
      .to(hBubble, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, 5.75)
      .call(() => { hTyping.style.display = 'none'; hMsg.style.display = 'block'; }, null, 6.4)
      .call(() => gsap.from(hMsg.children, { opacity: 0, y: 6, duration: 0.35, stagger: 0.08 }), null, 6.42)
      .to(hPath, { opacity: 0, duration: 0.6 }, 7.2)
      .to(hBubble, { autoAlpha: 0, y: -6, duration: 0.5, ease: 'power2.in' }, 9.0)
      .to(hr, { autoAlpha: 0, duration: 0.4 }, 9.1)
      .to({}, { duration: 0.1 }, 9.5);
  }
  heroCycle();
  ScrollTrigger.create({
    trigger: '.hero', start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { heroVisible = self.isActive; if (self.isActive && !heroTl) heroCycle(); if (heroTl) self.isActive ? heroTl.play() : heroTl.pause(); }
  });
  document.addEventListener('visibilitychange', () => { if (heroTl) document.hidden ? heroTl.pause() : heroTl.play(); });

  /* ---------- Marquee ---------- */
  const track = $('#marquee');
  track.innerHTML += track.innerHTML;
  if (window.lucide) lucide.createIcons();
  const mq = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  track.addEventListener('mouseenter', () => gsap.to(mq, { timeScale: 0, duration: 0.4 }));
  track.addEventListener('mouseleave', () => gsap.to(mq, { timeScale: 1, duration: 0.6 }));

  /* ---------- Pain dialog ---------- */
  ScrollTrigger.create({
    trigger: '#dialog', start: 'top 78%', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      $$('.say').forEach((s, i) => {
        const isKid = s.classList.contains('say--k');
        if (isKid) {
          const t = document.createElement('p');
          t.className = 'say say--k typing-say';
          t.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
          tl.call(() => { t.style.cssText = 'position:absolute;left:0;top:' + s.offsetTop + 'px;margin:0'; s.before(t); gsap.fromTo(t, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2 }); }, null, '+=0.15');
          tl.call(() => t.remove(), null, i === 5 ? '+=0.9' : '+=0.45');
        }
        tl.to(s, { opacity: 1, y: 0, duration: 0.32 }, isKid ? '>' : '+=0.25');
      });
      tl.call(() => $('#painMin').classList.add('is-flipped'), null, '-=0.1');
    }
  });

  /* ---------- How it works ---------- */
  const mm = gsap.matchMedia();
  const steps = $$('.step');
  const screens = $$('#howScreens .scr');
  const boardDigits = $$('.board__d');
  const times = ['1930', '1950', '1958', '2005'];
  const howBubble = $('#howBubble');
  let cur = -1;

  function setBoard(t) {
    boardDigits.forEach((d, i) => {
      if (d.textContent !== t[i]) {
        d.textContent = t[i];
        gsap.fromTo(d, { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      }
    });
  }
  function screenEnter(i, scr) {
    if (i === 1) {
      const opt = $$('.opt', scr)[1];
      opt.classList.remove('is-sel');
      gsap.fromTo($('.progress i', scr), { '--p': 0.35 }, { '--p': 0.6, duration: 1.2, ease: 'power2.inOut' });
      gsap.delayedCall(0.9, () => opt.classList.add('is-sel'));
    }
    if (i === 2) {
      const o = $$('.opt', scr);
      o.forEach((x) => x.classList.remove('is-rev', 'is-ok'));
      gsap.set($('.fb', scr), { opacity: 0, y: 10 });
      gsap.delayedCall(0.3, () => o[0].classList.add('is-rev'));
      gsap.delayedCall(0.7, () => o[1].classList.add('is-ok'));
      gsap.to($('.fb', scr), { opacity: 1, y: 0, duration: 0.45, delay: 0.9 });
    }
    if (i === 3) {
      const ring = $('.ring__fg', scr), num = $('.ring__num b', scr);
      gsap.fromTo(ring, { strokeDashoffset: 326.7 }, { strokeDashoffset: 43.6, duration: 1, ease: 'power2.out' });
      gsap.fromTo({ v: 0 }, { v: 0 }, { v: 13, duration: 1, onUpdate() { num.textContent = Math.round(this.targets()[0].v); } });
    }
  }
  function setStep(i) {
    if (i === cur) return;
    const prev = cur; cur = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    setBoard(times[i]);
    screens.forEach((s, k) => {
      if (k === i) {
        s.classList.add('is-on');
        gsap.fromTo(s, { autoAlpha: 0, x: prev < i ? 24 : -24 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out' });
        screenEnter(i, s);
      } else if (k === prev) {
        gsap.to(s, { autoAlpha: 0, x: prev < i ? -24 : 24, duration: 0.35, ease: 'power2.in', onComplete: () => s.classList.remove('is-on') });
      } else { s.classList.remove('is-on'); gsap.set(s, { autoAlpha: 0 }); }
    });
    if (i === 3) gsap.to(howBubble, { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.5, ease: 'back.out(1.7)' });
    else gsap.to(howBubble, { opacity: 0, y: 20, scale: 0.96, duration: 0.3 });
  }

  mm.add('(min-width: 1024px)', () => {
    const stage = $('#howStage');
    stage.classList.add('is-pinned');
    cur = -1; setStep(0);
    const line = $('.steps__line');
    const st = ScrollTrigger.create({
      trigger: stage, start: 'top top', end: '+=280%', pin: true, scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        setStep(Math.min(3, Math.floor(p * 4.4)));
        gsap.set('#stepsFill', { scaleY: p });
        gsap.set('#stepsSignal', { y: p * (line.offsetHeight - 12) });
      }
    });
    return () => { stage.classList.remove('is-pinned'); st.kill(); };
  });
  mm.add('(max-width: 1023px)', () => {
    const line = $('.steps__line');
    const st = ScrollTrigger.create({
      trigger: '.steps-wrap', start: 'top 70%', end: 'bottom 60%', scrub: 0.5,
      onUpdate: (self) => {
        gsap.set('#stepsFill', { scaleY: self.progress });
        gsap.set('#stepsSignal', { y: self.progress * (line.offsetHeight - 12) });
      }
    });
    const minis = $$('.step__mini');
    const tr = minis.map((m, i) => ScrollTrigger.create({
      trigger: m, start: 'top 80%', once: true,
      onEnter: () => screenEnter(i, $('.scr', m))
    }));
    steps.forEach((s) => s.classList.add('is-active'));
    return () => { st.kill(); tr.forEach((t) => t.kill()); };
  });

  /* ---------- Message entrance ---------- */
  gsap.set(msgBody, { opacity: 0 });
  ScrollTrigger.create({
    trigger: '.chat', start: 'top 75%', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.from(msgBubble, { y: 20, opacity: 0, duration: 0.5, ease: 'back.out(1.6)' })
        .to({}, { duration: 0.6 })
        .call(() => { msgTyping.style.display = 'none'; })
        .set(msgBody, { opacity: 1 })
        .from(msgBody.children, { opacity: 0, y: 8, duration: 0.4, stagger: 0.1 })
        .from('.notes li', { opacity: 0, x: -12, duration: 0.5, stagger: 0.12 }, '-=0.3');
    }
  });

  /* ---------- Method: anatomy ---------- */
  const callouts = $$('.callout');
  gsap.set(callouts, { opacity: 0.12 });
  gsap.set('.qcard .dot-n', { scale: 0 });
  const order = [1, 2, 3, 4, 5, 6];
  const anatTl = gsap.timeline({ scrollTrigger: { trigger: '#anat', start: 'top 70%', end: 'bottom 45%', scrub: 0.6 } });
  anatTl.to('.qcard__q', { y: -10, duration: 1 }, 0)
    .to('.qcard .opt:nth-child(1)', { y: -4, duration: 1 }, 0)
    .to('.qcard .opt:nth-child(3)', { y: 4, duration: 1 }, 0)
    .to('.qcard .opt:nth-child(4)', { y: 8, duration: 1 }, 0)
    .to('.qcard .fb', { y: 14, duration: 1 }, 0)
    .to('.qcard__lock', { y: 18, duration: 1 }, 0);
  order.forEach((n, i) => {
    const c = $(`.callout[data-n="${n}"]`);
    anatTl.to(c, { opacity: 1, duration: 0.5 }, 0.3 + i * 0.45);
    const dots = $$('.qcard .dot-n').filter((d) => d.textContent.trim() === String(n));
    anatTl.to(dots, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, 0.3 + i * 0.45);
  });

  gsap.from('.ladder__bar', { scaleY: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#ladder', start: 'top 80%', once: true } });
  ScrollTrigger.create({ trigger: '#bankGrid', start: 'top 82%', once: true, onEnter: () => shuffleBank(true) });

  /* ---------- Kid: flips & icons ---------- */
  ScrollTrigger.create({ trigger: '#flips', start: 'top 70%', once: true, onEnter: () => gsap.delayedCall(0.5, () => $$('.flip-card').forEach((f) => f.classList.add('is-flipped'))) });
  gsap.from('.theses li', { opacity: 0, y: 14, duration: 0.6, stagger: 0.08, scrollTrigger: { trigger: '.theses', start: 'top 82%', once: true } });

  /* ---------- Honest table ---------- */
  ScrollTrigger.create({
    trigger: '#honestTable', start: 'top 78%', once: true,
    onEnter: () => {
      const rows = $$('.ht__row');
      rows.forEach((r, i) => {
        const is = $('.ht__is', r), not = $('.ht__not', r);
        gsap.from(is, { opacity: 0, x: -10, duration: 0.5, delay: i * 0.14 });
        gsap.from(not, { opacity: 0, x: -10, duration: 0.5, delay: i * 0.14 + 0.15 });
        gsap.delayedCall(i * 0.14 + 0.75, () => not.classList.add('is-dim'));
      });
    }
  });

  /* ---------- Start ---------- */
  mm.add('(min-width: 861px)', () => {
    const t = gsap.fromTo('#startFill', { scaleX: 1, scaleY: 1 }, { scaleX: 0, ease: 'none', scrollTrigger: { trigger: '#startSteps', start: 'top 80%', end: 'bottom 55%', scrub: 0.5 } });
    return () => t.scrollTrigger && t.scrollTrigger.kill();
  });
  mm.add('(max-width: 860px)', () => {
    const t = gsap.fromTo('#startFill', { scaleY: 1, scaleX: 1 }, { scaleY: 0, ease: 'none', scrollTrigger: { trigger: '#startSteps', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 } });
    return () => t.scrollTrigger && t.scrollTrigger.kill();
  });
  ScrollTrigger.create({
    trigger: '#qr', start: 'top 80%', once: true,
    onEnter: () => {
      gsap.timeline({ delay: 0.3 })
        .set('.qr__scan', { opacity: 1, top: 0 })
        .to('.qr__scan', { top: '100%', duration: 1.1, ease: 'power1.inOut' })
        .to('.qr__scan', { opacity: 0, duration: 0.2 })
        .call(() => $('#qr').classList.add('is-done'));
    }
  });
  gsap.from('.start__steps li', { opacity: 0, y: 16, duration: 0.6, stagger: 0.12, scrollTrigger: { trigger: '#startSteps', start: 'top 82%', once: true } });

  /* ---------- Price ---------- */
  ScrollTrigger.create({
    trigger: '#pcard', start: 'top 75%', once: true,
    onEnter: () => {
      const n = $('#priceNum');
      gsap.fromTo({ v: 0 }, { v: 0 }, { v: 199, duration: 0.9, ease: 'power2.out', onUpdate() { n.textContent = Math.round(this.targets()[0].v); } });
      gsap.from('.pcard__kids span', { opacity: 0, x: -10, duration: 0.4, stagger: 0.08 });
      gsap.from('.pcard__list li', { opacity: 0, y: 8, duration: 0.45, stagger: 0.08, delay: 0.3 });
      gsap.fromTo('#pcard', { boxShadow: '0 0 0 0 rgba(70,86,200,0), 0 40px 80px -30px rgba(43,50,144,.0)' }, { boxShadow: '0 0 0 6px rgba(70,86,200,.06), 0 40px 80px -30px rgba(43,50,144,.35)', duration: 1.2 });
    }
  });

  /* ---------- FAQ ---------- */
  gsap.from('.acc__item', { opacity: 0, y: 10, duration: 0.5, stagger: 0.05, scrollTrigger: { trigger: '#acc', start: 'top 85%', once: true } });

  /* ---------- Final ---------- */
  const fTitle = $('#finalTitle');
  gsap.set('#finalBubble', { opacity: 0, y: 14, scale: 0.96 });
  ScrollTrigger.create({
    trigger: '#final', start: 'top 60%', once: true,
    onEnter: () => {
      gsap.timeline()
        .from(fTitle, { opacity: 0, y: 20, duration: 0.8 })
        .from('.final .lead', { opacity: 0, y: 12, duration: 0.6 }, '-=0.5')
        .set('#finalSignal', { opacity: 1, y: 0, scale: 1 })
        .to('#finalSignal', { y: 112, duration: 0.9, ease: 'power2.in' })
        .to('#finalSignal', { scale: 2.4, opacity: 0, duration: 0.3 })
        .to('#finalBubble', { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.25')
        .fromTo('.final__lamp', { scale: 0.85, opacity: 0.6 }, { scale: 1.05, opacity: 1, duration: 1.6, ease: 'sine.inOut' }, '-=0.6')
        .fromTo('.final .btns > *, .final .caption', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=1.2');
    }
  });

  addEventListener('load', () => ScrollTrigger.refresh());

  /* ================= Builders ================= */
  function screenHTML(i) {
    if (i === 0) return `<div class="scr" data-i="0">
      <p class="nav-path">7 класс <i data-lucide="chevron-right"></i> География</p>
      <h4>География</h4>
      <ul class="list">
        <li><div>§ 10. Атмосфера<small>15 вопросов</small></div><i data-lucide="chevron-right"></i></li>
        <li><div>§ 11. Погода<small>15 вопросов</small></div><i data-lucide="chevron-right"></i></li>
        <li class="is-hi"><div>§ 12. Климат<small>15 вопросов</small></div><i data-lucide="chevron-right"></i></li>
        <li><div>§ 13. Климатические пояса<small>15 вопросов</small></div><i data-lucide="chevron-right"></i></li>
      </ul></div>`;
    if (i === 1) return `<div class="scr" data-i="1">
      <div class="q-meta"><span>География · Климат</span><span>Вопрос 7 из 15</span></div>
      <div class="progress"><i style="--p:.47"></i></div>
      <p class="q-text">Как называются ветры, которые меняют направление по сезонам?</p>
      <ul class="opts"><li class="opt"><b>A</b>Пассаты</li><li class="opt is-sel"><b>B</b>Муссоны</li><li class="opt"><b>C</b>Бризы</li><li class="opt"><b>D</b>Западные ветры</li></ul></div>`;
    if (i === 2) return `<div class="scr" data-i="2">
      <div class="q-meta"><span>География · Климат</span><span>Вопрос 11 из 15</span></div>
      <div class="progress"><i style="--p:.73"></i></div>
      <p class="q-text">Почему зимой у моря теплее, чем в глубине материка?</p>
      <ul class="opts"><li class="opt is-rev"><b>A</b>Над морем чаще светит солнце</li><li class="opt is-ok"><b>B</b>Вода остывает медленнее суши</li><li class="opt"><b>C</b>Морская вода не замерзает</li></ul>
      <div class="fb fb--review"><i data-lucide="lightbulb"></i><p>Неверно. Вода остывает медленнее суши и зимой отдаёт накопленное тепло воздуху.</p></div></div>`;
    return `<div class="scr scr--res" data-i="3">
      <p class="res-sub">География · Климат</p>
      <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="ring__bg"/><circle cx="60" cy="60" r="52" class="ring__fg" style="stroke:var(--indigo);stroke-dashoffset:43.6"/></svg><div class="ring__num"><b>13</b><span>из 15</span></div></div>
      <p class="res-title">Давай закрепим</p>
      <p class="res-note">2 вопроса стоит повторить</p>
      <div class="res-btns"><span class="mini-btn">Пройти ещё раз</span><span class="mini-btn mini-btn--ghost">К списку тестов</span></div></div>`;
  }
  function buildHowScreens() {
    const host = $('#howScreens');
    host.innerHTML = [0, 1, 2, 3].map(screenHTML).join('');
    $$('.step__mini').forEach((m, i) => {
      m.innerHTML = `<div class="phone"><div class="phone__notch"></div><div class="phone__screen">${screenHTML(i)}</div></div>`;
      $('.scr', m).classList.add('is-on');
    });
  }
  function buildFaq() {
    const qa = [
      ['Это ГДЗ?', 'Нет. Ответ не показывается, пока ребёнок не выберет свой. После ответа — объяснение, чтобы тема закрепилась, а не чтобы списать.'],
      ['Что, если ребёнок будет отвечать наугад?', 'Угадать хороший результат почти невозможно: неверные варианты похожи на правду, а правильный ответ не выдаёт себя формой. Если результат слабый, вы увидите это в сообщении, а тему можно пройти ещё раз — с другим набором вопросов.'],
      ['Мне нужно помнить предмет?', 'Нет. В сообщении есть вопросы, где была ошибка, и правильные ответы к ним. Этого достаточно, чтобы поговорить.'],
      ['Какие предметы и классы есть?', '5–9 классы: физика, биология, география, история и другие школьные предметы. Внутри — выбор класса, предмета и параграфа.'],
      ['Где это открывается?', 'В Telegram или MAX, через чат-бот. Ничего устанавливать не нужно. В обычном браузере приложение не откроется — так задумано ради безопасности.'],
      ['Может ли к ребёнку привязаться посторонний?', 'Нет. Привязка возможна, только если вы показали QR-код или приняли запрос по почте.'],
      ['Сколько детей можно подключить?', 'До трёх в одной подписке. У каждого ребёнка свои три бесплатных теста.'],
      ['Это гарантирует пятёрку?', 'Нет, и мы честно этого не обещаем. Сервис показывает, что параграф пройден и какие вопросы стоит повторить.'],
      ['Что с данными ребёнка?', 'Подробности попытки не хранятся: сообщение отправили — данные забыли. Для регистрации ребёнку не нужны ни почта, ни пароль.']
    ];
    $('#acc').innerHTML = qa.map(([q, a], i) => `<div class="acc__item">
      <h3><button class="acc__btn" aria-expanded="false" aria-controls="acc-${i}" id="accb-${i}">${q}<i data-lucide="chevron-down"></i></button></h3>
      <div class="acc__panel" id="acc-${i}" role="region" aria-labelledby="accb-${i}"><div><p>${a}</p></div></div></div>`).join('');
  }
  function buildQr() {
    const n = 25; let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let s = '';
    const finder = (x, y) => { s += `<rect x="${x}" y="${y}" width="7" height="7" rx="1.4" fill="#1B202B"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx=".8" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".6" fill="#1B202B"/>`; };
    const inF = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inF(x, y) && rnd() > 0.55) s += `<rect x="${x + .1}" y="${y + .1}" width=".8" height=".8" rx=".2" fill="#1B202B"/>`;
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    s += `<rect x="10" y="10" width="5" height="5" rx="1.2" fill="#fff"/><circle cx="12.5" cy="12.5" r="1.6" fill="#F47D62"/>`;
    $('#qrSvg').innerHTML = s;
  }
  function buildBank() {
    $('#bankGrid').innerHTML = Array.from({ length: 24 }, () => '<span class="bcard"></span>').join('');
  }
})();
