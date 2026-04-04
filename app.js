/* app.js — Calculus II Mini-Lecciones */

/* ── Constants ─────────────────────────────────────────────── */
const SECTION_META = {
  "🎯 Objetivo":             { color: "#d4a843", accent: "#d4a843" },
  "💡 Concepto":             { color: "#6baed6", accent: "#6baed6" },
  "🔑 Definiciones":         { color: "#52c97a", accent: "#52c97a" },
  "📐 Fórmulas Clave":       { color: "#f48fb1", accent: "#f48fb1" },
  "✏️ Ejemplos Resueltos":   { color: "#b39ddb", accent: "#b39ddb" },
  "🏋️ Ejercicios de Práctica": { color: "#ffd54f", accent: "#ffd54f" },
  "✅ Soluciones":            { color: "#4db6ac", accent: "#4db6ac" },
  "📝 Resumen":              { color: "#e8935a", accent: "#e8935a" },
};

const SECTION_HEADERS = Object.keys(SECTION_META);

/* ── State ──────────────────────────────────────────────────── */
let activeLesson = null;
let generatedCache = {}; // { lessonId: rawText }
let isGenerating = false;

/* ── Load cache from localStorage ───────────────────────────── */
try {
  const saved = localStorage.getItem("calc2_lessons");
  if (saved) generatedCache = JSON.parse(saved);
} catch (_) {}

function saveCache() {
  try { localStorage.setItem("calc2_lessons", JSON.stringify(generatedCache)); } catch (_) {}
}

/* ── DOM refs ───────────────────────────────────────────────── */
const $nav          = document.getElementById("lessonNav");
const $search       = document.getElementById("search");
const $count        = document.getElementById("lessonCount");
const $emptyState   = document.getElementById("emptyState");
const $lessonView   = document.getElementById("lessonView");
const $heroTag      = document.getElementById("heroTag");
const $heroTitle    = document.getElementById("heroTitle");
const $heroMeta     = document.getElementById("heroMeta");
const $heroProgress = document.getElementById("heroProgress");
const $progressFill = document.getElementById("progressFill");
const $btnGenerate  = document.getElementById("btnGenerate");
const $btnCopy      = document.getElementById("btnCopy");
const $streamPreview= document.getElementById("streamPreview");
const $streamText   = document.getElementById("streamText");
const $errorBox     = document.getElementById("errorBox");
const $lessonContent= document.getElementById("lessonContent");

/* ══════════════════════════════════════════════════════════════
   SIDEBAR — build lesson navigation
══════════════════════════════════════════════════════════════ */
function buildNav(filter = "") {
  $nav.innerHTML = "";
  let total = 0, visible = 0;

  TOPICS.forEach(topic => {
    const filtered = filter
      ? topic.lessons.filter(l =>
          l.name.toLowerCase().includes(filter) ||
          l.id.includes(filter)
        )
      : topic.lessons;

    total += topic.lessons.length;
    visible += filtered.length;
    if (filtered.length === 0) return;

    const group = document.createElement("div");
    group.className = "topic-group";

    const header = document.createElement("div");
    header.className = "topic-header";
    header.innerHTML = `
      <div class="topic-left">
        <span class="topic-icon">${topic.icon}</span>
        <span class="topic-label">${topic.label}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <span class="topic-badge">${filtered.length}</span>
        <span class="topic-chevron">▾</span>
      </div>`;
    header.addEventListener("click", () => group.classList.toggle("collapsed"));

    const list = document.createElement("div");
    list.className = "topic-lessons";

    filtered.forEach(lesson => {
      const item = document.createElement("div");
      item.className = "lesson-item" + (activeLesson?.id === lesson.id ? " active" : "");
      item.dataset.id = lesson.id;
      item.innerHTML = `
        <span class="lesson-id">${lesson.id}</span>
        <span class="lesson-name">${highlightMatch(lesson.name, filter)}</span>`;
      item.addEventListener("click", () => selectLesson(lesson, topic));
      list.appendChild(item);
    });

    group.appendChild(header);
    group.appendChild(list);
    $nav.appendChild(group);
  });

  $count.textContent = filter
    ? `${visible} resultado${visible !== 1 ? "s" : ""} de ${total}`
    : `${total} lecciones`;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(re, '<mark style="background:rgba(212,168,67,.25);color:#e8d8b8;border-radius:2px">$1</mark>');
}

/* ── Search ─────────────────────────────────────────────────── */
$search.addEventListener("input", () => buildNav($search.value.trim().toLowerCase()));

/* ══════════════════════════════════════════════════════════════
   LESSON SELECTION
══════════════════════════════════════════════════════════════ */
function selectLesson(lesson, topic) {
  if (isGenerating) return;
  activeLesson = lesson;

  // update nav active state
  document.querySelectorAll(".lesson-item").forEach(el => {
    el.classList.toggle("active", el.dataset.id === lesson.id);
  });

  // show lesson view
  $emptyState.style.display = "none";
  $lessonView.style.display = "flex";

  // populate hero
  $heroTag.textContent = `Calculus II · ${lesson.id}`;
  $heroTitle.textContent = lesson.name;
  $heroMeta.innerHTML = `
    <span>📚 ${topic.label}</span>
    <span>⏱ 15–20 min</span>
    <span>🏋️ Ejercicios incluidos</span>`;

  // reset panels
  $streamPreview.style.display = "none";
  $errorBox.style.display = "none";
  $heroProgress.style.display = "none";
  $btnGenerate.disabled = false;
  $btnGenerate.innerHTML = '<span class="btn-icon">✨</span><span class="btn-label">Generar Lección</span>';

  // show preloaded or cached content
  if (PRELOADED[lesson.id]) {
    renderPreloaded(lesson.id);
    $btnCopy.style.display = "flex";
  } else if (generatedCache[lesson.id]) {
    renderParsed(parseSections(generatedCache[lesson.id]));
    $btnCopy.style.display = "flex";
  } else {
    $lessonContent.innerHTML = "";
    $btnCopy.style.display = "none";
  }
}

/* ══════════════════════════════════════════════════════════════
   RENDER — Pre-loaded structured data
══════════════════════════════════════════════════════════════ */
function renderPreloaded(id) {
  const d = PRELOADED[id];
  $lessonContent.innerHTML = "";

  // Objective
  $lessonContent.appendChild(sectionCard(
    "🎯 Objetivo",
    `<div class="objective-text">${d.objective}</div>`
  ));

  // Concept
  const conceptHTML = `
    <div class="concept-body">
      ${d.concept.map((p, i) => {
        if (i === 0) return `<div class="analogy-pull">${p}</div>`;
        return `<p>${p}</p>`;
      }).join("")}
      ${d.analogy ? `<div class="analogy-pull">${d.analogy}</div>` : ""}
    </div>`;
  $lessonContent.appendChild(sectionCard("💡 Concepto", conceptHTML));

  // Definitions
  const defHTML = `<ul class="def-list">${d.definitions.map((def, i) => `
    <li class="def-item">
      <div class="def-num">${i + 1}</div>
      <div class="def-body"><span class="def-term">${def.term}:</span> ${def.def}</div>
    </li>`).join("")}</ul>`;
  $lessonContent.appendChild(sectionCard("🔑 Definiciones", defHTML));

  // Formulas
  const fmlHTML = `<div class="formula-grid">${d.formulas.map(f => `
    <div class="formula-block">
      <div class="formula-label">${f.label}</div>
      ${f.math}
      ${f.name ? `<div class="formula-name">${f.name}</div>` : ""}
    </div>`).join("")}</div>`;
  $lessonContent.appendChild(sectionCard("📐 Fórmulas Clave", fmlHTML));

  // Examples
  const exHTML = `<div class="examples-list">${d.examples.map(ex => `
    <div class="example-card">
      <div class="example-card-header">
        <span class="example-label">${ex.label}</span>
        <span class="difficulty diff-${ex.diff}">${ex.diffLabel}</span>
      </div>
      <div class="example-problem">${ex.problem}</div>
      <div class="example-solution">
        ${ex.steps.map((s, i) => `
          <div class="step${ex.isResult?.[i] ? " result-step" : ""}">
            <span class="step-n">${ex.isResult?.[i] ? "→" : (i+1)+"."}</span>
            <span>${s}</span>
          </div>`).join("")}
      </div>
    </div>`).join("")}</div>`;
  $lessonContent.appendChild(sectionCard("✏️ Ejemplos Resueltos", exHTML));

  // Exercises
  const excsHTML = `<div class="exercises-grid">${d.exercises.map((e, i) => `
    <div class="exercise-item" id="exc_${id}_${i}">
      <div class="exercise-q" onclick="toggleExercise('exc_${id}_${i}')">
        <span class="ex-n">${i + 1}.</span>
        <span class="ex-text">${e.q}</span>
        <span class="ex-toggle">▾</span>
      </div>
      <div class="exercise-ans">${e.a}</div>
    </div>`).join("")}</div>`;
  $lessonContent.appendChild(sectionCard("🏋️ Ejercicios de Práctica", excsHTML));

  // Summary
  const sumHTML = `<ul class="summary-list">${d.summary.map(s => `
    <li class="summary-item">
      <div class="summary-dot"></div>
      <span>${s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</span>
    </li>`).join("")}</ul>`;
  $lessonContent.appendChild(sectionCard("📝 Resumen", sumHTML));

  // Footer
  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Calculus II · ${id} · Potenciado por Claude`;
  $lessonContent.appendChild(footer);

  triggerKaTeX();
}

/* ══════════════════════════════════════════════════════════════
   RENDER — Parsed sections from raw AI text
══════════════════════════════════════════════════════════════ */
function parseSections(text) {
  const pattern = new RegExp(
    `(${SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );
  const parts = text.split(pattern);
  const sections = [];
  let current = null;
  for (const part of parts) {
    if (SECTION_META[part]) {
      if (current) sections.push(current);
      current = { title: part, content: "" };
    } else if (current) {
      current.content += part;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function renderParsed(sections) {
  $lessonContent.innerHTML = "";
  if (!sections.length) return;

  sections.forEach(sec => {
    const meta = SECTION_META[sec.title] || { color: "#7a90a8", accent: "#7a90a8" };
    let bodyHTML = "";

    if (sec.title === "🏋️ Ejercicios de Práctica" || sec.title === "✅ Soluciones") {
      // parse numbered items
      const lines = sec.content.trim().split("\n").filter(l => l.trim());
      const items = [];
      lines.forEach(line => {
        const m = line.match(/^\s*(\d+)[.)]\s+(.+)/);
        if (m) items.push({ n: m[1], text: m[2].trim() });
      });

      if (sec.title === "🏋️ Ejercicios de Práctica") {
        bodyHTML = `<div class="exercises-grid">${items.map((it, i) => `
          <div class="exercise-item" id="ex_gen_${i}">
            <div class="exercise-q" onclick="toggleExercise('ex_gen_${i}')">
              <span class="ex-n">${it.n}.</span>
              <span class="ex-text">${it.text}</span>
              <span class="ex-toggle">▾</span>
            </div>
            <div class="exercise-ans"><em>Ver soluciones ↓</em></div>
          </div>`).join("")}</div>`;
      } else {
        bodyHTML = `<ul class="summary-list">${items.map(it => `
          <li class="summary-item">
            <div class="summary-dot" style="background:#4db6ac"></div>
            <span>${it.n}. ${it.text}</span>
          </li>`).join("")}</ul>`;
      }
    } else if (sec.title === "📝 Resumen") {
      const lines = sec.content.trim().split("\n").filter(l => l.trim().match(/^[-•*]|\d+\./));
      const items = lines.map(l => l.replace(/^[-•*\d.]\s*/, "").trim());
      bodyHTML = `<ul class="summary-list">${items.map(it => `
        <li class="summary-item">
          <div class="summary-dot"></div>
          <span>${it}</span>
        </li>`).join("")}</ul>`;
    } else if (sec.title === "🎯 Objetivo") {
      bodyHTML = `<div class="objective-text">${sec.content.trim()}</div>`;
    } else {
      // generic: preserve paragraphs, convert **bold**
      const paras = sec.content.trim()
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .split(/\n{2,}/)
        .map(p => `<p style="margin-bottom:12px;font-size:15px;line-height:1.8;color:#9ab4c8">${p.trim()}</p>`);
      bodyHTML = `<div>${paras.join("")}</div>`;
    }

    $lessonContent.appendChild(sectionCard(sec.title, bodyHTML, meta.color));
  });

  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Calculus II · ${activeLesson?.id} · Generado por Claude`;
  $lessonContent.appendChild(footer);

  triggerKaTeX();
}

/* ── Build a section card ────────────────────────────────────── */
function sectionCard(title, bodyHTML, colorOverride) {
  const meta = SECTION_META[title] || { color: colorOverride || "#7a90a8" };
  const color = colorOverride || meta.color;
  const card = document.createElement("div");
  card.className = "section-card";
  card.innerHTML = `
    <div class="section-card-header">
      <div class="section-accent-bar" style="background:${color}"></div>
      <span class="section-card-title" style="color:${color}">${title}</span>
    </div>
    <div class="section-card-body">${bodyHTML}</div>`;
  return card;
}

/* ── Toggle exercise answer ─────────────────────────────────── */
function toggleExercise(id) {
  document.getElementById(id)?.classList.toggle("open");
}
window.toggleExercise = toggleExercise; // expose for inline onclick

/* ── Trigger KaTeX rendering ────────────────────────────────── */
function triggerKaTeX() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   API — Generate lesson with Claude (streaming)
══════════════════════════════════════════════════════════════ */
const PROMPT = (lesson) => `Eres un tutor experto en Cálculo 2. Genera una mini-lección de 15-20 minutos.

Lección: ${lesson.name} (ID: ${lesson.id})

IMPORTANTE: Usa notación LaTeX para todas las matemáticas:
- Inline: $\\int x\\,dx$, $f'(x)$, $\\frac{d}{dx}$
- Display: $$\\int_a^b f(x)\\,dx = F(b) - F(a)$$

Responde EXACTAMENTE con estas secciones en orden:

🎯 Objetivo
[1 oración que incluya la fórmula o concepto principal en LaTeX]

💡 Concepto
[Explicación con analogía del mundo real. Usa $LaTeX$ en las ecuaciones. 2-3 párrafos.]

🔑 Definiciones
[Definiciones numeradas. Incluye LaTeX donde aplique.]

📐 Fórmulas Clave
[Fórmulas en display math $$...$$. Con nombre de cada una.]

✏️ Ejemplos Resueltos
[4 ejemplos con dificultad creciente. Cada paso en LaTeX.
Formato:
Ejemplo 1: [enunciado en LaTeX]
Solución:
1. [paso]
2. [paso]
→ [resultado final en LaTeX]]

🏋️ Ejercicios de Práctica
[6 ejercicios numerados. Enunciados en LaTeX inline $...$]

✅ Soluciones
[Soluciones numeradas, respuesta final en LaTeX]

📝 Resumen
[4-5 bullets comenzando con - ]

Responde en español. Sé riguroso y didáctico.`;

$btnGenerate.addEventListener("click", async () => {
  if (!activeLesson || isGenerating) return;

  isGenerating = true;
  $btnGenerate.disabled = true;
  $btnGenerate.innerHTML = '<span class="btn-icon">⟳</span><span class="btn-label">Generando…</span>';
  $lessonContent.innerHTML = "";
  $streamPreview.style.display = "block";
  $streamText.textContent = "";
  $errorBox.style.display = "none";
  $btnCopy.style.display = "none";
  $heroProgress.style.display = "block";
  $progressFill.style.width = "5%";

  let fullText = "";
  const lessonId = activeLesson.id;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        stream: true,
        messages: [{ role: "user", content: PROMPT(activeLesson) }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let progress = 5;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data: ") || line.slice(6) === "[DONE]") continue;
        try {
          const p = JSON.parse(line.slice(6));
          if (p.delta?.text) {
            fullText += p.delta.text;
            $streamText.textContent = fullText;
            progress = Math.min(90, progress + 0.4);
            $progressFill.style.width = progress + "%";
          }
        } catch (_) {}
      }
    }

    // Save & render
    generatedCache[lessonId] = fullText;
    saveCache();

    $progressFill.style.width = "100%";
    setTimeout(() => {
      $heroProgress.style.display = "none";
      $streamPreview.style.display = "none";
      renderParsed(parseSections(fullText));
      $btnCopy.style.display = "flex";
    }, 400);

  } catch (err) {
    $errorBox.style.display = "block";
    $errorBox.textContent = `⚠️ ${err.message}`;
    $streamPreview.style.display = "none";
    $heroProgress.style.display = "none";
  } finally {
    isGenerating = false;
    $btnGenerate.disabled = false;
    $btnGenerate.innerHTML = '<span class="btn-icon">✨</span><span class="btn-label">Regenerar</span>';
  }
});

/* ── Copy to clipboard ───────────────────────────────────────── */
$btnCopy.addEventListener("click", () => {
  const text = $lessonContent.innerText;
  navigator.clipboard.writeText(text).then(() => {
    $btnCopy.classList.add("copied");
    $btnCopy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg> Copiado`;
    setTimeout(() => {
      $btnCopy.classList.remove("copied");
      $btnCopy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar`;
    }, 2000);
  });
});

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
buildNav();
