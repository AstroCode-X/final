[English](#english) · [Deutsch](#deutsch)

## English

# Dancing with SARS

An interactive lunar mission dashboard with 2D south-pole and whole-Moon maps, a rotatable 3D Moon, five prototype locations, optional NASA/JPL Horizons data, and optional Groq chat through a Cloudflare Worker.

> **Scope:** This is a prototype, not a flight-safety tool or a validated lunar science product. The five coordinates are prototype locations, not confirmed CLPS landing sites. Ice, slope, temperature, backscatter, PSR/hazard overlays, and the local ML score are demo content, not verified NASA measurements.

**Seeing “Load failed” in the AI chat?** Follow the [English repair guide](GROQ_WORKER_FIX.en.md).

## Features

- Switch between south-pole, whole-Moon, and rotatable 3D views; zoom the polar map and select prototype locations.
- Inspect example ice, slope, temperature, and backscatter values for each prototype location. The interface labels these as demo values.
- Request Sun/Earth azimuth and elevation time series from NASA/JPL Horizons through the Cloudflare Worker. Choose a start time and a 24-hour, 3-day, or 7-day window; load one or all five prototype locations.
- Import a Horizons-format JSON file and export the selected location’s displayed time series as CSV.
- Use the explicitly labeled periodic demo mode when live data is unavailable. Demo values are not ephemerides for the selected date.
- View NASA SVS / LRO WAC imagery when the Worker can retrieve it; otherwise, the site uses its bundled illustrative fallback image.
- Ask the optional Groq chat about the dashboard. Chat messages and a small snapshot of displayed mission context are sent through the Worker to Groq. The chat is not a NASA service, and its answers may be wrong.

The separate local ML score is a synthetic demonstration, not a landing-safety probability or an ice detector. It combines example slope and temperature values with Sun/Earth visibility fractions from the selected data mode.

## Run the website locally

The frontend uses HTML, CSS, and JavaScript. From the repository root, start a local HTTP server:

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Do not open `index.html` with `file://`; browsers can block cross-origin requests to the Worker.

For Cloudflare Pages, publish the contents of `web/` as the site. The frontend calls the Worker at `https://apikey.elias256.workers.dev`; live ephemerides, remote imagery, and chat depend on that service being reachable and correctly configured.

## Optional Cloudflare Worker setup

You can explore the website without configuring a Groq key. Live ephemerides and remote NASA imagery require the Worker; chat also requires a Groq API key and a working chat rate-limit binding.

1. In `cloudflare/wrangler.jsonc`, add your hosted site’s exact origin to `ALLOWED_ORIGINS` before deployment. The checked-in configuration includes localhost origins.
2. Deploy the Worker:

   ```bash
   cd cloudflare
   npm install
   npx wrangler login
   npx wrangler deploy
   ```

3. Store your Groq key as a Cloudflare Worker secret:

   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```

4. Check [Worker health](https://apikey.elias256.workers.dev/health), then use the dashboard’s connection check from your hosted website.

Never put the Groq key in frontend files, commits, or public documentation. For a dashboard-only setup, follow the [Cloudflare Dashboard guide](CLOUDFLARE_DASHBOARD.en.md); it describes the `CHAT_RATE_KV` option, which does not require the CLI. The Worker source defines `GET /health`, `GET /texture`, `GET /ephemeris`, and `POST /chat` endpoints.

## Data and limitations

- A successful Worker `/ephemeris` request fetches Sun/Earth azimuth and elevation from NASA/JPL Horizons for the prototype coordinates. If the request fails or data is missing for a location, the app reports an error or N/A instead of presenting demo estimates as live JPL data.
- Imported Horizons-format JSON is checked for structure, but its provenance is not independently verified by the app.
- Visibility is calculated against a geometric horizon using hourly samples. Local terrain, crater-wall obstruction, antenna hardware, and continuous conditions are not modeled; a percentage represents the share of sampled intervals above the horizon.
- The NASA SVS / LRO WAC image provides visual context; it is not a calibrated SAR, ice, or landing-hazard map.
- The original ice, slope, temperature, backscatter, PSR/hazard overlays, and local ML model are demo content. CPR alone does not prove the presence of water ice.
- Chat messages and displayed mission context are sent through the Worker to Groq. The Worker keeps the API key server-side, but the model is not an authoritative source.

For setup, troubleshooting, endpoints, and limitations, see the [English guide](docs/README.en.md) and [interactive help](docs/guide.html).
[↑ English](#english) · [↓ Deutsch](#deutsch)

---

## Deutsch

> **Cloudflare-Einrichtung nur über das Dashboard:** Dieses Paket bietet für die Installation über das Cloudflare-Dashboard eine `CHAT_RATE_KV`-Bindungsoption. Die Kommandozeile ist dafür nicht erforderlich. Siehe die [deutsche Dashboard-Anleitung](CLOUDFLARE_DASHBOARD.de.md).

# Dancing with SARS

Ein interaktives Dashboard für Mondmissionen mit 2D-Karten des Südpols und des gesamten Mondes, einem drehbaren 3D-Mond, fünf Beispielstandorten, optionalen NASA/JPL-Horizons-Daten und einem optionalen Groq-Chat über einen Cloudflare Worker.

> **Geltungsbereich:** Dies ist ein Lern- und Demonstrationsprojekt, kein Werkzeug zur Flugsicherheit und kein wissenschaftlich validiertes Mondforschungsprodukt. Die fünf Koordinaten sind Beispielstandorte und keine bestätigten CLPS-Landeplätze. Eis-, Hangneigungs-, Temperatur- und Rückstreuungswerte, PSR-/Gefahren-Overlays sowie der lokale ML-Score sind Demo-Inhalte und keine verifizierten NASA-Messungen.

**Erscheint im KI-Chat „Load failed“?** Folge der [deutschen Reparaturanleitung](GROQ_WORKER_FIX.de.md).

## Funktionen

- Zwischen Südpol-, Gesamtmond- und drehbarer 3D-Ansicht wechseln, die Polaransicht zoomen und Beispielstandorte auswählen.
- Beispielwerte für Eis, Hangneigung, Temperatur und Rückstreuung des ausgewählten Standorts anzeigen. Diese Werte sind in der Oberfläche als Demo gekennzeichnet.
- Sonnen-/Erdazimut und -höhe über den Cloudflare Worker von NASA/JPL Horizons abrufen. Startzeit sowie Zeitfenster von 24 Stunden, 3 Tagen oder 7 Tagen wählen; einen oder alle fünf Beispielstandorte laden.
- Horizons-formatierte JSON-Dateien importieren und die angezeigte Zeitreihe des ausgewählten Standorts als CSV exportieren.
- Den ausdrücklich gekennzeichneten Demo-Modus mit periodischer Näherung verwenden, wenn Live-Daten nicht verfügbar sind. Diese Demo-Werte sind keine echten Ephemeriden für das ausgewählte Datum.
- NASA-SVS-/LRO-WAC-Bilder anzeigen, wenn der Worker sie abrufen kann; andernfalls nutzt die Website ein enthaltenes illustratives Ersatzbild.
- Den optionalen Groq-Chat zu Fragen über das Dashboard verwenden. Chatnachrichten und ein kleiner Ausschnitt des angezeigten Missionskontexts werden über den Worker an Groq gesendet. Der Chat ist kein NASA-Dienst; seine Antworten können falsch sein.

Der separate lokale ML-Score ist eine synthetische Demonstration und weder eine Landungssicherheitswahrscheinlichkeit noch ein Eisdetektor. Er kombiniert beispielhafte Hangneigungs- und Temperaturwerte mit den Sichtbarkeitsanteilen von Sonne und Erde aus dem ausgewählten Datenmodus.

## Website lokal starten

Das Frontend besteht aus statischem HTML, CSS und JavaScript. Starte im Stammverzeichnis des Repositorys einen lokalen HTTP-Server:

```bash
python -m http.server 8000
```

Öffne [http://localhost:8000](http://localhost:8000). Öffne `index.html` nicht direkt über `file://`; Browser können dadurch Cross-Origin-Anfragen an den Worker blockieren.

Für Cloudflare Pages veröffentliche den Inhalt von `web/` als Website. Das Frontend verwendet den Worker unter `https://apikey.elias256.workers.dev`. Live-Ephemeriden, entfernte NASA-Bilder und der Chat hängen daher davon ab, dass dieser Dienst erreichbar und korrekt konfiguriert ist.

## Optionalen Cloudflare Worker einrichten

Die Website lässt sich auch ohne konfigurierten Groq-Schlüssel erkunden. Live-Ephemeriden und entfernte NASA-Bilder benötigen den Worker; für den Chat sind zusätzlich ein Groq-API-Schlüssel und eine funktionierende Chat-Ratenbegrenzung erforderlich.

1. Ergänze vor der Bereitstellung in `cloudflare/wrangler.jsonc` den genauen Ursprung deiner gehosteten Website unter `ALLOWED_ORIGINS`. Die eingecheckte Konfiguration enthält lokale Ursprünge.
2. Stelle den Worker bereit:

   ```bash
   cd cloudflare
   npm install
   npx wrangler login
   npx wrangler deploy
   ```

3. Speichere deinen Groq-Schlüssel als Cloudflare-Worker-Secret:

   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```

4. Prüfe den [Worker-Status](https://apikey.elias256.workers.dev/health) und verwende anschließend die Verbindungsprüfung auf deiner gehosteten Website.

Speichere den Groq-Schlüssel niemals in Frontend-Dateien, Commits oder öffentlichen Dokumentationen. Für eine Einrichtung nur über das Dashboard folge der [Cloudflare-Dashboard-Anleitung](CLOUDFLARE_DASHBOARD.de.md). Der Worker-Quellcode stellt die Endpunkte `/health`, `/texture`, `/ephemeris` und `/chat` bereit.

## Daten und Einschränkungen

- Eine erfolgreiche Worker-Anfrage an `/ephemeris` ruft Sonnen-/Erdazimut und -höhe für die Beispielkoordinaten von NASA/JPL Horizons ab. Schlägt die Anfrage fehl oder fehlen Werte für einen Standort, meldet die App einen Fehler oder N/A, statt Demo-Schätzungen als Live-JPL-Daten auszugeben.
- Importierte Horizons-formatierte JSON-Dateien werden strukturell geprüft; ihre Herkunft wird von der App nicht unabhängig verifiziert.
- Die Sichtbarkeit wird anhand eines geometrischen Horizonts und stündlicher Stichproben berechnet. Lokales Gelände, Kraterwände, Antennenhardware und kontinuierliche Bedingungen werden nicht modelliert; der Prozentwert entspricht dem Anteil der Stichproben oberhalb des Horizonts.
- Das NASA-SVS-/LRO-WAC-Bild dient der visuellen Orientierung und ist keine kalibrierte SAR-, Eis- oder Landegefahrenkarte.
- Die ursprünglichen Eis-, Hangneigungs-, Temperatur- und Rückstreuungswerte, PSR-/Gefahren-Overlays sowie das lokale ML-Modell sind illustrative Demo-Inhalte. CPR allein weist kein Wassereis nach.
- Chatnachrichten und der angezeigte Missionskontext werden über den Worker an Groq gesendet. Der Worker hält den API-Schlüssel serverseitig; das Modell ist jedoch keine maßgebliche Quelle.

Ausführliche Informationen zu Einrichtung, Fehlerbehebung, Endpunkten und Einschränkungen findest du im [vollständigen deutschen Leitfaden](docs/README.de.md) und in der [interaktiven Hilfe](docs/guide.html).

[↑ Deutsch](#deutsch) · [↑ English](#english)





