# AI Worker 프로젝트 결과보고서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | AI Worker — AI 기반 업무 자동화 플랫폼 |
| 개발 기간 | 2025.05 ~ 2026.03 |
| 개발 인원 | 1명 (신희천) |
| 저장소 | https://github.com/shinysky73/ai-worker |

### 프로젝트 목적

사내 반복 업무를 AI로 자동화하여 업무 효율을 높이는 웹 플랫폼을 개발한다. PPT 발표 스크립트 생성, 이미지 분석, 영수증/명함 데이터 추출, 면접 질문 생성 등 4개 핵심 기능을 하나의 플랫폼에서 제공한다.

---

## 2. 사용한 AI 도구

### 2.1 서비스에 탑재된 AI

| AI 도구 | 용도 | 비고 |
|---------|------|------|
| **Google Gemini 2.5 Flash** (Vision API) | 슬라이드 이미지 분석, 발표 스크립트 생성, 이미지 콘텐츠 분석, 영수증/명함 데이터 추출, 면접 질문 생성 | Google Generative AI SDK 0.24.1 |

### 2.2 개발에 활용한 AI

| AI 도구 | 용도 | 비고 |
|---------|------|------|
| **Claude Code** (Anthropic CLI) | 코드 작성, TDD 기반 개발, 코드 리뷰, 디버깅, Git 워크플로우 자동화 | Claude Opus 모델 기반 |
| **GitHub Copilot** | 코드 자동완성, 인라인 제안 | VS Code 확장 |

### 2.3 AI 활용 상세

**Gemini Vision API — 3단계 AI 파이프라인 (발표 스크립트)**

1. **슬라이드 분석**: 각 슬라이드 이미지를 Gemini Vision API로 분석하여 핵심 내용 추출
2. **맥락 기반 스크립트 생성**: 이전 슬라이드 맥락을 반영한 발표 스크립트 생성
3. **후처리 리파인**: 톤, 시간, 일관성을 고려한 스크립트 정제

**Claude Code — TDD 워크플로우**

- `/prd` → `/plan` → `/go-phase` → `/check-tests` → `/commit-tdd` 사이클로 체계적 개발
- 백엔드 34개 + 프론트엔드 18개 테스트 자동 생성 및 검증
- 커밋 메시지에 `[BEHAVIORAL]` / `[STRUCTURAL]` 접두사로 변경 유형 구분

---

## 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                    Docker Compose                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ React Client │→│ NestJS API   │→│ PostgreSQL │ │
│  │ (Vite, :5175)│  │ (:3002)      │  │            │ │
│  └──────────────┘  └──────┬───────┘  └────────────┘ │
│                           │                          │
│                    ┌──────┴───────┐                   │
│                    │ Gemini API   │                   │
│                    │ (Vision)     │                   │
│                    └──────────────┘                   │
└─────────────────────────────────────────────────────┘
```

### 3.2 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React 19, Vite 7, TypeScript 5.8, Tailwind CSS 3, Zustand 5, React Router 7 |
| **백엔드** | NestJS 11, Express 5, Prisma 7, Passport JWT |
| **데이터베이스** | PostgreSQL |
| **AI** | Google Generative AI (Gemini 2.5 Flash Vision API) |
| **인프라** | Docker, Docker Compose, Nginx |
| **테스트** | Jest (백엔드), Vitest (프론트엔드) |
| **패키지 관리** | pnpm 10 (모노레포) |

### 3.3 모노레포 구조

```
ai-worker/
├── apps/
│   ├── api-server/       # NestJS 백엔드 (6개 모듈)
│   │   ├── src/
│   │   │   ├── auth/            # 이메일/비밀번호 인증
│   │   │   ├── presentation/    # 발표 스크립트 생성
│   │   │   ├── image-analysis/  # 이미지 분석
│   │   │   ├── image-to-excel/  # 영수증/명함 → 엑셀
│   │   │   ├── interview/       # 면접 질문 생성
│   │   │   └── prisma/          # DB 연결
│   │   └── prisma/schema.prisma
│   └── user-client/      # React 프론트엔드
│       └── src/
│           ├── features/        # 기능별 모듈
│           ├── components/      # 공통 컴포넌트
│           ├── stores/          # Zustand 상태 관리
│           └── pages/           # 페이지
├── docs/                  # 문서
└── docker-compose.yml
```

---

## 4. 주요 기능

### 4.1 발표 스크립트 생성

| 항목 | 내용 |
|------|------|
| 입력 | PPT 또는 PDF 파일 업로드 |
| 처리 | PPT→PDF→이미지 변환 → Gemini Vision 3단계 파이프라인 |
| 출력 | 슬라이드별 발표 스크립트 (톤/시간 조절 가능) |
| 부가 | 전체 복사, TXT 다운로드, 히스토리 관리 |

- LibreOffice로 PPT→PDF 변환, Poppler로 PDF→이미지 변환
- 이전 슬라이드 맥락을 반영한 자연스러운 스크립트 생성
- 격식체/비격식체, 목표 발표 시간 설정 가능

### 4.2 이미지 분석

| 항목 | 내용 |
|------|------|
| 입력 | 표, 차트, 기타 이미지 업로드 |
| 처리 | Gemini Vision API로 이미지 콘텐츠 분석 |
| 출력 | 텍스트 설명 + 핵심 인사이트 목록 |
| 부가 | 이미지 타입 자동 분류, 히스토리 관리 |

### 4.3 영수증/명함 → 엑셀 변환

| 항목 | 내용 |
|------|------|
| 입력 | 영수증 또는 명함 이미지 (다중 업로드) |
| 처리 | Gemini Vision API로 구조화 데이터 추출 |
| 출력 | 엑셀 파일 다운로드 (날짜, 상호명, 금액 등) |
| 부가 | 영수증/명함 타입 선택, 히스토리 관리 |

### 4.4 면접 질문 생성

| 항목 | 내용 |
|------|------|
| 입력 | 채용 공고(JD) 텍스트 + 이력서(선택) |
| 처리 | Gemini API로 직무 맞춤 면접 질문 생성 |
| 출력 | 질문 5개 + 평가 의도 + 키워드 + 상/중/하 평가 기준 |
| 부가 | 직무 유형 선택, 엑셀 다운로드, 전체 복사, 히스토리 관리 |

- 6개 직무 유형 지원 (개발, 디자인, 기획, 마케팅, 영업, 일반)
- 이력서 입력 시 지원자 맞춤 질문 생성

---

## 5. 데이터베이스 설계

```
User (1) ──→ (N) PresentationHistory
     (1) ──→ (N) ImageAnalysisHistory
     (1) ──→ (N) ImageToExcelHistory
     (1) ──→ (N) InterviewHistory
```

| 테이블 | 주요 필드 | 비고 |
|--------|----------|------|
| User | email, name, password | bcrypt 해싱 |
| PresentationHistory | filename, tone, slides(JSON), totalEstimatedSeconds | 슬라이드 데이터 JSON 저장 |
| ImageAnalysisHistory | filename, imageType, description, insights(JSON) | 이미지 파일 경로 별도 저장 |
| ImageToExcelHistory | type, imageCount, extractedData(JSON) | 엑셀 파일명 저장 |
| InterviewHistory | jdSummary, jobCategory, questionsData(JSON), hasResume | 질문 데이터 JSON 저장 |

- 모든 히스토리 테이블에 `userId + createdAt` 복합 인덱스 적용
- User 삭제 시 관련 히스토리 Cascade 삭제

---

## 6. 프로젝트 규모

| 지표 | 수치 |
|------|------|
| 총 커밋 수 | 33 |
| TypeScript 파일 수 | 204 |
| 총 코드 라인 수 | 약 29,000줄 |
| 백엔드 모듈 수 | 6 |
| 프론트엔드 기능 모듈 수 | 6 |
| DB 테이블 수 | 5 |
| 백엔드 테스트 파일 | 21 |
| 프론트엔드 테스트 파일 | 18 |

---

## 7. 개발 방법론

### TDD (테스트 주도 개발)

Kent Beck의 TDD와 Tidy First 원칙을 적용하여 개발하였다.

1. **Red**: 실패하는 테스트 먼저 작성
2. **Green**: 테스트를 통과하는 최소 코드 작성
3. **Refactor**: 구조 개선 (동작 변경 없이)

커밋 시 `[BEHAVIORAL]` (동작 변경)과 `[STRUCTURAL]` (구조 변경)을 구분하여 변경 이력을 명확히 관리하였다.

### AI 페어 프로그래밍

Claude Code를 활용한 AI 페어 프로그래밍으로 개발 생산성을 극대화하였다.

- PRD 작성 → 구현 계획 → TDD 사이클 → 코드 리뷰까지 전 과정에 AI 활용
- 커스텀 스킬(`/prd`, `/plan`, `/go-phase` 등)을 만들어 반복 워크플로우 자동화

---

## 8. 보안

| 항목 | 구현 |
|------|------|
| 인증 | 이메일/비밀번호 (bcrypt 해싱) |
| 인가 | JWT 토큰 기반 API 접근 제어 |
| CORS | 허용 Origin 제한 |
| 입력 검증 | JD 텍스트 길이 제한 (50~10,000자) |
| 데이터 격리 | userId 기반 히스토리 접근 제한 |

---

## 9. 배포 환경

Docker Compose를 통한 컨테이너 기반 배포 구성:

- **api-server**: NestJS + LibreOffice + Poppler (문서 변환 도구 포함)
- **user-client**: React 빌드 + Nginx 서빙
- **database**: PostgreSQL

개발/운영 환경 분리를 위한 별도 Docker 설정 파일 관리.

---

## 10. 향후 계획

- [ ] 다국어 스크립트 생성 지원
- [ ] 팀 공유 기능 (히스토리 공유, 협업)
- [ ] 추가 AI 모델 지원 (GPT-4o, Claude 등 선택 가능)
- [ ] 발표 리허설 모드 (타이머 + 스크립트 프롬프터)
- [ ] 관리자 대시보드 (사용 통계, 사용자 관리)
