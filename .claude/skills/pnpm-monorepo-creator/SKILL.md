---
name: pnpm-monorepo-creator
description: Create a pnpm monorepo with NestJS backend and React/Vite frontend. Use when user wants to create a new project, scaffold a monorepo, or set up a full-stack TypeScript project. Triggers on "모노레포 생성", "프로젝트 생성", "create monorepo", "새 프로젝트", "pnpm workspace 구성".
---

# pnpm Monorepo Creator

Create a production-ready pnpm monorepo with NestJS + React/Vite + TDD skills.

## Quick Start

Execute these commands (replace `PROJECT_NAME` and `TARGET_DIR`):

```bash
# 1. Copy template
cp -r ~/.claude/skills/pnpm-monorepo-creator/assets/template TARGET_DIR

# 2. Replace placeholders (macOS)
find TARGET_DIR -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.html" \) \
  -exec sed -i '' 's/{{PROJECT_NAME}}/PROJECT_NAME/g' {} +

# 3. Install & verify
cd TARGET_DIR && pnpm install && pnpm build
```

For Linux, use `sed -i` instead of `sed -i ''`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Package Manager | pnpm 10.28.1 |
| Backend | NestJS 11, Express 5, TypeScript |
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| Testing | Jest (API), Vitest (Client), Playwright |
| Node | >=20 |

## Structure

```
PROJECT_NAME/
├── .claude/
│   └── skills/              # TDD workflow skills
│       ├── prd/             # PRD 작성
│       ├── plan/            # TDD 구현 계획
│       ├── go/              # 구현 시작
│       ├── go-phase/        # 단계별 구현
│       ├── check-tests/     # 테스트 확인
│       └── commit-tdd/      # TDD 커밋
├── apps/
│   ├── api-server/          # NestJS (port 3001)
│   └── user-client/         # React + Vite (port 5174)
├── packages/                # Shared packages
├── infra/                   # Infrastructure
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
```

## Commands

```bash
pnpm dev                                    # Run all apps
pnpm build                                  # Build all apps
pnpm -F @PROJECT_NAME/api-server dev        # API only
pnpm -F @PROJECT_NAME/user-client dev       # Client only
```

## Included Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| /prd | "PRD 작성" | 요구사항 문서 작성 |
| /plan | "plan 작성" | TDD 구현 계획 |
| /go | "go" | 전체 구현 시작 |
| /go-phase | "go-phase N" | 단계별 구현 |
| /check-tests | "테스트 확인" | 테스트 상태 점검 |
| /commit-tdd | "커밋" | TDD 방식 커밋 |

## Post-Setup

1. `git init`
2. Create `.env` from `.env.example`
3. Add dependencies as needed (Prisma, Socket.io, etc.)
