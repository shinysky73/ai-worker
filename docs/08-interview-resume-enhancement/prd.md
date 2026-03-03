# PRD: 면접 질문 생성기 — 이력서 입력 추가 및 질문 수 조정

**Created**: 2026-03-03
**Status**: Draft
**Prerequisites**: 07-interview-question-generator 완료 상태

---

## 1. Problem

### 배경

현재 면접 질문 생성기는 채용 공고(JD)만 입력받아 역량 기반 면접 질문을 생성한다. JD에서 3-7개 역량을 추출하고 역량당 2-3개 질문을 만들어 총 10-20개 질문을 생성한다.

### 문제

1. **JD만으로는 일반적인 질문만 생성됨** — 지원자의 경력, 프로젝트 경험을 모르니 "~경험이 있나요?" 수준의 범용 질문에 그침
2. **질문 수가 과다** — 10-20개 질문은 면접관이 소화하기 어렵고, 역량별 나열로 중복 느낌이 있음
3. **이력서-JD 갭 분석 부재** — 지원자의 강점/약점을 파악한 맞춤 질문을 만들 수 없음

### 영향

- 면접관이 생성된 질문 중 일부만 골라 사용 → 도구 가치 저하
- 지원자 맞춤 질문은 면접관이 직접 이력서 읽고 추가 작성 → 시간 절감 효과 미흡

---

## 2. Functional Requirements

### FR-1: 이력서 텍스트 입력 (선택)

**Description**: 기존 JD 입력 영역 아래에 이력서/경력서 텍스트 입력 영역을 추가한다. 이력서 입력은 선택 사항이며, 미입력 시 기존과 동일하게 JD만으로 질문을 생성한다.

**현재 코드**:
- `apps/user-client/src/features/interview/pages/InterviewPage.tsx` — JD textarea만 존재
- `apps/user-client/src/features/interview/components/JdTextInput.tsx` — JD 입력 컴포넌트
- `apps/api-server/src/interview/interview.controller.ts` — `{ jdText, jobCategory }` 만 수신
- `apps/api-server/src/interview/interview.service.ts:submitJd()` — jdText만 검증

**Acceptance Criteria**:
- [ ] 프론트엔드에 이력서 텍스트 입력 영역이 JD 입력 아래에 표시된다
- [ ] 이력서 입력 영역에 "(선택)" 라벨이 표시된다
- [ ] 이력서 미입력 시에도 질문 생성이 정상 동작한다 (기존 호환)
- [ ] 이력서 텍스트는 최소 0자(빈 값 허용), 최대 10,000자까지 입력 가능하다
- [ ] 이력서 입력 시 글자 수 카운터가 표시된다
- [ ] API에 `resumeText` 필드가 선택 파라미터로 추가된다

**Edge Cases**:
- 이력서만 입력하고 JD 미입력: 기존과 동일하게 JD 최소 50자 검증에서 차단
- 이력서에 HTML 태그 포함: JD와 동일하게 태그 제거 후 처리

### FR-2: AI 프롬프트에 이력서 컨텍스트 반영

**Description**: 이력서가 입력된 경우, AI 프롬프트에 이력서 정보를 포함하여 JD-이력서 갭 분석 기반의 맞춤 질문을 생성한다.

**현재 코드**:
- `apps/api-server/src/interview/question-generator.service.ts:buildPrompt()` — JD + jobCategory만 사용

**Acceptance Criteria**:
- [ ] 이력서가 제공되면 프롬프트에 이력서 텍스트가 분석 대상으로 포함된다
- [ ] 이력서 기반 질문에는 지원자의 구체적 경력/프로젝트를 언급하는 질문이 포함된다
- [ ] 이력서 미제공 시 기존 JD-only 프롬프트가 사용된다

**Edge Cases**:
- JD와 이력서의 직무가 전혀 다른 경우: AI가 불일치를 인지하고 전환 동기 관련 질문 생성

### FR-3: 질문 수를 5개로 조정

**Description**: 역량별 다수 질문 대신, 핵심 질문 5개를 생성하도록 변경한다. 역량 그룹핑을 제거하고 플랫한 질문 리스트로 변경한다.

**현재 코드**:
- `apps/api-server/src/interview/question-generator.service.ts:buildPrompt()` — "3-7개 역량, 역량당 2-3개, 총 10-20개" 지시
- `apps/api-server/src/interview/types.ts` — `Competency[]` 구조 (역량 > 질문 중첩)
- `apps/user-client/src/features/interview/components/InterviewResult.tsx` — 역량별 아코디언 UI

**Acceptance Criteria**:
- [ ] AI 프롬프트가 핵심 질문 정확히 5개를 생성하도록 지시한다
- [ ] 응답 구조가 플랫한 질문 배열로 변경된다 (역량 중첩 제거)
- [ ] 각 질문에 `targetCompetency` 필드(문자열)가 포함되어 어떤 역량을 평가하는지 표시한다
- [ ] 이력서 제공 시: JD-이력서 갭 기반 맞춤 질문 5개 생성
- [ ] 이력서 미제공 시: JD 기반 핵심 질문 5개 생성
- [ ] 프론트엔드 결과 UI가 플랫 리스트로 변경된다 (아코디언 → 카드 리스트)
- [ ] 엑셀 출력에 `targetCompetency` 컬럼이 포함된다

**Edge Cases**:
- AI가 5개 미만 생성: 최소 3개 이상이면 유효로 처리, 미만이면 재시도
- AI가 5개 초과 생성: 앞에서 5개만 취함

### FR-4: 이력서 정보 저장

**Description**: 생성 이력에 이력서 포함 여부를 저장하여 히스토리에서 구분 가능하게 한다.

**현재 코드**:
- `apps/api-server/prisma/schema.prisma` — `InterviewHistory` 모델에 이력서 관련 필드 없음

**Acceptance Criteria**:
- [ ] `InterviewHistory` 모델에 `hasResume` (Boolean, default false) 필드가 추가된다
- [ ] 이력서가 제공된 생성 건은 `hasResume: true`로 저장된다
- [ ] 히스토리 목록에서 이력서 포함 여부가 표시된다 (뱃지 등)

**Edge Cases**:
- 기존 히스토리 데이터: 마이그레이션 시 default false로 처리

---

## 3. Affected Code

**수정 대상:**

Backend:
- `apps/api-server/src/interview/types.ts` — 응답 타입 변경 (Competency[] → InterviewQuestion[])
- `apps/api-server/src/interview/question-generator.service.ts` — 프롬프트 변경, resumeText 파라미터 추가
- `apps/api-server/src/interview/interview.service.ts` — resumeText 전달, 검증 추가
- `apps/api-server/src/interview/interview.controller.ts` — DTO에 resumeText 추가
- `apps/api-server/src/interview/excel-generator.service.ts` — 새 구조 반영
- `apps/api-server/prisma/schema.prisma` — hasResume 필드 추가

Frontend:
- `apps/user-client/src/features/interview/pages/InterviewPage.tsx` — 이력서 입력 영역 추가
- `apps/user-client/src/features/interview/components/InterviewResult.tsx` — 플랫 리스트 UI로 변경
- `apps/user-client/src/features/interview/hooks/useInterview.ts` — resumeText 전달
- `apps/user-client/src/features/interview/services/interviewApi.ts` — API 파라미터 추가

**의존성:**
- Prisma migration 필요 (hasResume 필드)
- 기존 테스트 (backend 34개 + frontend 17개) 업데이트 필요

---

## 4. Out of Scope

- 이력서 파일 업로드 (PDF/DOC) — 텍스트 입력만 지원
- 이력서 파싱/구조화 — 원문 그대로 AI에 전달
- 질문 수 사용자 설정 — 5개 고정
- 기존 히스토리 데이터 마이그레이션 (default false로 자동 처리)
- 이력서 원문 DB 저장 — 개인정보 이슈로 저장하지 않음, 포함 여부만 기록
