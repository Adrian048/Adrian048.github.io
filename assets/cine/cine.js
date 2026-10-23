// cinematic-web kit: entry point. Load as a module from your own origin (CSP-safe, no dependencies):
//
//   <script src="kit/boot.js"></script>                 in <head>: marks .js before first paint
//   <script type="module" src="kit/cine.js"></script>
//
// It starts every effect it finds by its data attribute. In a framework, put data-cine-manual on <html>
// and call init(container) after mounting; it returns a function that undoes everything.

import { mq } from './util.js';
import { initSplit } from './split.js';
import { initReveal } from './reveal.js';
import { initScenes } from './scene.js';
import { initShaders } from './shader.js';
import { initPoints } from './points.js';
import { initPointer } from './pointer.js';
import { initSequences } from './sequence.js';
import { initTheme } from './theme.js';
import { initCursor } from './cursor.js';
import { initTextFx } from './textfx.js';
import { initIntro } from './intro.js';
import { initDrift } from './drift.js';
import { initGallery } from './gallery.js';
import { initImageFx } from './imagefx.js';

export function init(root = document) {
  const env = {
    reduced: mq('(prefers-reduced-motion: reduce)'),
    coarse: mq('(pointer: coarse)'),
    finePointer: mq('(hover: hover) and (pointer: fine)'),
  };
  const html = document.documentElement;
  html.classList.add('js');
  const undo = [initIntro, initSplit, initTextFx, initReveal, initTheme, initScenes, initShaders, initPoints, initSequences, initDrift, initGallery, initImageFx, initPointer, initCursor].map((fn) => {
    try {
      return fn(root, env);
    } catch (e) {
      console.error('[cine]', fn.name, e);
      return null;
    }
  });
  html.classList.add('cine-ready');
  return () => undo.forEach((fn) => fn && fn());
}

if (!document.documentElement.hasAttribute('data-cine-manual')) init();
