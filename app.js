/* app.js — Cálculo II Mini-Lecciones */

const IS_NODE = typeof module !== "undefined" && module.exports;
const IS_BROWSER = !IS_NODE && typeof window !== "undefined" && typeof document !== "undefined";

const LESSONS_API = IS_NODE
  ? require("./lessons.js")
  : window;

const TOPICS_DATA = IS_NODE ? LESSONS_API.TOPICS : TOPICS;
const PRELOADED_DATA = IS_NODE ? LESSONS_API.PRELOADED : PRELOADED;
const lookupLessonById = IS_NODE ? LESSONS_API.getLessonById : getLessonById;
const lookupPrerequisites = IS_NODE ? LESSONS_API.getPrerequisites : getPrerequisites;
const lookupDependents = IS_NODE ? LESSONS_API.getDependents : getDependents;
const lookupRecommendedNext = IS_NODE ? LESSONS_API.getRecommendedNext : getRecommendedNext;
const lookupMissingPrerequisites = IS_NODE ? LESSONS_API.getMissingPrerequisites : getMissingPrerequisites;
const ALL_LESSONS = TOPICS_DATA.flatMap(topic => topic.lessons);
const DEFAULT_ENTRY_LESSON_ID = ALL_LESSONS.find(lesson => lookupMissingPrerequisites(lesson.id, {}).length === 0)?.id || ALL_LESSONS[0]?.id || null;

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
let lessonSession = null;
let lessonInteractionRecorded = false;

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

function getActiveGuidedBlockIndex(session = [], totalBlocks = session.length || 0) {
  if (!totalBlocks) return 0;
  const nextPending = session.findIndex(blockState => !(blockState.completed || blockState.solved));
  return nextPending === -1 ? Math.max(totalBlocks - 1, 0) : nextPending;
}

function getLessonBlockProgressLabel(session = [], totalBlocks = session.length || 0) {
  if (!totalBlocks) return "";
  return `Bloque ${Math.min(countCompletedBlocks(session) + 1, totalBlocks)} de ${totalBlocks}`;
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
  if (IS_BROWSER) renderHomepage();
}

function recordMeaningfulPractice(id = activeLesson?.id) {
  if (!id || lessonInteractionRecorded) return;
  recordPractice(id);
  lessonInteractionRecorded = true;
}

/* ── DOM refs ───────────────────────────────────────────────── */
const $nav               = IS_BROWSER ? document.getElementById("lessonNav") : null;
const $search            = IS_BROWSER ? document.getElementById("search") : null;
const $count             = IS_BROWSER ? document.getElementById("lessonCount") : null;
const $emptyState        = IS_BROWSER ? document.getElementById("emptyState") : null;
const $homeTitle         = IS_BROWSER ? document.getElementById("homeTitle") : null;
const $homeSubtitle      = IS_BROWSER ? document.getElementById("homeSubtitle") : null;
const $homeStats         = IS_BROWSER ? document.getElementById("homeStats") : null;
const $homeStarterPanel  = IS_BROWSER ? document.getElementById("homeStarterPanel") : null;
const $homeContinueCard  = IS_BROWSER ? document.getElementById("homeContinueCard") : null;
const $homeRecommendedCard = IS_BROWSER ? document.getElementById("homeRecommendedCard") : null;
const $homeReviewCard    = IS_BROWSER ? document.getElementById("homeReviewCard") : null;
const $homeRecentCard    = IS_BROWSER ? document.getElementById("homeRecentCard") : null;
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
const $lessonShell       = IS_BROWSER ? document.getElementById("lessonShell") : null;
const $lessonProgressBadge = IS_BROWSER ? document.getElementById("lessonProgressBadge") : null;
const $lessonIdeaCard    = IS_BROWSER ? document.getElementById("lessonIdeaCard") : null;
const $lessonIdeaSummary = IS_BROWSER ? document.getElementById("lessonIdeaSummary") : null;
const $lessonIdeaAnalogy = IS_BROWSER ? document.getElementById("lessonIdeaAnalogy") : null;
const $lessonAssistiveStatus = IS_BROWSER ? document.getElementById("lessonAssistiveStatus") : null;
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
  return TOPICS_DATA.find(topic => topic.lessons.some(lesson => lesson.id === id)) || null;
}

function getLessonState(id) {
  if (activeLesson?.id === id) return "active";
  if (progressData[id]?.mastered) return "mastered";
  if (progressData[id]?.practiceCount > 0) return "practiced";
  if ((lookupMissingPrerequisites(id, progressData) || []).length === 0) return "ready";
  return "pending";
}

function getProgressEntry(id, progress = progressData) {
  return progress?.[id] || {};
}

function hasLessonHistory(entry = {}) {
  return Boolean(entry.mastered || entry.practiceCount > 0 || entry.lastPracticed || entry.masteredAt);
}

function getLessonActivityDate(entry = {}) {
  return entry.lastPracticed || entry.masteredAt || "";
}

function compareLessonsByProgress(a, b, progress = progressData) {
  const entryA = getProgressEntry(a.id, progress);
  const entryB = getProgressEntry(b.id, progress);
  const dateCompare = getLessonActivityDate(entryB).localeCompare(getLessonActivityDate(entryA));
  if (dateCompare !== 0) return dateCompare;

  const practiceCompare = (entryB.practiceCount || 0) - (entryA.practiceCount || 0);
  if (practiceCompare !== 0) return practiceCompare;

  const masteredCompare = Number(Boolean(entryB.mastered)) - Number(Boolean(entryA.mastered));
  if (masteredCompare !== 0) return masteredCompare;

  return a.id.localeCompare(b.id);
}

function getTopicLabelByLessonId(id) {
  return getTopicByLessonId(id)?.label || "Ruta del curso";
}

function dedupeLessonIds(ids = []) {
  const seen = new Set();
  return ids.filter(id => {
    if (!id || seen.has(id) || !lookupLessonById(id)) return false;
    seen.add(id);
    return true;
  });
}

function getRecentProgressLessons(progress = progressData) {
  return ALL_LESSONS
    .filter(lesson => hasLessonHistory(getProgressEntry(lesson.id, progress)))
    .sort((a, b) => compareLessonsByProgress(a, b, progress));
}

function getReadyLessons(progress = progressData, { includeMastered = false } = {}) {
  return ALL_LESSONS.filter(lesson => {
    if (!includeMastered && progress[lesson.id]?.mastered) return false;
    return lookupMissingPrerequisites(lesson.id, progress).length === 0;
  });
}

function getDefaultEntryLesson() {
  return lookupLessonById(DEFAULT_ENTRY_LESSON_ID);
}

function pickRecommendedLesson(progress = progressData, continueLesson = null, recentLessons = []) {
  const recommendedFromHistory = dedupeLessonIds([
    ...(continueLesson ? lookupRecommendedNext(continueLesson.id) : []),
    ...recentLessons.slice(0, 3).flatMap(lesson => lookupRecommendedNext(lesson.id)),
  ]);

  const readyFromHistory = recommendedFromHistory.find(id => {
    if (id === continueLesson?.id) return false;
    if (progress[id]?.mastered) return false;
    return lookupMissingPrerequisites(id, progress).length === 0;
  });
  if (readyFromHistory) return lookupLessonById(readyFromHistory);

  const readyLessons = getReadyLessons(progress);
  return readyLessons.find(lesson => lesson.id !== continueLesson?.id && !progress[lesson.id]?.practiceCount)
    || readyLessons.find(lesson => lesson.id !== continueLesson?.id)
    || continueLesson
    || getDefaultEntryLesson();
}

function buildHomepageModel(progress = progressData) {
  const recentLessons = getRecentProgressLessons(progress);
  const hasHistory = recentLessons.length > 0;
  const continueLesson = recentLessons[0] || null;
  const continueEntry = continueLesson ? getProgressEntry(continueLesson.id, progress) : null;
  const entryLesson = getDefaultEntryLesson();
  const recommendedLesson = pickRecommendedLesson(progress, continueLesson, recentLessons);
  const recentPractice = recentLessons.slice(0, 4).map(lesson => ({
    lesson,
    entry: getProgressEntry(lesson.id, progress),
  }));

  const reviewReasonById = {};
  const continueMissing = continueLesson ? lookupMissingPrerequisites(continueLesson.id, progress) : [];
  const recommendedMissing = recommendedLesson ? lookupMissingPrerequisites(recommendedLesson.id, progress) : [];

  continueMissing.forEach(id => {
    reviewReasonById[id] = "Te ayuda a retomar la sesión más reciente.";
  });

  recommendedMissing.forEach(id => {
    if (!reviewReasonById[id]) reviewReasonById[id] = "Desbloquea la recomendación principal.";
  });

  recentLessons
    .filter(lesson => !progress[lesson.id]?.mastered)
    .forEach(lesson => {
      if (!reviewReasonById[lesson.id]) reviewReasonById[lesson.id] = "Ya lo practicaste: conviene consolidarlo.";
    });

  const topicsToReview = dedupeLessonIds([
    ...continueMissing,
    ...recommendedMissing,
    ...recentLessons.filter(lesson => !progress[lesson.id]?.mastered).map(lesson => lesson.id),
  ])
    .filter(id => id !== continueLesson?.id && id !== recommendedLesson?.id)
    .slice(0, 4)
    .map(id => ({
      lesson: lookupLessonById(id),
      reason: reviewReasonById[id] || "Conviene repasarlo antes de seguir avanzando.",
    }))
    .filter(item => item.lesson);

  return {
    hasHistory,
    entryLesson,
    continueLesson,
    continueEntry,
    recommendedLesson,
    topicsToReview,
    recentPractice,
    stats: {
      masteredCount: ALL_LESSONS.filter(lesson => progress[lesson.id]?.mastered).length,
      practicedCount: ALL_LESSONS.filter(lesson => progress[lesson.id]?.practiceCount > 0).length,
      readyCount: getReadyLessons(progress).length,
      totalSessions: Object.values(progress).reduce((sum, entry) => sum + (entry?.practiceCount || 0), 0),
    },
  };
}

function escapeHTML(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatRichText(text = "") {
  return String(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function formatAnnouncementText(text = "") {
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function announceLessonStatus(message = "") {
  if (!IS_BROWSER || !$lessonAssistiveStatus || !message) return;
  $lessonAssistiveStatus.textContent = "";
  window.setTimeout(() => {
    if ($lessonAssistiveStatus) $lessonAssistiveStatus.textContent = message;
  }, 0);
}

function resolveGuidedFocusTarget(focusRequest = null) {
  if (!IS_BROWSER || !$lessonContent || !focusRequest) return null;

  const getBlockTarget = blockIndex => {
    const block = $lessonContent.querySelector(`[data-guided-block-index="${blockIndex}"]`);
    if (!block) return null;
    return block.querySelector("button:not([disabled])") || block;
  };

  if (focusRequest.type === "choice") {
    const choiceTarget = $lessonContent.querySelector(`[data-guided-choice="${focusRequest.blockIndex}:${focusRequest.choiceId}"]:not([disabled])`);
    if (choiceTarget) return choiceTarget;
    return getBlockTarget(focusRequest.blockIndex);
  }

  if (focusRequest.type === "block") {
    return getBlockTarget(focusRequest.blockIndex);
  }

  const activeBlock = $lessonContent.querySelector(".guided-block.is-current");
  if (!activeBlock) return null;
  return activeBlock.querySelector("button:not([disabled])") || activeBlock;
}

function restoreGuidedFocus(focusRequest = null) {
  if (!IS_BROWSER || !focusRequest) return;
  window.requestAnimationFrame(() => {
    const target = resolveGuidedFocusTarget(focusRequest);
    if (target && typeof target.focus === "function") target.focus();
  });
}

function renderLectureParagraphsHTML(content = "") {
  const paragraphs = String(content).trim()
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p style="margin-bottom:12px;font-size:15px;line-height:1.8;color:var(--text-dim)">${paragraph}</p>`);

  return paragraphs.length ? `<div>${paragraphs.join("")}</div>` : renderLectureRawHTML(content);
}

function renderLectureRawHTML(content = "") {
  return `<div class="lecture-raw-fallback is-inline">${escapeHTML(String(content).trim())}</div>`;
}

function parseGeneratedLessonContent(text = "") {
  const rawText = String(text || "");
  const pattern = new RegExp(
    `(${SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );
  const parts = rawText.split(pattern);
  const sections = [];
  let current = null;

  for (const part of parts) {
    if (!part) continue;

    if (SECTION_META[part]) {
      if (current) sections.push(current);
      current = { kind: "section", title: part, content: "" };
      continue;
    }

    if (current) {
      current.content += part;
      continue;
    }

    if (part.trim()) {
      sections.push({ kind: "raw", title: "Texto original", content: part });
    }
  }

  if (current) sections.push(current);

  return { rawText, sections };
}

function resetLessonShell() {
  if (!$lessonShell) return;
  $lessonShell.style.display = "none";
  $lessonShell.classList.remove("is-secondary");
  $lessonContent.innerHTML = "";
  if ($lessonAssistiveStatus) $lessonAssistiveStatus.textContent = "";
  if ($lessonProgressBadge) {
    $lessonProgressBadge.style.display = "none";
    $lessonProgressBadge.textContent = "";
  }
  if ($lessonIdeaCard) $lessonIdeaCard.style.display = "none";
  if ($lessonIdeaSummary) $lessonIdeaSummary.innerHTML = "";
  if ($lessonIdeaAnalogy) {
    $lessonIdeaAnalogy.style.display = "none";
    $lessonIdeaAnalogy.innerHTML = "";
  }
}

function setLessonShellState({ progressLabel = "", summary = "", analogy = "", secondary = false } = {}) {
  if (!$lessonShell) return;
  $lessonShell.style.display = "flex";
  $lessonShell.classList.toggle("is-secondary", secondary);

  if ($lessonProgressBadge) {
    $lessonProgressBadge.textContent = progressLabel;
    $lessonProgressBadge.style.display = progressLabel ? "inline-flex" : "none";
  }

  const hasIdea = Boolean(summary || analogy);
  if ($lessonIdeaCard) $lessonIdeaCard.style.display = hasIdea ? "grid" : "none";
  if ($lessonIdeaSummary) $lessonIdeaSummary.innerHTML = summary ? formatRichText(summary) : "";
  if ($lessonIdeaAnalogy) {
    $lessonIdeaAnalogy.innerHTML = analogy ? formatRichText(analogy) : "";
    $lessonIdeaAnalogy.style.display = analogy ? "block" : "none";
  }
}

function renderLessonChip(id, extraClass = "") {
  const lesson = lookupLessonById(id);
  if (!lesson) return "";
  const state = getLessonState(id);
  return `
    <button class="lesson-chip-card ${extraClass} state-${state}" data-lesson-jump="${lesson.id}">
      <span class="lesson-chip-id">${lesson.id}</span>
      <span class="lesson-chip-title">${escapeHTML(lesson.name)}</span>
    </button>`;
}

function formatLessonDate(dateString = "") {
  if (!dateString) return "Sin fecha";
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatSessionLabel(count = 0) {
  return `${count} sesi${count === 1 ? "ón" : "ones"}`;
}

function renderLauncherStats(stats = {}) {
  return `
    <div class="launcher-stat">
      <strong>${stats.masteredCount || 0}</strong>
      <span>dominadas</span>
    </div>
    <div class="launcher-stat">
      <strong>${stats.practicedCount || 0}</strong>
      <span>practicadas</span>
    </div>
    <div class="launcher-stat">
      <strong>${stats.readyCount || 0}</strong>
      <span>listas ahora</span>
    </div>`;
}

function renderLauncherSpotlight(lesson, {
  chipClass = "",
  description = "",
  meta = [],
} = {}) {
  if (!lesson) return '<div class="launcher-empty">No hay una lección disponible para mostrar.</div>';

  return `
    <div class="launcher-spotlight">
      ${renderLessonChip(lesson.id, chipClass)}
      ${description ? `<p class="launcher-card-copy">${escapeHTML(description)}</p>` : ""}
      ${meta.length ? `<div class="launcher-meta-row">${meta.map(item => `<span>${escapeHTML(item)}</span>`).join("")}</div>` : ""}
    </div>`;
}

function renderLauncherList(items = [], emptyText = "", renderItem) {
  if (!items.length) return `<div class="launcher-empty">${escapeHTML(emptyText)}</div>`;
  return `<div class="launcher-list">${items.map(renderItem).join("")}</div>`;
}

function renderHomepage() {
  if (!$emptyState || !$homeTitle || !$homeSubtitle || !$homeStats || !$homeStarterPanel || !$homeContinueCard || !$homeRecommendedCard || !$homeReviewCard || !$homeRecentCard) return;

  const model = buildHomepageModel(progressData);
  const starterLesson = model.recommendedLesson || model.entryLesson;

  $homeTitle.textContent = model.hasHistory
    ? "Retoma tu ritmo de estudio"
    : "Empieza con una ruta clara";

  $homeSubtitle.textContent = model.hasHistory
    ? "Tu panel combina progreso reciente, repaso pendiente y el siguiente contenido listo para estudiar."
    : "Abre una lección de entrada, completa la práctica guiada y este panel se convertirá en tu lanzador personal.";

  $homeStats.innerHTML = renderLauncherStats(model.stats);

  if (model.hasHistory) {
    const actionIds = dedupeLessonIds([
      model.continueLesson?.id,
      model.recommendedLesson?.id,
    ]);

    $homeStarterPanel.innerHTML = `
      <div class="launcher-panel-kicker">Sesión sugerida</div>
      <h3 class="launcher-panel-title">Hoy conviene abrir ${escapeHTML(starterLesson?.name || "tu siguiente lección")}</h3>
      <p class="launcher-panel-copy">Continúa con tu sesión más reciente o aprovecha una recomendación que ya quedó desbloqueada según tus prerrequisitos.</p>
      <div class="launcher-actions">
        ${actionIds.map((id, index) => `
          <button class="launcher-action${index === 0 ? " is-primary" : ""}" type="button" data-lesson-jump="${id}">
            ${index === 0 ? "Continuar" : "Abrir sugerida"} ${id}
          </button>`).join("")}
      </div>`;
  } else {
    $homeStarterPanel.innerHTML = `
      <div class="launcher-panel-kicker">Primer paso</div>
      <h3 class="launcher-panel-title">Empieza por ${escapeHTML(model.entryLesson?.id || "")}</h3>
      <p class="launcher-panel-copy">La forma más segura de arrancar es estudiar una lección raíz, responder sus bloques guiados y usar el botón de dominada cuando ya no necesites apoyo.</p>
      <ol class="launcher-steps">
        <li>Abre la lección recomendada de entrada.</li>
        <li>Completa la práctica y revisa sus prerrequisitos sugeridos.</li>
        <li>Vuelve aquí: verás continuidad, repaso y práctica reciente.</li>
      </ol>
      <div class="launcher-actions">
        <button class="launcher-action is-primary" type="button" data-lesson-jump="${model.entryLesson?.id || ""}">Comenzar con ${escapeHTML(model.entryLesson?.id || "")}</button>
        <button class="launcher-action" type="button" data-open-graph="true">Ver mapa del curso</button>
      </div>`;
  }

  $homeContinueCard.innerHTML = model.hasHistory
    ? `
      <div class="launcher-card-kicker">Continuar</div>
      <h3 class="launcher-card-title">Sigue donde te quedaste</h3>
      ${renderLauncherSpotlight(model.continueLesson, {
        chipClass: "is-focus",
        description: model.continueEntry?.mastered
          ? "La última lección quedó dominada; úsala como repaso rápido o salta a la recomendación."
          : "Esta es la sesión con actividad más reciente y el punto más natural para retomar.",
        meta: [
          `Última práctica: ${formatLessonDate(model.continueEntry?.lastPracticed)}`,
          formatSessionLabel(model.continueEntry?.practiceCount || 0),
          model.continueEntry?.mastered ? "Estado: dominada" : "Estado: en progreso",
        ],
      })}
    `
    : `
      <div class="launcher-card-kicker">Continuar</div>
      <h3 class="launcher-card-title">Tu continuidad aparecerá aquí</h3>
      <div class="launcher-empty">Después de tu primera práctica, esta tarjeta te llevará directo a la lección más reciente.</div>
    `;

  $homeRecommendedCard.innerHTML = `
    <div class="launcher-card-kicker">Recomendación</div>
    <h3 class="launcher-card-title">${model.hasHistory ? "Siguiente lección sugerida" : "Lección recomendada para empezar"}</h3>
    ${renderLauncherSpotlight(model.recommendedLesson || model.entryLesson, {
      chipClass: "is-recommended",
      description: model.hasHistory
        ? "Está lista para estudiarse con tu progreso actual y mantiene continuidad con el camino del curso."
        : "Es una lección raíz: no necesita prerrequisitos dominados y te da una base útil para el resto del mapa.",
      meta: [
        getTopicLabelByLessonId((model.recommendedLesson || model.entryLesson)?.id),
        `${lookupPrerequisites((model.recommendedLesson || model.entryLesson)?.id || "").length} prerrequisitos directos`,
      ],
    })}
  `;

  $homeReviewCard.innerHTML = `
    <div class="launcher-card-kicker">Repaso</div>
    <h3 class="launcher-card-title">Temas para revisar</h3>
    ${renderLauncherList(
      model.topicsToReview,
      "Todavía no hay temas de repaso priorizados. Empieza una lección y aquí aparecerán los contenidos que conviene reforzar.",
      item => `
        <button class="launcher-list-item" type="button" data-lesson-jump="${item.lesson.id}">
          <span class="launcher-list-top">
            <span class="launcher-list-id">${item.lesson.id}</span>
            <span class="launcher-list-topic">${escapeHTML(getTopicLabelByLessonId(item.lesson.id))}</span>
          </span>
          <strong class="launcher-list-title">${escapeHTML(item.lesson.name)}</strong>
          <span class="launcher-list-copy">${escapeHTML(item.reason)}</span>
        </button>`
    )}
  `;

  $homeRecentCard.innerHTML = `
    <div class="launcher-card-kicker">Práctica reciente</div>
    <h3 class="launcher-card-title">Últimas sesiones registradas</h3>
    ${renderLauncherList(
      model.recentPractice,
      "Aún no hay práctica reciente. Cuando resuelvas ejercicios o bloques guiados, se registrarán aquí.",
      item => `
        <button class="launcher-list-item" type="button" data-lesson-jump="${item.lesson.id}">
          <span class="launcher-list-top">
            <span class="launcher-list-id">${item.lesson.id}</span>
            <span class="launcher-list-topic">${formatLessonDate(item.entry?.lastPracticed)}</span>
          </span>
          <strong class="launcher-list-title">${escapeHTML(item.lesson.name)}</strong>
          <span class="launcher-list-copy">${formatSessionLabel(item.entry?.practiceCount || 0)} · ${item.entry?.mastered ? "Dominada" : "En progreso"}</span>
        </button>`
    )}
  `;
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR — build lesson navigation
══════════════════════════════════════════════════════════════ */
function buildNav(filter = "") {
  $nav.innerHTML = "";
  let total = 0, visible = 0;

  TOPICS_DATA.forEach(topic => {
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
  lessonSession = null;
  lessonInteractionRecorded = false;

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
  resetLessonShell();

  // show preloaded or cached content
  if (PRELOADED_DATA[lesson.id]) {
    renderPreloaded(lesson.id);
    renderLearningPathPanel();
    $btnCopy.style.display = "flex";
    $btnMastered.style.display = "flex";
    updateMasteredButton(lesson.id);
  } else if (generatedCache[lesson.id]) {
    renderParsed(parseGeneratedLessonContent(generatedCache[lesson.id]));
    renderLearningPathPanel();
    $btnCopy.style.display = "flex";
    $btnMastered.style.display = "flex";
    updateMasteredButton(lesson.id);
  } else {
    renderLearningPathPanel();
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
  const lesson = PRELOADED_DATA[id];
  if (!lesson?.blocks?.length) {
    renderParsed([]);
    return;
  }

  lessonSession = createLessonSessionState(lesson);
  renderGuidedLesson(lesson);
}

const GUIDED_BLOCK_META = {
  concept: { kicker: "Concepto", className: "guided-block--concept" },
  practice: { kicker: "Práctica", className: "guided-block--practice" },
  application: { kicker: "Aplicación", className: "guided-block--application" },
  recognition: { kicker: "Reconocimiento", className: "guided-block--recognition" },
};

function renderGuidedLesson(lesson, uiState = {}) {
  if (!lesson?.blocks?.length) return;

  const totalBlocks = lesson.blocks.length;
  const activeBlockIndex = getActiveGuidedBlockIndex(lessonSession, totalBlocks);

  setLessonShellState({
    progressLabel: getLessonBlockProgressLabel(lessonSession, totalBlocks),
    summary: lesson.intro?.summary || "",
    analogy: lesson.intro?.analogy || "",
  });

  $lessonContent.innerHTML = lesson.blocks.map((block, index) => {
    return renderGuidedBlock(block, lessonSession[index], index, activeBlockIndex, totalBlocks);
  }).join("");

  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Cálculo II · ${lesson.id} · Flujo guiado`;
  $lessonContent.appendChild(footer);

  triggerKaTeX();
  restoreGuidedFocus(uiState.focusRequest || null);
  announceLessonStatus(uiState.announcement || "");
}

function renderGuidedBlock(block, sessionState = {}, index, activeBlockIndex, totalBlocks) {
  const meta = GUIDED_BLOCK_META[block.type] || { kicker: "Bloque", className: "" };
  const isCompleted = !!(sessionState.completed || sessionState.solved);
  const isCurrent = index === activeBlockIndex;
  const isLocked = index > activeBlockIndex;
  const statusLabel = isCompleted ? "Completado" : isCurrent ? "En curso" : "Bloqueado";

  if (block.type === "practice") {
    return renderPracticeBlock(block, sessionState, index, meta, { isCompleted, isCurrent, isLocked });
  }

  const content = Array.isArray(block.content) ? block.content : [];
  const contentHTML = block.type === "recognition"
    ? renderRecognitionBlockContent(block)
    : content.map(item => `<p class="guided-copy">${formatRichText(item)}</p>`).join("");
  const actionHTML = !isLocked && !isCompleted
    ? `<button class="guided-action-button" type="button" data-guided-continue="${index}">${index === totalBlocks - 1 ? "Cerrar bloque" : "Continuar"}</button>`
    : "";

  return `
    <section class="guided-block ${meta.className}${isCompleted ? " is-complete" : ""}${isCurrent ? " is-current" : ""}${isLocked ? " is-locked" : ""}" data-guided-block-index="${index}" tabindex="-1">
      <div class="guided-block-header">
        <div class="guided-block-heading">
          <span class="guided-block-step">${index + 1}</span>
          <div>
            <div class="guided-block-kicker">${meta.kicker}</div>
            <h2 class="guided-block-title">${escapeHTML(block.title || `Bloque ${index + 1}`)}</h2>
          </div>
        </div>
        <span class="guided-block-status">${statusLabel}</span>
      </div>
      ${isLocked ? '<div class="guided-block-locked">Se desbloquea cuando completes el bloque anterior.</div>' : `
        <div class="guided-block-body">
          ${contentHTML}
          ${actionHTML}
        </div>
      `}
    </section>`;
}

function renderRecognitionBlockContent(block) {
  const content = Array.isArray(block.content) ? block.content : [];
  const takeaway = block.takeaway || content[0] || "";
  const remaining = block.takeaway ? content : content.slice(1);

  return `
    ${takeaway ? `<div class="takeaway-chip">${formatRichText(takeaway)}</div>` : ""}
    ${remaining.length ? `<ul class="guided-points">${remaining.map(item => `<li>${formatRichText(item)}</li>`).join("")}</ul>` : ""}
  `;
}

function renderPracticeBlock(block, sessionState = {}, index, meta, viewState) {
  const feedbackState = getPracticeFeedbackState(sessionState);
  const content = Array.isArray(block.content) ? block.content : [];
  const choices = Array.isArray(block.choices) ? block.choices : [];
  const choicesHTML = choices.map(choice => {
    const isSelected = sessionState.selectedChoice === choice.id;
    const isCorrect = sessionState.solved && choice.id === block.correctChoice;
    const isIncorrect = !sessionState.solved && isSelected && sessionState.attempts > 0 && choice.id !== block.correctChoice;
    const stateClass = [
      "guided-choice",
      isSelected ? "is-selected" : "",
      isCorrect ? "is-correct" : "",
      isIncorrect ? "is-incorrect" : "",
    ].filter(Boolean).join(" ");

    return `
      <button
        class="${stateClass}"
        type="button"
        data-guided-choice="${index}:${choice.id}"
        aria-pressed="${isSelected ? "true" : "false"}"
        ${viewState.isLocked || sessionState.solved ? "disabled" : ""}
      >
        <span class="guided-choice-label">${choice.id.toUpperCase()}</span>
        <span>${formatRichText(choice.text)}</span>
      </button>`;
  }).join("");

  return `
    <section class="guided-block ${meta.className}${viewState.isCompleted ? " is-complete" : ""}${viewState.isCurrent ? " is-current" : ""}${viewState.isLocked ? " is-locked" : ""}" data-guided-block-index="${index}" tabindex="-1">
      <div class="guided-block-header">
        <div class="guided-block-heading">
          <span class="guided-block-step">${index + 1}</span>
          <div>
            <div class="guided-block-kicker">${meta.kicker}</div>
            <h2 class="guided-block-title">${escapeHTML(block.title || `Bloque ${index + 1}`)}</h2>
          </div>
        </div>
        <span class="guided-block-status">${viewState.isCompleted ? "Resuelto" : viewState.isCurrent ? "Responde" : "Bloqueado"}</span>
      </div>
      ${viewState.isLocked ? '<div class="guided-block-locked">Resuelve el bloque actual para desbloquear esta práctica.</div>' : `
        <div class="guided-block-body">
          ${content.length ? `<div class="guided-practice-prep">${content.map(item => `<p class="guided-copy">${formatRichText(item)}</p>`).join("")}</div>` : ""}
          <p class="guided-practice-prompt">${formatRichText(block.prompt || "")}</p>
          <div class="guided-choice-list">${choicesHTML}</div>
          ${sessionState.solved ? `<div class="guided-feedback-card is-correct">${formatRichText(block.correctMessage || "Correcto.")}</div>` : ""}
          ${(feedbackState === "hint" || feedbackState === "walkthrough") && block.hint ? `<div class="guided-feedback-card is-hint"><div class="guided-feedback-kicker">Pista</div>${formatRichText(block.hint)}</div>` : ""}
          ${feedbackState === "walkthrough" && block.walkthrough ? `<div class="guided-feedback-card is-walkthrough"><div class="guided-feedback-kicker">Desarrollo guiado</div>${formatRichText(block.walkthrough)}</div>` : ""}
        </div>
      `}
    </section>`;
}

/* ══════════════════════════════════════════════════════════════
   RENDER — Parsed sections from raw AI text
══════════════════════════════════════════════════════════════ */
function parseSections(text) {
  return parseGeneratedLessonContent(text).sections;
}

function renderParsed(parsedLesson) {
  const parsedModel = Array.isArray(parsedLesson)
    ? { rawText: generatedCache[activeLesson?.id] || "", sections: parsedLesson }
    : (parsedLesson || { rawText: "", sections: [] });
  const sections = Array.isArray(parsedModel.sections) ? parsedModel.sections : [];

  setLessonShellState({ secondary: true });
  $lessonContent.innerHTML = `
    <section class="lecture-fallback">
      <div class="lecture-fallback-kicker">Formato secundario</div>
      <h2 class="lecture-fallback-title">Lección generada en modo conferencia</h2>
      <p class="lecture-fallback-copy">La lección generada aún no usa el schema guiado de <code>intro</code> y <code>blocks</code>, así que se muestra en un formato clásico de lectura.</p>
    </section>`;

  const stack = document.createElement("div");
  stack.className = "lecture-fallback-stack";
  $lessonContent.appendChild(stack);

  if (!sections.length && parsedModel.rawText.trim()) {
    const rawFallback = document.createElement("div");
    rawFallback.className = "lecture-raw-fallback";
    rawFallback.textContent = parsedModel.rawText;
    stack.appendChild(rawFallback);
  }

  sections.forEach(sec => {
    if (sec.kind === "raw") {
      stack.appendChild(sectionCard(sec.title || "Texto original", renderLectureRawHTML(sec.content), "#7a90a8"));
      return;
    }

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

      if (!items.length) {
        bodyHTML = renderLectureRawHTML(sec.content);
      } else if (sec.title === "🏋️ Ejercicios de Práctica") {
        bodyHTML = `<div class="exercises-grid">${items.map((it, i) => `
          <div class="exercise-item" id="ex_gen_${i}">
            <button class="exercise-q" type="button" data-exercise-toggle="ex_gen_${i}">
              <span class="ex-n">${it.n}.</span>
              <span class="ex-text">${it.text}</span>
              <span class="ex-toggle">▾</span>
            </button>
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
      bodyHTML = items.length ? `<ul class="summary-list">${items.map(it => `
        <li class="summary-item">
          <div class="summary-dot"></div>
          <span>${it}</span>
        </li>`).join("")}</ul>` : renderLectureRawHTML(sec.content);
    } else if (sec.title === "🎯 Objetivo") {
      bodyHTML = sec.content.trim() ? `<div class="objective-text">${sec.content.trim()}</div>` : renderLectureRawHTML(sec.content);
    } else if (sec.title === "🔢 Opción Múltiple") {
      const parsed = parseMCQSection(sec.content);
      if (parsed.length) {
        const mcqCard = sectionCard(sec.title, '<div class="mcq-placeholder"></div>', meta.color);
        stack.appendChild(mcqCard);
        renderMCQ(parsed, mcqCard.querySelector(".mcq-placeholder"));
      } else {
        stack.appendChild(sectionCard(sec.title, renderLectureRawHTML(sec.content), meta.color));
      }
      return; // skip normal append below
    } else {
      bodyHTML = renderLectureParagraphsHTML(sec.content);
    }

    stack.appendChild(sectionCard(sec.title, bodyHTML, meta.color));
  });

  const footer = document.createElement("div");
  footer.className = "lesson-footer";
  footer.textContent = `Cálculo II · ${activeLesson?.id} · Generado con IA · fallback de lectura`;
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
  recordMeaningfulPractice();
  document.getElementById(id)?.classList.toggle("open");
}

function handleGuidedContinue(blockIndex) {
  const lesson = activeLesson ? PRELOADED_DATA[activeLesson.id] : null;
  if (!lesson?.blocks?.[blockIndex] || !lessonSession?.[blockIndex]) return;

  const block = lesson.blocks[blockIndex];
  if (block.type === "practice") return;

  recordMeaningfulPractice();
  lessonSession[blockIndex].completed = true;
  renderGuidedLesson(lesson, {
    focusRequest: { type: "active" },
    announcement: getLessonBlockProgressLabel(lessonSession, lesson.blocks.length),
  });
}

function handleGuidedChoice(blockIndex, choiceId) {
  const lesson = activeLesson ? PRELOADED_DATA[activeLesson.id] : null;
  const block = lesson?.blocks?.[blockIndex];
  const blockState = lessonSession?.[blockIndex];
  if (!block || block.type !== "practice" || !blockState || blockState.solved) return;

  recordMeaningfulPractice();
  blockState.selectedChoice = choiceId;
  blockState.attempts = (blockState.attempts || 0) + 1;

  let focusRequest = { type: "choice", blockIndex, choiceId };
  let announcement = getLessonBlockProgressLabel(lessonSession, lesson.blocks.length);

  if (choiceId === block.correctChoice) {
    blockState.solved = true;
    blockState.completed = true;
    focusRequest = { type: "active" };
    announcement = `${formatAnnouncementText(block.correctMessage || "Correcto.")} ${getLessonBlockProgressLabel(lessonSession, lesson.blocks.length)}`;
  } else {
    const feedbackState = getPracticeFeedbackState(blockState);
    announcement = feedbackState === "walkthrough"
      ? `Respuesta incorrecta. Desarrollo guiado disponible. ${getLessonBlockProgressLabel(lessonSession, lesson.blocks.length)}`
      : `Respuesta incorrecta. Pista disponible. ${getLessonBlockProgressLabel(lessonSession, lesson.blocks.length)}`;
  }

  renderGuidedLesson(lesson, { focusRequest, announcement });
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

  const prerequisites = lookupPrerequisites(activeLesson.id);
  const dependents = lookupDependents(activeLesson.id);
  const recommended = lookupRecommendedNext(activeLesson.id).filter(id => id !== activeLesson.id).slice(0, 4);
  const missing = lookupMissingPrerequisites(activeLesson.id, progressData);
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
      ${missing.length ? `<div class="path-alert">Antes de profundizar en <strong>${escapeHTML(activeLesson.name)}</strong>, conviene repasar: ${missing.map(id => escapeHTML(lookupLessonById(id)?.name || id)).join(", ")}.</div>` : `<div class="path-alert is-positive">Ya tienes cubiertos los prerrequisitos directos de esta lección.</div>`}
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
  const lessons = TOPICS_DATA.flatMap(topic => topic.lessons);
  const readyCount = lessons.filter(lesson => lookupMissingPrerequisites(lesson.id, progressData).length === 0).length;
  const masteredCount = lessons.filter(lesson => progressData[lesson.id]?.mastered).length;

  $graphSummary.innerHTML = `
    <div class="path-summary-row graph-summary-row">
      <div class="path-summary-chip"><strong>${lessons.length}</strong><span> contenidos en el mapa</span></div>
      <div class="path-summary-chip"><strong>${masteredCount}</strong><span> dominados</span></div>
      <div class="path-summary-chip"><strong>${readyCount}</strong><span> listos para estudiar</span></div>
    </div>
    <p class="graph-summary-text">Cada tarjeta muestra sus prerrequisitos directos. Haz clic en cualquier contenido para abrirlo.</p>`;

  $graphMapWrap.innerHTML = TOPICS_DATA.map(topic => `
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
  const lesson = lookupLessonById(lessonId);
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
  resetLessonShell();
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
    updateMasteredButton(lessonId);

    $progressFill.style.width = "100%";
    setTimeout(() => {
      $heroProgress.style.display = "none";
      $streamPreview.style.display = "none";
      renderParsed(parseGeneratedLessonContent(fullText));
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
    const graphTrigger = event.target.closest("[data-open-graph]");
    if (graphTrigger) {
      openGraphOverlay();
      return;
    }

    const trigger = event.target.closest("[data-lesson-jump]");
    if (!trigger) return;
    jumpToLesson(trigger.dataset.lessonJump);
  });

  $lessonContent?.addEventListener("click", event => {
    const choiceButton = event.target.closest("[data-guided-choice]");
    if (choiceButton) {
      const [blockIndex, choiceId] = choiceButton.dataset.guidedChoice.split(":");
      handleGuidedChoice(Number(blockIndex), choiceId);
      return;
    }

    const continueButton = event.target.closest("[data-guided-continue]");
    if (continueButton) {
      handleGuidedContinue(Number(continueButton.dataset.guidedContinue));
      return;
    }

    const exerciseButton = event.target.closest("[data-exercise-toggle]");
    if (exerciseButton) {
      toggleExercise(exerciseButton.dataset.exerciseToggle);
    }
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
      const btn = document.createElement("button");
      btn.type = "button";
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
  recordMeaningfulPractice();
  itemEl.classList.add("answered");
  const options = itemEl.querySelectorAll(".mcq-option");
  const feedback = itemEl.querySelector(".mcq-feedback");
  const LETTERS = ["A", "B", "C", "D"];

  if (chosen === correct) {
    options[chosen].classList.add("correct");
    feedback.textContent = "✓ ¡Correcto!";
    feedback.style.color = "var(--green)";
    announceLessonStatus("Respuesta correcta.");
  } else {
    options[chosen].classList.add("wrong");
    options[correct].classList.add("reveal");
    feedback.textContent = `✗ Incorrecto — la respuesta correcta era ${LETTERS[correct]})`;
    feedback.style.color = "var(--pink)";
    announceLessonStatus(`Respuesta incorrecta. La correcta era ${LETTERS[correct]}.`);
  }
  options.forEach(option => { option.disabled = true; });
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
  renderHomepage();
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
  const allLessons = TOPICS_DATA.flatMap(t => t.lessons);
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

  TOPICS_DATA.forEach(topic => {
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
  const allLessons = TOPICS_DATA.flatMap(t => t.lessons);
  const total = allLessons.length;
  const masteredCount = Object.values(progressData).filter(e => e.mastered).length;
  const practicedCount = Object.values(progressData).filter(e => e.practiceCount > 0).length;
  const totalSessions = Object.values(progressData).reduce((s, e) => s + (e.practiceCount || 0), 0);

  let md = `# Progreso — Cálculo II Mini-Lecciones\nExportado: ${today}\n\n`;
  md += `## Resumen\n- **Lecciones dominadas:** ${masteredCount} / ${total}\n`;
  md += `- **Lecciones practicadas:** ${practicedCount} / ${total}\n`;
  md += `- **Sesiones totales:** ${totalSessions}\n\n---\n\n`;

  TOPICS_DATA.forEach(topic => {
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
  renderHomepage();
}

if (IS_NODE) {
  module.exports = {
    buildHomepageModel,
    getPracticeFeedbackState,
    createLessonSessionState,
    countCompletedBlocks,
    getActiveGuidedBlockIndex,
    getLessonBlockProgressLabel,
    parseGeneratedLessonContent,
  };
}
