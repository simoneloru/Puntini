# Puntini · Il Traduttore di Indecisione

> Smaschera gli indecisi che scrivono usando un sacco di puntini. Incolli il messaggio, scopri cosa *davvero* volevano dire.

**Puntini** è una web app 100% statica che interpreta i puntini di sospensione (`...`, `....`, `???`) degli italiani che non riescono a chiudere una frase, e traduce ogni riga nel pensiero inconfessato che ci sta dietro.

---

## ✨ Cosa fa

Incolli questo:

```
ciao....
come stai???
ecco mi chiedevo se....
niente, lascia perdere...
dai, magari un'altra volta...
```

E ottieni:

- 📉 **Indice di Indecisione™** (0–100) con verdetto ironico
- 🎯 **Traduzione riga per riga** di cosa i puntini nascondono davvero
- 📋 **Bottone "Copia il verdetto"** per infamare l'indeciso di turno

---

## 🧠 Come funziona la "traduzione"

L'app prova in quest'ordine:

1. **AI gratuita senza API key** — `OVHcloud AI Endpoints` (tier anonimo, modelli open-weight hostati in EU, 2 richieste/min per IP) e, come backup, `LLM7.io`.
2. **Motore a regole locale** — un dizionario curato di espressioni puntinate italiane + analisi dei pattern (numero di puntini, `???`, `!!!`). Funziona *sempre*, anche offline.

**Nessuna chiave API è inclusa nel codice.** Ogni visitatore usa il proprio IP e i propri limiti: nessun setup, nessun costo, nessuna chiave da configurare.

---

## 🚀 Deploy su GitHub Pages (2 minuti)

1. Crea un repo nuovo su GitHub e pusha questa cartella.
2. Vai in **Settings → Pages**.
3. Sotto **Build and deployment → Source** scegli **Deploy from a branch** e seleziona il branch `main`, cartella `/ (root)`.
4. Salva. In pochi secondi il sito è live su:
   `https://tuousername.github.io/Puntini/`

Oppure, per provarlo in locale: apri `index.html` con un doppio click (o con un mini-server tipo `npx serve .`).

---

## 🗂️ Struttura

```
Puntini/
├── index.html       # struttura della pagina
├── style.css        # tema scuro, responsive, a tema "puntini"
├── app.js           # orchestratore: parse → AI/regole → rendering
├── ai.js            # LLM gratuiti senza API key (OVHcloud + LLM7)
├── traduttore.js    # motore a regole + Indice di Indecisione™
└── README.md
```

---

## ⚠️ Note

- I provider gratuiti senza chiave sono servizi "best effort": se un giorno fossero giù o cambiassero le regole, l'app ripiega automaticamente sul motore a regole. Il divertimento è garantito comunque.
- Progetto nato per gioco: smaschera responsabilmente 😄

## 📄 Licenza

MIT — fai pure, ma cita gli indecisi che hai smascherato.
