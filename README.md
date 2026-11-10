# Cloudflare Dashboard: No-terminal installation

**[Dashboard-Anleitung (Deutsch)](CLOUDFLARE_DASHBOARD.de.md) | [Dashboard instructions (English)](CLOUDFLARE_DASHBOARD.en.md)**

This package provides a `CHAT_RATE_KV` binding option specifically for dashboard-only deployment. No CLI is required. See the linked guide first.

---

# Dancing with SARS — NASA/JPL + Groq Chat + Cloudflare Worker (Hotfix)

**KI-Fehler „Load failed“? [Deutsch: Reparaturanleitung](GROQ_WORKER_FIX.de.md) · [English: Fix instructions](GROQ_WORKER_FIX.en.md)**

**Choose your documentation language / Sprache wählen:**

- 🇩🇪 **[Deutsch – Ausführliche Installations- und Fehlerbehebungsanleitung](docs/README.de.md)**
- 🇬🇧 **[English – Full setup and troubleshooting documentation](docs/README.en.md)**
- 🌐 **[Interaktive Hilfe mit Sprachauswahl / Interactive language switch](docs/guide.html)**

Originales Mission-Control-Design, 2D-/3D-Mond, synthetische SAR-/Hazard-Karten plus optional echte NASA/JPL-Horizons-Zeitreihen, NASA-LRO-Bildtextur und eine Groq-Chat-KI. **Weder Groq-Zugang noch Live-NASA-Abruf sind vorkonfiguriert:** Du musst den Cloudflare Worker `apikey` deployen und deinen Groq-Schlüssel als Secret speichern.

**Quick setup / Schnellstart**

```bash
cd cloudflare
npm install
npx wrangler login
# Edit ALLOWED_ORIGINS in wrangler.jsonc first!
npx wrangler deploy
npx wrangler secret put GROQ_API_KEY
```

**Diagnose / Diagnostics:** https://apikey.elias256.workers.dev/health

**Website:** Den Ordner `web/` auf Cloudflare Pages veröffentlichen / publish `web/` on Cloudflare Pages. Locally use `python -m http.server 8000` and open `http://localhost:8000`, **not `file://`**.

**Research integrity:** Original ice/slope/thermal/CPR metrics, polygons and local ML score are DEMO; only successfully fetched Horizons Sun/Earth ephemerides are NASA/JPL data. NASA SVS imagery is for visual context rather than quantitative geospatial science. Full explanations in the language-specific docs.


## Website languages / Sprachen

The dashboard and help center now support **Deutsch, English and Español** using the 🌐 language menu. The choice is stored in browser `localStorage` and reused on later visits. All translations are shipped locally in `assets/i18n.js`; no translation API or key is required. The mission maps, NASA data access and demo-data warnings work in all three interface languages.

The Groq chat sends only the language code (`de`, `en` or `es`) to the Cloudflare Worker, which is configured to answer in that language. **Redeploy `cloudflare/worker.js`** (or paste the matching `WORKER_DASHBOARD_COPY_PASTE.js`) for multilingual AI replies; changing only the website files changes the interface but will not update a previously deployed Worker.
