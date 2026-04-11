# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

```bash
python3 -m http.server 3000
# then open http://localhost:3000
```

Must be served via a local server (not opened as a file) because the app makes `fetch` requests to the Anthropic API.

## API Key

The app calls the Anthropic API directly from the browser. The `fetch` in `app.js` (`app.js:434`) must include an `x-api-key` header with a valid Anthropic API key. Currently the headers only include `Content-Type` — the key must be added manually for the app to work.

## Architecture

No build step, no framework, no dependencies to install. Four files:

- **`lessons.js`** — `TOPICS` array (159 lessons across 5 topics) and `PRELOADED` object (pre-structured lesson data, currently only `"1.5.1"`). Lesson IDs follow `{topic}.{section}.{lesson}` format (e.g., `"1.5.1"`).
- **`app.js`** — all application logic: sidebar nav, lesson selection, two render paths, streaming API call, and localStorage cache (`calc2_lessons`).
- **`index.html`** — static shell; loads KaTeX from CDN, then `lessons.js`, then `app.js`.
- **`styles.css`** — dark academic theme.

## Two render paths

1. **Preloaded** (`renderPreloaded`): structured JS objects in `PRELOADED` → rendered directly into typed HTML sections.
2. **AI-generated** (`renderParsed` + `parseGeneratedLessonContent`): raw text from Claude streaming → split on section emoji-headers defined in `SECTION_HEADERS` → rendered per section type.

## Adding pre-loaded lessons

Add entries to `PRELOADED` in `lessons.js` using the same structure as `"1.5.1"`. Fields: `objective`, `concept[]`, `analogy?`, `formulas[]`, `definitions[]`, `examples[]`, `exercises[]`, `summary[]`.

## KaTeX

Called via `triggerKaTeX()` after any render. Delimiters: `$...$` (inline) and `$$...$$` (display). Loaded deferred from CDN — `renderMathInElement` availability is checked at call time.
