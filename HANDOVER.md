# Deti Control - Handover

Последнее обновление: 2026-05-01

## Быстрый контекст

Deti Control - семейное web-приложение для учета домашних заданий детей, баллов, подтверждений родителей и истории. Продукт строится сначала как web app, не native mobile app.

Глобальный индекс проектов:

```text
C:\Users\Sergej\Documents\Codex\PROJECTS.md
```

## Пути и репозиторий

Локальный путь:

```text
C:\Users\Sergej\Documents\Codex\Deti Control
```

GitHub:

```text
https://github.com/sergkreis/Deti-Contol-App.git
```

Ветка:

```text
main
```

Живое приложение:

```text
http://192.168.1.250:3000
```

## Технологии

```text
Next.js App Router
TypeScript
Tailwind CSS
Prisma
SQLite
pm2 на сервере
```

## Основные возможности

```text
главная страница
страницы профилей детей
parent dashboard
seeded demo data для Stefan, Alwina, Lukas
SQLite + Prisma schema
parent PIN gate
child-specific PIN gate
logout для parent и child sessions
```

Текущее направление продукта:

```text
3 child profiles
parent moderation flow
points, penalties, history
temporary photo proof planned next
PIN protection already added
```

Текущее реализованное состояние после 2026-05-01:

```text
photo upload from child device is implemented
parent can approve/reject pending photo submissions
uploaded proof photo is deleted after parent decision
private uploads are stored under /uploads/submissions and ignored by git
photo route is protected by parent or matching child session
```

## Важные файлы

Main app routes:

```text
src/app/page.tsx
src/app/parent/page.tsx
src/app/parent/unlock/page.tsx
src/app/child/[slug]/page.tsx
src/app/child/[slug]/unlock/page.tsx
```

Auth/session:

```text
src/lib/auth.ts
src/app/actions/auth.ts
src/components/pin-form.tsx
src/components/logout-button.tsx
```

Data/model:

```text
prisma/schema.prisma
prisma/seed.ts
src/lib/data.ts
src/lib/prisma.ts
```

## Environment и секреты

Хранятся в `.env`:

```text
SESSION_SECRET=<long-random-secret>
SESSION_SECURE_COOKIE=false
PARENT_PIN=<parent-pin>
CHILD_PIN_STEFAN=<child-pin>
CHILD_PIN_ALWINA=<child-pin>
CHILD_PIN_LUKAS=<child-pin>
```

Реальные PIN и secret values не коммитить.

## База данных

Текущая локальная DB:

```text
prisma/dev.db
```

Seed содержит:

```text
3 children
starter task list from the paper system
sample submissions
sample transactions
```

## Деплой

Target:

```text
Ubuntu VM 102 on Proxmox
Host/IP: 192.168.1.250
SSH user: codex
App path on server: /home/codex/deti-control
Process manager: pm2
Process name: deti-control
```

SSH:

```bash
ssh codex@192.168.1.250
```

pm2:

```bash
pm2 status
pm2 logs deti-control
pm2 restart deti-control --update-env
```

## Проверка и команды

Install:

```bash
npm install
```

Dev:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Prisma:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Deploy workflow

Проект был развернут на сервер вручную.

Использованный high-level flow:

```text
1. copy project files to /home/codex/deti-control
2. npm install
3. npx prisma generate
4. npx prisma db push --skip-generate
5. npm run db:seed
6. npm run build
7. run with pm2
```

Текущий целевой workflow:

```text
edit locally -> lint/build -> commit -> push to GitHub -> deploy/update VM after approval
```

Точный pull/update deploy command на VM еще нужно зафиксировать после следующего деплоя.

Текущий проверенный deploy/update flow от 2026-05-01:

```bash
ssh codex@192.168.1.250
cd /home/codex
rm -rf deti-control-new
git clone https://github.com/sergkreis/Deti-Contol-App.git deti-control-new
cd deti-control-new
git switch main
cp ../deti-control/.env .env
mkdir -p prisma
cp ../deti-control/prisma/dev.db prisma/dev.db
if [ -d ../deti-control/uploads ]; then cp -a ../deti-control/uploads ./uploads; fi
npm ci
npm run db:generate
npm run db:push
npm run build
cd /home/codex
ts=$(date +%Y%m%d-%H%M%S)
mv deti-control "deti-control-backup-$ts"
mv deti-control-new deti-control
pm2 restart deti-control --update-env
pm2 status
```

Важно:

```text
Do not run npm run db:seed during normal VM update; it resets seeded app data.
Keep server .env, prisma/dev.db, and uploads/ when replacing the app folder.
Last deployed commit: da8d909.
Last server backup after deploy: /home/codex/deti-control-backup-20260501-142317
```

## Текущее состояние

```text
app is live on 192.168.1.250:3000
build succeeds locally
build succeeds on server
pm2 autostart is configured
unlock routes exist and return 200
photo submission moderation flow is deployed on VM
server checkout is main at da8d909
```

## Открытые задачи

Главная следующая задача:

```text
Implement real photo upload -> moderation -> approve/reject -> delete photo flow.
```

Статус:

```text
Done on 2026-05-01 in commit da8d909 and deployed to VM.
```

Рекомендованные шаги:

```text
1. Runtime-check photo upload from a real child phone on the home network.
2. Runtime-check parent approve/reject from the parent device.
3. Добавить manual bonus / penalty actions из parent UI, если текущей формы недостаточно.
4. Заменить placeholder PINs на реальные family values только в .env.
5. Опционально добавить nginx reverse proxy и локальный домен.
```

## Запрещено

```text
Не коммитить .env.
Не коммитить реальные PIN, SESSION_SECRET, SQLite DB, uploaded photos или private family data.
Не деплоить/update VM без явного разрешения.
Не обходить GitHub; GitHub main должен быть источником правды.
```

## Как продолжать в новом чате

```text
Open C:\Users\Sergej\Documents\Codex\PROJECTS.md and continue Deti Control.
Then open this HANDOVER.md.
Before deployment changes, verify live app at http://192.168.1.250:3000 and check pm2 status.
```
