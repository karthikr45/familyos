# FamilyOS

> A Family Learning and Life Operating System for Indian families.

FamilyOS brings academics, health, finance, talents, and family life into one
connected system for students and parents. It pairs a NestJS backend with a
Next.js parent dashboard, an Expo mobile app for students and parents, and an
Anthropic Claude–powered AI layer for tutoring, insights, and planning.

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Monorepo         | Turborepo + pnpm workspaces                     |
| Web frontend     | Next.js 14 (App Router)                          |
| Mobile app       | Expo React Native (Expo Router)                 |
| Backend API      | NestJS (REST + WebSockets)                       |
| Database ORM     | Prisma                                          |
| Database         | PostgreSQL 16                                    |
| Cache / queues   | Redis + BullMQ                                   |
| AI engine        | Anthropic Claude (`claude-sonnet-4-20250514`)    |
| Auth             | JWT (access + refresh) + phone OTP              |
| Push             | Firebase Cloud Messaging + Expo Push            |
| File storage     | AWS S3                                           |
| Payments         | Razorpay                                         |
| Styling (web)    | Tailwind CSS + shadcn/ui                         |
| Styling (mobile) | NativeWind                                       |
| State            | TanStack Query + Zustand                         |
| Validation       | Zod + class-validator                            |

## Repository Layout

```
familyos/
├── apps/
│   ├── web/          # Next.js 14 — parent & admin dashboard
│   ├── mobile/       # Expo React Native — student & parent app
│   └── api/          # NestJS — REST API + WebSockets + jobs
├── packages/
│   ├── database/     # Prisma schema, client, repositories, seed
│   ├── shared/       # Shared types, constants, utils, validators
│   ├── ui/           # Shared component library
│   └── ai/           # Anthropic Claude SDK wrapper + AI services
├── turbo.json        # Turborepo task pipeline
├── pnpm-workspace.yaml
└── .env.example
```

## Prerequisites

- **Node.js** >= 20 (see `.nvmrc`)
- **pnpm** >= 9 (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- **Docker** (for local PostgreSQL + Redis) or local Postgres 16 / Redis 7
- An **Anthropic API key**

## Getting Started

```bash
# 1. Install dependencies for all workspaces
pnpm install

# 2. Set up environment variables
cp .env.example .env
# then edit .env with real values

# 3. Start local infrastructure (Postgres + Redis)
docker compose up -d postgres redis

# 4. Generate the Prisma client, run migrations, and seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run everything in dev mode
pnpm dev
```

By default:

- **API** runs on `http://localhost:3001` (Swagger at `/api/docs`)
- **Web** runs on `http://localhost:3000`
- **Mobile** runs via Expo (`http://localhost:8081`)

## Development Workflow

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Run all apps in watch mode via Turborepo               |
| `pnpm build`         | Build every workspace                                  |
| `pnpm lint`          | Lint all workspaces                                    |
| `pnpm type-check`    | Type-check all workspaces                              |
| `pnpm test`          | Run unit tests                                         |
| `pnpm test:e2e`      | Run end-to-end tests                                   |
| `pnpm format`        | Format the repo with Prettier                          |
| `pnpm db:generate`   | Generate the Prisma client                             |
| `pnpm db:migrate`    | Apply database migrations                              |
| `pnpm db:seed`       | Seed reference + sample data                           |

Run a task for a single workspace with a filter:

```bash
pnpm turbo run dev --filter=@familyos/api
pnpm turbo run build --filter=@familyos/web
```

## Environment Variables

All variables are documented in [`.env.example`](./.env.example). Required
groups: database (`DATABASE_URL`, `DIRECT_URL`), Anthropic (`ANTHROPIC_API_KEY`),
auth (`JWT_SECRET`, `JWT_REFRESH_SECRET`), Redis (`REDIS_URL`), AWS S3, Firebase
Admin, and Razorpay. The API validates required variables on startup and refuses
to boot if any are missing.

## Workspaces

| Package              | Path                | Purpose                                  |
| -------------------- | ------------------- | ---------------------------------------- |
| `@familyos/web`      | `apps/web`          | Parent & admin web dashboard             |
| `@familyos/mobile`   | `apps/mobile`       | Student & parent mobile app              |
| `@familyos/api`      | `apps/api`          | Backend REST API, WebSockets, jobs       |
| `@familyos/database` | `packages/database` | Prisma schema, client, repositories      |
| `@familyos/shared`   | `packages/shared`   | Shared types, constants, utils, schemas  |
| `@familyos/ui`       | `packages/ui`       | Shared component library                 |
| `@familyos/ai`       | `packages/ai`       | Claude SDK wrapper + AI services         |

## License

Proprietary — © FamilyOS. All rights reserved.
