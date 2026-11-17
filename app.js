(function () {
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("mb_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mb_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const D = window.DEMO;
  let state = store.get("state", null);
  const save = () => store.set("state", state);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

  const NAV = [["home", "Главная", "⌂"], ["profile", "Мой профиль", "☺"], ["ach", "Мои достижения", "🏆"], ["tasks", "Задания", "✔"],
    ["shop", "Магазин", "🛍"], ["community", "Сообщество", "💬"], ["rating", "Рейтинг", "▮"]];

  function rank(h) { let r = RANKS[0]; RANKS.forEach((x) => { if (h >= x.min) r = x; }); return r; }
  function nextRank(h) { return RANKS.find((x) => x.min > h); }

  function init() {
    $("#nav").innerHTML = NAV.map((n) => `<a href="#${n[0]}" data-r="${n[0]}"><i>${n[2]}</i>${n[1]}</a>`).join("");
    $("#age-yes").onclick = () => { store.set("age", 1); $("#gate").classList.add("hidden"); step(); };
    $("#demo-login").onclick = () => {
      state = {user: D.user.name, hearts: D.user.hearts, bought: [], done: [], posts: D.posts.slice(), liked: []};
      save(); step();
    };
    $("#logout").onclick = () => { state = null; save(); location.hash = ""; step(); };
    $("#burger").onclick = () => $(".side").classList.toggle("open");
    $("#nav").onclick = () => $(".side").classList.remove("open");
    window.addEventListener("hashchange", render);
    mountTelegram();
    if (window.CONFIG.authUrl) $("#demo-login").classList.add("hidden");
    if (store.get("age", 0)) $("#gate").classList.add("hidden"); else { $("#gate").classList.remove("hidden"); }
    step();
    if (state && state.token) syncMe();
  }

  function step() {
    const aged = store.get("age", 0);
    $("#login").classList.toggle("hidden", !aged || !!state);
    $("#app").classList.toggle("hidden", !aged || !state);
    if (aged && state) render();
  }

  function mountTelegram() {
    const c = window.CONFIG;
    if (!c.botName) return;
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.dataset.telegramLogin = c.botName;
    s.dataset.size = "large";
    s.dataset.onauth = "onTelegramAuth(user)";
    s.dataset.requestAccess = "write";
    $("#tg-widget").appendChild(s);
  }
  // Этап 2: отправить данные на Worker, он проверит подпись и подписку на канал.
  window.onTelegramAuth = function (user) {
    if (!window.CONFIG.authUrl) { alert("Проверка подписки ещё не подключена."); return; }
    fetch(window.CONFIG.authUrl + "/auth", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(user)})
      .then((r) => r.json()).then((res) => {
        if (!res.ok) { alert(res.error || "Нужна подписка на канал."); return; }
        state = {token: res.token, user: res.name, hearts: res.hearts, done: res.done, bought: res.bought, posts: [], liked: []};
        save();
        refreshPosts().then(step);
      }).catch(() => alert("Не удалось проверить подписку. Попробуй позже."));
  };

  function api(path, body) {
    const o = {headers: {"Authorization": "Bearer " + state.token, "Content-Type": "application/json"}};
    if (body) { o.method = "POST"; o.body = JSON.stringify(body); }
    return fetch(window.CONFIG.authUrl + path, o).then((r) => r.json());
  }
  function refreshPosts() {
    return api("/posts").then((r) => { if (r.ok) { state.posts = r.posts; save(); } }).catch(() => {});
  }
  function syncMe() {
    api("/me").then((r) => {
      if (!r.ok) { alert(r.error || "Войди заново."); state = null; save(); step(); return; }
      Object.assign(state, {user: r.name, hearts: r.hearts, done: r.done, bought: r.bought});
      save(); render();
      refreshPosts().then(render);
    }).catch(() => {});
  }

  const V = {
    home() {
      const r = rank(state.hearts), nx = nextRank(state.hearts);
      const pct = nx ? Math.round((state.hearts - r.min) / (nx.min - r.min) * 100) : 100;
      return `<div class="hero" style="background-image:linear-gradient(90deg,#0b0509 10%,transparent 70%),url(img/hero.jpg)">
        <img class="ava ring" src="img/avatar.jpg" alt="">
        <div><h1>${esc(state.user)}</h1><span class="chip">${r.n}</span>
        <p class="script">Dream. Obey. Belong ♡</p>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <small>${state.hearts} Pink Hearts${nx ? " · до «" + nx.n + "» ещё " + (nx.min - state.hearts) : ""}</small></div></div>
        <div class="grid3">
          <div class="card stat"><b>${state.done.length}</b>заданий</div>
          <div class="card stat"><b>${D.ach.length}</b>достижений</div>
          <div class="card stat"><b>${state.hearts}</b>Pink Hearts</div></div>
        <div class="card"><h3>Активное задание</h3>${D.tasks.filter((t) => !t.locked && !state.done.includes(t.id)).slice(0, 1).map((t) => `<p><b>${t.t}</b> — ${t.d}</p><a class="btn" href="#tasks">Перейти к заданиям</a>`).join("") || "<p>Все задания выполнены. Новые появятся завтра.</p>"}</div>`;
    },
    profile() {
      const r = rank(state.hearts);
      return `<h2 class="title">Мой профиль</h2><div class="card prof"><img class="ava ring" src="img/avatar.jpg" alt=""><div>
        <h1>${esc(state.user)}</h1><span class="chip">${r.n}</span><p class="script">${esc(D.user.bio)}</p>
        <p>Роль: ${D.user.role}<br>Куплено предметов: ${state.bought.length}</p>
        <a class="btn ghost" href="${CONFIG.channelUrl}" target="_blank" rel="noopener">Открыть канал</a></div></div>
        <div class="card"><h3>Рамки аватара по рангам</h3><div class="ranks">${RANKS.map((x, i) => `<div class="rk ${state.hearts >= x.min ? "on" : ""}"><span>Lv.${i + 1}</span>${x.n}<small>от ${x.min}</small></div>`).join("")}</div></div>`;
    },
    ach() {
      return `<h2 class="title">Мои достижения</h2><p class="script">Твой путь в клубе Ms.Bimbo ♡</p><div class="grid4">${D.ach.map((a) => {
        const cur = a.cur === undefined ? a.need : a.cur, done = cur >= a.need;
        return `<div class="card ach ${done ? "done" : ""}"><div class="ico">${a.e}</div><b>${a.t}</b><small>${a.d}</small>${done ? '<span class="chip">Получено ✓</span>' : `<div class="bar"><i style="width:${cur / a.need * 100}%"></i></div><small>${cur} / ${a.need}</small>`}</div>`;
      }).join("")}</div>`;
    },
    tasks() {
      return `<h2 class="title">Задания</h2><p class="script">Выполняй задания, зарабатывай Pink Hearts ♡</p>${D.tasks.map((t) => {
        const done = state.done.includes(t.id);
        return `<div class="card row"><div><span class="chip s">${t.k}</span><h3>${t.t}</h3><small>${t.d}</small><br><span class="chip s">+${t.r} ♡</span></div>
        ${t.locked ? `<span class="muted">🔒 ${t.locked}</span>` : done ? '<span class="muted">Выполнено ✓</span>' : `<button class="btn" data-task="${t.id}">Выполнить</button>`}</div>`;
      }).join("")}`;
    },
    shop() {
      const cats = ["Все товары", "Доступы", "Украшения", "Контент", "Прочее"], cur = window._cat || "Все товары";
      return `<h2 class="title">Магазин</h2><p class="script">Покупай эксклюзивные товары и открывай новые возможности ♡</p>
      <div class="tabs">${cats.map((c) => `<button class="${c === cur ? "on" : ""}" data-cat="${c}">${c}</button>`).join("")}</div>
      <div class="grid4">${D.shop.filter((s) => cur === "Все товары" || s.c === cur).map((s) => {
        const own = state.bought.includes(s.id);
        return `<div class="card item"><div class="ico">${s.e}</div><b>${s.t}</b><span>${s.p} ♡</span>${own ? '<span class="muted">Куплено ✓</span>' : `<button class="btn" data-buy="${s.id}">Купить</button>`}</div>`;
      }).join("")}</div>`;
    },
    community() {
      return `<h2 class="title">Сообщество</h2><p class="script">Общайся, делись мыслями и находи единомышленниц ♡</p>
      <div class="card"><textarea id="post-t" rows="2" placeholder="Написать сообщение…"></textarea><button class="btn" id="post-go">Опубликовать</button></div>
      ${state.posts.map((p, i) => `<div class="card"><b>${esc(p.a)}</b> ${p.adm ? '<span class="chip s">Админ</span>' : ""} <small>${p.time}</small><p>${esc(p.x)}</p>
      <button class="link" data-like="${i}">${state.liked.includes(i) ? "♥" : "♡"} ${p.l + (state.liked.includes(i) ? 1 : 0)}</button> <small>💬 ${p.c}</small></div>`).join("")}`;
    },
    rating() {
      const rows = D.top.slice(0, 3).concat([[state.user, state.hearts]]).sort((a, b) => b[1] - a[1]);
      return `<h2 class="title">Рейтинг</h2><div class="card">${rows.map((r, i) => `<div class="row sm ${r[0] === state.user ? "me" : ""}"><span>${i + 1}. ${esc(r[0])}</span><b>${r[1]} ♡</b></div>`).join("")}</div>`;
    }
  };

  function render() {
    const r = (location.hash || "#home").slice(1);
    const key = V[r] ? r : "home";
    $("#view").innerHTML = V[key]();
    document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.r === key));
    $("#bal").textContent = state.hearts + " ♡";
    $("#who").textContent = state.user;
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-task],[data-buy],[data-cat],[data-like],#post-go");
    if (!t || !state) return;
    if (state.token) {
      let r = null;
      try {
        if (t.dataset.task) r = await api("/task", {id: +t.dataset.task});
        else if (t.dataset.buy) r = await api("/buy", {id: +t.dataset.buy});
        else if (t.id === "post-go") { const v = $("#post-t").value.trim(); if (!v) return; r = await api("/posts", {text: v}); }
      } catch (err) { alert("Нет связи с сервером. Попробуй ещё раз."); return; }
      if (r) {
        if (!r.ok) { alert(r.error || "Что-то пошло не так."); return; }
        if (r.posts) state.posts = r.posts; else Object.assign(state, {hearts: r.hearts, done: r.done, bought: r.bought});
      } else if (t.dataset.cat) window._cat = t.dataset.cat;
      else if (t.dataset.like !== undefined) { const i = +t.dataset.like; const j = state.liked.indexOf(i); j < 0 ? state.liked.push(i) : state.liked.splice(j, 1); }
      save(); render(); return;
    }
    if (t.dataset.task) { const k = D.tasks.find((x) => x.id == t.dataset.task); state.done.push(k.id); state.hearts += k.r; }
    else if (t.dataset.buy) {
      const s = D.shop.find((x) => x.id == t.dataset.buy);
      if (state.hearts < s.p) { alert("Не хватает Pink Hearts. Выполни задания, чтобы заработать."); return; }
      state.hearts -= s.p; state.bought.push(s.id);
    } else if (t.dataset.cat) window._cat = t.dataset.cat;
    else if (t.dataset.like !== undefined) { const i = +t.dataset.like; const j = state.liked.indexOf(i); j < 0 ? state.liked.push(i) : state.liked.splice(j, 1); }
    else if (t.id === "post-go") { const v = $("#post-t").value.trim(); if (!v) return; state.posts.unshift({a: state.user, time: "Только что", x: v, l: 0, c: 0}); }
    save(); render();
  });

  init();
})();
