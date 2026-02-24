# PRD: Image-to-Excel (영수증/명함 → 엑셀 변환)

**Created**: 2026-02-23
**Status**: Draft
**Prerequisites**: 기존 image-analysis 모듈 (패턴 참고), 인증 시스템 (Google OAuth + JWT)

---

## 1. Problem

### 배경

AI Worker는 현재 PPT/PDF → 발표 스크립트 생성과 단일 이미지 분석 기능을 제공한다. 하지만 많은 사용자가 반복적으로 영수증이나 명함 사진에서 정보를 수동으로 엑셀에 옮겨 적는 작업을 하고 있다.

### 문제

1. **수동 데이터 입력**: 영수증/명함 사진을 보면서 일일이 엑셀에 타이핑해야 한다
2. **다량 처리 불가**: 10장, 50장의 이미지를 한 번에 처리할 방법이 없다
3. **오타/누락 위험**: 수작업 입력 시 금액, 전화번호 등의 오류가 빈번하다

### 영향

- 경비 처리, 거래처 연락처 정리 등에 불필요한 시간 소모
- 데이터 정확도 저하로 인한 업무 오류

---

## 2. Functional Requirements

### FR-1: 다중 이미지 업로드

**Description**: 사용자가 여러 장의 영수증 또는 명함 이미지를 한 번에 업로드할 수 있다.

**현재 코드**: `image-analysis.controller.ts` — 단일 파일 업로드만 지원 (`FileInterceptor`)

**Acceptance Criteria**:
- [ ] 한 번에 최대 20장의 이미지 파일을 업로드할 수 있다
- [ ] 지원 형식: JPEG, PNG, WebP
- [ ] 개별 파일 최대 10MB, 전체 요청 최대 100MB
- [ ] 업로드 시 이미지 타입을 선택한다: `receipt`(영수증) 또는 `namecard`(명함)
- [ ] 업로드 완료 후 처리 ID(UUID)가 반환된다

**Edge Cases**:
- 파일 0개 업로드 시도: 400 에러 ("최소 1개 파일을 업로드하세요")
- 21장 이상 업로드 시도: 400 에러 ("최대 20장까지 업로드 가능합니다")
- 지원하지 않는 파일 형식 포함: 해당 파일만 거부, 유효한 파일은 처리 진행
- 빈 파일(0 byte): 해당 파일 스킵, 에러 메시지 포함

### FR-2: AI 기반 구조화 데이터 추출

**Description**: 업로드된 각 이미지에서 AI가 이미지 타입에 맞는 구조화된 정보를 추출한다.

**현재 코드**: `image-analyzer.service.ts` — Gemini Vision API로 이미지 분석 (비구조화 텍스트 반환)

**Acceptance Criteria**:
- [ ] **영수증**에서 다음 필드를 추출한다: 날짜, 상호명, 항목 목록(품목명, 수량, 단가), 합계 금액, 결제 수단
- [ ] **명함**에서 다음 필드를 추출한다: 이름, 직함, 회사명, 전화번호, 이메일, 주소
- [ ] 추출 불가능한 필드는 빈 문자열로 반환한다 (에러 아님)
- [ ] 각 이미지 처리 결과에 신뢰도 표시: `high` / `medium` / `low`

**Edge Cases**:
- 흐릿하거나 잘린 이미지: `low` 신뢰도로 가능한 만큼 추출, 빈 필드 허용
- 영수증/명함이 아닌 이미지: 빈 필드 반환 + `low` 신뢰도
- 외국어 영수증/명함: 원문 그대로 추출 (번역 안 함)

### FR-3: 엑셀 파일 생성 및 다운로드

**Description**: 추출된 데이터를 정리된 엑셀(.xlsx) 파일로 생성하여 다운로드할 수 있다.

**현재 코드**: 없음 — 신규 기능

**Acceptance Criteria**:
- [ ] 영수증: 한 행에 한 영수증, 컬럼은 (번호, 날짜, 상호명, 항목요약, 합계금액, 결제수단, 원본파일명)
- [ ] 명함: 한 행에 한 명함, 컬럼은 (번호, 이름, 직함, 회사명, 전화번호, 이메일, 주소, 원본파일명)
- [ ] 첫 번째 행은 헤더(굵은 글씨), 컬럼 너비 자동 조정
- [ ] 파일명 형식: `receipts_YYYYMMDD_HHmmss.xlsx` 또는 `namecards_YYYYMMDD_HHmmss.xlsx`
- [ ] 다운로드 API 호출 시 `Content-Disposition: attachment` 헤더로 응답

**Edge Cases**:
- 추출 결과가 모두 빈 값인 행: 포함하되, 원본파일명은 표시
- 특수문자가 포함된 데이터: 엑셀에서 깨지지 않도록 처리

### FR-4: 처리 상태 추적

**Description**: 다중 이미지 처리 진행 상태를 실시간으로 확인할 수 있다.

**현재 코드**: `image-analysis.service.ts` — 단일 이미지 상태 관리 패턴 (statusStore + polling)

**Acceptance Criteria**:
- [ ] 전체 상태: `pending` → `processing` → `completed` / `error`
- [ ] 진행률: 처리 완료된 이미지 수 / 전체 이미지 수 (예: 3/10)
- [ ] 개별 이미지 상태: `pending` / `processing` / `completed` / `error`
- [ ] 폴링 간격 2초, 최대 대기 5분 (타임아웃 시 에러)

**Edge Cases**:
- 일부 이미지만 실패: 전체 상태는 `completed`, 실패 이미지는 개별 `error` 표시
- 서버 재시작으로 인메모리 상태 유실: `error` 반환 (무한 폴링 방지)

### FR-5: 히스토리 관리

**Description**: 이전 변환 결과를 저장하고 다시 엑셀로 다운로드할 수 있다.

**현재 코드**: `ImageAnalysisHistory` Prisma 모델 — 유사 패턴 참고

**Acceptance Criteria**:
- [ ] 변환 완료 시 자동으로 히스토리에 저장된다
- [ ] 히스토리 목록: 날짜, 이미지 타입(영수증/명함), 이미지 수, 파일명 표시
- [ ] 히스토리 상세: 추출된 데이터 테이블 표시
- [ ] 히스토리에서 엑셀 재다운로드 가능
- [ ] 히스토리 삭제 가능
- [ ] 페이지네이션: 기본 10건, 최대 100건

**Edge Cases**:
- 다른 사용자의 히스토리 접근 시도: 404 응답 (존재 여부 비노출)

### FR-6: 프론트엔드 UI

**Description**: 이미지 업로드부터 엑셀 다운로드까지 직관적인 화면을 제공한다.

**현재 코드**: `features/image-analysis/` — 유사 UI 패턴 참고

**Acceptance Criteria**:
- [ ] 이미지 타입 선택 (영수증/명함) 탭 또는 라디오 버튼
- [ ] 드래그 앤 드롭 + 파일 선택 버튼으로 다중 이미지 업로드
- [ ] 업로드된 이미지 썸네일 미리보기 (삭제 가능)
- [ ] 처리 중: 전체 진행률 바 + 개별 이미지 상태 표시
- [ ] 결과 화면: 추출 데이터 테이블 + 엑셀 다운로드 버튼
- [ ] 히스토리 페이지: 목록 + 상세 + 재다운로드

**Edge Cases**:
- 브라우저 새로고침 중 처리 진행 중: 폴링 재개하여 결과 표시

---

## 3. Affected Code

**신규 생성:**
- `apps/api-server/src/image-to-excel/` — 백엔드 모듈 전체 (controller, service, module)
- `apps/user-client/src/features/image-to-excel/` — 프론트엔드 feature 전체

**수정 대상:**
- `apps/api-server/src/app.module.ts` — 새 모듈 등록
- `apps/api-server/prisma/schema.prisma` — `ImageToExcelHistory` 모델 추가
- `apps/user-client/src/App.tsx` — 새 라우트 추가
- `apps/user-client/src/components/Navbar.tsx` — 네비게이션 링크 추가

**의존성:**
- 엑셀 생성 라이브러리 필요 (예: `exceljs` 등)
- 기존 `@google/generative-ai` 패키지 재사용
- 기존 `retry.ts` 유틸리티 재사용

---

## 4. Out of Scope

- OCR 전용 엔진 도입 (Gemini Vision으로 충분)
- 영수증/명함 외 문서 타입 (계약서, 세금계산서 등)
- 추출 결과 웹 화면에서 직접 편집 기능
- CSV, PDF 등 엑셀 이외 형식 내보내기
- 이미지 자동 회전/보정 전처리
- 대량 처리 (100장 이상) 최적화
- 모바일 카메라 직접 촬영 연동
