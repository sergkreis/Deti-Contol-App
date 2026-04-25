# Deti Control

Family chore tracking web app for children and parents.

Deti Control helps a family manage household tasks, points, approvals, and child-specific access from one phone-friendly web interface.

## Current status

MVP is already running and includes:

- landing page with child profile selection
- child cabinet pages
- parent dashboard
- Prisma + SQLite data layer
- seeded demo data for 3 children
- parent PIN access
- individual PIN access for each child

Planned next:

- photo upload from child device
- parent approve / reject flow
- automatic photo deletion after decision
- manual bonus / penalty actions

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- PM2 for production runtime

## Local development

Project path:

```text
C:\Users\Sergej\Documents\Codex\Deti Control
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment

Example values:

```env
DATABASE_URL="file:./dev.db"
PARENT_PIN="1234"
CHILD_PIN_STEFAN="1111"
CHILD_PIN_ALWINA="2222"
CHILD_PIN_LUKAS="3333"
```

## Database

Generate Prisma client:

```bash
npx prisma generate
```

Sync schema:

```bash
npx prisma db push --skip-generate
```

Seed demo data:

```bash
npm run db:seed
```

## Production

Current deployed server:

```text
http://192.168.1.250:3000
```

Runtime:

```text
pm2
```

Process name:

```text
deti-control
```

## Important files

Routes:

```text
src/app/page.tsx
src/app/child/[slug]/page.tsx
src/app/child/[slug]/unlock/page.tsx
src/app/parent/page.tsx
src/app/parent/unlock/page.tsx
```

Auth and sessions:

```text
src/lib/auth.ts
src/app/actions/auth.ts
```

Project handover:

```text
HANDOVER.md
```

## Notes

- This project started from a real paper-based family points system.
- The app is intended for phone use inside the home first.
- Before major work, read `HANDOVER.md`.
