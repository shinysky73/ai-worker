# PRD: 표/차트 이미지 → 텍스트 설명 변환기

**Created**: 2026-02-10
**Status**: Draft
**Prerequisites**: 없음 (기존 Gemini Vision API 인프라 활용)

---

## 1. Problem

### 배경

보고서, 논문, 회의자료 등에 포함된 표(table)나 차트(chart) 이미지는 시각적으로만 정보를 전달한다. 이를 텍스트로 풀어서 설명하려면 사람이 직접 내용을 해석하고 작성해야 한다.

현재 AI Worker는 PPT/PDF 파일 전체를 업로드하여 발표 스크립트를 생성하는 기능만 제공한다. 개별 이미지(표/차트)를 올려서 텍스트 설명만 받는 기능은 없다.

### 문제

1. 복잡한 표/차트 이미지의 내용을 텍스트로 설명하려면 사람이 직접 해석해야 한다
2. 시각 자료에 대한 텍스트 대안(접근성)을 제공하는 쉬운 방법이 없다
3. 보고서 작성 시 차트/표의 핵심 내용을 요약하는 데 시간이 많이 소요된다

### 영향

- 시각 장애인 등 접근성이 필요한 사용자가 표/차트 정보에 접근할 수 없다
- 보고서 작성자가 차트/표 해석에 불필요한 시간을 소비한다
- 기존 AI Worker 사용자가 개별 이미지 분석을 위해 별도 도구를 사용해야 한다

---

## 2. Functional Requirements

### FR-1: 이미지 업로드

**Description**: 사용자가 표/차트 이미지 파일을 업로드할 수 있다.

**현재 코드**: 신규 기능 — 기존 `presentation/` 모듈과 독립된 별도 모듈로 구현

**Acceptance Criteria**:
- [ ] JPEG, PNG, WebP 형식의 이미지를 업로드할 수 있다
- [ ] 파일 크기 10MB 이하만 허용된다
- [ ] 지원하지 않는 형식 업로드 시 에러 메시지가 표시된다
- [ ] 드래그 앤 드롭 또는 파일 선택으로 업로드할 수 있다

**Edge Cases**:
- 지원하지 않는 형식(GIF, BMP 등) 업로드: 에러 메시지 "지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드할 수 있습니다." 표시
- 10MB 초과 파일 업로드: 에러 메시지 "파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다." 표시
- 빈 파일(0바이트) 업로드: 에러 메시지 표시

### FR-2: 분석 옵션 선택

**Description**: 사용자가 이미지 분석 시 출력 형식과 설명 수준을 선택할 수 있다.

**현재 코드**: 신규 기능 — `features/presentation/components/OptionsForm.tsx` 패턴 참고

**Acceptance Criteria**:
- [ ] 설명 수준을 선택할 수 있다: "간략" (핵심 내용 2-3문장), "상세" (구조와 데이터 포함한 전체 설명)
- [ ] 출력 언어를 선택할 수 있다: "한국어" (기본값), "English"
- [ ] 옵션 미선택 시 기본값(상세, 한국어)이 적용된다

**Edge Cases**:
- 없음

### FR-3: AI 이미지 분석

**Description**: Gemini Vision API를 사용하여 업로드된 이미지를 분석하고 텍스트 설명을 생성한다.

**현재 코드**: `apps/api-server/src/presentation/script-generator.service.ts:analyzeSlide()` — 기존 Vision API 호출 패턴 참고, 별도 서비스로 구현

**Acceptance Criteria**:
- [ ] 표 이미지 입력 시 행/열 구조와 데이터를 텍스트로 설명한다
- [ ] 차트 이미지(막대, 선, 원 등) 입력 시 유형, 축, 추세를 텍스트로 설명한다
- [ ] 표도 차트도 아닌 일반 이미지 입력 시에도 이미지 내용을 설명한다
- [ ] 분석 결과에 다음이 포함된다: 이미지 유형(표/차트/기타), 텍스트 설명, 핵심 인사이트
- [ ] API 호출 실패 시 재시도(최대 3회)하고, 최종 실패 시 에러 메시지를 반환한다

**Edge Cases**:
- 텍스트가 전혀 없는 이미지(순수 사진 등): 이미지 내용을 시각적으로 묘사
- 해상도가 매우 낮은 이미지: 분석 가능한 범위 내에서 결과 반환, 인식 불가 시 "이미지 품질이 낮아 정확한 분석이 어렵습니다" 메시지 포함
- 복수의 표/차트가 하나의 이미지에 있는 경우: 각각을 구분하여 설명

### FR-4: 결과 표시

**Description**: 분석 결과를 사용자에게 보기 쉬운 형태로 표시한다.

**현재 코드**: 신규 기능 — `features/presentation/components/SlideScriptCard.tsx` 패턴 참고

**Acceptance Criteria**:
- [ ] 이미지 유형(표/차트/기타)이 라벨로 표시된다
- [ ] 텍스트 설명이 마크다운 형식으로 렌더링된다
- [ ] 핵심 인사이트가 별도 섹션으로 표시된다
- [ ] 결과 전체를 클립보드에 복사할 수 있다
- [ ] 업로드한 원본 이미지가 결과 옆에 미리보기로 표시된다

**Edge Cases**:
- 매우 긴 분석 결과: 스크롤 가능하게 표시
- 마크다운 렌더링 실패: 플레인 텍스트로 폴백

### FR-5: 별도 메뉴(네비게이션)

**Description**: 이미지 분석 기능이 기존 "스크립트 생성"과 독립된 별도 메뉴로 제공된다.

**현재 코드**: `apps/user-client/src/components/Navbar.tsx` — NavLink 추가, `apps/user-client/src/App.tsx` — Route 추가

**Acceptance Criteria**:
- [ ] Navbar에 "이미지 분석" 메뉴 항목이 표시된다 ("스크립트 생성", "히스토리" 다음 위치)
- [ ] `/image-analysis` 경로로 접근할 수 있다
- [ ] 인증된 사용자만 접근할 수 있다 (기존 Layout 인증 가드 활용)
- [ ] 현재 페이지에 해당하는 메뉴 항목이 활성 상태로 표시된다

**Edge Cases**:
- 비인증 상태에서 `/image-analysis` 직접 접근: 로그인 페이지로 리다이렉트

### FR-6: 처리 상태 표시

**Description**: 이미지 분석 진행 중 상태를 사용자에게 표시한다.

**현재 코드**: 신규 기능 — `features/presentation/components/ProcessingStatus.tsx` 패턴 참고

**Acceptance Criteria**:
- [ ] 업로드 중 프로그레스 바가 표시된다
- [ ] 분석 중 로딩 상태가 표시된다 ("이미지를 분석하고 있습니다...")
- [ ] 완료 시 자동으로 결과가 표시된다
- [ ] 에러 발생 시 에러 메시지가 표시되고 다시 시도 버튼이 제공된다

**Edge Cases**:
- 분석 중 네트워크 끊김: 에러 메시지 표시 후 재시도 가능
- 브라우저 새로고침: 진행 중인 분석 상태 초기화 (재업로드 필요)

---

## 3. Affected Code

**신규 생성:**
- `apps/api-server/src/image-analysis/` — 백엔드 모듈 (module, controller, service)
- `apps/user-client/src/features/image-analysis/` — 프론트엔드 피처 (components, pages, hooks, services, stores)

**수정 대상:**
- `apps/api-server/src/app.module.ts` — ImageAnalysisModule import 추가
- `apps/user-client/src/App.tsx` — `/image-analysis` Route 추가
- `apps/user-client/src/components/Navbar.tsx` — "이미지 분석" NavLink 추가

**의존성:**
- Google Generative AI (`@google/generative-ai`) — 이미 설치됨, Gemini Vision API 활용
- 마크다운 렌더링 라이브러리 (프론트엔드) — 신규 설치 필요 여부 확인 (기존에 없으면 `react-markdown` 추가)

---

## 4. Out of Scope

- 분석 히스토리 저장 및 조회 (DB 모델, 히스토리 페이지) — 추후 별도 기능으로
- 다중 이미지 동시 업로드 및 배치 분석
- 이미지 내 표 데이터를 CSV/Excel로 추출하는 기능
- 이미지 편집/크롭 기능
- PDF 파일 내 특정 페이지의 표/차트만 추출하는 기능
- 실시간 카메라 입력을 통한 분석
