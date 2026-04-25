# Deti Control Handover

## Project summary

Deti Control is a family web app for tracking children's household chores, points, and parent approvals.

Current product direction:

- web app first, not native mobile
- 3 children with separate profiles
- parent moderation flow
- points, penalties, and history
- temporary photo proof planned next
- PIN protection already added for parent and each child

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- pm2 for runtime on server

## Local project path

```text
C:\Users\Sergej\Documents\Codex\Deti Control
```

## Deployment

Current deployment target:

```text
Ubuntu VM 102 on Proxmox
```

Current app URL:

```text
http://192.168.1.250:3000
```

SSH access:

```text
ssh codex@192.168.1.250
```

Process manager:

```text
pm2
```

Process name:

```text
deti-control
```

Useful commands on server:

```bash
pm2 status
pm2 logs deti-control
pm2 restart deti-control --update-env
```

## Current features

- main landing page
- child profile pages
- parent dashboard
- seeded demo data for Stefan, Alwina, Lukas
- SQLite + Prisma schema
- parent PIN gate
- child-specific PIN gate
- logout for parent and child sessions

## Current PIN defaults

Stored in `.env`:

```text
PARENT_PIN=1234
CHILD_PIN_STEFAN=1111
CHILD_PIN_ALWINA=2222
CHILD_PIN_LUKAS=3333
```

These are placeholder defaults and should be changed later.

## Important files

Main app routes:

```text
src/app/page.tsx
src/app/parent/page.tsx
src/app/parent/unlock/page.tsx
src/app/child/[slug]/page.tsx
src/app/child/[slug]/unlock/page.tsx
```

Auth/session logic:

```text
src/lib/auth.ts
src/app/actions/auth.ts
src/components/pin-form.tsx
src/components/logout-button.tsx
```

Data/model layer:

```text
prisma/schema.prisma
prisma/seed.ts
src/lib/data.ts
src/lib/prisma.ts
```

## Database

Current DB:

```text
prisma/dev.db
```

Seeded with:

- 3 children
- starter task list from the paper system
- sample submissions
- sample transactions

## Deployment workflow used so far

The project was deployed manually to the server.

High-level flow:

1. copy project files to `/home/codex/deti-control`
2. run `npm install`
3. run `npx prisma generate`
4. run `npx prisma db push --skip-generate`
5. run `npm run db:seed`
6. run `npm run build`
7. run with `pm2`

## Known state

- app is live on `192.168.1.250:3000`
- build succeeds locally
- build succeeds on server
- pm2 autostart is configured
- unlock routes exist and return `200`

## Next recommended steps

1. Implement real photo upload from child device.
2. Add parent moderation actions: approve / reject.
3. Delete uploaded photo after parent decision.
4. Add manual bonus / penalty actions from parent UI.
5. Replace placeholder PINs with real family values.
6. Optionally add nginx reverse proxy and nicer local domain.

## Notes for future chats

When resuming work:

- open `PROJECTS.md`
- open this `HANDOVER.md`
- verify live app at `192.168.1.250:3000`
- check pm2 status on the server before changing deployment
