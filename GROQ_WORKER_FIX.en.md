# Fix: Groq chat shows `Load failed` (October 15, 2026)

[Deutsch](GROQ_WORKER_FIX.de.md) · [English](GROQ_WORKER_FIX.en.md)

Your `/health` response contains `groq_configured: true`, `chat_rate_limit_configured: false`, and `service: "Dancing with SARS"`. This means that your key is configured, **but the chat rate-limiting binding is missing and an older Worker version is deployed**. The browser's `Load failed` message may additionally be caused by blocked CORS preflight requests.

## Deploy the new Worker

1. In `cloudflare/wrangler.jsonc`, edit `ALLOWED_ORIGINS` so it includes the **exact origin** of your hosted page, for example `https://your-project.pages.dev`. Keep the localhost origins if you test locally. Do not include a trailing slash or a path. In your browser console, `location.origin` prints the correct value.
2. From the `cloudflare` folder, run:

```bash
npm install
npx wrangler login
npx wrangler whoami
npx wrangler deploy
```

The project configuration deploys Worker `apikey` and includes `CHAT_RATE_LIMITER` and `DATA_RATE_LIMITER` bindings using Cloudflare's rate-limiting API. Make sure it is the correct Cloudflare account and Worker.

3. The existing `GROQ_API_KEY` secret normally does not need to be re-entered. If `/health` reports it missing after deployment, use `npx wrangler secret put GROQ_API_KEY` to set it **in Cloudflare**, never in website code.
4. Upload the updated `web/` directory to Cloudflare Pages.
5. Visit https://apikey.elias256.workers.dev/health. Check that the returned service is `Dancing with SARS API`, the version is `2026.10.15-cors-and-binding-fix.2`, and both `groq_configured` and `chat_rate_limit_configured` are `true`.
6. Check the Worker status **from the hosted website**, because opening `/health` directly does not normally send a browser `Origin` header. `origin_allowed: true` in a direct navigation does not prove the website is permitted.
7. Finally, send a chat message to verify the real Groq connection.

## CORS preflight check

Replace the example Origin:

```bash
curl -i -X OPTIONS 'https://apikey.elias256.workers.dev/chat' \
  -H 'Origin: https://your-project.pages.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Expected: HTTP 204 and `Access-Control-Allow-Origin` matching the origin, plus `Access-Control-Allow-Headers: Content-Type`. HTTP 403 means the website origin is not permitted.

`file://` is not a suitable way to test the hosted API; use a local HTTP server or Cloudflare Pages. CORS does **not** replace API authentication or rate limiting; keep the rate-limit binding enabled to reduce possible Groq usage costs.

**Data provenance:** Live NASA/JPL Sun/Earth angles are provided only after a successful `/ephemeris` call. Ice scores, slopes, polygons and local ML scores are still clearly labeled as demo data. External upstream services have not been tested live from this environment.
