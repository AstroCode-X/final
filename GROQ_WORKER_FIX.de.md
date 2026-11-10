# KI-Chat: `Load failed` – konkrete Reparatur (15.10.2026)

[Deutsch](GROQ_WORKER_FIX.de.md) · [English](GROQ_WORKER_FIX.en.md)

## Was dein Status wirklich aussagt

Deine derzeitige `/health`-Antwort lautet:

```json
{"status":"ok","service":"Dancing with SARS","groq_configured":true,"chat_rate_limit_configured":false,"nasa":"JPL Horizons / NASA SVS LROC","model":"llama-3.3-70b-versatile"}
```

- **`groq_configured: true`**: Der Schlüssel ist im **gerade antwortenden Worker** hinterlegt. Bitte keinen Schlüssel im Browser teilen oder einfügen.
- **`chat_rate_limit_configured: false`**: Das Binding **`CHAT_RATE_LIMITER`** ist nicht aktiv. Der Worker blockiert bezahlte Chat-Aufrufe dann aus Sicherheitsgründen.
- **`service: "Dancing with SARS"`**: Es läuft die **alte Worker-Version**. Die neue Version hat `service: "Dancing with SARS API"` und zeigt `origin_allowed` und `version` an.
- **`Load failed`**: Der Browser kann auch durch fehlende CORS-Freigabe scheitern, bevor er überhaupt die JSON-Fehlermeldung über das fehlende Binding lesen kann.

**Der API-Key ist wahrscheinlich nicht das Problem.** Erst Worker aktualisieren + Binding installieren + Website-Origin freigeben.

## Korrigierten Worker veröffentlichen (empfohlen)

1. ZIP entpacken und im Terminal in den Ordner `cloudflare` wechseln.
2. Öffne `cloudflare/wrangler.jsonc`. Unter `ALLOWED_ORIGINS` zusätzlich die **exakte Origin deiner Website** eintragen. Beispiel:

```json
"ALLOWED_ORIGINS": "http://localhost:8000,http://127.0.0.1:8000,https://DEIN-PROJEKT.pages.dev"
```

`https://DEIN-PROJEKT.pages.dev` musst du durch deine **wirkliche** Domain ersetzen! Die genaue Origin kannst du im Browser auf deiner Website mit `location.origin` in der Entwicklerkonsole ermitteln. `file://` nicht verwenden. Verwende weder Pfad noch einen abschließenden `/`.

3. Führe diese Befehle im `cloudflare`-Ordner aus:

```bash
npm install
npx wrangler login
npx wrangler whoami
npx wrangler deploy
```

`wrangler.jsonc` enthält **`name: "apikey"`** und die Rate-Limit-Bindings **`CHAT_RATE_LIMITER`** (8 Anfragen/Minute) sowie **`DATA_RATE_LIMITER`**. Beim Deployment müssen sie zum Worker hinzugefügt werden. Cloudflare-Doku: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

4. Dein Secret war bereits `true`. Normalerweise **nicht erneut setzen**. Nur wenn es nach dem Deployment fehlt:

```bash
npx wrangler secret put GROQ_API_KEY
```

Diesen Befehl fragt den Schlüssel im Terminal ab – niemals im Website-Code und niemals im Chat posten.

5. Den aktualisierten **`web/`-Ordner** auf Cloudflare Pages hochladen. Die HTML/JS-Dateien wurden korrigiert, damit eine veraltete Worker-Version und fehlende Bindings beim ersten Chatversuch erkannt und verständlich angezeigt werden.

## Prüfung nach dem Deployment

1. Öffne https://apikey.elias256.workers.dev/health. Die JSON-Ausgabe sollte unter anderem enthalten:

```json
{
  "status":"ok",
  "service":"Dancing with SARS API",
  "version":"2026.10.15-cors-and-binding-fix.2",
  "groq_configured":true,
  "chat_rate_limit_configured":true
}
```

2. **Achtung:** Beim direkten Öffnen von `/health` sendet der Browser normalerweise **keinen `Origin`-Header**. `origin_allowed: true` dort beweist deshalb *nicht*, dass die echte Website-Origin freigegeben ist.
3. Öffne deine **Website** über HTTPS, klicke auf `VERBINDUNG PRÜFEN`. Dort muss `Website-Origin: freigegeben` stehen.
4. Schreibe `Hallo` im KI-Chat. Erst dann ist der echte Groq-API-Aufruf geprüft.

### Alternativer CORS-Test (fortgeschritten)

Die URL im `Origin:`-Header **exakt** anpassen:

```bash
curl -i -X OPTIONS 'https://apikey.elias256.workers.dev/chat' \
  -H 'Origin: https://DEIN-PROJEKT.pages.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Erwartet: Status `204` mit `Access-Control-Allow-Origin: https://DEIN-PROJEKT.pages.dev` und `Access-Control-Allow-Headers: Content-Type`. Bei `403` ist deine Origin nicht freigegeben.

## Wenn es weiterhin nicht funktioniert

- `service` ist noch `"Dancing with SARS"`: altes Skript ist immer noch online. Prüfe Workername `apikey`, das richtige Cloudflare-Konto (`npx wrangler whoami`) und das erfolgreiche Deployment.
- `chat_rate_limit_configured: false`: Deployment/Binding wurde nicht übernommen; `ratelimits` in `wrangler.jsonc` sowie Ausgaben von `wrangler deploy` überprüfen.
- `origin_allowed: false` **in der Website-Statusanzeige**: `ALLOWED_ORIGINS` exakt korrigieren, deployen und Browser neu laden.
- Groq HTTP 401/403: Secret oder Zugriffsrechte prüfen. Groq HTTP 429: Limits prüfen.
- `file://`: Starte den mitgelieferten lokalen Server oder hoste `web/` auf Pages.
- `Load failed` trotz erfolgreicher `/health`-Diagnose: Browser-Konsole → **Network** → `/chat` bzw. `OPTIONS /chat` prüfen. Netzsperre, Browser-Erweiterungen und Preflight können ebenfalls beteiligt sein.

## Was mit echten NASA-Daten ist

Dieser Hotfix korrigiert **die Anbindung**, er erfindet keine Messungen. `JPL LIVE LADEN` lädt Sonnen- und Erdazimut/Elevation über `/ephemeris`. Diese werden nur nach erfolgreichem, überprüfbarem JPL-Abruf als NASA/JPL-Werte angezeigt. Die Eis-Scores, Hangneigungen, PSR-/Gefahrenpolygone und lokalen ML-Werte aus deinem ursprünglichen Prototyp bleiben **DEMO**. Die NASA-Bildtextur `/texture` ist kein SAR- oder Höhenmodell.

**Sicherheit:** Ein öffentlich zugänglicher Worker mit Groq-Secret kann Kosten erzeugen. Lass das serverseitige Rate-Limit aktiv. CORS schützt den Browserzugriff, ist aber keine vollständige API-Authentifizierung.
