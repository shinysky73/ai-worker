# Plan: 면접 질문 생성기 — 이력서 입력 추가 및 질문 수 조정

**PRD**: `docs/08-interview-resume-enhancement/prd.md`
**Created**: 2026-03-03

---

## Phase 1: 타입 변경 및 DB 스키마 (FR-3, FR-4)

**Scope**: `types.ts` (BE+FE), `schema.prisma`, Prisma migration
**행동 목표**: 응답 구조가 `Competency[]` 중첩에서 플랫 `InterviewQuestion[]`로 변경되고, `InterviewHistory`에 `hasResume` 필드가 추가된다
**PRD AC**: FR-3의 AC 2, 3 / FR-4의 AC 1

### ⚠ 위험 요소
- **타입 변경이 전체 파이프라인에 영향**: `InterviewQuestionResult` 타입을 소비하는 모든 서비스/컴포넌트가 깨짐 (question-generator, interview.service, excel-generator, InterviewResult 컴포넌트, useInterview hook, interviewApi)
- 기존 테스트의 `MOCK_RESULT`가 모두 구조 변경 필요
- DB 마이그레이션: `hasResume` default false → 기존 데이터 안전

### Tests:
- [x] shouldHaveFlatQuestionStructure: InterviewQuestionResult.questions[] 플랫 구조 확인 (기존 테스트 MOCK_RESULT 전체 업데이트)
- [x] shouldHaveTargetCompetencyInQuestion: 각 질문에 targetCompetency 필드 존재 확인
- [x] shouldHaveHasResumeInSchema: InterviewHistory에 hasResume 필드 추가 확인
- [x] allExistingTests181Pass: 기존 백엔드 181개 테스트 전체 통과

---

## Phase 2: Backend — resumeText 수신 및 검증 (FR-1, FR-4)

**Scope**: `interview.controller.ts`, `interview.service.ts`
**행동 목표**: API가 `resumeText` 선택 파라미터를 수신하고, HTML 태그 제거 + 10,000자 제한 검증을 수행하며, `hasResume` 값을 히스토리에 저장한다
**PRD AC**: FR-1의 AC 3, 4, 6 / FR-4의 AC 2
**Edge Cases**: 이력서만 입력 + JD 미입력 → JD 검증에서 차단, 이력서 HTML 태그 제거

### ⚠ 위험 요소
- `submitJd` 시그니처 변경 → 기존 테스트 호출부 업데이트 필요
- `StoreEntry`에 `resumeText` 추가 → `processGeneration`에서 전달 필요

### Tests:
- [x] shouldPassResumeTextToGenerator: resumeText가 제공되면 generator에 전달
- [x] shouldStripHtmlFromResume: 이력서 HTML 태그 제거
- [x] shouldRejectLongResume: 10,000자 초과 이력서 제출 시 413 에러
- [x] shouldIgnoreEmptyResume: 빈 이력서는 undefined로 처리
- [x] shouldSaveHasResumeTrue: 이력서 제공 시 hasResume: true로 저장
- [x] shouldSaveHasResumeFalse: 이력서 미제공 시 hasResume: false로 저장

---

## Phase 3: Backend — AI 프롬프트 및 질문 생성 변경 (FR-2, FR-3)

**Scope**: `question-generator.service.ts`
**행동 목표**: `generate()`가 `resumeText`를 선택 파라미터로 받아 프롬프트에 반영하며, 5개 플랫 질문(+targetCompetency)을 생성하고 검증/정규화한다
**PRD AC**: FR-2의 AC 1, 2, 3 / FR-3의 AC 1, 4, 5
**Edge Cases**: 이력서 미제공 시 JD-only 프롬프트, AI가 5개 미만/초과 생성 시 처리

### ⚠ 위험 요소
- 프롬프트 변경은 AI 응답 형식에 직접 영향 → `isValidResult`, `normalizeResult` 로직 전면 수정
- `MIN_COMPETENCIES` 검증 → `MIN_QUESTIONS` 검증으로 전환

### Tests:
- [x] shouldIncludeResumeInPrompt: 이력서 제공 시 프롬프트에 이력서 포함
- [x] shouldNotIncludeResumeWhenNotProvided: 이력서 미제공 시 이력서 섹션 없음
- [x] shouldLimitToFiveQuestions: AI가 5개 초과 생성 시 5개만 반환

---

## Phase 4: Backend — 엑셀 생성기 변경 (FR-3)

**Scope**: `excel-generator.service.ts`
**행동 목표**: 엑셀이 플랫 질문 리스트 구조로 생성되며, `targetCompetency` 컬럼이 포함된다
**PRD AC**: FR-3의 AC 7

### Tests:
- [x] shouldIncludeTargetCompetencyColumn: 엑셀에 평가 역량 컬럼 포함

---

## Phase 5: Frontend — API 및 Hook 변경 (FR-1, FR-3)

**Scope**: `interviewApi.ts`, `useInterview.ts`
**행동 목표**: `submitJd`가 `resumeText`를 선택 파라미터로 전달하고, hook의 `submit`과 `copyToClipboard`가 새 플랫 구조에 맞게 동작한다
**PRD AC**: FR-1의 AC 6 / FR-3의 AC 2

### ⚠ 위험 요소
- `interviewApi.submitJd` 시그니처 변경 → mock 업데이트 필요
- `copyToClipboard`의 `competencies` 순회 로직 → 플랫 `questions` 순회로 변경

### Tests:
- [x] shouldIncludeResumeTextWhenProvided: 이력서 포함 시 body에 resumeText 추가
- [x] shouldSubmitAndPollToCompletion: 플랫 구조 result.questions 검증 (기존 테스트 업데이트)
- [x] allFrontendTests83Pass: 프론트엔드 83개 테스트 전체 통과

---

## Phase 6: Frontend UI — 이력서 입력 및 결과 표시 (FR-1, FR-3, FR-4)

**Scope**: `InterviewPage.tsx`, `InterviewResult.tsx`, `InterviewHistoryPage.tsx`
**행동 목표**: 이력서 텍스트 입력 영역이 추가되고, 결과가 플랫 카드 리스트로 표시되며, 히스토리에 이력서 포함 뱃지가 표시된다

### Tasks:
- [x] `InterviewPage.tsx`에 이력서 textarea 추가 (JD 입력 아래, "(선택)" 라벨, 글자 수 카운터)
- [x] `InterviewPage.tsx`의 `handleSubmit`에서 `resumeText` 전달
- [x] `InterviewResult.tsx` — 아코디언(역량별) → 카드 리스트(플랫) UI 변경
- [x] `InterviewResult.tsx` — 각 카드에 `targetCompetency` 뱃지 표시
- [x] 히스토리 목록/상세에서 이력서 포함 여부 뱃지 표시
- [x] `InterviewHistoryPage.tsx` — handleDetailCopy 플랫 구조 대응

**PRD AC**: FR-1의 AC 1, 2, 4, 5 / FR-3의 AC 6 / FR-4의 AC 3

---

## Phase 순서 및 의존성

```
Phase 1 (타입+DB) → Phase 2 (BE 수신/검증) → Phase 3 (BE AI 프롬프트)
                                             → Phase 4 (BE 엑셀)
                  → Phase 5 (FE API/Hook)    → Phase 6 (FE UI)
```

- Phase 1이 모든 후속 Phase의 기반 (타입이 바뀌므로)
- Phase 2, 3, 4는 순차 (service → generator → excel)
- Phase 5는 Phase 1 이후 독립 진행 가능
- Phase 6은 Phase 5 이후 (hook 시그니처 확정 후 UI 연결)
