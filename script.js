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
