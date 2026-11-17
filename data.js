// Настройки и демо-данные. На втором этапе это приходит с сервера.
window.CONFIG = {
  botName: "",            // имя бота для Telegram Login Widget, например "MsBimboBot"
  channelUrl: "https://t.me/",
  authUrl: ""             // адрес Cloudflare Worker (этап 2)
};
window.RANKS = [
  {n: "Pink Visitor", min: 0}, {n: "Pretty Doll", min: 100}, {n: "Black Ribbon", min: 200},
  {n: "Locked Heart", min: 350}, {n: "Gothic Princess", min: 500}, {n: "Ms.Bimbo Elite", min: 1000}
];
window.DEMO = {
  user: {name: "BunnyLillies", hearts: 542, level: 4, xp: 48, role: "Участник", bio: "Soft heart. Hard rules. ♡"},
  shop: [
    {id: 1, t: "Розовый бант", p: 100, c: "Украшения", e: "🎀"},
    {id: 2, t: "Кружевной чокер", p: 150, c: "Украшения", e: "🖤"},
    {id: 3, t: "Подвеска-сердце", p: 200, c: "Украшения", e: "🔒"},
    {id: 4, t: "Рамка Elite", p: 300, c: "Украшения", e: "👑"},
    {id: 5, t: "Плюшевый мишка", p: 250, c: "Прочее", e: "🧸"},
    {id: 6, t: "Чёрная роза", p: 120, c: "Прочее", e: "🥀"},
    {id: 7, t: "Премиум фон", p: 200, c: "Доступы", e: "✨"},
    {id: 8, t: "Пакет Pink Hearts", p: 500, c: "Контент", e: "💗"}
  ],
  tasks: [
    {id: 1, t: "Подпишись на канал", d: "Будь в курсе всех новостей Ms.Bimbo", r: 50, k: "Обычное"},
    {id: 2, t: "Поставь лайк", d: "Поддержи проект своим лайком", r: 30, k: "Обычное"},
    {id: 3, t: "Ответь на опрос", d: "Твоё мнение важно для нас", r: 40, k: "Ежедневное"},
    {id: 4, t: "Участвуй в ивенте", d: "Докажи, что ты настоящая Ms.Bimbo", r: 200, k: "Событие", locked: "Доступно с 14.05"}
  ],
  ach: [
    {t: "Pink Visitor", d: "Зарегистрируйся в клубе", e: "🎀", need: 1},
    {t: "Locked Heart", d: "Пройди 5 испытаний", e: "🔒", need: 5},
    {t: "Pretty Doll", d: "Набери 100 Pink Hearts", e: "👑", need: 100, cur: 68},
    {t: "Black Ribbon", d: "Выполни 10 заданий", e: "🥀", need: 10, cur: 4},
    {t: "Gothic Princess", d: "Достигни 500 Pink Hearts", e: "🩷", need: 500, cur: 320},
    {t: "Щедрая Дама", d: "Соверши 5 покупок", e: "🎁", need: 5},
    {t: "Верная Сердцу", d: "Соблюдай протокол 30 дней", e: "💎", need: 30, cur: 12}
  ],
  posts: [
    {a: "Ms.Bimbo", adm: 1, time: "Сегодня, 18:45", x: "Добро пожаловать в наше сообщество! Здесь ты можешь делиться мыслями и находить друзей ♡", l: 248, c: 37},
    {a: "BimboGirl", time: "Сегодня, 17:20", x: "Какая же тут атмосфера… ♡", l: 97, c: 14},
    {a: "BunnyLillies", time: "Вчера, 21:06", x: "Люблю этот стиль… Кто тоже?", l: 142, c: 24}
  ],
  top: [["Ms.Bimbo", 12500], ["PinkDoll", 8900], ["BimboGirl", 7600], ["BunnyLillies", 542]]
};
