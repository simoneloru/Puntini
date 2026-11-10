// ============================================================
// ai.js — Traduzione "intelligente" tramite LLM gratuiti SENZA
// API key (tier anonimo). Nessuna chiave è inclusa nel codice.
//
// Provider (in ordine di preferenza):
//  1. OVHcloud AI Endpoints — tier anonimo, 2 richieste/min per IP
//     (OpenAI-compatibile, modelli open-weight hostati in EU)
//  2. LLM7.io — gateway con accesso anonimo ai modelli "turbo"
//
// Se entrambi falliscono, app.js ripiega sul motore a regole.
// ============================================================

const SYSTEM_PROMPT = [
  'Sei "Il Traduttore di Puntini". Sveli cosa i puntini di sospensione (....) e i punti interrogativi ripetuti (???) nascondono nel messaggio di una persona indecisa.',
  "",
  "Regole ferree:",
  "1. Per OGNI riga produci UNA sola frase, in terza persona, massimo 12 parole, che interpreta l'esitazione di QUELLA riga.",
  "2. Resta fedele al contenuto della riga: NON inventare relazioni, flirt, insulti, personaggi o fatti non presenti nel testo.",
  "3. Tono ironico e secco, da esperto che smaschera. Usa formule tipo: 'sta cercando di dire X ma non ha il coraggio', 'vuole chiedere Y e finge indifferenza', 'evita di dire Z'.",
  "4. Rispondi ESCLUSIVAMENTE con un array JSON di stringhe, una per riga, nello stesso ordine. Niente testo aggiuntivo, niente markdown.",
].join("\n");

// Esempio few-shot per ancorare stile e formato della risposta.
const FEW_SHOT_INPUT = "1. ciao....\n2. come stai???\n3. ecco mi chiedevo se....";
const FEW_SHOT_OUTPUT = JSON.stringify([
  "saluto col freno a mano tirato: voleva cominciare dicendo altro",
  "domande ripetute: ansia di non ricevere risposta",
  "sta per chiedere un favore e spera che tu lo anticipi",
]);

const PROVIDERS = [
  {
    nome: "OVHcloud",
    url: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions",
    model: "Meta-Llama-3_3-70B-Instruct",
  },
  {
    nome: "LLM7",
    url: "https://api.llm7.io/v1/chat/completions",
    model: "mistral-Nemo-Instruct-2407",
  },
];

function fetchConTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// Estrae l'array di traduzioni dalla risposta del modello,
// con tolleranza per risposte non perfettamente JSON.
function parseTraduzioni(content, n) {
  if (!content) return null;
  let text = String(content).trim();

  // Rimuove eventuali recinti markdown ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Tenta di estrarre il primo array JSON presente nel testo.
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed)) return null;

  const arr = parsed.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      return item.traduzione || item.translation || item.msg || item.originale || "";
    }
    return "";
  });

  // Allinea la lunghezza al numero di righe originali.
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[i] && String(arr[i]).trim() ? String(arr[i]).trim() : null);
  }
  return out;
}

async function chiamaProvider(provider, segments) {
  const body = {
    model: provider.model,
    temperature: 0.7,
    max_tokens: 900,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: FEW_SHOT_INPUT },
      { role: "assistant", content: FEW_SHOT_OUTPUT },
      { role: "user", content: segments.map((s, i) => `${i + 1}. ${s}`).join("\n") },
    ],
  };

  const res = await fetchConTimeout(
    provider.url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    25000
  );

  if (!res.ok) throw new Error(`${provider.nome}: HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const out = parseTraduzioni(content, segments.length);
  if (!out) throw new Error(`${provider.nome}: risposta non valida`);
  return out;
}

// Prova i provider in sequenza; ritorna { translations, provider }.
// Lancia un errore se tutti falliscono.
async function traduciConAI(segments) {
  let lastError = null;
  for (const provider of PROVIDERS) {
    try {
      const translations = await chiamaProvider(provider, segments);
      return { translations, provider: provider.nome };
    } catch (err) {
      lastError = err;
      console.warn(`[Puntini] ${provider.nome} fallito:`, err.message);
    }
  }
  throw lastError || new Error("Nessun provider AI disponibile");
}

window.AI = { traduciConAI };
