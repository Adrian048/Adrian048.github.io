// Small page behaviour that is not part of the cinematic kit.

// The portrait is optional: it only shows once assets/img/foto.webp exists and has loaded. Without the
// file the profile section simply runs full width, with no empty frame or broken image.
for (const img of document.querySelectorAll('img.portrait')) {
  const show = () => img.classList.add('is-loaded');
  if (img.complete && img.naturalWidth > 0) show();
  else img.addEventListener('load', show, { once: true });
}
