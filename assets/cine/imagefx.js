// Pictures that react to the pointer with WebGL: a ripple and a split of the colour channels follow the
// pointer over the picture, and fade away when it leaves. One shared canvas for the whole page (it moves
// over whichever picture is under the pointer), so any number of pictures costs one WebGL context.
//
//   <img src="foto.webp" alt="…" data-cine-distort>              (same-origin pictures only)
//   data-cine-distort="0.6" sets the strength (0–1).
//
// Fine pointers only; nothing under reduced motion. The <img> itself stays in the page underneath.

import { compile, uniforms, damp, lerp } from './util.js';

const VS = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FS = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCover;      // scale for object-fit: cover
uniform vec2 uMouse;      // 0–1 in the picture
uniform float uAmt;       // 0–1 strength, eased
uniform float uTime;
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  vec2 d = vUv - uMouse;
  float dist = length(d * vec2(1.0, uCover.x / uCover.y));
  float wave = sin(dist * 38.0 - uTime * 5.0) * exp(-dist * 6.0);
  vec2 off = normalize(d + 1e-4) * wave * 0.018 * uAmt;
  float split = 0.006 * uAmt * exp(-dist * 3.0);
  float r = texture2D(uTex, uv + off + vec2(split, 0.0)).r;
  float g = texture2D(uTex, uv + off).g;
  float b = texture2D(uTex, uv + off - vec2(split, 0.0)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

export function initImageFx(root, env) {
  const imgs = [...root.querySelectorAll('img[data-cine-distort]')];
  if (!imgs.length || !env.finePointer || env.reduced) return () => {};
  const canvas = document.createElement('canvas');
  canvas.className = 'cine-distort';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  if (!gl) return () => {};
  let prog;
  try { prog = compile(gl, VS, FS); } catch (e) { console.warn('[cine] distort:', e.message); return () => {}; }
  document.body.append(canvas);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  const u = uniforms(gl, prog, ['uTex', 'uCover', 'uMouse', 'uAmt', 'uTime']);
  const textures = new Map();
  let current = null, amt = 0, target = 0, raf = 0, last = 0;
  const mouse = [0.5, 0.5], mouseT = [0.5, 0.5];

  const texFor = (img) => {
    if (textures.has(img)) return textures.get(img);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch { return null; }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures.set(img, t);
    return t;
  };

  const frame = (now) => {
    const dt = last ? Math.min(now - last, 100) : 16.7;
    last = now;
    amt = lerp(amt, target, damp(0.08, dt));
    mouse[0] = lerp(mouse[0], mouseT[0], damp(0.2, dt));
    mouse[1] = lerp(mouse[1], mouseT[1], damp(0.2, dt));
    if (!current || amt < 0.01 && target === 0) {
      canvas.classList.remove('is-on');
      raf = 0; last = 0;
      return;
    }
    const r = current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.transform = `translate(${r.left}px, ${r.top}px)`;
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const ia = current.naturalWidth / current.naturalHeight, ra = r.width / r.height;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, textures.get(current));
    gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uCover, ra > ia ? 1 : ra / ia, ra > ia ? ia / ra : 1);
    gl.uniform2f(u.uMouse, mouse[0], mouse[1]);
    gl.uniform1f(u.uAmt, amt * (parseFloat(current.dataset.cineDistort) || 1));
    gl.uniform1f(u.uTime, now / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.classList.add('is-on');
    raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const offs = [];
  for (const img of imgs) {
    const enter = () => { if (!img.complete || !texFor(img)) return; current = img; target = 1; wake(); };
    const move = (e) => { const r = img.getBoundingClientRect(); mouseT[0] = (e.clientX - r.left) / r.width; mouseT[1] = 1 - (e.clientY - r.top) / r.height; };
    const leave = () => { target = 0; wake(); };
    img.addEventListener('pointerenter', enter);
    img.addEventListener('pointermove', move, { passive: true });
    img.addEventListener('pointerleave', leave);
    offs.push(() => { img.removeEventListener('pointerenter', enter); img.removeEventListener('pointermove', move); img.removeEventListener('pointerleave', leave); });
  }
  // the canvas sits over the picture but lets the pointer through to it
  return () => { cancelAnimationFrame(raf); offs.forEach((f) => f()); canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); };
}
