# TDD Plan: JD 기반 면접 질문 생성기

**PRD**: `docs/07-interview-question-generator/prd.md`
**Created**: 2026-02-24
**Status**: Completed

---

# Backend (TDD)

## Phase 1: 타입 정의 + AI 질문 생성 서비스 (FR-3)

**Scope**: `apps/api-server/src/interview/types.ts`, `apps/api-server/src/interview/question-generator.service.ts`
**행동 목표**: JD 텍스트와 직무 유형을 입력하면 역량별 면접 질문·평가 포인트가 구조화된 JSON으로 반환된다.
**PRD AC**: FR-3 AC 1(역량 추출 + 질문 생성), AC 2(질문 구조), AC 3(질문 수 범위), AC 5(JSON 결과)
**Edge Cases**: JD가 짧아 역량 추출 어려운 경우 일반 질문 보충, AI 응답 JSON 파싱 불가 시 2회 재시도, Gemini API 타임아웃

### ⚠ 위험 요소
- Gemini API 응답 포맷이 불안정할 수 있음 — `data-extractor.service.ts`의 JSON 파싱 + 코드블록 추출 패턴 재활용
- 프롬프트 품질이 질문 품질을 좌우 — Spike 없이 진행하되, 프롬프트는 상수로 분리하여 교체 용이하게

### Tests:
- [x] shouldGenerateQuestionsFromJD: JD 텍스트에서 역량별 면접 질문 생성
- [x] shouldUseDefaultCategory: 직무 유형 미지정 시 일반/기타로 처리
- [x] shouldHandleCodeBlockResponse: ```json 코드 블록 감싸진 응답 파싱
- [x] shouldRetryOnInvalidJson: JSON 파싱 실패 시 최대 2회 재시도 후 에러
- [x] shouldValidateMinCompetencies: 역량이 3개 미만이면 재시도

---

## Phase 2: 면접 서비스 + 컨트롤러 (FR-1, FR-2, FR-3)

**Scope**: `apps/api-server/src/interview/interview.service.ts`, `apps/api-server/src/interview/interview.controller.ts`
**행동 목표**: POST `/api/interview/generate` 엔드포인트가 JD 텍스트 + 직무 유형을 받아 비동기 처리를 시작하고, 상태 폴링과 결과 조회가 가능하다.
**PRD AC**: FR-1 AC 1(텍스트 수신), AC 2(id 반환), AC 3(50자 미만 에러) / FR-2 AC 1(직무 유형), AC 2(기본값), AC 3(jobCategory 전달) / FR-3 AC 4(폴링)
**Edge Cases**: 10,000자 초과, 빈 문자열, HTML 태그 strip, 유효하지 않은 jobCategory

### ⚠ 위험 요소
- `app.module.ts` 수정 필요 — InterviewModule import 추가

### Tests:
- [x] shouldReturnIdOnSubmit: JD 제출 시 ID 반환
- [x] shouldRejectShortJd: 50자 미만 JD 제출 시 400 에러
- [x] shouldRejectLongJd: 10,000자 초과 JD 제출 시 413 에러
- [x] shouldRejectBlankJd: 공백만 있는 텍스트 제출 시 400 에러
- [x] shouldStripHtmlTags: HTML 태그 포함 텍스트에서 태그 제거
- [x] shouldUseDefaultCategory: 유효하지 않은 직무 유형은 일반/기타로 대체
- [x] shouldReturnProcessingStatus: 처리 중 상태 반환
- [x] shouldReturnCompletedWithResult: 처리 완료 후 결과 포함
- [x] shouldReturnPendingForUnknownId: 알 수 없는 ID는 pending 반환
- [x] shouldDenyAccessForWrongUser: 다른 사용자의 결과 조회 시 pending 반환
- [x] shouldSetErrorOnGenerationFailure: AI 생성 실패 시 에러 상태
- [x] shouldReturnIdOnGenerate (controller): JD 제출 시 { id } 반환
- [x] shouldUseDefaultCategory (controller): jobCategory 미전달 시 일반/기타 기본값
- [x] shouldReturnStatus (controller): 상태 조회 결과 반환

---

## Phase 3: 엑셀 생성 + 히스토리 (FR-4, FR-5)

**Scope**: `apps/api-server/src/interview/excel-generator.service.ts`, `apps/api-server/src/interview/interview.service.ts` (히스토리 부분), `prisma/schema.prisma`
**행동 목표**: 생성 결과를 엑셀로 다운로드할 수 있고, 히스토리가 DB에 저장·조회·삭제된다.
**PRD AC**: FR-4 AC 3(엑셀 다운로드) / FR-5 AC 1(자동 저장), AC 2(페이지네이션 조회), AC 3(상세 조회), AC 4(삭제)
**Edge Cases**: 역량 1개 → 최소 3개 질문 보장, DB 저장 실패 시 결과는 정상 반환, 히스토리 0건

### ⚠ 위험 요소
- Prisma 마이그레이션 필요 — `InterviewHistory` 모델 추가, User relation 추가
- 기존 Prisma 클라이언트 재생성 필요 (`npx prisma generate`)

### Tests:
- [x] shouldGenerateExcelBuffer: 면접 질문 결과를 엑셀 Buffer로 변환
- [x] shouldHandleEmptyResult: 질문이 없는 경우에도 엑셀 생성
- [x] shouldReturnExcelAfterProcessing: 처리 완료 후 엑셀 Buffer 반환
- [x] shouldReturnNullForWrongUser: 다른 사용자의 엑셀 요청 시 null
- [x] shouldSaveHistoryOnCompletion: 생성 완료 시 자동으로 히스토리 저장
- [x] shouldReturnPaginatedList: 페이지네이션된 히스토리 목록 반환
- [x] shouldReturnDetail: 히스토리 상세 반환
- [x] shouldThrow404WhenNotFound: 존재하지 않는 히스토리는 404
- [x] shouldDeleteHistory: 히스토리 삭제
- [x] shouldThrow404DeleteNotFound: 존재하지 않는 히스토리 삭제 시 404
- [x] shouldRegenerateExcelFromHistory: 히스토리에서 엑셀 재생성
- [x] shouldThrow404RegenNotFound: 존재하지 않는 히스토리 재다운로드 시 404

---

# Frontend Logic (TDD)

## Phase 4: API 서비스 + Store (FR-1, FR-2)

**Scope**: `apps/user-client/src/features/interview/services/interviewApi.ts`, `apps/user-client/src/features/interview/stores/interviewStore.ts`
**행동 목표**: 백엔드 API를 호출하는 클라이언트와 직무 유형·입력 텍스트 상태를 관리하는 Zustand store가 동작한다.
**PRD AC**: FR-1 AC 1(텍스트 제출), AC 2(POST 요청 + id 응답) / FR-2 AC 1(직무 유형 선택), AC 2(기본값), AC 3(jobCategory 전달)
**Edge Cases**: 네트워크 에러 시 에러 메시지 추출, 타임아웃

### Tests:
- [x] shouldPostJdAndReturnId: JD 텍스트 제출 시 id 반환
- [x] shouldExtractErrorMessage: API 에러 시 에러 메시지 추출
- [x] shouldPollStatusById: ID로 상태 조회
- [x] shouldDownloadExcelBlob: 엑셀 파일 Blob 다운로드
- [x] shouldFetchPaginatedList: 페이지네이션 목록 조회
- [x] shouldFetchDetailById: ID로 상세 조회
- [x] shouldDeleteById: ID로 삭제
- [x] shouldDownloadHistoryExcelBlob: 히스토리 엑셀 다운로드
- [x] shouldHaveDefaultOptions: 기본값은 일반/기타
- [x] shouldSetOptions: 옵션 변경
- [x] shouldResetToDefault: 리셋 시 기본값 복원

---

## Phase 5: useInterview 훅 (FR-1, FR-3, FR-4)

**Scope**: `apps/user-client/src/features/interview/hooks/useInterview.ts`
**행동 목표**: 제출 → 폴링 → 완료/에러 상태 전이가 동작하고, 결과 데이터와 복사/다운로드 액션이 제공된다.
**PRD AC**: FR-1 AC 3(50자 미만 에러) / FR-3 AC 4(폴링 상태) / FR-4 AC 4(클립보드 복사)
**Edge Cases**: 빈 문자열/공백 입력 차단, 폴링 중 컴포넌트 언마운트 시 클린업, 에러 후 리셋

### Tests:
- [x] shouldStartInIdleState: 초기 상태는 idle
- [x] shouldRejectShortJd: 50자 미만 JD 제출 시 에러
- [x] shouldSubmitAndPollToCompletion: 제출 → 폴링 → 완료
- [x] shouldHandleSubmitError: 제출 실패 시 에러 상태
- [x] shouldHandlePollError: 폴링에서 에러 반환 시 에러 상태
- [x] shouldResetState: reset 시 idle 상태로 복원

---

# UI/UX (Non-TDD)

## Phase 6: 면접 질문 생성 페이지

**Scope**: `apps/user-client/src/features/interview/pages/InterviewPage.tsx`, `apps/user-client/src/features/interview/components/`

### Tasks:
- [x] JD 텍스트 입력 textarea (글자 수 카운터, 50~10,000자 유효성) — `JdTextInput.tsx`
- [x] 직무 유형 드롭다운 (개발, 디자인, 기획/PM, 마케팅, 영업, 일반/기타) — `JobCategorySelector.tsx`
- [x] 제출 버튼 (유효성 미충족 시 비활성화)
- [x] ProcessingStatus 컴포넌트 (스피너 + 상태 메시지) — `InterviewProcessingStatus.tsx`
- [x] 역량별 질문 결과 카드 (아코디언 형태: 역량명 → 질문 목록) — `InterviewResult.tsx`
- [x] 각 질문: 질문 텍스트, 평가 의도, 우수 답변 키워드, 평가 기준(상/중/하)
- [x] "엑셀 다운로드" 버튼 + "전체 복사" 버튼
- [x] 에러 상태 표시 + 재시도 버튼

---

## Phase 7: 히스토리 페이지

**Scope**: `apps/user-client/src/features/interview/pages/InterviewHistoryPage.tsx`

### Tasks:
- [x] 히스토리 목록 테이블 (JD 요약, 직무 유형, 생성일, 질문 수)
- [x] 페이지네이션 (10건/페이지)
- [x] 상세 보기 (Phase 6과 동일한 결과 카드 형태)
- [x] 삭제 버튼 + 확인 모달
- [x] 빈 상태: "아직 생성한 면접 질문이 없습니다" 메시지

---

## Phase 8: 통합 (라우팅 + 네비게이션)

**Scope**: `apps/user-client/src/App.tsx`, `apps/user-client/src/components/Navbar.tsx`, `apps/api-server/src/app.module.ts`

### Tasks:
- [x] `/interview` 라우트 → InterviewPage
- [x] `/interview/history` 라우트 → InterviewHistoryPage
- [x] Navbar에 "면접 질문" 링크 추가
- [x] `app.module.ts`에 InterviewModule import
- [x] Prisma schema에 InterviewHistory 모델 추가 + `prisma generate` 완료

---

## Notes

- Phase 1~3 (Backend)은 순서대로 진행 — Phase 2가 Phase 1의 QuestionGeneratorService에 의존
- Phase 4~5 (Frontend Logic)는 Phase 1~3 완료 후 진행 — API 응답 타입이 확정되어야 함
- Phase 6~8 (UI)는 Phase 4~5 완료 후 진행
- `exceljs`와 `@google/generative-ai`는 이미 설치됨 — 추가 패키지 불필요
- Gemini API 모킹 패턴은 `data-extractor.service.spec.ts` 참조
- 프론트엔드 테스트는 Vitest + `vi.mock` 사용 (Jest 아님)
