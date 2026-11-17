// Cloudflare Worker: вход через Telegram + проверка подписки + хранение Pink Hearts.
// Секреты (wrangler secret put): BOT_TOKEN, SIGN_KEY. Переменные: CHANNEL, ORIGIN, ADMINS. KV: DB.
const TASKS = {1: 50, 2: 30, 3: 40};                 // id -> награда (как в data.js, без заблокированных)
const SHOP = {1: 100, 2: 150, 3: 200, 4: 300, 5: 250, 6: 120, 7: 200, 8: 500};
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(keyData, msg) {
  const k = await crypto.subtle.importKey("raw", keyData, {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
async function verifyTelegram(d, botToken) {
  const {hash, ...rest} = d;
  const check = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
  const secret = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const sig = hex(await hmac(secret, check));
  return sig === hash && Date.now() / 1000 - Number(rest.auth_date) < 86400;
}
async function isMember(env, uid) {
  const u = `https://api.telegram.org/bot${env.BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(env.CHANNEL)}&user_id=${uid}`;
  const r = await (await fetch(u)).json();
  if (!r.ok) return false;
  const s = r.result.status;
  return ["member", "administrator", "creator"].includes(s) || (s === "restricted" && r.result.is_member);
}
async function sign(env, payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  return body + "." + b64u(await hmac(enc.encode(env.SIGN_KEY), body));
}
async function readToken(env, req) {
  const t = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const [body, sig] = t.split(".");
  if (!body || !sig) return null;
  if (b64u(await hmac(enc.encode(env.SIGN_KEY), body)) !== sig) return null;
  const p = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  return p.exp > Date.now() ? p : null;
}
const view = (u) => ({hearts: u.hearts, done: u.done, bought: u.bought});

export default {
  async fetch(req, env) {
    const cors = {"Access-Control-Allow-Origin": env.ORIGIN, "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
    const out = (o, s = 200) => new Response(JSON.stringify(o), {status: s, headers: {...cors, "Content-Type": "application/json"}});
    if (req.method === "OPTIONS") return new Response(null, {headers: cors});
    const path = new URL(req.url).pathname;
    try {
      if (path === "/auth" && req.method === "POST") {
        const d = await req.json();
        if (!(await verifyTelegram(d, env.BOT_TOKEN))) return out({ok: false, error: "Не удалось подтвердить вход через Telegram."}, 401);
        if (!(await isMember(env, d.id))) return out({ok: false, error: "Сначала подпишись на закрытый канал, потом войди снова."}, 403);
        const key = "u:" + d.id;
        let u = await env.DB.get(key, "json");
        const name = d.username || d.first_name || "Guest";
        if (!u) u = {name, hearts: 0, done: [], bought: []};
        u.name = name;
        await env.DB.put(key, JSON.stringify(u));
        const token = await sign(env, {id: d.id, exp: Date.now() + 7 * 864e5});
        return out({ok: true, token, name, ...view(u)});
      }
      const me = await readToken(env, req);
      if (!me) return out({ok: false, error: "Войди заново."}, 401);
      if (!(await isMember(env, me.id))) return out({ok: false, error: "Подписка на канал не найдена."}, 403);
      const key = "u:" + me.id;
      const u = await env.DB.get(key, "json");
      if (!u) return out({ok: false, error: "Войди заново."}, 401);

      if (path === "/me") return out({ok: true, name: u.name, ...view(u)});
      if (path === "/task" && req.method === "POST") {
        const {id} = await req.json();
        if (!TASKS[id] || u.done.includes(id)) return out({ok: false, error: "Задание недоступно."}, 400);
        u.done.push(id); u.hearts += TASKS[id];
      } else if (path === "/buy" && req.method === "POST") {
        const {id} = await req.json();
        if (!SHOP[id] || u.bought.includes(id)) return out({ok: false, error: "Товар недоступен."}, 400);
        if (u.hearts < SHOP[id]) return out({ok: false, error: "Не хватает Pink Hearts."}, 400);
        u.hearts -= SHOP[id]; u.bought.push(id);
      } else if (path === "/posts") {
        let posts = (await env.DB.get("posts", "json")) || [];
        if (req.method === "POST") {
          const {text} = await req.json();
          const x = String(text || "").trim().slice(0, 500);
          if (!x) return out({ok: false, error: "Пустое сообщение."}, 400);
          const adm = (env.ADMINS || "").split(",").includes(String(me.id));
          posts.unshift({a: u.name, adm: adm ? 1 : 0, time: new Date().toLocaleString("ru-RU", {timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"}), x, l: 0, c: 0});
          posts = posts.slice(0, 100);
          await env.DB.put("posts", JSON.stringify(posts));
        }
        return out({ok: true, posts});
      } else return out({ok: false, error: "Не найдено."}, 404);
      await env.DB.put(key, JSON.stringify(u));
      return out({ok: true, ...view(u)});
    } catch (e) {
      return out({ok: false, error: "Ошибка сервера."}, 500);
    }
  }
};
