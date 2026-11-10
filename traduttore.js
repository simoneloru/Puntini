// ============================================================
// traduttore.js — Motore a regole (fallback garantito)
// Interpreta i puntini di sospensione degli indecisi italiani
// senza bisogno di alcuna API.
// ============================================================

// Dizionario curato di espressioni puntinate classiche.
// Ogni voce: espressione -> "cosa nasconde davvero".
const FRASI = [
  { re: /ecco\s+mi\s+chiedevo/i, msg: "sta per chiederti un favore enorme ma vuole far finta di niente" },
  { re: /mi\s+chiedevo/i, msg: "ha già deciso cosa vuole, ma vuole che sia tu a proporlo" },
  { re: /come\s+stai/i, msg: "in realtà deve dirti una cosa scomoda e sta prendendo la rincorsa" },
  { re: /ciao/i, msg: "saluto con l'entusiasmo di chi deve annunciare una cattiva notizia" },
  { re: /ecco\s*[.!…]*$/i, msg: "ha finito le parole ma non il pensiero" },
  { re: /\ballora\b/i, msg: "sta cercando il coraggio di dire 'no' con educazione" },
  { re: /\bcioè\b/i, msg: "sta cercando le parole per non dirti la verità" },
  { re: /\bmagari\b/i, msg: "vorrebbe, ma non abbastanza da impegnarsi" },
  { re: /\bforse\b/i, msg: "probabilmente no, ma non ha il coraggio di ammetterlo" },
  { re: /\bboh\b/i, msg: "sa benissimo la risposta ma non vuole responsabilità" },
  { re: /\bmah\b/i, msg: "disapprova, ma ha paura di dirlo a voce alta" },
  { re: /\bdai\b/i, msg: "sta cercando di convincere sé stesso prima ancora che te" },
  { re: /\bscusa\b/i, msg: "ha già fatto qualcosa di cui si vergogna" },
  { re: /\bcomunque\b/i, msg: "vuole cambiare argomento prima che qualcuno lo incalzi" },
  { re: /\bva\s+beh\b/i, msg: "è seccato ma fa il superiore" },
  { re: /\bnon\s+so\b/i, msg: "non sa, e sta comodamente in mezzo all'incertezza" },
  { re: /\bsenti\b/i, msg: "sta per dire qualcosa che non ti piacerà" },
  { re: /\bguarda\b/i, msg: "premessa difensiva: sente di doversi giustificare" },
  { re: /\bniente\b/i, msg: "in realtà c'è tutto un problema, ma minimizza" },
  { re: /\bse\s+mi\s+spiego\b/i, msg: "sa di essere già incomprensibile" },
  { re: /\bse\s+capisci\s+cosa\s+intendo\b/i, msg: "non ha la minima idea di cosa stia dicendo" },
  { re: /\bnon\s+lo\s+so\s+se\b/i, msg: "lo sa benissimo, ma tergiversa" },
  { re: /\bvolevo\s+dirti\b/i, msg: "sta costruendo una rampa di lancio per una confessione" },
];

// Interpretazione basata sul "sapore" dei puntini usati.
function interpretaPuntini(segment) {
  const nDots = (segment.match(/\./g) || []).length;
  const hasManyQ = /\?{3,}/.test(segment);
  const hasManyBang = /!{3,}/.test(segment);
  const hasTwoDots = /\.{2}/.test(segment) && !/\.{3}/.test(segment);

  if (hasManyQ) return "ansia da risposta: le domande sono tre volte più pressanti del necessario";
  if (hasManyBang) return "entusiasmo gonfiato per mascherare l'insicurezza";
  if (nDots >= 5) return "esitazione estrema: più puntini, più panico esistenziale";
  if (hasTwoDots) return "puntini da sospensione improvvisata, neanche il coraggio di arrivare a tre";
  return "puntini di sospensione: la frase non è finita, il coraggio sì";
}

// Traduzione "di base" per un singolo segmento.
function traduciSegmento(segment) {
  const clean = segment.trim();
  for (const f of FRASI) {
    if (f.re.test(clean)) return f.msg;
  }
  return interpretaPuntini(clean);
}

// Controlla se un segmento contiene tracce di indecisione.
function haPuntini(segment) {
  return /\.{2,}|\?{2,}|!{2,}/.test(segment);
}

// ============================================================
// Statistiche & Indice di Indecisione™
// ============================================================

function contaSegni(text) {
  const dots = (text.match(/\.{2,}/g) || []).reduce((sum, s) => sum + s.length, 0);
  const questions = (text.match(/\?{2,}/g) || []).reduce((sum, s) => sum + s.length, 0);
  const bangs = (text.match(/!{2,}/g) || []).reduce((sum, s) => sum + s.length, 0);
  const sequence = (text.match(/\.{2,}|\?{2,}|!{2,}/g) || []).length;
  const words = (text.trim().split(/\s+/).filter(Boolean)).length;
  return { dots, questions, bangs, sequence, words };
}

function calcolaIndice(stats) {
  if (!stats.words) return 0;
  // Rapporto sequenze/parole (quante frasi finiscono "in sospeso"),
  // con un piccolo bonus per i puntini extra oltre i canonici tre.
  const seqRatio = stats.sequence / stats.words;
  const extra = Math.max(0, stats.dots - stats.sequence * 3);
  const raw = seqRatio * 120 + (extra / stats.words) * 40;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function verdetto(indice) {
  if (indice === 0) return "Deciso. Sospetto. Stai bene?";
  if (indice <= 15) return "Quasi umano: qualche esitazione fisiologica";
  if (indice <= 40) return "Indeciso amatoriale, in allenamento";
  if (indice <= 65) return "Indeciso professionista, iscritto all'albo";
  if (indice <= 85) return "CEO dell'agenzia 'Forse S.r.l.'";
  return "La sospensione fatta persona. Contatta subito un puntinologo.";
}

// Espone le funzioni usate da app.js e ai.js.
window.Traduttore = { traduciSegmento, haPuntini, contaSegni, calcolaIndice, verdetto };
