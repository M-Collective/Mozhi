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
