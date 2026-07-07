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
