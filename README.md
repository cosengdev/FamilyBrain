# FamilyBrain

The family operating system — shared calendar, AI assistant, budgeting, school hub, and
life-admin reminders in one place. Scales from solo "life admin" use up to a full family
household: same data model and AI engine, household size is a configuration, not a
different product.

See [DESIGN.md](./DESIGN.md) for the full product and architecture design.

## Structure

- `apps/web` — Next.js PWA
- `apps/mobile` — Expo (React Native) app
- `packages/shared` — shared TypeScript types used by both apps
- `prisma/schema.prisma` — phase 0 data model

This is a phase 0 scaffold: project structure, data model, and app shells. Features are
built out per the roadmap in DESIGN.md.

## Getting started

```
npm install
cp .env.example .env   # set DATABASE_URL to a local Postgres instance
npx prisma generate
npm run dev:web
```

For the mobile app:

```
npm run dev:mobile
```
