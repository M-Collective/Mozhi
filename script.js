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
        let y2 = 8, scale2 = 0.96, z2 = 2;
        let y3 = 16, scale3 = 0.92, z3 = 1;

        if (currentMissionProgress < 0.5) {
          // Phase 1: Card 1 flies to back
          const t1 = Math.min(Math.max(currentMissionProgress / 0.5, 0), 1);
          if (t1 < 0.5) {
            const ft1 = t1 / 0.5;
            y1 = 120 * ft1; // translate percentage out (positive translates down)
            scale1 = 1.0 - 0.08 * ft1;
            z1 = 3;
          } else {
            const ft1 = (t1 - 0.5) / 0.5;
            y1 = 120 * (1 - ft1);
            scale1 = 0.92;
            z1 = 1;
          }

          // Card 2 moves to top (y goes 8px -> 0px, scale 0.96 -> 1.0)
          y2 = 8 * (1 - t1);
          scale2 = 0.96 + 0.04 * t1;
          z2 = t1 < 0.5 ? 2 : 3;

          // Card 3 moves to middle (y goes 16px -> 8px, scale 0.92 -> 0.96)
          y3 = 16 - 8 * t1;
          scale3 = 0.92 + 0.04 * t1;
          z3 = t1 < 0.5 ? 1 : 2;

        } else {
          // Phase 2: Card 2 flies to back
          const t2 = Math.min(Math.max((currentMissionProgress - 0.5) / 0.5, 0), 1);

          // Card 1 starts at bottom (y=16px, scale=0.92) and moves to middle (y=8px, scale=0.96)
          y1 = 16 - 8 * t2;
          scale1 = 0.92 + 0.04 * t2;
          z1 = t2 < 0.5 ? 1 : 2;

          // Card 2
          if (t2 < 0.5) {
            const ft2 = t2 / 0.5;
            y2 = 120 * ft2; // translate percentage out (positive translates down)
            scale2 = 1.0 - 0.08 * ft2;
            z2 = 3;
          } else {
            const ft2 = (t2 - 0.5) / 0.5;
            y2 = 120 * (1 - ft2);
            scale2 = 0.92;
            z2 = 1;
          }

          // Card 3 moves to top (y goes 8px -> 0px, scale 0.96 -> 1.0)
          y3 = 8 * (1 - t2);
          scale3 = 0.96 + 0.04 * t2;
          z3 = t2 < 0.5 ? 2 : 3;
        }

        // Apply transforms to cards
        // Card 1
        if (currentMissionProgress < 0.5 && z1 === 1) {
          missionCard1.style.transform = `translateY(calc(${y1}% + 16px)) scale(${scale1}) rotate(-1.5deg)`;
        } else {
          missionCard1.style.transform = `translateY(${y1}px) scale(${scale1}) rotate(-1.5deg)`;
        }
        missionCard1.style.zIndex = z1;

        // Card 2
        if (currentMissionProgress >= 0.5 && z2 === 1) {
          missionCard2.style.transform = `translateY(calc(${y2}% + 16px)) scale(${scale2}) rotate(-1.5deg)`;
        } else {
          missionCard2.style.transform = `translateY(${y2}px) scale(${scale2}) rotate(-1.5deg)`;
        }
        missionCard2.style.zIndex = z2;

        // Card 3
        missionCard3.style.transform = `translateY(${y3}px) scale(${scale3}) rotate(-1.5deg)`;
        missionCard3.style.zIndex = z3;

        // Coordinate polaroids entry with the 45% overlap layout
        // pol-1 sits offset at -160px, pol-2 slides to 0px, pol-3 slides to 160px
        const t1_pol = Math.min(Math.max(currentMissionProgress / 0.45, 0), 1);
        const t2_pol = Math.min(Math.max((currentMissionProgress - 0.5) / 0.45, 0), 1);

        if (missionPols[0]) {
          missionPols[0].style.transform = `translateX(calc((1 - ${t1_pol}) * 80vw)) rotate(5deg)`;
          missionPols[0].style.opacity = t1_pol;
        }
        if (missionPols[1]) {
          missionPols[1].style.transform = `translateX(calc((1 - ${t2_pol}) * 80vw + ${t2_pol} * 160px)) rotate(-4deg)`;
          missionPols[1].style.opacity = t2_pol;
        }
      }
    }

    // ── 3. Zigzag Line Draw (slow LERP) ─────────────────────────────
    if (seriesSection && zigzagDraw) {
      const startDraw = seriesSection.offsetTop - window.innerHeight;
      const totalDrawScroll = (seriesSection.offsetTop + seriesSection.scrollHeight - window.innerHeight) - startDraw;
      const t = Math.min(Math.max((scrollY - startDraw) / totalDrawScroll, 0), 1);
      currentZigzagProgress += (t - currentZigzagProgress) * 0.04;
      zigzagDraw.style.strokeDashoffset = 1200 - currentZigzagProgress * 1200;
    }
  }

  function animLoop() {
    runScrollUpdate();
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);

  /* ===================================================================
   * DISCRETE SCROLL LOCKS (ONE SCROLL = ONE SLIDE / POLAROID)
   * Prevents skips, ensures intentional controlled slide transitions
   * =================================================================== */
  window.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 768) return;
    if (!horizSection || !missionSection) return;

    const scrollY = window.scrollY;
    const hTop = horizSection.offsetTop;
    const mTop = missionSection.offsetTop;

    if (activeSection === 'none') {
      // Enter Horizontal lock scrolling down
      if (e.deltaY > 0 && Math.abs(scrollY - hTop) < 25 && horizSlideIndex < 2) {
        activeSection = 'horizontal';
        window.scrollTo(0, hTop);
        e.preventDefault();
        return;
      }
      // Enter Horizontal lock scrolling up
      if (e.deltaY < 0 && Math.abs(scrollY - hTop) < 25 && horizSlideIndex > 0) {
        activeSection = 'horizontal';
        window.scrollTo(0, hTop);
        e.preventDefault();
        return;
      }

      // Enter Mission lock scrolling down
      if (e.deltaY > 0 && Math.abs(scrollY - mTop) < 25 && missionSlideIndex < 2) {
        activeSection = 'mission';
        window.scrollTo(0, mTop);
        e.preventDefault();
        return;
      }
      // Enter Mission lock scrolling up
      if (e.deltaY < 0 && Math.abs(scrollY - mTop) < 25 && missionSlideIndex > 0) {
        activeSection = 'mission';
