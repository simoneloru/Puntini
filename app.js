// ============================================================
// app.js — Orchestrazione: parse, AI (con fallback a regole),
// rendering dei risultati e copia del verdetto.
// ============================================================

const ESEMPIO =
  "ciao....\ncome stai???\necco mi chiedevo se....\nniente, lascia perdere...\ndai, magari un'altra volta...";

const el = {
  input: document.getElementById("input"),
  analyze: document.getElementById("analyze"),
  example: document.getElementById("example"),
  copy: document.getElementById("copy"),
  reset: document.getElementById("reset"),
  loading: document.getElementById("loading"),
  results: document.getElementById("results"),
  verdict: document.getElementById("verdict"),
  lines: document.getElementById("lines"),
  modeHint: document.getElementById("mode-hint"),
};

let ultimoRisultato = null;

// ---------- Parse ----------
function parseSegments(text) {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const sentences = text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.length ? sentences : [text.trim()];
}

// ---------- Evidenziazione dei puntini ----------
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function highlight(text) {
  return escapeHtml(text).replace(
    /(\.{2,}|\?{2,}|!{2,})/g,
    '<span class="hl">$1</span>'
  );
}

// ---------- Traduzione (AI -> regole) ----------
async function traduci(segments) {
  try {
    const result = await AI.traduciConAI(segments);
    // Completa eventuali buchi con il motore a regole.
    const translations = result.translations.map((t, i) =>
      t ?? (Traduttore.haPuntini(segments[i]) ? Traduttore.traduciSegmento(segments[i]) : null)
    );
    return { translations, mode: "ai", provider: result.provider };
  } catch {
    const translations = segments.map((s) =>
      Traduttore.haPuntini(s) ? Traduttore.traduciSegmento(s) : null
    );
    return { translations, mode: "rules", provider: null };
  }
}

// ---------- Rendering ----------
function renderVerdict(stats, indice) {
  const text = Traduttore.verdetto(indice);
  el.verdict.innerHTML = `
    <div class="index-label">Indice di Indecisione™</div>
    <div class="index-number">${indice}<span style="font-size:1.4rem">/100</span></div>
    <div class="gauge"><div class="gauge-fill" style="width:${indice}%"></div></div>
    <div class="verdict-text">${text}</div>
    <div class="stats">
      Puntini trovati: ${stats.dots} · Sequenze sospette: ${stats.sequence} · Parole: ${stats.words}
    </div>
  `;
}

function renderLines(segments, translations) {
  el.lines.innerHTML = "";
  segments.forEach((seg, i) => {
    const tr = translations[i];
    const li = document.createElement("li");
    li.className = "line";
    li.innerHTML = `
      <div class="original">${highlight(seg)}</div>
      <div class="translation">${tr ? escapeHtml(tr) : "nessun puntino: frase innocente (per ora)"}</div>
    `;
    el.lines.appendChild(li);
  });
}

function renderModeHint(mode, provider) {
  if (mode === "ai") {
    el.modeHint.innerHTML =
      `<span class="pill pill-ai">AI · ${escapeHtml(provider)}</span> traduzione generata da un LLM gratuito, senza API key`;
  } else {
    el.modeHint.innerHTML =
      `<span class="pill pill-rules">Motore a regole</span> le API gratuite non rispondono, ma i puntini non si nascondono`;
  }
}

// ---------- Azioni ----------
async function smaschera() {
  const text = el.input.value.trim();
  if (!text) {
    el.input.focus();
    return;
  }

  el.results.classList.add("hidden");
  el.loading.classList.remove("hidden");
  el.analyze.disabled = true;

  try {
    const segments = parseSegments(text);
    const stats = Traduttore.contaSegni(text);
    const indice = Traduttore.calcolaIndice(stats);

    const { translations, mode, provider } = await traduci(segments);

    ultimoRisultato = { segments, translations, stats, indice, mode, provider };

    renderVerdict(stats, indice);
    renderLines(segments, translations);
    renderModeHint(mode, provider);

    el.loading.classList.add("hidden");
    el.results.classList.remove("hidden");
    el.results.scrollIntoView({ behavior: "smooth", block: "start" });
  } finally {
    el.analyze.disabled = false;
  }
}

function testoVerdetto() {
  if (!ultimoRisultato) return "";
  const { segments, translations, stats, indice } = ultimoRisultato;
  const righe = segments
    .map((s, i) => `${i + 1}. "${s}" → ${translations[i] || "nessun puntino"}`)
    .join("\n");
  return [
    "📉 ANALISI INDECISIONE — Puntini",
    `Indice di Indecisione™: ${indice}/100 — ${Traduttore.verdetto(indice)}`,
    `Puntini: ${stats.dots} · Sequenze sospette: ${stats.sequence} · Parole: ${stats.words}`,
    "",
    righe,
    "",
    "— smascherato da Puntini, il Traduttore di Indecisione",
  ].join("\n");
}

async function copiaVerdetto() {
  const txt = testoVerdetto();
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    const old = el.copy.textContent;
    el.copy.textContent = "Copiato! ✅";
    setTimeout(() => (el.copy.textContent = old), 1500);
  } catch {
    // Fallback per browser che bloccano clipboard.
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function reset() {
  el.input.value = "";
  el.results.classList.add("hidden");
  el.modeHint.innerHTML = "";
  ultimoRisultato = null;
  el.input.focus();
}

// ---------- Eventi ----------
el.analyze.addEventListener("click", smaschera);
el.example.addEventListener("click", () => {
  el.input.value = ESEMPIO;
  el.input.focus();
});
el.copy.addEventListener("click", copiaVerdetto);
el.reset.addEventListener("click", reset);

// Invio con Ctrl+Invio / Cmd+Invio
el.input.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    smaschera();
  }
});
