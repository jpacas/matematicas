# Calculus II — Mini-Lecciones ∫

Aplicación web para generar mini-lecciones de Cálculo 2 potenciadas por Claude AI, con renderizado profesional de ecuaciones matemáticas usando KaTeX.

## ✨ Features

- **159 lecciones** organizadas en 5 temas
- **KaTeX** para ecuaciones matemáticas profesionales
- **Streaming** en tiempo real mientras Claude genera la lección
- **Caché local** — las lecciones generadas se guardan en el navegador
- **Ejercicios interactivos** con respuestas ocultas (click para revelar)
- **Copiar lección** al portapapeles con un clic
- **Sin build step** — HTML/CSS/JS puro, corre en cualquier servidor estático

## 📁 Estructura

```
calculus2-lessons/
├── index.html     # Estructura principal
├── styles.css     # Estilos (dark academic theme)
├── app.js         # Lógica de la aplicación
├── lessons.js     # Catálogo de lecciones + demo pre-cargada
└── README.md
```

## 🚀 Deploy en GitHub Pages

1. Sube los archivos a un repositorio de GitHub
2. Ve a **Settings → Pages**
3. En "Source", selecciona **Deploy from a branch → main → / (root)**
4. Tu app estará en `https://TU_USUARIO.github.io/TU_REPO/`

## 💻 Correr localmente

```bash
# Con Python (recomendado)
python3 -m http.server 3000

# Con Node.js
npx serve .

# Luego abre http://localhost:3000
```

> ⚠️ Necesitas un servidor local (no abrir el HTML directo) porque la app hace fetch requests.

## 🔑 API Key

La app llama directamente a la API de Anthropic desde el navegador.

> **Para producción**, mueve la llamada a la API a un backend (Next.js, Express, Cloudflare Workers) para no exponer tu API key. Para uso personal o privado, el enfoque actual es suficiente.

## 📐 Temas cubiertos

| # | Tema | Lecciones |
|---|------|-----------|
| 1 | Técnicas de Integración | 36 |
| 2 | Aplicaciones de la Integración | 23 |
| 3 | Ecuaciones Paramétricas y Polares | 13 |
| 4 | Sucesiones y Series | 35 |
| 5 | Ecuaciones Diferenciales | 18 |

## 🛠 Pre-cargar lecciones (opcional)

Para evitar llamadas a la API, puedes pre-generar lecciones y agregarlas al objeto `PRELOADED` en `lessons.js`:

```js
const PRELOADED = {
  "1.5.1": { /* Integration by Parts — ya incluida */ },
  "4.23.3": {
    objective: "...",
    concept: ["...", "..."],
    formulas: [{ label: "...", math: "$$...$$", name: "..." }],
    // ...
  }
};
```

## 🎨 Stack

- **HTML / CSS / Vanilla JS** — sin frameworks, sin build step
- **KaTeX 0.16.9** — renderizado de ecuaciones LaTeX
- **Claude Sonnet** — generación de lecciones
- **Google Fonts** — Playfair Display + Source Serif 4

---

Made with ∫ and Claude AI
