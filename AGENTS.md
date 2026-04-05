# Repository Guidelines

## Estructura del Proyecto

Este repositorio es una app web estática sin build step. Los archivos principales viven en la raíz: `index.html` carga la interfaz, `styles.css` define el tema visual, `app.js` contiene la lógica de navegación, render y llamadas a la API, y `lessons.js` guarda el catálogo de lecciones y el contenido precargado. Usa `README.md` para contexto funcional y `CLAUDE.md` para notas técnicas rápidas.

## Comandos de Desarrollo

Corre el proyecto con un servidor local; no abras `index.html` directamente.

```bash
python3 -m http.server 3000
```

Levanta un servidor estático en `http://localhost:3000`.

```bash
npx serve .
```

Alternativa equivalente si tienes Node.js instalado. No hay scripts de `npm`, pipeline de build ni instalación de dependencias.

## Estilo de Código y Convenciones

Mantén el proyecto en HTML, CSS y JavaScript vanilla. Sigue el estilo existente: nombres descriptivos, lógica agrupada por responsabilidad y cambios pequeños sobre los archivos actuales en vez de introducir estructura innecesaria. Conserva el formato de IDs de lección en `lessons.js` como `{tema}.{seccion}.{leccion}`, por ejemplo `1.5.1`. Si agregas contenido precargado, respeta la estructura usada en `PRELOADED`.

## Guía de Pruebas

Actualmente no hay suite automatizada. Verifica manualmente en navegador:

- navegación del sidebar
- render de lecciones precargadas y generadas
- ecuaciones con KaTeX
- caché en `localStorage`

Incluye en tus cambios pasos claros de validación manual y los resultados observados.

## Commits y Pull Requests

El historial actual usa mensajes cortos y descriptivos, por ejemplo `Primer borrador de proyecto`. Mantén commits breves, específicos y en modo imperativo cuando sea posible. En cada pull request incluye objetivo, archivos tocados, pruebas manuales realizadas y capturas si cambias UI o estilos.

## Seguridad y Configuración

No subas claves API al repositorio. La app llama a Anthropic desde el navegador; ese enfoque solo es aceptable para uso personal o privado. Si el proyecto se publica, mueve la integración a un backend.
