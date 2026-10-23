// More text and type effects.
//
//   <span data-cine-scramble>Texto</span>    the letters decode from random glyphs when it enters the
//                                            screen, and again on hover (titles, labels, roles)
//   <h2 data-cine-imgtext="foto.webp">TERRA</h2>
//                                            giant type filled with a photograph; the picture drifts and
//                                            the word grows a little as it crosses the screen (uses --pv)
//   [data-cine-velocity]                     gets --vel (-1…1) from the scroll speed, eased, so CSS can
//                                            skew or speed things up while the page moves (marquees)

import { clamp, damp, lerp } from './util.js';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&$@*+=<>/';

function scramble(el, env) {
  const text = el.dataset.cineScrambleText ?? (el.dataset.cineScrambleText = el.textContent);
  if (env.reduced) { el.textContent = text; return; }
  const start = performance.now(), dur = Math.min(1200, 260 + text.length * 34);
  const tick = (now) => {
    const t = clamp((now - start) / dur);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === ' ' || i < Math.floor(t * text.length)) out += c;
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

export function initTextFx(root, env) {
  const offs = [];
  const els = [...root.querySelectorAll('[data-cine-scramble]')];
  els.forEach((el) => {
    el.setAttribute('aria-label', el.textContent);
    if (!el.closest('a, button')) return;
    const fn = () => scramble(el, env);
    el.closest('a, button').addEventListener('pointerenter', fn);
    offs.push(() => el.closest('a, button')?.removeEventListener('pointerenter', fn));
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { scramble(e.target, env); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));

  for (const el of root.querySelectorAll('[data-cine-imgtext]')) {
    el.style.backgroundImage = `url("${el.dataset.cineImgtext}")`;
    el.classList.add('cine-imgtext');
    if (!el.hasAttribute('data-cine-progress')) el.setAttribute('data-cine-progress', '');
  }

  const vels = [...root.querySelectorAll('[data-cine-velocity]')];
  if (vels.length && !env.reduced) {
    let lastY = window.scrollY, lastT = performance.now(), v = 0, raf = 0;
    const tick = (now) => {
      const dt = Math.min(now - lastT, 100) || 16.7;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY; lastT = now;
      const target = clamp(dy / dt / 3, -1, 1);
      v = lerp(v, target, damp(0.12, dt));
      vels.forEach((el) => el.style.setProperty('--vel', v.toFixed(3)));
      raf = Math.abs(v) > 0.002 || Math.abs(target) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(tick); } };
    window.addEventListener('scroll', wake, { passive: true });
    offs.push(() => { cancelAnimationFrame(raf); window.removeEventListener('scroll', wake); });
  }
  return () => { io.disconnect(); offs.forEach((f) => f()); };
}
