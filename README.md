# ProteinLens — Binding Site Explorer

A browser-based tool for exploring AlphaFold structure confidence, annotated binding sites, and disease-associated variants for any human protein.

**Live data sources:** UniProt REST API · AlphaFold Database mmCIF · Mol\* Viewer

---

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the built dist/ locally
```

## Deploy to Vercel

Push to GitHub, then import the repo at [vercel.com](https://vercel.com). Framework preset is auto-detected as **Vite**. Every push to `main` auto-redeploys.

---

## Project structure

```
proteinlens-guide/
├── src/
│   ├── main.js        # Entry point — search logic, event listeners
│   ├── api.js         # UniProt + AlphaFold fetch functions
│   ├── wizard.js      # Result panel rendering
│   └── style.css      # All styles
├── public/            # Static assets (proteins.json goes here in Phase 3)
├── scripts/           # Batch generation scripts (Phase 3)
├── index.html         # Shell HTML
├── vite.config.js
└── package.json
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

---

**Data disclaimer:** All protein data is sourced from UniProt and AlphaFold Database. This tool is for research and educational purposes only.
