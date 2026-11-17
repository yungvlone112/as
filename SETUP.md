# Этап 2: вход через Telegram и проверка подписки

## 1. Бот
1. @BotFather → /newbot → получи токен и имя бота (например MsBimboBot).
2. @BotFather → /setdomain → выбери бота → впиши домен сайта: `ТВОЙ_ЛОГИН.github.io`.
3. Добавь бота администратором в закрытый канал (права не нужны, достаточно просто админа).
4. Узнай id канала (вид -100xxxxxxxxxx): перешли пост из канала боту @userinfobot или @getidsbot.
5. Узнай свой Telegram id там же — он пойдёт в ADMINS.

## 2. Cloudflare (бесплатно)
```
npm i -g wrangler
wrangler login
cd worker
wrangler kv namespace create DB      # скопируй выданный id в wrangler.toml
# заполни CHANNEL, ORIGIN, ADMINS в wrangler.toml
wrangler secret put BOT_TOKEN        # токен бота
wrangler secret put SIGN_KEY         # любая длинная случайная строка
wrangler deploy                      # выдаст адрес вида https://msbimbo-api.xxx.workers.dev
```

## 3. Сайт
В `data.js` впиши:
```
botName: "MsBimboBot",
authUrl: "https://msbimbo-api.xxx.workers.dev"   // без слэша в конце
```
Залей файлы в GitHub. Кнопка демо-входа исчезнет, останется вход через Telegram.

## Важно
- Токен бота и SIGN_KEY никогда не кладём в репозиторий, только через `wrangler secret`.
- Награды и цены дублируются в `worker/worker.js` (TASKS, SHOP). Меняешь в data.js — меняй и там.
- Задание «Подпишись на канал» сейчас засчитывается по клику. Настоящую проверку можно сделать через getChatMember.
