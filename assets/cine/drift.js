// Things that drift in the air over a section: dandelion seeds, dust in the light, snow, embers.
// A 2D canvas laid over the host; the wind is a slow noise field, the pointer pushes particles
// aside and fast scrolling lifts them.
//
//   <section data-cine-drift="seeds" data-count="60" data-color="#ffffff">…</section>
//
// Kinds: seeds | dust | snow | embers. Pauses off screen; draws a still frame under reduced motion.

import { clamp, toRGB } from './util.js';

const KINDS = {
  seeds: { count: 55, size: [6, 14], speed: 0.55, rise: -0.06, color: '#fffaf0', glow: 0 },
  dust: { count: 140, size: [0.6, 2.2], speed: 0.18, rise: -0.02, color: '#ffe9c4', glow: 0.6 },
  snow: { count: 160, size: [1, 3.4], speed: 0.35, rise: 0.55, color: '#ffffff', glow: 0 },
  embers: { count: 70, size: [0.8, 2.6], speed: 0.4, rise: -0.7, color: '#ff8a3d', glow: 1 },
};

export function initDrift(root, env) {
  const undo = [];
  for (const host of root.querySelectorAll('[data-cine-drift]')) {
    const kind = KINDS[host.dataset.cineDrift] || KINDS.dust;
    const name = host.dataset.cineDrift in KINDS ? host.dataset.cineDrift : 'dust';
    const [cr, cg, cb] = toRGB(host.dataset.color || kind.color).map((v) => Math.round(v * 255));
    const canvas = document.createElement('canvas');
    canvas.className = 'cine-drift';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    const ctx = canvas.getContext('2d');
    let w = 1, h = 1, dpr = 1, parts = [], raf = 0, visible = false, t = 0, last = 0;
    const pointer = { x: -1e4, y: -1e4 };
    let lift = 0, lastScroll = window.scrollY;

    const make = (fresh) => {
      const s = kind.size[0] + Math.random() * (kind.size[1] - kind.size[0]);
      return { x: Math.random() * w, y: fresh ? Math.random() * h : (kind.rise < 0 ? h + 20 : -20), s, a: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.02, vx: 0, vy: 0, z: 0.4 + Math.random() * 0.6 };
    };
    const resize = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const n = Math.round((parseInt(host.dataset.count, 10) || kind.count) * clamp((w * h) / (1440 * 900), 0.35, 1.4) * (env.coarse ? 0.6 : 1));
      parts = Array.from({ length: n }, () => make(true));
      draw();
    };
    const wind = (x, y) => Math.sin(x * 0.004 + t * 0.4) * 0.6 + Math.cos(y * 0.006 - t * 0.3) * 0.4;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const alpha = 0.35 + 0.65 * p.z;
        if (name === 'seeds') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.85})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, p.s * 0.9); ctx.lineTo(0, 0);
          for (let k = 0; k < 9; k++) {
            const ang = -Math.PI / 2 + (k - 4) * 0.32;
            ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * p.s * 0.7, Math.sin(ang) * p.s * 0.7);
          }
          ctx.stroke();
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.beginPath(); ctx.arc(0, p.s * 0.9, 0.9, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else {
          if (kind.glow) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4);
            g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.5 * kind.glow})`);
            g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 4, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(now - (last || now), 50) / 16.7;
      last = now;
      t += dt / 60;
      const sy = window.scrollY;
      lift = lift * 0.92 + (sy - lastScroll) * 0.02;
      lastScroll = sy;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = (1 - d2 / 14000) * 0.6; p.vx += (dx / Math.sqrt(d2 + 1)) * f; p.vy += (dy / Math.sqrt(d2 + 1)) * f; }
        p.vx = p.vx * 0.94 + wind(p.x, p.y) * kind.speed * 0.15 * p.z;
        p.vy = p.vy * 0.94 + (kind.rise * 0.08 - lift * 0.05) * p.z + Math.sin(t + i) * 0.01;
        p.x += (p.vx + kind.speed * 0.35 * p.z) * dt;
        p.y += p.vy * dt;
        p.a += p.spin * dt;
        if (p.x > w + 30 || p.x < -30 || p.y > h + 30 || p.y < -30) {
          Object.assign(p, make(false));
          if (p.x > w) p.x = -10;
        }
      }
      draw();
    };
    const sync = () => {
      const on = visible && !document.hidden && !env.reduced;
      if (on && !raf) { last = 0; raf = requestAnimationFrame(step); }
      if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const ro = new ResizeObserver(resize); ro.observe(host);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }); io.observe(host);
    const onMove = (e) => { const r = host.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    if (env.finePointer) window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', sync);
    resize();
    undo.push(() => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', sync); canvas.remove(); });
  }
  return () => undo.forEach((f) => f());
}
