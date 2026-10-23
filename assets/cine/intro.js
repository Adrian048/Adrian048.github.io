// An opening: a count from 0 to 100 while the page loads, then the curtain opens in a circle from the
// centre onto the first screen. Once per visit (session); skipped under reduced motion.
//
//   <div class="cine-intro" data-cine-intro aria-hidden="true">
//     <p class="cine-intro__count" data-cine-intro-count>0</p>
//     <p class="cine-intro__name">Nombre</p>                 (anything else you want on the curtain)
//   </div>
//
// Put it first in <body>. Without script it is never shown (only .js shows it), and boot.js takes .js
// off if the kit fails to start, so the page can never stay covered.

export function initIntro(root, env) {
  const el = root.querySelector('[data-cine-intro]');
  if (!el) return () => {};
  let seen = false;
  try { seen = sessionStorage.getItem('cine-intro') === '1'; } catch {}
  if (env.reduced || seen) { el.remove(); return () => {}; }
  try { sessionStorage.setItem('cine-intro', '1'); } catch {}

  const count = el.querySelector('[data-cine-intro-count]');
  const min = parseFloat(el.dataset.duration) || 1600;
  const t0 = performance.now();
  let loaded = document.readyState === 'complete';
  const onLoad = () => { loaded = true; };
  window.addEventListener('load', onLoad, { once: true });
  document.documentElement.classList.add('cine-intro-on');

  let raf = 0;
  const tick = (now) => {
    // time drives the count to 90; the last 10 wait for the page to finish loading
    const byTime = Math.min(1, (now - t0) / min);
    const eased = 1 - Math.pow(1 - byTime, 3);
    const n = Math.round(loaded ? eased * 100 : Math.min(eased * 100, 90));
    if (count) count.textContent = String(n);
    if (n >= 100) {
      el.classList.add('is-opening');
      document.documentElement.classList.remove('cine-intro-on');
      window.setTimeout(() => el.remove(), 1100);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // never hold the page more than 5 s
  const giveUp = window.setTimeout(() => { loaded = true; }, 5000);
  return () => { cancelAnimationFrame(raf); clearTimeout(giveUp); window.removeEventListener('load', onLoad); el.remove(); document.documentElement.classList.remove('cine-intro-on'); };
}
