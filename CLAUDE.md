# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Worker는 AI 기반 발표 스크립트 자동 생성기이다. PPT/PDF 파일을 업로드하면 3단계 AI 파이프라인(슬라이드 분석 → 맥락 기반 스크립트 생성 → 후처리 리파인)을 통해 각 슬라이드별 발표 스크립트를 생성한다. pnpm 모노레포로 NestJS 백엔드와 React 프론트엔드로 구성되어 있다.

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
pnpm -F @ai-worker/api-server dev          # Start dev server with watch (port 3002)
pnpm -F @ai-worker/api-server build        # Build for production
pnpm -F @ai-worker/api-server test         # Run tests
pnpm -F @ai-worker/api-server test:watch   # Run tests in watch mode
pnpm -F @ai-worker/api-server test:cov     # Run tests with coverage
pnpm -F @ai-worker/api-server test:e2e     # Run e2e tests
pnpm -F @ai-worker/api-server lint         # Lint and fix

# Database (Prisma)
cd apps/api-server && npx prisma generate       # Generate Prisma client
cd apps/api-server && npx prisma migrate dev     # Run migrations
cd apps/api-server && npx prisma db push         # Push schema to database
```

### User Client (apps/user-client)

```bash
pnpm -F @ai-worker/user-client dev         # Start Vite dev server (port 5175)
pnpm -F @ai-worker/user-client build       # Build for production
pnpm -F @ai-worker/user-client lint        # Lint
pnpm -F @ai-worker/user-client preview     # Preview production build
pnpm -F @ai-worker/user-client test        # Run tests
pnpm -F @ai-worker/user-client test:watch  # Run tests in watch mode
```

### Docker

```bash
docker-compose up --build       # Build and run all services
docker-compose up -d --build    # Background mode
docker-compose down             # Stop all services
```

## Architecture

### Monorepo Structure

```
apps/
  api-server/      # NestJS backend (port 3002)
  user-client/     # React frontend (port 5175)
```

### Backend (api-server)

NestJS 11 application with modular architecture:

- **presentation/**: 핵심 기능 — 파일 업로드, PPT→PDF→이미지 변환, 3단계 AI 스크립트 생성
  - `converter.service.ts`: LibreOffice(PPT→PDF), Poppler(PDF→이미지) 실행
  - `script-generator.service.ts`: Gemini Vision API로 슬라이드 분석 + 스크립트 생성 + 후처리
  - `presentation.service.ts`: 업로드, 파이프라인 오케스트레이션, 상태 관리
  - `presentation.controller.ts`: REST API 엔드포인트
- **auth/**: Google OAuth 2.0 + JWT 인증 (Passport)
- **prisma/**: PrismaService (PostgreSQL 연결, User/PresentationHistory 모델)

Database: PostgreSQL with Prisma ORM.

External dependencies: LibreOffice (`soffice`), Poppler (`pdftoppm`) — Docker 이미지에 포함.

### Frontend (user-client)

React 19 + Vite 7 with feature-based organization:

- **features/presentation/**: 파일 업로드, 옵션 설정, 처리 상태, 결과 표시
- **features/auth/**: Google OAuth 로그인, JWT 상태 관리, API 인터셉터
- **features/history/**: 히스토리 목록/상세/삭제 API 클라이언트, useHistory hook, HistoryPage
- **components/**: Layout (인증 가드 + Outlet), Navbar (네비게이션 + 프로필 드롭다운)
- **stores/**: Zustand 상태 관리 (feature-scoped)

Key libraries: Axios, Zustand, Tailwind CSS, React Router v7.

## Tech Stack

- **Runtime**: Node.js >= 20
- **Package Manager**: pnpm 10.x
- **Backend**: NestJS 11, Express 5, Prisma 7, PostgreSQL, Passport, JWT
- **Frontend**: React 19, Vite 7, Zustand 5, Axios, Tailwind CSS 3
- **AI**: Google Generative AI (Gemini 2.5 Flash) — Vision API
- **Infra**: Docker, Docker Compose, Nginx
- **Testing**: Jest (backend), Vitest (frontend)
- **Linting**: ESLint 9 with TypeScript-ESLint

## Environment Variables

### API Server (`apps/api-server/.env`)

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `GOOGLE_CALLBACK_URL`: OAuth callback URL
- `JWT_SECRET`: JWT signing key (optional, defaults to dev secret)
- `CORS_ORIGIN`: CORS allowed origin (default: `http://localhost:5175`)
- `PORT`: Server port (default: 3002)

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

### Core Principles

1. **Tests Drive Design**: 테스트를 미리 다 설계하지 않고, 하나씩 발견한다
2. **Red → Green → Refactor**: Write failing test, make it pass, improve structure
3. **Behavior, not implementation**: public API 행동을 테스트, private 구현 디테일 아님
4. **Tidy First**: Separate structural changes from behavioral changes

## Last Work Position

- **Feature**: Google 로그인, History 저장, 네비게이션 메뉴
- **PRD**: `docs/auth-history-navigation/prd.md`
- **Plan**: `docs/auth-history-navigation/plan.md`
- **Status**: 전체 Phase 완료 (Phase 1~9).
- **Pre-existing test failures**: converter.service.spec.ts, script-generator.service.spec.ts — 이전 리팩토링에서 인터페이스 변경 후 테스트 미업데이트. presentationApi.test.ts — API 호출 검증 assertion 미업데이트.
