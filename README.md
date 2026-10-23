# Adrián Hernández Zapata · portfolio

[![Security](https://github.com/Adrian048/Adrian048.github.io/actions/workflows/security.yml/badge.svg)](https://github.com/Adrian048/Adrian048.github.io/actions/workflows/security.yml)

Mi portfolio: **https://adrian048.github.io** (en inglés: **https://adrian048.github.io/en/**).

Desarrollador full stack en Madrid: aplicaciones web a medida, desarrollo seguro (OWASP) y
automatizaciones con IA.

## Cómo está hecho

- **HTML, CSS y JavaScript sin framework ni paso de build**: GitHub Pages sirve los ficheros tal cual.
- **Efectos propios**: shaders WebGL, escenas de scroll, cursor, coverflow y una escena 3D con
  three.js (empaquetado en local) donde las partículas pasan de un escudo a una red y a un servidor.
- **Seguridad**: CSP estricta en cada página (`script-src 'self'`, `style-src 'self'`), sin recursos
  de terceros, sin scripts ni estilos en línea. El CI lo comprueba en cada cambio, junto con gitleaks.
- **Accesible**: todo el contenido está en HTML, funciona con teclado y respeta
  `prefers-reduced-motion`.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` · `en/index.html` | La página en español y en inglés |
| `assets/css/site.css` | Estilos del portfolio |
| `assets/cine/` · `assets/s3d/` | Efectos y motor 3D (three.js 0.186.1, MIT) |
| `assets/img/` | Capturas del proyecto y, opcionalmente, `foto.webp` |
| `assets/fonts/` | Geist, autoalojada (SIL OFL) |

Para verlo en local: `python -m http.server 9004` en esta carpeta y abrir http://127.0.0.1:9004.

## Licencia

El código es MIT. Los textos y las imágenes son míos y no se pueden reutilizar.
