# CLAUDE.md: Adrian048.github.io (portfolio)

Contexto en `ContextoClaude/contexto-proyecto.md` (git-ignored) y en
`../ContextoClaude/contexto-general.md`.

- **Qué es:** el portfolio de Adrián, publicado con GitHub Pages en https://adrian048.github.io
  (`index.html`, español) y https://adrian048.github.io/en/ (`en/index.html`, inglés). **Las dos
  versiones tienen la misma estructura: cualquier cambio se hace en las dos.**
- **Sin build:** HTML, CSS y JS servidos tal cual. Efectos copiados de las skills propias
  `cinematic-web` (`assets/cine/`) y `scene-3d` (`assets/s3d/scene3d.js`, ya empaquetado con
  three.js 0.186.1). Si se mejoran las skills, se vuelven a copiar y se filma de nuevo.
- **Reglas:**
  - CSP estricta en un `<meta>` de cada página; nada de CDN, fuentes externas, `<script>` en línea ni
    atributos `style`. El CI (`.github/workflows/security.yml`) lo comprueba, junto con gitleaks;
  - contacto: email, teléfono (Adrián pidió publicarlo el 23/10/2026) y LinkedIn; GitHub va en el
    pie, no en contacto. El PDF del CV no se publica;
  - **sin nombres de empresas** en la experiencia (se describen: "consultora de ingeniería…");
  - la foto es opcional: `assets/img/foto.webp` (cuadrada); si no existe, no se ve nada.
- **Comprobar:** `node ~/.claude/skills/cinematic-web/scripts/film.mjs index.html --root .` (y lo mismo
  con `en/index.html`): escritorio, móvil y movimiento reducido, sin errores ni desbordamiento.
- **Un solo repo para los dos idiomas** y con este nombre (es el que publica en la raíz): no
  renombrarlo ni separarlo.
- **En local:** vista previa `portfolio` de `../.claude/launch.json` → http://127.0.0.1:9004.
- **Git lo maneja Adrián** (commits, push, merge), sin la línea `Co-Authored-By: Claude`. Habla en
  español con él.
