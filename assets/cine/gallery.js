// Galleries.
//
//   <div class="cine-coverflow" data-cine-coverflow tabindex="0" aria-roledescription="carrusel" aria-label="…">
//     <figure class="cine-coverflow__item"><img …><figcaption>…</figcaption></figure>   ×3–12
//   </div>
//   A 3D coverflow: the chosen picture faces you, the others turn away on both sides. Choose with a
//   click on a picture, ← → (when focused), or a horizontal drag. Each item gets --k (its offset from
//   the chosen one) and the CSS does the rest. Without script it is a row that scrolls sideways.
//
//   .cine-accordion (CSS only, in cine.css): a row of tall pictures; the one under the pointer or with
//   focus opens wide (galleries, team, cases).

export function initGallery(root, env) {
  const undo = [];
  for (const host of root.querySelectorAll('[data-cine-coverflow]')) {
    const items = [...host.querySelectorAll('.cine-coverflow__item')];
    if (!items.length) continue;
    const start = parseInt(host.dataset.start, 10);
    let active = Math.min(Number.isFinite(start) ? start : Math.floor((items.length - 1) / 2), items.length - 1);
    host.classList.add('is-live');
    const live = document.createElement('p');
    live.className = 'cine-sr';
    live.setAttribute('aria-live', 'polite');
    host.after(live);
    const render = (announce) => {
      items.forEach((it, i) => {
        const k = i - active;
        it.style.setProperty('--k', k);
        it.style.setProperty('--ak', Math.abs(k));
        it.classList.toggle('is-active', k === 0);
        it.setAttribute('aria-current', String(k === 0));
      });
      if (announce) live.textContent = items[active].querySelector('figcaption')?.textContent?.trim() || `${active + 1} / ${items.length}`;
    };
    const go = (i) => { active = Math.max(0, Math.min(items.length - 1, i)); render(true); };
    const onClick = (e) => { const it = e.target.closest('.cine-coverflow__item'); if (it && !moved) go(items.indexOf(it)); };
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { go(active - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(active + 1); e.preventDefault(); }
    };
    let startX = null, moved = false;
    const onDown = (e) => {
      if (e.button !== 0) return;
      startX = e.clientX; moved = false;
      // Without the capture and preventDefault the browser starts its native image drag (a ghost
      // picture follows the pointer) and pointermove stops arriving.
      if (e.pointerType === 'mouse') { e.preventDefault(); host.setPointerCapture(e.pointerId); }
    };
    const onMove = (e) => {
      if (startX === null) return;
      const d = e.clientX - startX;
      if (Math.abs(d) > 60) { go(active + (d < 0 ? 1 : -1)); startX = e.clientX; moved = true; }
    };
    const onUp = () => { startX = null; };
    const noDrag = (e) => e.preventDefault();
    host.addEventListener('click', onClick);
    host.addEventListener('keydown', onKey);
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('dragstart', noDrag);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    host.style.touchAction = 'pan-y';
    render(false);
    undo.push(() => {
      host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey);
      host.removeEventListener('pointerdown', onDown); host.removeEventListener('pointermove', onMove);
      host.removeEventListener('dragstart', noDrag); window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp); live.remove(); host.classList.remove('is-live');
    });
  }
  return () => undo.forEach((f) => f());
}
