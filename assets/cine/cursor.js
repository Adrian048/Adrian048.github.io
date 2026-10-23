// The pointer as part of the page (fine pointers only; nothing under reduced motion).
//
//   <html data-cine-cursor>                   a custom cursor: a dot that follows exactly and a ring that
//                                             eases behind it; the ring grows over links and buttons and
//                                             shows a word over [data-cine-cursor-label="Ver"]
//   <div data-cine-trail="a.webp,b.webp,…">   pictures appear along the pointer's path inside the element
//                                             and fade out (portfolios, galleries, agencies)
//   <div data-cine-xray>                      two layers; the top one (.cine-xray__top) shows only inside a
//     <img …> <img class="cine-xray__top" …>  circle around the pointer (before/after, blueprint/photo,
//   </div>                                    code/product)
//
// Inputs, textareas and selects keep the system cursor.

import { damp, lerp } from './util.js';

export function initCursor(root, env) {
  if (!env.finePointer || env.reduced) return () => {};
  const offs = [];
  const on = (el, t, fn, o = { passive: true }) => { el.addEventListener(t, fn, o); offs.push(() => el.removeEventListener(t, fn, o)); };
  let raf = 0;

  // custom cursor
  const html = document.documentElement;
  if (html.hasAttribute('data-cine-cursor')) {
    const box = document.createElement('div');
    box.className = 'cine-cursor';
    box.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('span'); dot.className = 'cine-cursor__dot';
    const ring = document.createElement('span'); ring.className = 'cine-cursor__ring';
    const label = document.createElement('span'); label.className = 'cine-cursor__label';
    ring.append(label);
    box.append(ring, dot);
    document.body.append(box);
    html.classList.add('has-cine-cursor');
    const p = { x: -100, y: -100 }, r = { x: -100, y: -100 };
    let last = 0;
    const tick = (now) => {
      const dt = last ? Math.min(now - last, 100) : 16.7;
      last = now;
      const k = damp(0.2, dt);
      r.x = lerp(r.x, p.x, k); r.y = lerp(r.y, p.y, k);
      dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
      ring.style.transform = `translate(${r.x}px, ${r.y}px)`;
      raf = Math.abs(r.x - p.x) + Math.abs(r.y - p.y) > 0.3 ? requestAnimationFrame(tick) : ((last = 0), 0);
    };
    on(window, 'pointermove', (e) => {
      p.x = e.clientX; p.y = e.clientY;
      box.classList.add('is-on');
      const t = e.target.closest?.('a, button, [role="button"], [data-cine-cursor-label], summary, label');
      const native = e.target.closest?.('input, textarea, select');
      box.classList.toggle('is-hover', !!t && !native);
      box.classList.toggle('is-native', !!native);
      const word = t?.getAttribute('data-cine-cursor-label') || '';
      if (label.textContent !== word) label.textContent = word;
      box.classList.toggle('has-label', !!word);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    on(document, 'pointerleave', () => box.classList.remove('is-on'));
    on(window, 'pointerdown', () => box.classList.add('is-down'));
    on(window, 'pointerup', () => box.classList.remove('is-down'));
    offs.push(() => { box.remove(); html.classList.remove('has-cine-cursor'); });
  }

  // image trail
  for (const host of root.querySelectorAll('[data-cine-trail]')) {
    const srcs = host.dataset.cineTrail.split(',').map((s) => s.trim()).filter(Boolean);
    if (!srcs.length) continue;
    srcs.forEach((s) => { const i = new Image(); i.src = s; });   // warm the cache
    const gap = parseFloat(host.dataset.gap) || 90;
    let lastX = null, lastY = null, n = 0, alive = 0;
    on(host, 'pointermove', (e) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (lastX !== null && Math.hypot(x - lastX, y - lastY) < gap) return;
      lastX = x; lastY = y;
      if (alive > 12) return;
      const img = document.createElement('img');
      img.className = 'cine-trail__img';
      img.alt = '';
      img.src = srcs[n++ % srcs.length];
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      host.append(img);
      alive++;
      const rot = (Math.random() - 0.5) * 14;
      img.animate([
        { transform: `translate(-50%, -50%) scale(0.6) rotate(${rot}deg)`, opacity: 0 },
        { transform: `translate(-50%, -50%) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.18 },
        { transform: `translate(-50%, -40%) scale(0.92) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: 1100, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).finished.then(() => { img.remove(); alive--; });
    });
    on(host, 'pointerleave', () => { lastX = lastY = null; });
  }

  // x-ray reveal
  for (const host of root.querySelectorAll('[data-cine-xray]')) {
    const radius = parseFloat(host.dataset.cineXray) || 160;
    let target = 0, value = 0, last = 0, loop = 0;
    const step = (now) => {
      const dt = last ? Math.min(now - last, 100) : 16.7;
      last = now;
      value = lerp(value, target, damp(0.15, dt));
      host.style.setProperty('--xr', `${value.toFixed(1)}px`);
      loop = Math.abs(value - target) > 0.5 ? requestAnimationFrame(step) : ((last = 0), 0);
    };
    on(host, 'pointermove', (e) => {
      const r = host.getBoundingClientRect();
      host.style.setProperty('--mx', `${e.clientX - r.left}px`);
      host.style.setProperty('--my', `${e.clientY - r.top}px`);
      target = radius;
      if (!loop) loop = requestAnimationFrame(step);
    });
    on(host, 'pointerleave', () => { target = 0; if (!loop) loop = requestAnimationFrame(step); });
  }

  return () => { cancelAnimationFrame(raf); offs.forEach((f) => f()); };
}
