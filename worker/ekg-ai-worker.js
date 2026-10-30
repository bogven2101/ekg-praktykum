// ЕКГ Практикум — сервер-посередник для розбору ЕКГ через Claude API (Cloudflare Worker)
// Секрети (Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY — ключ з console.anthropic.com
//   APP_TOKEN         — токен застосунку (з файлу www/config.js)
// Необов'язкова змінна MODEL (за замовчуванням claude-sonnet-5-5).

const ALLOWED_ORIGINS = [
  "https://bogven2101.github.io", // сайт
  "https://localhost",            // Android-застосунок (Capacitor)
  "http://localhost",
];
const MAX_IMAGES = 10;
const MAX_BODY = 12 * 1024 * 1024; // 12 МБ

function cors(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const json = (data, status, origin) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...cors(origin) } });

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "POST") return json({ ok: true, service: "ЕКГ Практикум ШІ" }, 200, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "origin" }, 403, origin);
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return json({ error: "too_large" }, 413, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, origin); }
    if (!env.APP_TOKEN || body.token !== env.APP_TOKEN) return json({ error: "token" }, 401, origin);
    const prompt = String(body.prompt || "").slice(0, 20000);
    const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
    if (!prompt || !images.length) return json({ error: "empty" }, 400, origin);

    const content = images.map((data) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: String(data) } }));
    content.push({ type: "text", text: prompt + "\n\nВідповідай ТІЛЬКИ одним JSON-об'єктом, без markdown." });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.MODEL || "claude-sonnet-5-5",
        max_tokens: 2500,
        messages: [{ role: "user", content }],
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const status = r.status === 429 || r.status === 529 ? 429 : 502;
      return json({ error: (d.error && d.error.message) || "upstream" }, status, origin);
    }
    const text = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    return json({ text }, 200, origin);
  },
};
