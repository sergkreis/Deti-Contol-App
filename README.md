# Deti Control

Семейное веб-приложение для домашних заданий, баллов и родительской модерации.

`Deti Control` помогает вести домашние дела для детей в удобном формате: у каждого ребенка свой кабинет, у родителя отдельная панель проверки, а доступ защищен PIN-кодами.

## Что уже есть

Текущая MVP-версия включает:

- главную страницу с выбором профиля
- отдельные кабинеты детей
- родительскую панель
- PIN-код для родителя
- отдельный PIN-код для каждого ребенка
- Prisma + SQLite
- тестовые данные для `Stefan`, `Alwina`, `Lukas`

## Что планируется дальше

Следующий большой этап:

- загрузка фото с телефона ребенком
- заявка на проверку
- одобрение или отклонение родителем
- удаление фото после решения
- ручные бонусы и штрафы

## Технологии

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- PM2 для продакшн-запуска

## Локальный запуск

Путь проекта:

```text
C:\Users\Sergej\Documents\Codex\Deti Control
```

Установка зависимостей:

```bash
npm install
```

Запуск в режиме разработки:

```bash
npm run dev
```

Открыть в браузере:

```text
http://localhost:3000
```

## Переменные окружения

Пример `.env`:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<long-random-secret>"
SESSION_SECURE_COOKIE="false"
PARENT_PIN="<parent-pin>"
CHILD_PIN_STEFAN="<child-pin>"
CHILD_PIN_ALWINA="<child-pin>"
CHILD_PIN_LUKAS="<child-pin>"
```

## База данных

Сгенерировать Prisma client:

```bash
npx prisma generate
```

Синхронизировать схему:

```bash
npx prisma db push --skip-generate
```

Заполнить демо-данными:

```bash
npm run db:seed
```

## Продакшн

Текущий сервер:

```text
http://192.168.1.250:3000
```

Менеджер процессов:

```text
pm2
```

Имя процесса:

```text
deti-control
```

## Важные файлы

Основные роуты:

```text
src/app/page.tsx
src/app/child/[slug]/page.tsx
src/app/child/[slug]/unlock/page.tsx
src/app/parent/page.tsx
src/app/parent/unlock/page.tsx
```

Авторизация и PIN:

```text
src/lib/auth.ts
src/app/actions/auth.ts
```

Передача проекта:

```text
HANDOVER.md
```

## Заметки

- Проект вырос из реальной бумажной системы домашних дел и баллов.
- Интерфейс в первую очередь рассчитан на использование с телефона.
- Перед крупной доработкой лучше открыть `HANDOVER.md`.
