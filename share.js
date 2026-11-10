// ============================================================
// share.js — Condivisione virale: testo nativo + card PNG
// Genera la card 1080x1920 (storia Instagram) lato client con
// Canvas: nessuna API, nessuna quota, nessun server.
// ============================================================

const URL_APP = "https://simoneloru.github.io/Puntini/";

// ---------- Testo di condivisione ----------
function testoCondivisione(r) {
  const righe = r.segments
    .map((s, i) => `"${s}" → ${r.translations[i] || "nessun puntino"}`)
    .join("\n");
  return (
    `📉 Indice di Indecisione™: ${r.indice}/100 — ${Traduttore.verdetto(r.indice)}\n\n` +
    `${righe}\n\n` +
    `Smascherato da Puntini 👉 ${URL_APP}`
  );
}

async function condividi(r) {
  const text = testoCondivisione(r);
  // Web Share API (mobile): apre il menu nativo di condivisione.
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Puntini · Il Traduttore di Indecisione",
        text,
        url: URL_APP,
      });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // utente ha annullato
      // altrimenti si procede col fallback
    }
  }
  // Fallback: copia negli appunti.
  try {
    await navigator.clipboard.writeText(text);
    flashLabel(document.getElementById("share"), "Copiato! ✅");
  } catch {
    // clipboard bloccata: textarea di emergenza
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    flashLabel(document.getElementById("share"), "Copiato! ✅");
  }
}

// Feedback visivo su un bottone (preserva l'icona SVG interna).
function flashLabel(btn, label) {
  if (!btn) return;
  const span = btn.querySelector("span");
  const old = span ? span.textContent : btn.textContent;
  if (span) span.textContent = label;
  else btn.textContent = label;
  setTimeout(() => {
    if (span) span.textContent = old;
    else btn.textContent = old;
  }, 1500);
}

// ============================================================
// Card PNG (1080x1920)
// ============================================================

const W = 1080;
const H = 1920;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Ritorna le righe di testo mandando a capo in base alla larghezza.
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Disegna una riga evidenziando i puntini (., ?, ! ripetuti) in accent.
function drawLineWithDots(ctx, line, x, y, fontBase, fontAccent) {
  const parts = line.split(/(\.{2,}|\?{2,}|!{2,})/);
  let cx = x;
  for (const part of parts) {
    if (!part) continue;
    const isDots = /\.{2,}|\?{2,}|!{2,}/.test(part);
    ctx.font = isDots ? fontAccent : fontBase;
    ctx.fillStyle = isDots ? "#ff5c8a" : "#f0f0f7";
    ctx.fillText(part, cx, y);
    cx += ctx.measureText(part).width;
  }
}

function disegnaCard(r) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // --- sfondo ---
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, W, H);

  // alone radiale in alto e in basso
  let g = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900);
  g.addColorStop(0, "rgba(43,27,77,0.9)");
  g.addColorStop(1, "rgba(15,15,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 900);

  g = ctx.createRadialGradient(W / 2, H, 50, W / 2, H, 900);
  g.addColorStop(0, "rgba(27,43,77,0.9)");
  g.addColorStop(1, "rgba(15,15,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 900, W, 900);

  // griglia di puntini
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 20; y < H; y += 44) {
    for (let x = 20; x < W; x += 44) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#ff5c8a");
  grad.addColorStop(1, "#ffb347");

  // --- tre puntini (logo) ---
  const logoY = 150;
  const logo = [
    { x: W / 2 - 120, y: logoY + 40, r: 26 },
    { x: W / 2, y: logoY, r: 34 },
    { x: W / 2 + 120, y: logoY + 40, r: 26 },
  ];
  ctx.fillStyle = grad;
  for (const d of logo) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- titolo ---
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 130px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = grad;
  ctx.fillText("Puntini", W / 2, 330);

  ctx.font = "500 44px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#9a9ab5";
  ctx.fillText("Il Traduttore di Indecisione", W / 2, 400);

  // --- bolla con la frase ---
  const bubbleX = 90;
  const bubbleY = 470;
  const bubbleW = W - 180;
  const bubbleH = 420;
  ctx.fillStyle = "#1e1e33";
  roundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 40);
  ctx.fill();
  ctx.strokeStyle = "#33334d";
  ctx.lineWidth = 2;
  roundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 40);
  ctx.stroke();

  // frase: max ~6 righe, poi tronca
  const fullText = r.segments.join("\n");
  const fontBase = "600 44px 'Segoe UI', Arial, sans-serif";
  const fontAccent = "700 44px 'Segoe UI', Arial, sans-serif";
  const maxW = bubbleW - 80;
  let lines = [];
  for (const seg of r.segments.slice(0, 6)) {
    lines = lines.concat(wrapText(ctx, seg, maxW));
    if (lines.length >= 6) break;
  }
  lines = lines.slice(0, 6);
  if (r.segments.length > 6 || lines.length === 6) {
    const last = lines.length - 1;
    lines[last] = lines[last].slice(0, -3) + "...";
  }

  const lineHeight = 62;
  const startTextY = bubbleY + 90;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    const y = startTextY + i * lineHeight;
    if (y > bubbleY + bubbleH - 30) return;
    drawLineWithDots(ctx, line, bubbleX + 40, y, fontBase, fontAccent);
  });

  // --- verdetto ---
  ctx.textAlign = "center";
  ctx.font = "800 120px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = grad;
  ctx.fillText(`${r.indice}/100`, W / 2, 1060);

  ctx.font = "500 40px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#9a9ab5";
  ctx.fillText("Indice di Indecisione™", W / 2, 1120);

  const verdictText = Traduttore.verdetto(r.indice);
  ctx.font = "700 46px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  const verdictLines = wrapText(ctx, verdictText, W - 200);
  verdictLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 1200 + i * 60);
  });

  // --- URL in basso ---
  ctx.font = "500 36px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#55556e";
  ctx.fillText(URL_APP.replace("https://", ""), W / 2, 1780);

  return canvas;
}

function scaricaCard(r) {
  try {
    const canvas = disegnaCard(r);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "puntini-story.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  } catch (e) {
    console.error("[Puntini] generazione card fallita:", e);
  }
}

window.Share = { condividi, scaricaCard, testoCondivisione };
