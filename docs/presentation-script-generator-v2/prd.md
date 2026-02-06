# PRD: AI 기반 발표 스크립트 자동 생성기

**Author**: AI Worker Team
**Created**: 2026-02-06
**Status**: Approved

---

## 1. Problem Statement

### Background

사내에서 프레젠테이션 발표는 주간 보고, 프로젝트 리뷰, 고객 제안 등 다양한 상황에서 수시로 이루어진다. 대부분의 직원은 슬라이드 제작 후 발표 스크립트를 별도로 작성해야 하며, 이 과정이 전체 발표 준비 시간의 상당 부분을 차지한다.

### Problem

- **스크립트 작성에 과도한 시간 소요**: 20장 기준 평균 2-3시간이 수동 스크립트 작성에 소요
- **시각 자료 활용 부족**: 차트, 그래프, 다이어그램 등의 데이터를 구두로 어떻게 설명할지 매번 고민
- **흐름 단절 및 어투 불일관**: 슬라이드 간 전환이 부자연스럽고 격식체/비격식체가 혼용되는 경우 빈번
- **시간 배분 실패**: 발표 리허설 시 특정 슬라이드에서 시간이 초과/부족하는 문제 반복
- **품질 편차**: 발표 경험이 적은 직원은 스크립트 품질이 크게 떨어짐

### Impact

이 문제를 해결하지 않을 경우:
- 발표 준비에 소요되는 비생산적 시간이 지속적으로 누적
- 발표 품질 차이로 인한 커뮤니케이션 효율 저하
- 신입사원의 발표 부담 증가 및 업무 적응 지연

---

## 2. Goals & Success Metrics

### Primary Goal

PPT/PDF 파일을 업로드하면 AI가 각 슬라이드의 텍스트, 차트, 이미지를 상세 분석하여 맥락 있는 발표 스크립트를 자동 생성하고, 전체 흐름을 다듬어 즉시 사용 가능한 수준의 스크립트를 제공한다.

### Success Metrics

| Metric | As-Is | To-Be |
|--------|-------|-------|
| 스크립트 작성 시간 (20슬라이드) | 2-3시간 | 3-5분 |
| 슬라이드당 AI 분석 항목 | 없음 | 6가지 (텍스트, 차트, 이미지, 레이아웃, 핵심메시지, 보충설명) |
| 슬라이드 간 전환 문장 | 수동 작성 | 자동 생성 |
| 전체 일관성 검토 | 수동 리뷰 | AI 자동 후처리 |
| 지원 파일 형식 | 없음 | PPT, PPTX, PDF |

---

## 3. User Stories

### Must Have (P0)

- [x] 사용자로서, PPT/PPTX/PDF 파일을 업로드하면 AI가 슬라이드별 발표 스크립트를 생성해주길 원한다
- [x] 사용자로서, 각 슬라이드의 텍스트뿐 아니라 차트/그래프/이미지도 스크립트에 반영되길 원한다
- [x] 사용자로서, 슬라이드 간 자연스러운 전환 문장이 자동으로 포함되길 원한다
- [x] 사용자로서, 처리 진행 상황을 실시간으로 확인하고 싶다
- [x] 사용자로서, 생성된 스크립트를 복사하거나 텍스트 파일로 다운로드하고 싶다

### Should Have (P1)

- [x] 사용자로서, 발표 톤(격식체/비격식체)을 선택할 수 있길 원한다
- [x] 사용자로서, 목표 발표 시간을 지정하면 분량이 자동 조절되길 원한다
- [x] 사용자로서, 전체 스크립트가 일관된 어투와 흐름으로 다듬어지길 원한다 (후처리)

### Could Have (P2)

- [ ] 사용자로서, 생성된 스크립트를 PPT 발표자 노트에 자동 삽입하고 싶다
- [ ] 사용자로서, 스크립트를 TTS로 들어보며 발표 연습을 하고 싶다
- [ ] 사용자로서, Google Slides URL을 직접 입력해서 스크립트를 생성하고 싶다

---

## 4. Functional Requirements

### FR-1: 파일 업로드 및 검증

**Description**: 사용자가 PPT, PPTX, PDF 파일을 업로드하면 서버에서 파일 유효성을 검증한다.

**Acceptance Criteria**:
- [x] PPT, PPTX, PDF 파일 형식을 허용
- [x] MIME 타입 + 매직바이트(file signature) 이중 검증
- [x] 파일 확장자 화이트리스트 검증 (.ppt, .pptx, .pdf)
- [x] 최대 파일 크기 50MB 제한
- [x] 드래그 앤 드롭 및 파일 선택 모두 지원

**Edge Cases**:
- 확장자가 .pptx이지만 내용이 다른 파일: 매직바이트 검증으로 거부
- 0바이트 파일: 매직바이트 길이 부족으로 거부
- 50MB 초과 파일: 클라이언트 + 서버 양쪽에서 거부

### FR-2: 파일 변환 파이프라인

**Description**: 업로드된 파일을 이미지로 변환하여 AI 분석이 가능한 형태로 준비한다.

**Acceptance Criteria**:
- [x] PPT/PPTX → PDF 변환 (LibreOffice headless)
- [x] PDF → PNG 이미지 변환 (Poppler pdftoppm, 1920x1080)
- [x] PDF 파일 직접 업로드 시 PPT→PDF 변환 단계 스킵
- [x] 최대 50슬라이드 제한
- [x] 외부 명령 5분 타임아웃
- [x] 변환 결과 파일 존재 여부 검증

**Edge Cases**:
- LibreOffice/Poppler 미설치: 명확한 에러 메시지 반환
- 변환 후 빈 출력: "No images generated" 에러
- 한글 폰트 깨짐: Docker 이미지에 fonts-nanum 포함

### FR-3: 3단계 AI 스크립트 생성 파이프라인

**Description**: AI(Google Gemini)를 활용하여 슬라이드 분석 → 맥락 기반 스크립트 생성 → 전체 후처리의 3단계로 스크립트를 생성한다.

**Step 1: 슬라이드 상세 분석 (병렬)**

**Acceptance Criteria**:
- [x] 슬라이드 내 모든 텍스트 OCR 추출 (제목, 본문, 캡션, 주석)
- [x] 차트/그래프 유형 및 데이터 경향 분석
- [x] 이미지/아이콘/다이어그램 설명
- [x] 슬라이드 유형 분류 (title, content, chart, comparison, image, closing)
- [x] 핵심 메시지 추출
- [x] 발표자 보충 설명 추론
- [x] 최대 3개 동시 병렬 처리

**Step 2: 맥락 기반 스크립트 생성 (순차)**

**Acceptance Criteria**:
- [x] 이전 3개 슬라이드의 스크립트를 컨텍스트로 전달
- [x] 슬라이드 위치에 따른 역할 부여 (도입부/본론/마무리)
- [x] 차트/그래프 데이터의 의미와 시사점 반드시 포함
- [x] 슬라이드 간 전환 문장(transition) 자동 생성
- [x] 톤(격식/비격식) 및 목표 시간 반영

**Step 3: 전체 후처리 리파인 (1회 호출)**

**Acceptance Criteria**:
- [x] 도입 → 본론 → 결론 흐름 검토/보완
- [x] 전환 자연스러움 검토
- [x] 어투/용어 일관성 확인
- [x] 중복 표현 제거
- [x] 슬라이드 중요도에 따른 시간 배분 최적화
- [x] 첫/마지막 슬라이드 특별 처리

### FR-4: 실시간 진행 상태 표시

**Description**: 처리 과정을 단계별로 추적하여 사용자에게 진행률을 표시한다.

**Acceptance Criteria**:
- [x] 진행률 0-100% 실시간 표시
- [x] 단계별 상세 메시지 (한글)
  - 0-15%: 파일 변환
  - 15-45%: 슬라이드 분석
  - 45-80%: 스크립트 생성
  - 80-95%: 전체 스크립트 다듬기
  - 100%: 완료
- [x] 1초 간격 폴링, 최대 10분 타임아웃
- [x] 에러 발생 시 명확한 에러 메시지 표시
- [x] 컴포넌트 언마운트 시 폴링 자동 정리

### FR-5: 결과 표시 및 내보내기

**Description**: 생성된 스크립트를 슬라이드별로 표시하고 다양한 방식으로 내보낸다.

**Acceptance Criteria**:
- [x] 슬라이드별 스크립트 카드 표시 (번호, 내용, 예상 시간)
- [x] 전환 문장을 화살표 아이콘과 함께 별도 표시
- [x] 총 발표 시간 및 슬라이드 수 요약
- [x] 개별 슬라이드 스크립트 복사 (클립보드)
- [x] 전체 스크립트 일괄 복사
- [x] 텍스트 파일(.txt) 다운로드 (전환 문장 포함)
- [x] 복사 성공/실패 시각적 피드백

---

## 5. Non-Functional Requirements

### Performance

- 20슬라이드 기준 전체 처리 시간 5분 이내
- 슬라이드 분석 병렬 처리 (동시 3개)로 처리 속도 최적화
- 파일 업로드 진행률 실시간 표시

### Security

- 셸 인젝션 방지: `execFile()` 사용 (문자열 기반 `exec()` 사용 금지)
- 파일 확장자 화이트리스트 + 매직바이트 이중 검증
- CORS origin 제한 (환경변수로 설정 가능)
- 업로드 파일명에 UUID 사용하여 경로 순회(path traversal) 방지

### Reliability

- API 호출 실패 시 지수 백오프 자동 재시도 (최대 3회)
- 외부 명령(soffice, pdftoppm) 5분 타임아웃
- 인메모리 상태 저장소 TTL 기반 자동 정리 (1시간)
- 컴포넌트 언마운트 시 메모리 누수 방지 (폴링 타이머 정리)

### Scalability

- Docker Compose로 컨테이너화하여 환경 독립적 실행
- 한글 폰트 포함으로 한국어 프레젠테이션 완벽 지원

---

## 6. Technical Considerations

### Architecture

```
[사용자] → [React SPA] → [NestJS API] → [Gemini Vision API]
                                       → [LibreOffice] → [Poppler]
```

**3단계 AI 파이프라인**:
```
PPT/PDF 업로드
  → 파일 변환 (PPT→PDF→PNG)
  → Step 1: 슬라이드 상세 분석 (병렬, Gemini Vision)
  → Step 2: 맥락 기반 스크립트 생성 (순차, 이전 슬라이드 컨텍스트 전달)
  → Step 3: 전체 후처리 리파인 (1회 호출, 흐름/일관성/시간배분 최적화)
  → 결과 반환
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS, Zustand 5 |
| Backend | NestJS 11, Express 5, TypeScript 5.8 |
| AI | Google Generative AI (Gemini 2.5 Flash) |
| File Conversion | LibreOffice (headless), Poppler (pdftoppm) |
| Infrastructure | Docker, Docker Compose, Nginx |

### Existing Patterns

- pnpm 모노레포 (`apps/*`, `packages/*`)
- NestJS Module 패턴 (Controller → Service → 외부서비스)
- Zustand + Custom Hook 패턴 (프론트엔드 상태 관리)
- Feature-based 디렉토리 구조 (`features/presentation/`)

### Dependencies

- **Google Gemini API**: 슬라이드 분석 및 스크립트 생성 (API Key 필요)
- **LibreOffice**: PPT/PPTX → PDF 변환 (Docker 이미지에 포함)
- **Poppler**: PDF → PNG 이미지 변환 (Docker 이미지에 포함)

### Constraints

- Gemini API 호출 비용 및 Rate Limit (동시 3개 제한으로 대응)
- LibreOffice 변환 시 메모리 사용량 (컨테이너 최소 2GB RAM 권장)
- 인메모리 상태 관리 (서버 재시작 시 진행 중 작업 유실)

---

## 7. Out of Scope

이 버전에서는 다음을 포함하지 않는다:

- 생성된 스크립트를 PPT 발표자 노트에 자동 삽입
- TTS(Text-to-Speech) 기반 발표 연습 기능
- Google Slides URL 직접 입력
- 다국어 지원 (현재 한국어 전용)
- 사용자 계정/인증 시스템
- 생성 이력 관리 및 영구 저장 (DB)
- 동시 다수 사용자를 위한 작업 큐 시스템 (Redis/Bull)

---

## 8. Open Questions

| Question | Resolution |
|----------|------------|
| Gemini API 비용 한도는? | 사내 API Key 할당량 내 운영, 필요 시 요청 |
| Docker 배포 환경은? | 사내 서버 또는 클라우드 VM (Docker 설치 필요) |
| 최대 동시 사용자 수는? | MVP는 단일 서버, 향후 필요 시 큐 시스템 도입 |

---

## Appendix

### 처리 파이프라인 상세 흐름도

```
┌──────────────┐
│  파일 업로드   │  PPT / PPTX / PDF (최대 50MB)
└──────┬───────┘
       │
       ▼ (0-15%)
┌──────────────┐
│  파일 변환    │  PDF면 스킵 → PDF → PNG (1920x1080)
└──────┬───────┘
       │
       ▼ (15-45%)
┌──────────────────────────────────────┐
│  Step 1: 슬라이드 분석 (병렬 x3)      │
│  ┌─────────────────────────────┐     │
│  │ 각 슬라이드 이미지 → Gemini  │     │
│  │ → 텍스트 OCR               │     │
│  │ → 차트/그래프 분석          │     │
│  │ → 이미지/다이어그램 설명     │     │
│  │ → 레이아웃 유형 분류        │     │
│  │ → 핵심 메시지 추출          │     │
│  │ → 보충 설명 추론            │     │
│  └─────────────────────────────┘     │
└──────────────┬───────────────────────┘
               │
               ▼ (45-80%)
┌──────────────────────────────────────┐
│  Step 2: 스크립트 생성 (순차)          │
│  ┌─────────────────────────────┐     │
│  │ 슬라이드 N 분석 결과         │     │
│  │ + 이전 3개 슬라이드 스크립트  │     │
│  │ + 톤 / 목표시간 설정         │     │
│  │ + 위치 힌트 (도입/본론/결론) │     │
│  │ → 스크립트 + 전환 문장 생성  │     │
│  └─────────────────────────────┘     │
└──────────────┬───────────────────────┘
               │
               ▼ (80-95%)
┌──────────────────────────────────────┐
│  Step 3: 후처리 리파인 (1회 호출)      │
│  - 흐름 (도입→본론→결론) 보완         │
│  - 전환 자연스러움 검토               │
│  - 어투/용어 일관성 확인              │
│  - 중복 표현 제거                    │
│  - 시간 배분 최적화                  │
└──────────────┬───────────────────────┘
               │
               ▼ (100%)
┌──────────────┐
│  결과 반환    │  슬라이드별 스크립트 + 전환 문장 + 예상 시간
└──────────────┘
```

### 프로젝트 구조

```
ai-worker/
├── apps/
│   ├── api-server/           # NestJS 백엔드
│   │   ├── src/presentation/ # 핵심 비즈니스 로직
│   │   │   ├── converter.service.ts          # 파일 변환
│   │   │   ├── script-generator.service.ts   # 3단계 AI 파이프라인
│   │   │   ├── presentation.service.ts       # 오케스트레이션
│   │   │   ├── presentation.controller.ts    # REST API
│   │   │   └── utils/retry.ts               # 재시도 유틸
│   │   └── Dockerfile
│   └── user-client/          # React 프론트엔드
│       ├── src/features/presentation/
│       │   ├── pages/         # PresentationPage
│       │   ├── components/    # UI 컴포넌트
│       │   ├── hooks/         # usePresentation
│       │   ├── services/      # API 클라이언트
│       │   ├── stores/        # Zustand 상태
│       │   └── utils/         # 공통 유틸
│       ├── nginx.conf
│       └── Dockerfile
├── docker-compose.yml
└── docs/
```

### Related Documents

- 기존 PRD: `docs/presentation-script-generator/prd.md`
- 구현 계획: `docs/presentation-script-generator/plan.md`
