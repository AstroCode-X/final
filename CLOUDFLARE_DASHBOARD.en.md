# Dancing with SARS — Enable Groq chat using only the Cloudflare dashboard (English)

[Deutsch](CLOUDFLARE_DASHBOARD.de.md) · [English](CLOUDFLARE_DASHBOARD.en.md)

As of 15 October 2026 · Worker: https://apikey.elias256.workers.dev

## 1. Understanding the current `/health` response

- `groq_configured: true`: the Groq API secret is configured. Never publish its value.
- `chat_rate_limit_configured: false`: the native rate limiting binding is missing and the previous Worker deliberately rejects chat requests.
- `data_rate_limit_configured: false`: data requests are not using a native limiter; this is not the direct reason chat is blocked.
- `browser_origin: null` means no `Origin` header was sent by your direct browser navigation. `origin_allowed: true` therefore **does not prove** your actual website is whitelisted.

Native rate limit bindings are configured with Wrangler, not through the normal dashboard bindings workflow. This package includes a dashboard-installable **Workers KV-based, best-effort alternative**. It is not an atomic rate limiter, and is unsuitable as sole protection for a public, paid AI API.

## 2. Create and bind Workers KV using the web dashboard

1. Visit https://dash.cloudflare.com.
2. Open **Workers KV** (sometimes **Storage & databases > KV**) and choose **Create instance / Create namespace**.
3. Name it `dancing-sars-chat-limits`.
4. Open **Workers & Pages** > Worker `apikey` (corresponding to `https://apikey.elias256.workers.dev`).
5. Under **Bindings** or **Settings > Bindings**, click **Add binding** > **KV namespace**.
6. **Variable name must be `CHAT_RATE_KV`**. Choose your `dancing-sars-chat-limits` namespace.
7. Click **Add binding / Deploy**.

The variable must be called `CHAT_RATE_KV`, not `CHAT_RATE_LIMITER`. One KV namespace serves both chat and NASA throttling in the updated code. Official docs: https://developers.cloudflare.com/kv/concepts/kv-namespaces/

## 3. Replace Worker code in the Cloudflare web editor

Go to **Workers & Pages > apikey > Edit code**, save a copy of the old script, replace it with the **complete** content of `cloudflare/worker.js`, and **Deploy**. Make sure you update the existing `apikey` Worker and do not create a new worker with a different address.

Your existing `GROQ_API_KEY` Secret can remain as-is under **Settings > Variables and Secrets**. Never paste the key into source code or the front-end.

## 4. Configure website CORS

Open your actual website and copy only its origin, such as `https://my-project.pages.dev`. In Worker `apikey` go to **Settings > Variables and Secrets > Add**. Set a **Text** variable called `ALLOWED_ORIGINS` to that exact origin. Multiple origins must be comma-separated. Save/deploy the variable change.

Do **not** use `*` or add `null` merely to enable `file://` usage; host the site over HTTPS on Cloudflare Pages instead.

## 5. Test online

Open https://apikey.elias256.workers.dev/health. Expected fields:

```json
{
  "version": "2026.10.15-dashboard-kv.1",
  "groq_configured": true,
  "chat_rate_limit_configured": true,
  "chat_rate_limit_mode": "kv_approximate",
  "chat_ready": true,
  "data_rate_limit_configured": true
}
```

When you directly browse to `/health`, `browser_origin: null` is expected. Next open your **actual website**, press **Check Connection** and try a short question in the AI chat. A real cross-origin request should report the browser's website origin as `browser_origin`, with `origin_allowed: true`.

If you still see `Load failed`, check **Developer Tools > Network** for `OPTIONS /chat` and `POST /chat`, and see Cloudflare **Worker > Observability** for errors. Common status codes: 403 origin blocked; 503 configuration missing; 429 request limit; 502 upstream Groq/NASA error.

## 6. Real NASA data versus demo content

- `/texture` attempts to fetch a NASA SVS/LRO image, which is **not** a calibrated SAR or water ice map.
- `/ephemeris` attempts to request real JPL Horizons Sun/Earth azimuth and elevation time series. Only successful responses are shown as live JPL data.
- The original hard-coded ice scores, slopes, hazard polygons, and model estimates remain **unverified demo values**, not certified NASA observations.
- If NASA data cannot be fetched, the front-end must show an error or a clearly labeled demo fallback. Obtaining validated ice/slope maps requires a separately documented scientific data pipeline.

## 7. Security caution

The KV-based limiter records short-lived request tokens and aims for approximately 8 chat requests per IP per minute. Workers KV is eventually consistent, so concurrent requests may bypass the intended limit, and KV read/write operations have their own quotas. For a public and potentially paid Groq service, use the native Cloudflare rate limiter via Wrangler or a strongly consistent Durable Object, and add protection such as Cloudflare Access/Turnstile and appropriate Groq billing limits.

Domain-level WAF rate limiting is **not** the same as creating a `CHAT_RATE_LIMITER` Worker binding on a `workers.dev` subdomain.

## 8. Included files

- `cloudflare/worker.js`: full Cloudflare Worker code (Groq chat, NASA, optional native limiter + KV fallback)
- `web/` and `index.html` + `assets/`: original 2D/3D moon web app
- `assets/worker-diagnostics.js`: updated diagnostic UI for dashboard KV mode
- `tests/dashboard-kv.test.mjs`: mocked behavior tests; not a live API test

No real Groq API secrets are included.
