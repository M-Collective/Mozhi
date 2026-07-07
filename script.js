/* =====================================================================
   * Mozhi Collective — Script (Locked Scroll & Beige Collaborators)
   * High performance LERP scroll loop with vertical scroll-locking
   * ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Element Caching ───────────────────────────────────────────────
  const contactForm = document.getElementById('contact-form');

  /* ===================================================================
   * DRIFTING SUN LIGHT ANIMATION
   * =================================================================== */
  const t0 = Date.now();
  function animateSun() {
    const elapsed = Date.now() - t0;
    document.body.style.setProperty('--light-x', `${50 + 12 * Math.sin(elapsed / 12000)}%`);
    document.body.style.setProperty('--light-y', `${40 + 8 * Math.cos(elapsed / 15000)}%`);
    document.body.style.setProperty('--shadow-angle', `${45 + 20 * Math.sin(elapsed / 18000)}deg`);
    requestAnimationFrame(animateSun);
  }
  requestAnimationFrame(animateSun);

  /* ===================================================================
   * HERO POLAROID TILT EFFECT
   * =================================================================== */
  const tiltWrap = document.getElementById('tilt-wrap');
  const tiltCard = document.getElementById('tilt-card');
  if (tiltWrap && tiltCard) {
    let hovering = false;
    tiltWrap.addEventListener('mouseenter', () => {
      hovering = true;
      tiltCard.style.transition = 'transform 0.12s linear';
    });
    tiltWrap.addEventListener('mousemove', (e) => {
      if (!hovering) return;
      const rect = tiltWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      tiltCard.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 6}deg) scale(1.02)`;
    });
    tiltWrap.addEventListener('mouseleave', () => {
      hovering = false;
      tiltCard.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
      tiltCard.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    });
  }

  /* ===================================================================
   * INTERSECTION OBSERVER FOR IN-VIEW REVEALS
   * =================================================================== */
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.classList.add('in-view');
        target.querySelectorAll('[data-animate]').forEach(card => {
          if (card.closest('.series-zigzag-layout') || card.closest('.mission-scrolly-container')) return;
          card.classList.add('in-view');
        });
        sectionObserver.unobserve(target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.section').forEach(s => sectionObserver.observe(s));

  // Zigzag series rows reveal observer
  const zigzagRowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        zigzagRowObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.series-zigzag-row').forEach(row => zigzagRowObserver.observe(row));

  /* ===================================================================
   * SCROLL INTERACTION & LAYOUT CACHING
   * =================================================================== */
  const horizSection = document.getElementById('horizontal-scroll-section');
  const horizTrack = document.getElementById('horizontal-track');
  const seriesSection = document.getElementById('series');
  const zigzagDraw = document.getElementById('zigzag-path-draw');
  const missionSection = document.getElementById('mission');
  const missionPols = [document.querySelector('#mission .pol-2'), document.querySelector('#mission .pol-3')];

  const missionCard1 = document.getElementById('mission-card-1');
  const missionCard2 = document.getElementById('mission-card-2');
  const missionCard3 = document.getElementById('mission-card-3');
  const partnersSection = document.getElementById('services');

  const sections = document.querySelectorAll('section.section');
  const navLinksList = document.querySelectorAll('#navbar .nav-links a');
  const slideGlyphs = document.querySelectorAll('.horizontal-slide .slide-bg-glyph');
  const slidePhotos = document.querySelectorAll('.horizontal-slide .photo-mount-box');

  // HUD UI elements
  const gcSpan = document.querySelector('.gc-current');
  const gpFill = document.getElementById('gallery-progress-fill');
  const gHint = document.getElementById('gallery-scroll-hint');

  // ── Native LERP scroll animation states ────────────────────────────
  let currentHorizProgress = 0;
  let currentMissionProgress = 0;
  let currentZigzagProgress = 0;
  let prevScrollY = window.scrollY;
  let astrolabeRotation = 0;

  // LERP Targets, Slide Indices, and Locks
  let targetHorizProgress = 0;
  let targetMissionProgress = 0;

  let horizSlideIndex = 0;
  let missionSlideIndex = 0;

  let activeSection = 'none'; // 'none' | 'horizontal' | 'mission'
  let isScrollThrottled = false;
  const SCROLL_COOLDOWN = 600; // ms to throttle scroll wheels

  /* ===================================================================
   * NAVBAR SMOOTH SCROLL ROUTING
   * =================================================================== */
  navLinksList.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.replace('#', '');
        const target = document.getElementById(targetId);
        if (target) {
          activeSection = 'none';

          // Align scroll lock state indices based on destination section
          if (targetId === 'hero') {
            horizSlideIndex = 0; targetHorizProgress = 0;
            missionSlideIndex = 0; targetMissionProgress = 0;
          } else if (targetId === 'series' || targetId === 'scrapbook') {
            horizSlideIndex = 2; targetHorizProgress = 1;
            missionSlideIndex = 0; targetMissionProgress = 0;
          } else if (targetId === 'contact' || targetId === 'services') {
            horizSlideIndex = 2; targetHorizProgress = 1;
            missionSlideIndex = 2; targetMissionProgress = 1;
          }

          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ===================================================================
   * ACTIVE LINK SCROLLSPY
   * =================================================================== */
  function handleScrollSpy() {
    let activeId = '';
    const scrollY = window.scrollY;
    sections.forEach(sec => {
      const id = sec.getAttribute('id');
      if (!id) return;
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollY >= top - 250 && scrollY < top + height - 250) activeId = id;
    });
    if ((window.innerHeight + scrollY) >= document.documentElement.scrollHeight - 100) activeId = 'contact';
    navLinksList.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${activeId}`) link.classList.add('active');
    });
  }

  /* ===================================================================
   * INERTIAL ANIMATION LOOP (rAF)
   * =================================================================== */
  function runScrollUpdate() {
    const scrollY = window.scrollY;
    const deltaY = Math.abs(scrollY - prevScrollY);
    prevScrollY = scrollY;

    handleScrollSpy();

    // Astrolabe — passive continuous rotation driven by scroll speed
    astrolabeRotation += 0.06 + deltaY * 0.08;
    document.querySelectorAll('.logo-astrolabe').forEach(astro => {
      astro.style.transform = `rotate(${astrolabeRotation}deg)`;
    });

    // ── 1. Horizontal Gallery LERP ───────────────────────────────────
    if (horizSection && horizTrack) {
      if (activeSection === 'horizontal') {
        currentHorizProgress += (targetHorizProgress - currentHorizProgress) * 0.12;
      } else {
        const offsetTop = horizSection.offsetTop;
        const totalScroll = horizSection.scrollHeight - window.innerHeight;
        if (totalScroll > 0) {
          const rawProgress = (scrollY - offsetTop) / totalScroll;
          const progress = Math.min(Math.max(rawProgress, 0), 1);
          currentHorizProgress += (progress - currentHorizProgress) * 0.12;
          targetHorizProgress = currentHorizProgress;

          // Map native progress back to discrete indices for scroll lock sync
          horizSlideIndex = currentHorizProgress < 0.33 ? 0 : currentHorizProgress < 0.66 ? 1 : 2;
        }
      }

      horizTrack.style.transform = `translateX(-${currentHorizProgress * 200}vw)`;

      for (let i = 0; i < 3; i++) {
        const cp = i * 0.5;
        const d = currentHorizProgress - cp;
        if (slideGlyphs[i]) slideGlyphs[i].style.transform = `translate(-50%, -50%) translateX(${d * 24}vw)`;
        if (slidePhotos[i]) slidePhotos[i].style.transform = `translateX(${-d * 14}vw)`;
      }

      if (gcSpan) gcSpan.textContent = currentHorizProgress < 0.33 ? '01' : currentHorizProgress < 0.66 ? '02' : '03';
      if (gpFill) gpFill.style.width = `${currentHorizProgress * 100}%`;
      if (gHint) {
        if (currentHorizProgress > 0.02) gHint.classList.add('hidden');
        else gHint.classList.remove('hidden');
      }
    }

    // ── 2. Mission Scrollytelling LERP ───────────────────────────────
    if (missionSection) {
      if (activeSection === 'mission') {
        currentMissionProgress += (targetMissionProgress - currentMissionProgress) * 0.12;
      } else {
        const offsetTopM = missionSection.offsetTop;
        const totalScrollM = missionSection.scrollHeight - window.innerHeight;
        if (totalScrollM > 0) {
          const rawProgress = (scrollY - offsetTopM) / totalScrollM;
          const progress = Math.min(Math.max(rawProgress, 0), 1);
          currentMissionProgress += (progress - currentMissionProgress) * 0.12;
          targetMissionProgress = currentMissionProgress;

          // Map native progress back to discrete indices for scroll lock sync
          missionSlideIndex = currentMissionProgress < 0.33 ? 0 : currentMissionProgress < 0.66 ? 1 : 2;
        }
      }

      if (missionCard1 && missionCard2 && missionCard3) {
        let y1 = 0, scale1 = 1.0, z1 = 3;
