# Dancing with SARS — Groq-Chat ohne Terminal in Cloudflare aktivieren (Deutsch)

[Deutsch](CLOUDFLARE_DASHBOARD.de.md) · [English](CLOUDFLARE_DASHBOARD.en.md)

Stand: 15.10.2026 · Worker: https://apikey.elias256.workers.dev

## 1. Was zeigt dein derzeitiger `/health`-Status?

Die Werte `groq_configured: true`, `chat_rate_limit_configured: false`, `data_rate_limit_configured: false`, `origin_allowed: true`, `browser_origin: null` bedeuten:

- Der Worker antwortet und das Groq-Secret ist eingerichtet. Den Secret-Wert bitte niemals weitergeben.
- Das **native** Rate-Limit-Binding fehlt. Der alte Worker lässt den Chat deswegen absichtlich nicht zu.
- `browser_origin: null` bedeutet, dass der Browser `/health` **ohne Origin-Header** geöffnet hat. `origin_allowed: true` beweist in diesem Fall **nicht**, dass deine eigentliche Website freigegeben ist.
- `data_rate_limit_configured: false` hat den Chat nicht direkt blockiert; es sollte aber gegen Missbrauch möglichst eine Daten-Anfragebegrenzung geben.

Die speziellen Cloudflare-Rate-Limit-Bindings können nicht wie ein normales KV-Binding allein im Web-Dashboard hinzugefügt werden; sie werden über Wrangler konfiguriert. Da du ausschließlich das Dashboard verwendest, beinhaltet dieser Patch eine **Workers-KV-Alternative**. Diese ist wegen Eventual Consistency nur eine ungefähre Begrenzung, kein sicherer Schutz gegen gleichzeitige oder verteilte Angriffe.

## 2. Workers KV im Cloudflare-Dashboard anlegen

1. Öffne https://dash.cloudflare.com und melde dich an.
2. Wechsle zu **Workers KV** (ggf. unter **Storage & databases** > **KV**).
3. **Create instance** oder **Create namespace** auswählen.
4. Als Namespace-Namen zum Beispiel `dancing-sars-chat-limits` eintragen und erstellen.
5. Zurück zu **Workers & Pages** > Worker **`apikey`** wechseln (dieser Name gehört zu `https://apikey.elias256.workers.dev`).
6. Im Worker auf **Bindings** bzw. **Settings > Bindings** gehen, **Add binding** anklicken und **KV namespace** auswählen.
7. Unbedingt **Variable name: `CHAT_RATE_KV`** eingeben, dann `dancing-sars-chat-limits` auswählen.
8. **Add binding / Deploy** bestätigen.

Die Variable muss exakt `CHAT_RATE_KV` heißen, nicht `CHAT_RATE_LIMITER`. Nur der neue Dashboard-Worker benutzt dieses KV-Binding. Du brauchst keine zweite KV-Namespace: Die NASA-Abfragen können dieselbe Namespace für eine separate Begrenzung benutzen.

Cloudflare-Anleitung: https://developers.cloudflare.com/kv/concepts/kv-namespaces/

## 3. Neuen Worker-Code online einsetzen

1. In **Workers & Pages** auf `apikey` gehen.
2. **Edit code** öffnen. Lege vorher eine Kopie des alten Skripts an.
3. Den **vollständigen Inhalt** der Datei `cloudflare/worker.js` aus diesem Paket in den Cloudflare-Codeeditor übernehmen. Der Code unterstützt sowohl native Rate-Limit-Bindings als auch den hier beschriebenen KV-Fallback.
4. **Deploy** ausführen. Achte darauf, dass der vorhandene Worker `apikey` aktualisiert wird und nicht ein zweiter Worker entsteht.

Du musst den API-Key nicht erneut eintragen, solange `GROQ_API_KEY` in `Settings > Variables and Secrets` als **Secret** vorhanden ist. Nie `GROQ_API_KEY` in den JavaScript-Code oder in die Website kopieren.

## 4. `ALLOWED_ORIGINS` im Dashboard festlegen

1. Öffne die veröffentlichte Website mit deinem Mond-Dashboard und kopiere ihre Adresse **bis zum Domain-Namen**, z. B. `https://mein-projekt.pages.dev`. **Nicht** `index.html` oder andere Pfade hinzufügen.
2. Cloudflare: `apikey` > **Settings** > **Variables and Secrets** > **Add**.
3. Typ **Text**, Name **`ALLOWED_ORIGINS`**, Wert beispielsweise:

   `https://mein-projekt.pages.dev`

4. Falls du mehrere echte Domains nutzt, Komma-getrennt ohne Leerzeichen:

   `https://mein-projekt.pages.dev,https://mond.example.de`

5. Speichern/Deploy bestätigen.

Kein `*` einsetzen, wenn der Worker einen öffentlich erreichbaren Groq-Zugang anbietet. Für eine lokal per `file://` geöffnete Datei kann die Origin `null` sein; statt diese unsichere Origin freizuschalten, veröffentliche die Website auf Cloudflare Pages.

## 5. Test ohne Terminal

Öffne: https://apikey.elias256.workers.dev/health

Nach dem Update sollte die Antwort u. a. Folgendes anzeigen:

```json
{
  "status": "ok",
  "service": "Dancing with SARS API",
  "version": "2026.10.15-dashboard-kv.1",
  "groq_configured": true,
  "chat_rate_limit_configured": true,
  "chat_rate_limit_mode": "kv_approximate",
  "chat_ready": true,
  "data_rate_limit_configured": true
}
```

Beim direkten Aufruf bleibt `browser_origin: null` **normal**. Öffne dann dein tatsächliches Mond-Dashboard, klicke auf **VERBINDUNG PRÜFEN** und teste den KI-Chat mit einer kurzen Frage. Wenn du aus der Website heraus auf `/health` zugreifst, sollte `browser_origin` die wirkliche Website-Origin anzeigen und `origin_allowed` wahr sein.

Wenn wieder `Load failed` erscheint: Browser-Entwicklertools > **Network** > `OPTIONS /chat` und `POST /chat` prüfen. Der Worker unter **Observability** zeigt Fehler und Ausnahmen. Prüfe insbesondere HTTP 403 (Origin), 503 (Binding/Secret), 429 (Limit), 502 (Groq- oder NASA-Upstream).

## 6. Was sind echte NASA-Daten?

- `GET /texture` liefert bei erfolgreichem Abruf eine NASA-SVS/LRO-Bildtextur. Sie ist keine georeferenzierte SAR- oder Eisdatenkarte.
- `GET /ephemeris` ruft JPL Horizons für Sonnen-/Erde-Azimut und -Elevation ab. Die Zeitreihen werden nur bei erfolgreicher Antwort als `NASA/JPL Horizons` beschriftet.
- Die im ursprünglichen Projekt hinterlegten `ice_score`, `slope_deg`, Gefahrenpolygone und Modellschätzungen sind **keine nachgewiesenen NASA-Messungen**. Der Worker kann diese nicht durch ein bloßes Umbenennen echt machen.
- Bei externer Nichterreichbarkeit zeigen Worker und Website eine Fehlermeldung beziehungsweise eine klar gekennzeichnete Demo. Für verifizierte Eiskarten und Geländeeigenschaften ist eine eigene dokumentierte Datenpipeline erforderlich.

## 7. Sicherheit und Belastbarkeit

Der KV-Limiter erstellt pro Anfrage einen kurzlebigen Eintrag und lässt pro IP ungefähr 8 Chat-Anfragen/Minute zu. KV synchronisiert **nicht atomar** über alle Standorte. Gleichzeitige Anfragen können das Limit überholen; außerdem können KV-Operationen Kosten und Limits verursachen. Dies ist für eine Demo mit wenigen Nutzern geeignet, **nicht** als harter Schutz für eine öffentlich zugängliche, kostenpflichtige Groq-API. Für eine produktive Anwendung: natives Cloudflare-Rate-Limit-Binding via Wrangler oder einen atomaren Durable Object Limiter einsetzen, zusätzlich Schutz wie Cloudflare Access/Turnstile und ein begrenztes Groq-Budget.

**Nicht zu verwechseln:** WAF Rate Limiting im Domain-Dashboard ist ein anderer Mechanismus und konfiguriert nicht automatisch `CHAT_RATE_LIMITER` in einem Worker auf `workers.dev`.

## 8. Dateien

- `cloudflare/worker.js`: komplettes Dashboard-taugliches Worker-Skript (Groq + NASA + KV-Limiter)
- `web/` oder `index.html` und `assets/`: Dashboard mit 2D/3D-Mond und KI-Chat
- `assets/worker-diagnostics.js`: angepasster Diagnosetext mit KV-Unterstützung
- `tests/dashboard-kv.test.mjs`: automatisierte **Mock-Tests**, keine Live-Cloudflare-Prüfung

**Keine** realen Groq-Secrets sind in der ZIP enthalten.
