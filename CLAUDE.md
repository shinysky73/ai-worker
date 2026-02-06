# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Milo Seah is a full-stack AI chat application built as a pnpm monorepo with a NestJS backend and React frontend. It supports multiple AI providers (OpenAI, Anthropic, Google Gemini, Perplexity) with real-time WebSocket streaming, file upload with RAG processing, and Google OAuth authentication.

## Commands

### Root (monorepo)

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all apps in development mode
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm test             # Test all apps
```

### API Server (apps/api-server)

```bash
pnpm -F @milo-seah/api-server dev          # Start dev server with watch (port 3001)
pnpm -F @milo-seah/api-server build        # Build for production
pnpm -F @milo-seah/api-server test         # Run tests
pnpm -F @milo-seah/api-server test:watch   # Run tests in watch mode
pnpm -F @milo-seah/api-server test:cov     # Run tests with coverage
pnpm -F @milo-seah/api-server test:e2e     # Run e2e tests
pnpm -F @milo-seah/api-server lint         # Lint and fix
pnpm -F @milo-seah/api-server format       # Format with Prettier

# Database (Prisma)
pnpm -F @milo-seah/api-server db:generate  # Generate Prisma client
pnpm -F @milo-seah/api-server db:migrate   # Run migrations
pnpm -F @milo-seah/api-server db:push      # Push schema to database
pnpm -F @milo-seah/api-server db:seed      # Seed database
```

### User Client (apps/user-client)

```bash
pnpm -F @milo-seah/user-client dev         # Start Vite dev server (port 5174)
pnpm -F @milo-seah/user-client build       # Build for production
pnpm -F @milo-seah/user-client lint        # Lint
pnpm -F @milo-seah/user-client preview     # Preview production build
pnpm -F @milo-seah/user-client test        # Run tests
pnpm -F @milo-seah/user-client test:watch  # Run tests in watch mode
pnpm -F @milo-seah/user-client test:cov    # Run tests with coverage
```

## Architecture

### Monorepo Structure

```
apps/
  api-server/      # NestJS backend (port 3001)
  user-client/     # React frontend (port 5174)
packages/          # Shared packages (currently empty)
```

### Backend (api-server)

NestJS application with modular architecture:

- **auth/**: Google OAuth 2.0 + JWT authentication with Passport
- **chat/**: Real-time chat with WebSocket (Socket.io), contains `ai/` subdirectory for multi-model LLM services
- **file/**: File upload and RAG (Retrieval-Augmented Generation) with document vectorization
- **weather/**: Weather data integration
- **analytics/**: Usage tracking and cost analytics
- **common/**: Shared guards, filters, decorators, and Winston logger
- **prisma/**: Database service wrapper

Database: PostgreSQL with Prisma ORM, pgvector extension for embeddings.

API Documentation: Swagger UI at `http://localhost:3001/api-docs`

### Frontend (user-client)

React 19 + Vite with feature-based organization:

- **features/**: Feature modules (auth, chat, agent, guide, history, home)
- **components/**: Shared UI components
- **stores/**: Zustand state management (theme)
- **lib/**: Utilities and helpers
- **routes/**: React Router v7 route definitions

Key libraries: TanStack Query for data fetching, Tailwind CSS for styling, React Markdown for rendering.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Package Manager**: pnpm 10.x
- **Backend**: NestJS, Prisma, PostgreSQL, Socket.io, Passport
- **Frontend**: React 19, Vite, TanStack Query, Zustand, Tailwind CSS
- **AI Providers**: OpenAI, Anthropic, Google Generative AI, Perplexity
- **Testing**: Jest (backend), Vitest (frontend)
- **Linting**: ESLint with TypeScript-ESLint
- **Formatting**: Prettier (singleQuote, trailingComma: all)

## Environment Variables

### API Server

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `FRONTEND_URL`: CORS allowed origin
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`: AI provider keys
- `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`: Google Search API
- `GOOGLE_SERVICE_ACCOUNT_BASE64`: Service account for Google services

### User Client

- `VITE_API_URL`: Backend API URL (default: http://localhost:3001)

## TDD Workflow

This project follows Kent Beck's TDD and Tidy First principles.

### Skills

| Skill | Purpose |
|-------|---------|
| `/prd` | 경량 PRD 작성 (Problem, FR+AC, Affected Code, Out of Scope) |
| `/plan` | PRD에서 경량 TDD Plan 생성 (Phase 방향 + 위험 요소) |
| `/go-phase` | Phase의 TDD 사이클 실행 (테스트 발견 → Red → Green → Refactor) |
| `/check-tests` | 전체 테스트 실행 및 결과 보고 |
| `/commit-tdd` | `[BEHAVIORAL]` / `[STRUCTURAL]` 접두사 커밋 |

### Workflow

```
/prd → /plan → /go-phase → /check-tests → /commit-tdd
                   ↑              |
                   └──────────────┘ (repeat)
```

### Document Structure

```
docs/
  {feature-name}/
    prd.md      # /prd 로 생성
    plan.md     # /plan 으로 생성
```

Example: `/prd user-auth` → `docs/user-auth/prd.md`

### plan.md Format (경량)

```markdown
## Phase 1: {행동 목표} (FR-X, FR-Y)

**Scope**: `{파일/모듈}`
**행동 목표**: {시스템이 어떻게 달라지는지}
**PRD AC**: {대상 AC}
**Edge Cases**: {대상 edge cases}

### ⚠ 위험 요소
- {기존 테스트 깨짐 등 — 없으면 섹션 생략}

### Tests:
_(비워둠 — `/go-phase`에서 발견하면서 추가, `[x]`로 진행 추적)_
```

테스트 이름은 Plan 작성 시 쓰지 않음 — `/go-phase` 실행 중 발견하면서 기록

### Core Principles

1. **Tests Drive Design**: 테스트를 미리 다 설계하지 않고, 하나씩 발견한다
2. **Red → Green → Refactor**: Write failing test, make it pass, improve structure
3. **Behavior, not implementation**: public API 행동을 테스트, private 구현 디테일 아님
4. **Tidy First**: Separate structural changes from behavioral changes
5. **Small commits**: `[BEHAVIORAL]` for features, `[STRUCTURAL]` for refactoring

## Last Work Position

- **Feature**: Agentic Chat Enhancement (코드 품질 개선)
- **PRD**: `docs/agentic-chat-enhancement/prd-phase3-code-quality.md`
- **Plan**: `docs/agentic-chat-enhancement/plan-phase3-code-quality.md`
- **Status**: Phase 3 Plan 완료. Phase 1부터 시작
- **이전 완료**: Phase 1 Stability (5커밋), Phase 2 Correctness (42/42) — origin에 push 전
- **Pre-existing test failures**: chat.controller.spec.ts (DI issue), google.service.spec.ts — 우리 작업과 무관
