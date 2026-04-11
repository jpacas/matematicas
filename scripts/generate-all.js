#!/usr/bin/env node
/**
 * generate-all.js — Pre-genera lecciones guiadas para todas las lecciones del currículo.
 *
 * Uso:
 *   node scripts/generate-all.js --key sk-ant-xxxx
 *   ANTHROPIC_API_KEY=sk-ant-xxxx node scripts/generate-all.js
 *
 * Flags:
 *   --key <api-key>         API key de Anthropic (o usa ANTHROPIC_API_KEY)
 *   --only 1.1.1,1.1.2     Genera solo las lecciones indicadas (IDs separados por coma)
 *   --resume                Salta lecciones que ya existan en preloaded-generated.js
 *   --output <path>         Ruta de salida (default: ../preloaded-generated.js)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

/* ── Parsear argumentos ── */
const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}
const API_KEY = getArg("--key") || process.env.ANTHROPIC_API_KEY;
const ONLY = getArg("--only") ? getArg("--only").split(",").map(s => s.trim()) : null;
const RESUME = args.includes("--resume");
const OUTPUT_PATH = getArg("--output")
  ? path.resolve(getArg("--output"))
  : path.join(__dirname, "..", "preloaded-generated.js");

if (!API_KEY) {
  console.error("Error: se requiere una API key. Usa --key sk-ant-xxx o ANTHROPIC_API_KEY=...");
  process.exit(1);
}

/* ── Cargar currículo ── */
const lessonsPath = path.join(__dirname, "..", "lessons.js");
const { TOPICS, PRELOADED } = require(lessonsPath);
const ALL_LESSONS = TOPICS.flatMap(t => t.lessons);

/* ── Lecciones a generar ── */
function shouldSkip(lessonId, existingIds) {
  if (PRELOADED[lessonId]) return true;              // ya está en PRELOADED manual
  if (RESUME && existingIds.has(lessonId)) return true; // ya fue generada antes
  if (ONLY && !ONLY.includes(lessonId)) return true;
  return false;
}

/* ── Prompt ── */
function buildPrompt(lesson) {
  return `Eres un profesor experto de Cálculo II. Genera una lección guiada completa para:
Lección: "${lesson.name}" (ID: ${lesson.id})

Devuelve ÚNICAMENTE JSON válido. Sin markdown, sin texto antes ni después del JSON.

{
  "objective": "1 oración con el objetivo de aprendizaje y la fórmula principal en LaTeX",
  "intro": {
    "summary": "Resumen del concepto central en 2-3 líneas",
    "analogy": "Analogía del mundo real en 1-2 oraciones"
  },
  "blocks": [
    {
      "type": "concept",
      "title": "Título corto del bloque",
      "source": "intro",
      "sourceRefs": ["intro"],
      "content": ["Párrafo explicativo con $LaTeX$ inline...", "Segundo párrafo con la idea clave."]
    },
    {
      "type": "practice",
      "title": "Título del ejercicio",
      "source": "concept",
      "sourceRefs": ["concept"],
      "prompt": "Enunciado claro del ejercicio con $LaTeX$",
      "choices": [
        {"id": "a", "text": "Primera opción con $LaTeX$"},
        {"id": "b", "text": "Segunda opción"},
        {"id": "c", "text": "Tercera opción"}
      ],
      "correctChoice": "a",
      "correctMessage": "Explicación de por qué esa opción es correcta.",
      "hint": "Pista útil para quien falló en el primer intento.",
      "walkthrough": [
        "**Paso 1 — [nombre del paso].** Explicación detallada con $LaTeX$.",
        "**Paso 2 — [nombre del paso].** Continúa el razonamiento.",
        "**Paso 3 — [nombre del paso].** Conclusión o resultado final."
      ],
      "content": []
    },
    {
      "type": "application",
      "title": "Ejemplo aplicado",
      "source": "examples",
      "sourceRefs": ["examples"],
      "content": ["Descripción del ejemplo con $LaTeX$...", "Resultado: $...$"]
    },
    {
      "type": "recognition",
      "title": "Cuándo usar esta técnica",
      "source": "summary",
      "sourceRefs": ["summary"],
      "content": ["Señal clave que indica cuándo aplicar este método.", "Error común a evitar.", "Resumen en una línea."]
    }
  ]
}

Reglas obligatorias:
- Todo el texto en español
- Todo el math en LaTeX: inline $...$ o display $$...$$
- Entre 3 y 6 bloques en total
- Al menos 1 bloque de tipo "practice" con walkthrough como array de pasos (mínimo 3 pasos)
- Cada paso del walkthrough empieza con "**Paso N — nombre.**" y explica el razonamiento
- JSON estrictamente válido: sin comentarios, sin trailing commas, sin texto fuera del objeto`;
}

/* ── Llamada a la API ── */
function callAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4500,
      messages: [{ role: "user", content: prompt }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
      },
      res => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.content?.[0]?.text || "");
          } catch (e) {
            reject(new Error("Respuesta no es JSON válido: " + data.slice(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/* ── Leer IDs ya generados ── */
function readExistingIds() {
  const ids = new Set();
  if (!fs.existsSync(OUTPUT_PATH)) return ids;
  const content = fs.readFileSync(OUTPUT_PATH, "utf-8");
  const matches = content.matchAll(/"(\d+\.\d+\.\d+)"\s*:/g);
  for (const m of matches) ids.add(m[1]);
  return ids;
}

/* ── Escribir archivo de salida ── */
function writeOutput(generated) {
  const entries = Object.entries(generated)
    .map(([id, data]) => `    ${JSON.stringify(id)}: ${JSON.stringify(data, null, 2).split("\n").join("\n    ")}`)
    .join(",\n");

  const content = `// Auto-generado por scripts/generate-all.js — no editar a mano
(function () {
  if (typeof PRELOADED === "undefined") return;
  Object.assign(PRELOADED, {
${entries}
  });
})();
`;
  fs.writeFileSync(OUTPUT_PATH, content, "utf-8");
}

/* ── Esperar N ms ── */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ── Main ── */
async function main() {
  const existingIds = readExistingIds();

  // Cargar lo que ya había generado para no perderlo en --resume
  let generated = {};
  if (RESUME && fs.existsSync(OUTPUT_PATH)) {
    const content = fs.readFileSync(OUTPUT_PATH, "utf-8");
    // Extraer el objeto del IIFE
    const match = content.match(/Object\.assign\(PRELOADED,\s*(\{[\s\S]*?\})\s*\)/);
    if (match) {
      try { generated = JSON.parse(match[1]); } catch (_) {}
    }
  }

  const pending = ALL_LESSONS.filter(l => !shouldSkip(l.id, existingIds));

  if (pending.length === 0) {
    console.log("No hay lecciones por generar.");
    return;
  }

  console.log(`Generando ${pending.length} lecciones → ${OUTPUT_PATH}\n`);

  let ok = 0, fail = 0;

  for (const lesson of pending) {
    process.stdout.write(`  ${lesson.id.padEnd(8)} ${lesson.name.slice(0, 50).padEnd(50)} `);
    try {
      const text = await callAPI(buildPrompt(lesson));
      const data = JSON.parse(text.trim());

      if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
        throw new Error("blocks vacío o ausente");
      }

      generated[lesson.id] = { id: lesson.id, ...data };
      writeOutput(generated);
      console.log("✓");
      ok++;
    } catch (err) {
      console.log(`✗  ${err.message.slice(0, 80)}`);
      fail++;
    }

    // Pausa entre llamadas para respetar rate limits
    await sleep(1000);
  }

  console.log(`\nFinalizado: ${ok} OK, ${fail} errores.`);
  if (fail > 0) {
    console.log("Vuelve a ejecutar con --resume para reintentar las fallidas.");
  }
}

main().catch(err => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
