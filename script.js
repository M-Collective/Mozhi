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

