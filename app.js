/* app.js — Cálculo II Mini-Lecciones */

const IS_NODE = typeof module !== "undefined" && module.exports;
const IS_BROWSER = !IS_NODE && typeof window !== "undefined" && typeof document !== "undefined";

const LESSONS_API = IS_NODE
  ? require("./lessons.js")
  : window;

const {
  TOPICS,
  PRELOADED,
  getLessonById,
  getPrerequisites,
  getDependents,
  getRecommendedNext,
  getMissingPrerequisites,
} = LESSONS_API;

/* ── Constants ─────────────────────────────────────────────── */
const SECTION_META = {
  "🎯 Objetivo":             { color: "#8b6914", accent: "#8b6914" },
  "💡 Concepto":             { color: "#2563a8", accent: "#2563a8" },
  "🔑 Definiciones":         { color: "#2d7a4f", accent: "#2d7a4f" },
  "📐 Fórmulas Clave":       { color: "#b5486a", accent: "#b5486a" },
  "✏️ Ejemplos Resueltos":   { color: "#6b4f9e", accent: "#6b4f9e" },
  "🏋️ Ejercicios de Práctica": { color: "#b85c2a", accent: "#b85c2a" },
  "✅ Soluciones":            { color: "#2a7a72", accent: "#2a7a72" },
  "📝 Resumen":              { color: "#b85c2a", accent: "#b85c2a" },
  "🔢 Opción Múltiple":      { color: "#6b4f9e", accent: "#6b4f9e" },
};

const SECTION_HEADERS = Object.keys(SECTION_META);

/* ── State ──────────────────────────────────────────────────── */
let activeLesson = null;
let generatedCache = {}; // { lessonId: rawText }
let progressData  = {}; // { lessonId: { mastered, masteredAt, lastPracticed, practiceCount } }
let isGenerating = false;

function getPracticeFeedbackState(session = {}) {
  if (session.solved) return "correct";
  if ((session.attempts || 0) >= 2) return "walkthrough";
  if ((session.attempts || 0) >= 1) return "hint";
  return "idle";
}

function createLessonSessionState(lesson) {
  const blocks = Array.isArray(lesson?.blocks) ? lesson.blocks : [];
  return blocks.map(block => {
    if (block.type === "practice") {
      return {
        attempts: 0,
        completed: false,
        selectedChoice: null,
        solved: false,
      };
    }

    return { completed: false };
  });
}

function countCompletedBlocks(session = []) {
  return session.reduce((count, blockState = {}) => {
    return count + (blockState.completed || blockState.solved ? 1 : 0);
  }, 0);
}

/* ── Load cache & progress from localStorage ─────────────────── */
const storage = IS_BROWSER && typeof localStorage !== "undefined"
  ? localStorage
  : null;

try {
  const saved = storage?.getItem("calc2_lessons");
  if (saved) generatedCache = JSON.parse(saved);
} catch (_) {}

try {
  const saved = storage?.getItem("calc2_progress");
  if (saved) progressData = JSON.parse(saved);
} catch (_) {}

function saveCache() {
  try { storage?.setItem("calc2_lessons", JSON.stringify(generatedCache)); } catch (_) {}
}

function saveProgress() {
  try { storage?.setItem("calc2_progress", JSON.stringify(progressData)); } catch (_) {}
}

function ensureProgressEntry(id) {
  if (!progressData[id]) {
    progressData[id] = { mastered: false, masteredAt: null, lastPracticed: null, practiceCount: 0 };
  }
}

function recordPractice(id) {
  ensureProgressEntry(id);
  progressData[id].lastPracticed = new Date().toISOString().slice(0, 10);
  progressData[id].practiceCount++;
  saveProgress();
}

/* ── DOM refs ───────────────────────────────────────────────── */
const $nav               = IS_BROWSER ? document.getElementById("lessonNav") : null;
const $search            = IS_BROWSER ? document.getElementById("search") : null;
const $count             = IS_BROWSER ? document.getElementById("lessonCount") : null;
const $emptyState        = IS_BROWSER ? document.getElementById("emptyState") : null;
const $lessonView        = IS_BROWSER ? document.getElementById("lessonView") : null;
const $heroTag           = IS_BROWSER ? document.getElementById("heroTag") : null;
const $heroTitle         = IS_BROWSER ? document.getElementById("heroTitle") : null;
const $heroMeta          = IS_BROWSER ? document.getElementById("heroMeta") : null;
const $heroProgress      = IS_BROWSER ? document.getElementById("heroProgress") : null;
const $progressFill      = IS_BROWSER ? document.getElementById("progressFill") : null;
const $btnGenerate       = IS_BROWSER ? document.getElementById("btnGenerate") : null;
const $btnCopy           = IS_BROWSER ? document.getElementById("btnCopy") : null;
const $btnMastered       = IS_BROWSER ? document.getElementById("btnMastered") : null;
const $streamPreview     = IS_BROWSER ? document.getElementById("streamPreview") : null;
const $streamText        = IS_BROWSER ? document.getElementById("streamText") : null;
const $errorBox          = IS_BROWSER ? document.getElementById("errorBox") : null;
const $learningPathShell = IS_BROWSER ? document.getElementById("learningPathShell") : null;
const $lessonContent     = IS_BROWSER ? document.getElementById("lessonContent") : null;
const $progressOverlay   = IS_BROWSER ? document.getElementById("progressOverlay") : null;
const $progressStats     = IS_BROWSER ? document.getElementById("progressStats") : null;
const $progressTableWrap = IS_BROWSER ? document.getElementById("progressTableWrap") : null;
const $graphOverlay      = IS_BROWSER ? document.getElementById("graphOverlay") : null;
const $graphSummary      = IS_BROWSER ? document.getElementById("graphSummary") : null;
const $graphMapWrap      = IS_BROWSER ? document.getElementById("graphMapWrap") : null;
const $btnGraphOpen      = IS_BROWSER ? document.getElementById("btnGraphOpen") : null;
const $btnProgressOpen   = IS_BROWSER ? document.getElementById("btnProgressOpen") : null;
const $btnCloseProgress  = IS_BROWSER ? document.getElementById("btnCloseProgress") : null;
const $btnCloseGraph     = IS_BROWSER ? document.getElementById("btnCloseGraph") : null;
const $btnExportMd       = IS_BROWSER ? document.getElementById("btnExportMd") : null;

function getTopicByLessonId(id) {
  return TOPICS.find(topic => topic.lessons.some(lesson => lesson.id === id)) || null;
}

function getLessonState(id) {
  if (activeLesson?.id === id) return "active";
  if (progressData[id]?.mastered) return "mastered";
  if (progressData[id]?.practiceCount > 0) return "practiced";
  if ((getMissingPrerequisites(id, progressData) || []).length === 0) return "ready";
  return "pending";
}

function escapeHTML(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderLessonChip(id, extraClass = "") {
  const lesson = getLessonById(id);
  if (!lesson) return "";
  const state = getLessonState(id);
  return `
    <button class="lesson-chip-card ${extraClass} state-${state}" data-lesson-jump="${lesson.id}">
      <span class="lesson-chip-id">${lesson.id}</span>
      <span class="lesson-chip-title">${escapeHTML(lesson.name)}</span>
    </button>`;
}

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
      const masteredDot = progressData[lesson.id]?.mastered
        ? `<span class="mastered-dot" title="Dominado">★</span>` : "";
      item.innerHTML = `
        <span class="lesson-id">${lesson.id}</span>
        <span class="lesson-name">${highlightMatch(lesson.name, filter)}</span>
        ${masteredDot}`;
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
  return text.replace(re, '<mark style="background:rgba(139,105,20,.18);color:var(--text);border-radius:2px">$1</mark>');
}

/* ── Search ─────────────────────────────────────────────────── */
$search?.addEventListener("input", () => buildNav($search.value.trim().toLowerCase()));

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
  $heroTag.textContent = `Cálculo II · ${lesson.id}`;
  $heroTitle.textContent = lesson.name;
  $heroMeta.innerHTML = `
    <span>📚 ${topic.label}</span>
    <span>⏱ 15–20 min</span>
    <span>🏋️ Ejercicios incluidos</span>
    <span>🗺 Ruta guiada</span>`;

  // reset panels
  $streamPreview.style.display = "none";
  $errorBox.style.display = "none";
  $learningPathShell.style.display = "block";
  $heroProgress.style.display = "none";
  $btnGenerate.disabled = false;
  $btnGenerate.innerHTML = '<span class="btn-icon">✨</span><span class="btn-label">Generar Lección</span>';

  // show preloaded or cached content
  if (PRELOADED[lesson.id]) {
    renderPreloaded(lesson.id);
    renderLearningPathPanel();
    $btnCopy.style.display = "flex";
    $btnMastered.style.display = "flex";
    recordPractice(lesson.id);
    updateMasteredButton(lesson.id);
  } else if (generatedCache[lesson.id]) {
    renderParsed(parseSections(generatedCache[lesson.id]));
    renderLearningPathPanel();
    $btnCopy.style.display = "flex";
    $btnMastered.style.display = "flex";
    recordPractice(lesson.id);
    updateMasteredButton(lesson.id);
  } else {
    renderLearningPathPanel();
    $lessonContent.innerHTML = "";
    $btnCopy.style.display = "none";
    $btnMastered.style.display = "none";
  }
}

function updateMasteredButton(id) {
  const mastered = progressData[id]?.mastered;
  $btnMastered.classList.toggle("is-mastered", !!mastered);
  $btnMastered.querySelector(".btn-mastered-icon").textContent = mastered ? "★" : "☆";
  $btnMastered.querySelector(".btn-mastered-label").textContent = mastered ? "Dominado ✓" : "Marcar dominado";
}

function updateNavMasteredIndicators() {
  document.querySelectorAll(".lesson-item").forEach(el => {
    const id = el.dataset.id;
    const hasDot = !!el.querySelector(".mastered-dot");
    const shouldHave = !!progressData[id]?.mastered;
    if (shouldHave && !hasDot) {
      const dot = document.createElement("span");
      dot.className = "mastered-dot";
      dot.title = "Dominado";
      dot.textContent = "★";
      el.appendChild(dot);
    } else if (!shouldHave && hasDot) {
      el.querySelector(".mastered-dot").remove();
    }
  });
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

  // Multiple choice
  if (d.mcq && d.mcq.length) {
    const mcqCard = sectionCard("🔢 Opción Múltiple", '<div class="mcq-placeholder"></div>');
    $lessonContent.appendChild(mcqCard);
    renderMCQ(d.mcq, mcqCard.querySelector(".mcq-placeholder"));
  }

  // Footer
  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Cálculo II · ${id} · Contenido guiado por IA`;
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
            <div class="summary-dot" style="background:var(--teal)"></div>
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
    } else if (sec.title === "🔢 Opción Múltiple") {
      const parsed = parseMCQSection(sec.content);
      if (parsed.length) {
        const mcqCard = sectionCard(sec.title, '<div class="mcq-placeholder"></div>', meta.color);
        $lessonContent.appendChild(mcqCard);
        renderMCQ(parsed, mcqCard.querySelector(".mcq-placeholder"));
      }
      return; // skip normal append below
    } else {
      // generic: preserve paragraphs, convert **bold**
      const paras = sec.content.trim()
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .split(/\n{2,}/)
        .map(p => `<p style="margin-bottom:12px;font-size:15px;line-height:1.8;color:var(--text-dim)">${p.trim()}</p>`);
      bodyHTML = `<div>${paras.join("")}</div>`;
    }

    $lessonContent.appendChild(sectionCard(sec.title, bodyHTML, meta.color));
  });

  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Cálculo II · ${activeLesson?.id} · Generado con IA`;
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
if (IS_BROWSER) {
  window.toggleExercise = toggleExercise; // expose for inline onclick
}

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

function renderLearningPathPanel() {
  if (!activeLesson) {
    $learningPathShell.style.display = "none";
    $learningPathShell.innerHTML = "";
    return;
  }

  const prerequisites = getPrerequisites(activeLesson.id);
  const dependents = getDependents(activeLesson.id);
  const recommended = getRecommendedNext(activeLesson.id).filter(id => id !== activeLesson.id).slice(0, 4);
  const missing = getMissingPrerequisites(activeLesson.id, progressData);
  const prereqDone = prerequisites.length - missing.length;

  $learningPathShell.style.display = "block";
  $learningPathShell.innerHTML = `
    <section class="path-panel">
      <div class="path-panel-header">
        <div>
          <div class="path-panel-kicker">Ruta pedagógica</div>
          <h2 class="path-panel-title">Prerequisitos y siguiente paso</h2>
        </div>
        <button class="btn-copy btn-inline-secondary" id="btnOpenGraphInline" type="button">Ver mapa completo</button>
      </div>
      <div class="path-summary-row">
        <div class="path-summary-chip"><strong>${prereqDone}/${prerequisites.length}</strong><span> prerequisitos dominados</span></div>
        <div class="path-summary-chip"><strong>${dependents.length}</strong><span> contenidos que desbloquea</span></div>
        <div class="path-summary-chip"><strong>${recommended.length}</strong><span> siguientes sugeridos</span></div>
      </div>
      ${missing.length ? `<div class="path-alert">Antes de profundizar en <strong>${escapeHTML(activeLesson.name)}</strong>, conviene repasar: ${missing.map(id => escapeHTML(getLessonById(id)?.name || id)).join(", ")}.</div>` : `<div class="path-alert is-positive">Ya tienes cubiertos los prerrequisitos directos de esta lección.</div>`}
      <div class="path-graph">
        <div class="path-column">
          <div class="path-column-title">Antes de esta lección</div>
          <div class="path-node-list">
            ${prerequisites.length ? prerequisites.map(id => renderLessonChip(id)).join("") : '<div class="path-empty">No requiere un contenido previo directo.</div>'}
          </div>
        </div>
        <div class="path-focus">
          <div class="path-column-title">Lección actual</div>
          ${renderLessonChip(activeLesson.id, "is-focus")}
        </div>
        <div class="path-column">
          <div class="path-column-title">Después de esta lección</div>
          <div class="path-node-list">
            ${dependents.length ? dependents.map(id => renderLessonChip(id)).join("") : '<div class="path-empty">Esta lección cierra una rama del temario.</div>'}
          </div>
        </div>
      </div>
      <div class="path-recommended">
        <div class="path-column-title">Siguiente ruta recomendada</div>
        <div class="path-recommended-list">
          ${recommended.length ? recommended.map(id => renderLessonChip(id, "is-recommended")).join("") : '<div class="path-empty">No hay una siguiente lección directa recomendada.</div>'}
        </div>
      </div>
    </section>`;

  document.getElementById("btnOpenGraphInline")?.addEventListener("click", openGraphOverlay);
}

function renderGlobalGraph() {
  const lessons = TOPICS.flatMap(topic => topic.lessons);
  const readyCount = lessons.filter(lesson => getMissingPrerequisites(lesson.id, progressData).length === 0).length;
  const masteredCount = lessons.filter(lesson => progressData[lesson.id]?.mastered).length;

  $graphSummary.innerHTML = `
    <div class="path-summary-row graph-summary-row">
      <div class="path-summary-chip"><strong>${lessons.length}</strong><span> contenidos en el mapa</span></div>
      <div class="path-summary-chip"><strong>${masteredCount}</strong><span> dominados</span></div>
      <div class="path-summary-chip"><strong>${readyCount}</strong><span> listos para estudiar</span></div>
    </div>
    <p class="graph-summary-text">Cada tarjeta muestra sus prerrequisitos directos. Haz clic en cualquier contenido para abrirlo.</p>`;

  $graphMapWrap.innerHTML = TOPICS.map(topic => `
    <section class="graph-topic">
      <header class="graph-topic-header">
        <span>${topic.icon}</span>
        <div>
          <h3>${topic.label}</h3>
          <p>${topic.lessons.length} lecciones</p>
        </div>
      </header>
      <div class="graph-topic-list">
        ${topic.lessons.map(lesson => {
          const state = getLessonState(lesson.id);
          const prereqLabels = lesson.prerequisites.map(id => `<span class="graph-edge-chip">${id}</span>`).join("");
          return `
            <button class="graph-node state-${state}" data-lesson-jump="${lesson.id}">
              <div class="graph-node-top">
                <span class="graph-node-id">${lesson.id}</span>
                <span class="graph-node-state">${state === "mastered" ? "★" : state === "practiced" ? "●" : state === "ready" ? "→" : "○"}</span>
              </div>
              <div class="graph-node-title">${escapeHTML(lesson.name)}</div>
              <div class="graph-node-bottom">
                <span class="graph-node-label">Prerequisitos</span>
                <div class="graph-edge-list">${prereqLabels || '<span class="graph-edge-chip is-root">Inicio</span>'}</div>
              </div>
            </button>`;
        }).join("")}
      </div>
    </section>`).join("");
}

function jumpToLesson(lessonId) {
  const lesson = getLessonById(lessonId);
  const topic = getTopicByLessonId(lessonId);
  if (!lesson || !topic) return;
  $graphOverlay.style.display = "none";
  selectLesson(lesson, topic);
}

function openGraphOverlay() {
  renderGlobalGraph();
  $graphOverlay.style.display = "flex";
}

/* ══════════════════════════════════════════════════════════════
   API — Generate lesson with IA (streaming)
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

🔢 Opción Múltiple
[Exactamente 3 preguntas de opción múltiple. Usa ESTE FORMATO EXACTO para cada una:]
PREGUNTA: [texto de la pregunta, LaTeX con $...$]
A) [opción]
B) [opción]
C) [opción]
D) [opción]
CORRECTA: [A o B o C o D]
---
[repetir para las 3 preguntas]

Responde en español. Sé riguroso y didáctico.`;

$btnGenerate?.addEventListener("click", async () => {
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
        max_tokens: 3500,
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
    recordPractice(lessonId);
    updateMasteredButton(lessonId);

    $progressFill.style.width = "100%";
    setTimeout(() => {
      $heroProgress.style.display = "none";
      $streamPreview.style.display = "none";
      renderParsed(parseSections(fullText));
      renderLearningPathPanel();
      $btnCopy.style.display = "flex";
      $btnMastered.style.display = "flex";
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
$btnCopy?.addEventListener("click", () => {
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

if (IS_BROWSER) {
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-lesson-jump]");
    if (!trigger) return;
    jumpToLesson(trigger.dataset.lessonJump);
  });
}

/* ══════════════════════════════════════════════════════════════
   MULTIPLE CHOICE (MCQ)
══════════════════════════════════════════════════════════════ */
function parseMCQSection(content) {
  const questions = [];
  let current = null;
  const LETTERS = ["A", "B", "C", "D"];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("PREGUNTA:")) {
      if (current && current.options.length === 4) questions.push(current);
      current = { q: line.slice("PREGUNTA:".length).trim(), options: [], correct: 0 };
    } else if (current && /^[A-D]\)/.test(line)) {
      current.options.push(line.slice(2).trim());
    } else if (current && line.startsWith("CORRECTA:")) {
      const letter = line.slice("CORRECTA:".length).trim().toUpperCase();
      current.correct = LETTERS.indexOf(letter);
      if (current.correct < 0) current.correct = 0;
    } else if (line === "---" && current && current.options.length === 4) {
      questions.push(current);
      current = null;
    }
  }
  if (current && current.options.length === 4) questions.push(current);
  return questions;
}

let mcqCounter = 0;

function renderMCQ(mcqArray, parentEl) {
  if (!mcqArray || !mcqArray.length) return;
  const prefix = "mcq_" + (++mcqCounter) + "_";
  const list = document.createElement("div");
  list.className = "mcq-list";

  mcqArray.forEach((q, qi) => {
    const itemId = prefix + qi;
    const item = document.createElement("div");
    item.className = "mcq-item";
    item.id = itemId;

    const questionEl = document.createElement("div");
    questionEl.className = "mcq-question";
    questionEl.innerHTML = `<span class="mcq-q-num">${qi + 1}.</span> ${q.q}`;
    item.appendChild(questionEl);

    const optionsEl = document.createElement("div");
    optionsEl.className = "mcq-options";
    const LETTERS = ["A", "B", "C", "D"];

    q.options.forEach((opt, oi) => {
      const btn = document.createElement("div");
      btn.className = "mcq-option";
      btn.dataset.index = oi;
      btn.innerHTML = `<span class="mcq-option-letter">${LETTERS[oi]}</span><span>${opt}</span>`;
      btn.addEventListener("click", () => handleMCQSelect(item, oi, q.correct));
      optionsEl.appendChild(btn);
    });

    item.appendChild(optionsEl);

    const feedback = document.createElement("div");
    feedback.className = "mcq-feedback";
    feedback.style.display = "none";
    item.appendChild(feedback);

    list.appendChild(item);
  });

  parentEl.appendChild(list);
  if (typeof renderMathInElement === "function") {
    renderMathInElement(list, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }
}

function handleMCQSelect(itemEl, chosen, correct) {
  if (itemEl.classList.contains("answered")) return;
  itemEl.classList.add("answered");
  const options = itemEl.querySelectorAll(".mcq-option");
  const feedback = itemEl.querySelector(".mcq-feedback");
  const LETTERS = ["A", "B", "C", "D"];

  if (chosen === correct) {
    options[chosen].classList.add("correct");
    feedback.textContent = "✓ ¡Correcto!";
    feedback.style.color = "var(--green)";
  } else {
    options[chosen].classList.add("wrong");
    options[correct].classList.add("reveal");
    feedback.textContent = `✗ Incorrecto — la respuesta correcta era ${LETTERS[correct]})`;
    feedback.style.color = "var(--pink)";
  }
  feedback.style.display = "block";
}

/* ══════════════════════════════════════════════════════════════
   MASTERED BUTTON
══════════════════════════════════════════════════════════════ */
$btnMastered?.addEventListener("click", () => {
  if (!activeLesson) return;
  ensureProgressEntry(activeLesson.id);
  const entry = progressData[activeLesson.id];
  entry.mastered = !entry.mastered;
  entry.masteredAt = entry.mastered ? new Date().toISOString().slice(0, 10) : null;
  saveProgress();
  updateMasteredButton(activeLesson.id);
  updateNavMasteredIndicators();
  renderLearningPathPanel();
  if ($graphOverlay.style.display === "flex") renderGlobalGraph();
});

/* ══════════════════════════════════════════════════════════════
   PROGRESS MODAL
══════════════════════════════════════════════════════════════ */
$btnGraphOpen?.addEventListener("click", openGraphOverlay);

$btnCloseGraph?.addEventListener("click", () => {
  $graphOverlay.style.display = "none";
});

$graphOverlay?.addEventListener("click", e => {
  if (e.target === $graphOverlay) $graphOverlay.style.display = "none";
});

$btnProgressOpen?.addEventListener("click", () => {
  renderProgressModal();
  $progressOverlay.style.display = "flex";
});

$btnCloseProgress?.addEventListener("click", () => {
  $progressOverlay.style.display = "none";
});

$progressOverlay?.addEventListener("click", e => {
  if (e.target === $progressOverlay) $progressOverlay.style.display = "none";
});

$btnExportMd?.addEventListener("click", exportProgressMarkdown);

function renderProgressModal() {
  const allLessons = TOPICS.flatMap(t => t.lessons);
  const total = allLessons.length;
  const masteredCount = Object.values(progressData).filter(e => e.mastered).length;
  const practicedCount = Object.values(progressData).filter(e => e.practiceCount > 0).length;
  const totalSessions = Object.values(progressData).reduce((s, e) => s + (e.practiceCount || 0), 0);

  $progressStats.innerHTML = `
    <div class="stat-chip">
      <span class="stat-value">${masteredCount} / ${total}</span>
      <span class="stat-label">dominadas</span>
    </div>
    <div class="stat-chip">
      <span class="stat-value">${practicedCount}</span>
      <span class="stat-label">practicadas</span>
    </div>
    <div class="stat-chip">
      <span class="stat-value">${totalSessions}</span>
      <span class="stat-label">sesiones totales</span>
    </div>`;

  const interacted = allLessons.filter(l => progressData[l.id]?.practiceCount > 0);
  if (!interacted.length) {
    $progressTableWrap.innerHTML = '<p class="progress-empty">Aún no has practicado ninguna lección. ¡Selecciona una del menú!</p>';
    return;
  }

  let html = '<table class="progress-table"><thead><tr><th>ID</th><th>Lección</th><th>Última práctica</th><th>Sesiones</th><th>Estado</th></tr></thead><tbody>';

  TOPICS.forEach(topic => {
    const topicLessons = topic.lessons.filter(l => progressData[l.id]?.practiceCount > 0);
    if (!topicLessons.length) return;
    // mastered first, then by lastPracticed
    topicLessons.sort((a, b) => {
      const am = progressData[a.id]?.mastered ? 1 : 0;
      const bm = progressData[b.id]?.mastered ? 1 : 0;
      if (am !== bm) return bm - am;
      return (progressData[b.id]?.lastPracticed || "").localeCompare(progressData[a.id]?.lastPracticed || "");
    });
    html += `<tr class="progress-group-header"><td colspan="5">${topic.icon} ${topic.label}</td></tr>`;
    topicLessons.forEach(l => {
      const e = progressData[l.id];
      const mastered = e?.mastered;
      const statusHtml = mastered
        ? `<span class="status-mastered">★ Dominado</span>`
        : `<span class="status-practiced">practicado</span>`;
      html += `<tr class="${mastered ? "mastered-row" : ""}">
        <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px">${l.id}</span></td>
        <td>${l.name}</td>
        <td style="white-space:nowrap">${e?.lastPracticed || "—"}</td>
        <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:12px">${e?.practiceCount || 0}</td>
        <td>${statusHtml}</td>
      </tr>`;
    });
  });

  html += '</tbody></table>';
  $progressTableWrap.innerHTML = html;
}

function exportProgressMarkdown() {
  const today = new Date().toISOString().slice(0, 10);
  const allLessons = TOPICS.flatMap(t => t.lessons);
  const total = allLessons.length;
  const masteredCount = Object.values(progressData).filter(e => e.mastered).length;
  const practicedCount = Object.values(progressData).filter(e => e.practiceCount > 0).length;
  const totalSessions = Object.values(progressData).reduce((s, e) => s + (e.practiceCount || 0), 0);

  let md = `# Progreso — Cálculo II Mini-Lecciones\nExportado: ${today}\n\n`;
  md += `## Resumen\n- **Lecciones dominadas:** ${masteredCount} / ${total}\n`;
  md += `- **Lecciones practicadas:** ${practicedCount} / ${total}\n`;
  md += `- **Sesiones totales:** ${totalSessions}\n\n---\n\n`;

  TOPICS.forEach(topic => {
    const topicLessons = topic.lessons.filter(l => progressData[l.id]?.practiceCount > 0);
    if (!topicLessons.length) return;
    topicLessons.sort((a, b) => {
      const am = progressData[a.id]?.mastered ? 1 : 0;
      const bm = progressData[b.id]?.mastered ? 1 : 0;
      if (am !== bm) return bm - am;
      return (progressData[b.id]?.lastPracticed || "").localeCompare(progressData[a.id]?.lastPracticed || "");
    });
    md += `## ${topic.icon} ${topic.label}\n\n`;
    md += `| ID | Lección | Última práctica | Sesiones | Estado |\n`;
    md += `|----|---------|-----------------|----------|--------|\n`;
    topicLessons.forEach(l => {
      const e = progressData[l.id];
      const status = e?.mastered ? "★ Dominado" : "practicado";
      md += `| ${l.id} | ${l.name} | ${e?.lastPracticed || "—"} | ${e?.practiceCount || 0} | ${status} |\n`;
    });
    md += "\n";
  });

  md += `---\n_Generado por Cálculo II Mini-Lecciones_\n`;

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calc2-progreso-${today}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
if (IS_BROWSER) {
  buildNav();
}

if (IS_NODE) {
  module.exports = {
    getPracticeFeedbackState,
    createLessonSessionState,
    countCompletedBlocks,
  };
}
