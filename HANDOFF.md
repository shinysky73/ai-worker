# JD 기반 면접 질문 생성기 - Handoff Document

## Goal
채용 공고(JD) 텍스트를 입력하면 AI(Gemini 2.5 Flash)가 직무별 역량을 분석하여 구조화된 면접 질문·평가 기준을 자동 생성하고, 엑셀 다운로드 및 히스토리 관리가 가능한 기능. PRD → TDD Plan → 8 Phase 구현 완료. 아직 커밋/PR 전 상태.

## Current Progress

### What's Been Done

**Backend (34 new tests, 4 test suites)**
- `QuestionGeneratorService` — Gemini AI로 JD 분석, 역량 추출(3~7개), 질문 생성(10~20개), JSON 파싱 + 코드블록 추출, 3회 재시도, 역량 최소 3개 검증
- `InterviewService` — 비동기 처리 오케스트레이션: JD 제출(HTML 스트립, 50~10,000자 검증), 상태 관리(인메모리 Map + TTL), 히스토리 자동 저장
- `InterviewExcelGeneratorService` — 면접 질문 결과 → .xlsx 변환 (역량, 질문, 평가의도, 키워드, 평가기준 상/중/하)
- `InterviewController` — REST API: `POST generate`, `GET :id/status`, `GET :id/download`, `GET/DELETE history`, `GET history/:id/download`
- `InterviewModule` — `app.module.ts`에 등록 완료
- `InterviewHistory` Prisma 모델 — schema.prisma 추가 + `prisma generate` + `prisma db push` 완료
- `PrismaService` — `interviewHistory` getter 추가

**Frontend (17 new tests, 3 test suites)**
- `interviewApi.ts` — submitJd, pollStatus, downloadExcel (4 tests)
- `interviewHistoryApi.ts` — fetchList, fetchDetail, deleteItem, downloadExcel (4 tests)
- `useInterviewStore` — Zustand store: jobCategory 옵션 관리 (3 tests)
- `useInterview` hook — submit → polling(2초 간격) → result 상태 머신, 클립보드 복사, 엑셀 다운로드 (6 tests)
- `useInterviewHistory` hook — 목록/삭제/다운로드
- `InterviewPage` — 직무 유형 선택(6개 카테고리 그리드) + JD 텍스트 입력(글자 수 카운터) + 처리 상태 + 결과 아코디언
- `InterviewHistoryPage` — 목록/상세/페이지네이션/재다운로드/삭제 확인
- Components: `JobCategorySelector`, `JdTextInput`, `InterviewResult`(아코디언 + 평가기준 카드), `InterviewProcessingStatus`
- `App.tsx` 라우트 추가: `/interview`, `/interview/history`
- `Navbar.tsx` — "면접 질문" 링크 (데스크톱 + 모바일)

**Docs**
- `docs/07-interview-question-generator/prd.md` — 5개 FR, AC, Edge Cases
- `docs/07-interview-question-generator/plan.md` — 8 Phases 전체 완료, 51개 테스트 기록

### What Worked
- 기존 `image-to-excel` 모듈 패턴을 그대로 참조 → 일관된 아키텍처 유지 (인메모리 상태 관리, 비동기 fire-and-forget, TTL 클린업)
- `data-extractor.service.ts`의 Gemini API 모킹 패턴을 `question-generator.service.spec.ts`에 재활용
- TDD Phase 순서 (Types → AI Service → Orchestration → Excel → History → Frontend API → Hook → UI) — 의존성 방향대로 빌드업
- 프론트엔드 보라색(violet) 테마로 기존 기능들(indigo/emerald)과 시각적으로 차별화

### What Didn't Work
- `JSX.Element` 타입이 React 19에서 네임스페이스 문제 발생 → `ReactNode`로 교체
- 테스트에서 JD 텍스트가 50자 미만이어서 실패 → 충분히 긴 한국어 텍스트로 교체

## Key Decisions
- **인메모리 상태 관리** — 기존 image-to-excel과 동일한 TTL 기반 Map 패턴 (Redis 미도입)
- **직무 유형 6개 고정** — 개발, 디자인, 기획/PM, 마케팅, 영업, 일반/기타 (프론트 + 백엔드 양쪽 검증)
- **3회 재시도 전략** — JSON 파싱 실패 또는 역량 3개 미만 시 Gemini API 재호출
- **역량별 아코디언 UI** — 드롭다운이 아닌 버튼 그리드로 직무 유형 선택 (한눈에 보기)
- **히스토리에 전체 questionsData JSON 저장** — 재조회 시 동일한 결과 카드 형태로 표시 가능

## Files Changed

### Backend (신규)
- `apps/api-server/src/interview/types.ts` — 공통 타입 (JobCategory, Competency, InterviewQuestion, InterviewQuestionResult)
- `apps/api-server/src/interview/question-generator.service.ts` + `.spec.ts` — AI 질문 생성 (5 tests)
- `apps/api-server/src/interview/interview.service.ts` + `.spec.ts` — 오케스트레이션 + 히스토리 (22 tests)
- `apps/api-server/src/interview/interview.controller.ts` + `.spec.ts` — REST API (3 tests)
- `apps/api-server/src/interview/excel-generator.service.ts` + `.spec.ts` — 엑셀 생성 (3 tests)
- `apps/api-server/src/interview/interview.module.ts` — NestJS 모듈

### Backend (수정)
- `apps/api-server/prisma/schema.prisma` — InterviewHistory 모델 + User relation 추가
- `apps/api-server/src/prisma/prisma.service.ts` — interviewHistory getter 추가
- `apps/api-server/src/app.module.ts` — InterviewModule import

### Frontend (신규)
- `apps/user-client/src/features/interview/` — 전체 feature 디렉토리 (services, stores, hooks, pages, components, index.ts)

### Frontend (수정)
- `apps/user-client/src/App.tsx` — 라우트 추가
- `apps/user-client/src/components/Navbar.tsx` — 네비게이션 링크 추가

## Test Status
- Backend: 180 tests passing (22 suites, 0 failures) — 기존 146 + 신규 34
- Frontend: 82 tests passing (18 suites, 0 failures) — 기존 65 + 신규 17
- 총 262개 테스트 all green. 기존 테스트 회귀 없음.
- 양쪽 빌드 정상 (`pnpm -F @ai-worker/api-server build`, `pnpm -F @ai-worker/user-client build`)

## Next Steps
1. **커밋 + PR 생성** — `feat/interview-question-generator` 브랜치 생성 → `[BEHAVIORAL]` 커밋 → PR
2. **E2E 수동 검증** — 실제 JD 텍스트로 면접 질문 생성 → 결과 확인 → 엑셀 다운로드 → 히스토리 조회/삭제
3. `docs/GUIDE.md`, `docs/GUIDE.html` — 아직 커밋되지 않은 가이드 문서 정리/커밋
4. 새 기능 기획 — `docs/01-idea/idea.md`에서 다음 기능 선정

## Resume Command
```
HANDOFF.md를 읽고 현재 작업 상태를 파악해줘. interview-question-generator 기능 8 Phase 구현 완료, 아직 커밋/PR 전. 다음 단계(커밋/PR 또는 E2E 검증)를 진행하자.
```
