# AI Worker

AI 기반 발표 스크립트 자동 생성기. PPT/PDF 파일을 업로드하면 3단계 AI 파이프라인을 통해 슬라이드별 발표 스크립트를 생성합니다.

```
슬라이드 분석 → 맥락 기반 스크립트 생성 → 후처리 리파인
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite 7, Zustand 5, Tailwind CSS 3, React Router v7 |
| **Backend** | NestJS 11, Express 5, Prisma 7, PostgreSQL |
| **Auth** | Google OAuth 2.0, Passport, JWT |
| **AI** | Google Gemini 2.5 Flash (Vision API) |
| **Infra** | Docker, Docker Compose, Nginx |
| **Testing** | Jest (backend), Vitest (frontend) |

## Architecture

```
apps/
  api-server/      # NestJS backend (port 3002)
  user-client/     # React frontend (port 5175)
```

### Backend

- **presentation/**: 파일 업로드, PPT→PDF→이미지 변환, 3단계 AI 스크립트 생성
- **auth/**: Google OAuth 2.0 + JWT 인증
- **prisma/**: PostgreSQL 연결 (User, PresentationHistory 모델)

외부 의존: LibreOffice (`soffice`), Poppler (`pdftoppm`) — Docker 이미지에 포함

### Frontend

Feature-based organization:

- **features/presentation/**: 파일 업로드, 옵션 설정, 처리 상태, 결과 표시
- **features/auth/**: Google OAuth 로그인, JWT 상태 관리
- **features/history/**: 히스토리 목록/상세/삭제

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker & Docker Compose

### Docker (권장)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5175
- API Server: http://localhost:3002

### Local Development

```bash
pnpm install
pnpm dev
```

### Environment Variables

`apps/api-server/.env` 파일을 생성하세요:

```env
DATABASE_URL=postgresql://postgres:post1234@localhost:5432/brett-ai?schema=public
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:5175
PORT=3002
```

## Scripts

```bash
pnpm dev        # 전체 개발 서버 실행
pnpm build      # 전체 빌드
pnpm test       # 전체 테스트
pnpm lint       # 전체 린트
```

## License

UNLICENSED
