import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';

const base = 'https://apikey.elias256.workers.dev';
const origin = 'https://example-site.pages.dev';
const chats = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(options.headers.Authorization, 'Bearer FAKE-SECRET-FOR-TESTS');
  chats.push(url);
  return new Response(JSON.stringify({ choices: [{ message: { content: 'Testantwort' } }] }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
function fakeKV() {
  const store = new Map();
  return {
    store,
    async list({ prefix, limit }) {
      return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name })) };
    },
    async put(key, val, options) {
      assert.equal(options.expirationTtl, 120);
      assert.equal(val, '1');
      store.set(key, val);
    }
  };
}
const kv = fakeKV();
const env = {GROQ_API_KEY:'FAKE-SECRET-FOR-TESTS', ALLOWED_ORIGINS:origin, CHAT_RATE_KV:kv};
const ctx = { waitUntil() {} };
function request(path, options={}) {
  return new Request(base+path, { ...options, headers: { Origin:origin, 'CF-Connecting-IP':'192.0.2.1', ...(options.headers||{}) } });
}
function body() {return JSON.stringify({messages:[{role:'user',content:'Wie ist der Mond?'}]});}
test('KV fallback exposed as ready without native rate limit', async () => {
  const resp = await worker.fetch(request('/health'),env,ctx);
  const data=await resp.json();
  assert.equal(data.chat_ready,true);
  assert.equal(data.chat_rate_limit_configured,true);
  assert.equal(data.chat_rate_limit_mode,'kv_approximate');
  assert.equal(data.data_rate_limit_configured,true);
  assert.equal(data.browser_origin,origin);
  assert.equal(data.origin_allowed,true);
  assert.equal(JSON.stringify(data).includes('FAKE-SECRET-FOR-TESTS'),false);
});
test('KV fallback allows 8 messages then rejects the ninth', async () => {
  for (let i=0;i<8;i++) {
    const r=await worker.fetch(request('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:body()}),env,ctx);
    assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  }
  const rejected=await worker.fetch(request('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:body()}),env,ctx);
  assert.equal(rejected.status,429);
  assert.equal(chats.length,8);
});
test('OPTIONS preflight sends correct CORS response', async () => {
  const r=await worker.fetch(request('/chat',{method:'OPTIONS',headers:{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),env,ctx);
  assert.equal(r.status,204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
});
test('untrusted browser origin is not authorized', async () => {
  const r=await worker.fetch(new Request(base+'/health',{headers:{Origin:'https://bad.example'}}),env,ctx);
  assert.equal((await r.json()).origin_allowed,false);
  const x=await worker.fetch(new Request(base+'/chat',{method:'POST',headers:{Origin:'https://bad.example','Content-Type':'application/json'},body:body()}),env,ctx);
  assert.equal(x.status,403);
});
