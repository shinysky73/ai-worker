# PRD: JD 기반 면접 질문 생성기

**Created**: 2026-02-24
**Status**: Draft
**Prerequisites**: 기존 인증(auth) 모듈, Gemini API 연동

---

## 1. Problem

### 배경
HR팀은 채용 공고(JD)를 작성한 후 면접을 준비할 때, 직무에 맞는 면접 질문을 수동으로 작성한다. 직무별 핵심 역량, 기술 스택, 경험 수준에 따라 질문이 달라져야 하지만, 매번 처음부터 작성하거나 기존 질문을 재활용하면서 JD와의 정합성이 떨어진다.

### 문제
1. JD에 명시된 요구사항과 면접 질문 간 정합성이 낮다 — 핵심 역량을 빠뜨리거나 불필요한 질문을 포함
2. 면접관마다 질문 수준과 평가 기준이 다르다 — 평가 일관성 부족
3. 면접 질문 준비에 시간이 과다 소요된다 — JD 분석 → 역량 도출 → 질문 작성 → 평가 기준 정의

### 영향
- 면접 품질 편차로 적합한 후보자를 놓치거나 부적합한 후보자를 선발할 위험
- HR팀의 면접 준비 시간이 채용 프로세스 병목

---

## 2. Functional Requirements

### FR-1: JD 텍스트 입력

**Description**: 사용자가 채용 공고 텍스트를 입력하면 시스템이 이를 수신하여 AI 분석에 전달한다.

**현재 코드**: 신규 모듈 — `apps/api-server/src/interview/` 생성 필요

**Acceptance Criteria**:
- [ ] 텍스트 입력 필드에 JD 텍스트(최소 50자, 최대 10,000자)를 붙여넣기하여 제출할 수 있다
- [ ] 제출 시 서버에 POST 요청이 전송되고, `{ id }` 형태의 응답을 받는다
- [ ] 입력 텍스트가 50자 미만이면 "채용 공고 내용이 너무 짧습니다 (최소 50자)" 에러를 표시한다

**Edge Cases**:
- 10,000자 초과 입력: 서버에서 413 에러 반환, 프론트에서 "최대 10,000자까지 입력 가능합니다" 표시
- 빈 문자열 또는 공백만 입력: 프론트 유효성 검사에서 차단, 제출 버튼 비활성화
- HTML 태그가 포함된 텍스트: 태그를 제거(strip)하고 순수 텍스트만 처리

### FR-2: 직무 유형 선택

**Description**: 사용자가 JD의 직무 유형을 선택하면 AI가 해당 직무에 특화된 질문을 생성한다.

**현재 코드**: 신규 — 프론트엔드 옵션 컴포넌트 + 백엔드 프롬프트 분기

**Acceptance Criteria**:
- [ ] 직무 유형을 드롭다운에서 선택할 수 있다 (개발, 디자인, 기획/PM, 마케팅, 영업, 일반/기타)
- [ ] 선택하지 않으면 기본값 "일반/기타"로 처리된다
- [ ] 선택된 직무 유형이 API 요청의 `jobCategory` 필드로 전달된다

**Edge Cases**:
- 목록에 없는 직무: "일반/기타" 선택 후 JD 텍스트에서 AI가 직무 특성을 자동 추론

### FR-3: AI 면접 질문 생성

**Description**: JD 텍스트와 직무 유형을 기반으로 AI가 구조화된 면접 질문과 평가 포인트를 생성한다.

**현재 코드**: 신규 — `apps/api-server/src/interview/question-generator.service.ts`

**Acceptance Criteria**:
- [ ] JD에서 핵심 역량(3~7개)을 추출하여 각 역량별 면접 질문을 2~3개씩 생성한다
- [ ] 각 질문에는 다음이 포함된다: 질문 텍스트, 의도(이 질문으로 무엇을 평가하는가), 우수 답변 예시 키워드, 평가 포인트(상/중/하 기준)
- [ ] 전체 질문 수는 10~20개 범위이다
- [ ] 처리 상태를 폴링으로 확인할 수 있다 (processing → completed/error)
- [ ] 완료 시 JSON 구조의 결과를 반환한다

**Edge Cases**:
- JD가 매우 짧아 역량 추출이 어려운 경우: 최소 3개 역량은 일반적 질문(자기소개, 지원동기, 강약점)으로 보충
- AI 응답이 JSON 파싱 불가: 최대 2회 재시도, 실패 시 에러 반환
- Gemini API 타임아웃: 30초 제한, 초과 시 재시도 1회 후 에러

### FR-4: 결과 표시 및 다운로드

**Description**: 생성된 면접 질문을 구조화된 형태로 화면에 표시하고, 다운로드할 수 있다.

**현재 코드**: 신규 — 프론트엔드 결과 컴포넌트

**Acceptance Criteria**:
- [ ] 역량별로 그룹핑된 질문 목록이 아코디언/카드 형태로 표시된다
- [ ] 각 질문 카드에 질문 텍스트, 평가 의도, 우수 답변 키워드, 평가 기준이 표시된다
- [ ] "엑셀 다운로드" 버튼 클릭 시 역량-질문-평가기준이 정리된 .xlsx 파일을 다운로드한다
- [ ] "복사" 버튼 클릭 시 전체 질문 목록이 클립보드에 텍스트로 복사된다

**Edge Cases**:
- 역량이 1개만 추출된 경우: 정상 표시, 최소 질문 수(3개) 보장
- 다운로드 실패: 에러 토스트 표시, 재시도 가능

### FR-5: 히스토리 저장 및 조회

**Description**: 생성된 면접 질문 세트를 히스토리로 저장하여 이후 재조회할 수 있다.

**현재 코드**: 기존 히스토리 패턴 — `PrismaService`, `image-to-excel/` 히스토리 참조

**Acceptance Criteria**:
- [ ] 생성 완료 시 자동으로 히스토리에 저장된다 (userId, JD 텍스트 요약, 직무 유형, 생성된 질문 JSON, 생성일시)
- [ ] 히스토리 목록에서 과거 생성 결과를 페이지네이션으로 조회할 수 있다 (10건/페이지)
- [ ] 히스토리 상세에서 이전에 생성한 질문 세트를 동일한 형태로 다시 볼 수 있다
- [ ] 히스토리 항목을 삭제할 수 있다

**Edge Cases**:
- 히스토리가 0건: "아직 생성한 면접 질문이 없습니다" 메시지 표시
- DB 저장 실패: 질문 생성 결과는 정상 표시하되, 히스토리 저장 실패 경고 표시

---

## 3. Affected Code

**신규 생성:**
- `apps/api-server/src/interview/` — 백엔드 모듈 전체 (controller, service, question-generator.service, types)
- `apps/user-client/src/features/interview/` — 프론트엔드 피처 전체 (pages, components, hooks, services, stores)

**수정 대상:**
- `apps/api-server/src/app.module.ts` — InterviewModule import 추가
- `apps/api-server/prisma/schema.prisma` — InterviewHistory 모델 추가
- `apps/user-client/src/App.tsx` — `/interview`, `/interview/history` 라우트 추가
- `apps/user-client/src/components/Navbar.tsx` — "면접 질문" 네비게이션 링크 추가

**의존성:**
- `@google/generative-ai` — 이미 설치됨 (Gemini 2.5 Flash)
- `exceljs` — 이미 설치됨 (image-to-excel에서 사용 중)
- Prisma migration 필요 (InterviewHistory 테이블)

---

## 4. Out of Scope

- 파일(PDF/Word) 형태의 JD 업로드 (텍스트 붙여넣기만 지원)
- 면접 질문 수동 편집/커스터마이징 기능
- 면접 평가표 템플릿 생성 (질문 + 평가 포인트까지만)
- 다국어 지원 (한국어 JD → 한국어 질문만 지원)
- 면접 결과 기록/채점 기능
- 실시간 협업 (다수 면접관이 동시 편집)
