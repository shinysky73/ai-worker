# TDD Plan: 표/차트 이미지 → 텍스트 설명 변환기

**PRD**: `docs/05-image-analysis/prd.md`
**Created**: 2026-02-10
**Status**: Completed

---

# Backend (TDD)

## Phase 1: 이미지 분석 서비스 — Gemini Vision API 호출 (FR-3)

**Scope**: `apps/api-server/src/image-analysis/image-analyzer.service.ts`
**행동 목표**: 이미지 파일 경로를 받아 Gemini Vision API로 분석하고, 이미지 유형(표/차트/기타), 텍스트 설명, 핵심 인사이트를 포함한 구조화된 결과를 반환한다.
**PRD AC**: FR-3의 AC 1~5 (표/차트/일반 이미지 분석, 결과 구조, 재시도)
**Edge Cases**: 텍스트 없는 이미지 → 시각적 묘사, 저해상도 → 품질 경고 포함, 복수 표/차트 → 각각 구분 설명

### 설계 메모
- 기존 `ScriptGeneratorService.analyzeSlide()` 패턴 참고하되 독립 서비스로 구현
- 기존 `executeWithRetry()` 유틸 재사용 (재시도 3회)
- 옵션(설명 수준: brief/detailed, 언어: ko/en)을 프롬프트에 반영
- 결과 인터페이스: `{ imageType: 'table' | 'chart' | 'other', description: string, insights: string[] }`

### Tests:
- [x] shouldAnalyzeTableImage: 표 이미지 입력 시 imageType "table" 반환
- [x] shouldAnalyzeChartImage: 차트 이미지 입력 시 유형/축/추세 설명 반환
- [x] shouldAnalyzeOtherImage: 일반 이미지도 설명 반환
- [x] shouldReturnStructuredResult: 결과에 imageType, description, insights 포함
- [x] shouldRetryOnApiFailure: executeWithRetry를 통해 재시도
- [x] shouldSupportBriefOption: detailLevel=brief 옵션 지원
- [x] shouldSupportEnglishOption: language=en 옵션 지원
- [x] shouldParseMarkdownCodeBlock: 코드 블록 감싸진 응답 파싱
- [x] shouldFallbackOnInvalidJson: 파싱 불가 시 폴백
- [x] shouldNormalizeUnknownImageType: 알 수 없는 타입을 "other"로 정규화
- [x] shouldHandleNonArrayInsights: 비배열 insights 처리

---

## Phase 2: 이미지 업로드 및 오케스트레이션 서비스 (FR-1, FR-3)

**Scope**: `apps/api-server/src/image-analysis/image-analysis.service.ts`
**행동 목표**: 이미지 파일 업로드를 받아 유효성 검증(형식, 크기)하고, 분석 서비스를 호출하여 결과를 반환한다. 상태(pending → processing → completed/error)를 관리한다.
**PRD AC**: FR-1의 AC 1~3 (JPEG/PNG/WebP 허용, 10MB 제한, 에러 메시지) + FR-3의 AC 5 (API 실패 시 에러 반환)
**Edge Cases**: 지원하지 않는 형식 → 에러, 10MB 초과 → 에러, 0바이트 파일 → 에러

### 설계 메모
- `PresentationService` 패턴 참고: 파일 저장 → 비동기 처리 → 폴링 상태 관리
- 이미지는 PPT처럼 변환 과정 없이 바로 분석으로 넘어감 → 파이프라인 단순
- MIME 타입 검증: `image/jpeg`, `image/png`, `image/webp`
- Magic bytes 검증: JPEG(FF D8 FF), PNG(89 50 4E 47), WebP(52 49 46 46...57 45 42 50)

### Tests:
- [x] shouldAcceptPngFile: PNG 이미지 업로드 시 UUID 반환
- [x] shouldAcceptJpegFile: JPEG 이미지 업로드 허용
- [x] shouldAcceptWebpFile: WebP 이미지 업로드 허용
- [x] shouldRejectFileTooLarge: 10MB 초과 거부
- [x] shouldRejectUnsupportedFormat: GIF 등 지원하지 않는 형식 거부
- [x] shouldRejectEmptyFile: 0바이트 파일 거부
- [x] shouldRejectCorruptedFile: magic bytes 불일치 거부
- [x] shouldStoreFileWithUuid: UUID로 파일 저장
- [x] shouldReturnPendingForUnknownId: 알 수 없는 ID → pending
- [x] shouldTrackProcessingStatus: 업로드 후 상태 추적
- [x] shouldReturnNullForUnknownId: 알 수 없는 ID → null
- [x] shouldReturnResultAfterProcessing: 처리 완료 후 결과 반환

---

## Phase 3: 컨트롤러 및 모듈 등록 (FR-1, FR-3)

**Scope**: `apps/api-server/src/image-analysis/image-analysis.controller.ts`, `image-analysis.module.ts`, `app.module.ts`
**행동 목표**: REST API 엔드포인트(`POST /api/image-analysis/upload`, `GET /api/image-analysis/:id/status`, `GET /api/image-analysis/:id/result`)가 동작하고, JWT 인증이 적용된다.
**PRD AC**: FR-1의 AC 1~3, FR-5의 AC 3 (인증된 사용자만 접근)

### ⚠ 위험 요소
- `app.module.ts` 수정 — 기존 모듈 import에 영향 없는지 확인

### Tests:
- [x] shouldCallServiceUpload: 파일과 옵션을 서비스에 전달
- [x] shouldRejectInvalidDetailLevel: 유효하지 않은 detailLevel 거부
- [x] shouldRejectInvalidLanguage: 유효하지 않은 language 거부
- [x] shouldReturnStatus: 상태 조회 결과 반환
- [x] shouldReturnResult: 분석 결과 반환
- [x] shouldThrow404WhenNotFound: 결과 없으면 404

---

# Frontend Logic (TDD)

## Phase 4: API 클라이언트 (FR-1, FR-3)

**Scope**: `apps/user-client/src/features/image-analysis/services/imageAnalysisApi.ts`
**행동 목표**: 백엔드 이미지 분석 API를 호출하는 클라이언트 함수를 제공한다. 업로드(FormData + 옵션), 상태 폴링, 결과 조회 3개 함수.
**PRD AC**: FR-1의 AC 1 (업로드), FR-2의 AC 1~3 (옵션 전달)
**Edge Cases**: 없음

### 설계 메모
- `presentationApi.ts` 패턴 그대로 따름
- 타입 정의: `ImageAnalysisResult { imageType, description, insights }`

### Tests:
- [x] shouldUploadFileWithFormData: FormData로 파일 업로드
- [x] shouldIncludeOptionsInFormData: 옵션을 FormData에 포함
- [x] shouldThrowOnError: API 에러 시 Error throw
- [x] shouldPollStatus: 상태 폴링 결과 반환
- [x] shouldFetchResult: 분석 결과 조회

---

## Phase 5: 상태 관리 Hook (FR-6)

**Scope**: `apps/user-client/src/features/image-analysis/hooks/useImageAnalysis.ts`
**행동 목표**: 이미지 업로드 → 폴링 → 결과 수신의 전체 흐름을 관리하는 hook을 제공한다. 상태(idle → uploading → processing → completed/error)와 진행률을 노출한다.
**PRD AC**: FR-6의 AC 1~4 (프로그레스, 로딩, 완료, 에러)
**Edge Cases**: 네트워크 끊김 → 에러 표시, 브라우저 새로고침 → 상태 초기화

### 설계 메모
- `usePresentation.ts` 패턴 참고
- 폴링은 단일 이미지이므로 타임아웃 짧게 (MAX_POLL_ATTEMPTS=120, 2분)
- `reset()`, `retry()` 함수 포함

### Tests:
- [x] shouldInitializeWithIdleState: 초기 상태 idle
- [x] shouldTransitionToUploading: 업로드 시작 시 uploading
- [x] shouldTransitionToProcessing: 업로드 후 processing
- [x] shouldTransitionToCompleted: 완료 시 completed + 결과
- [x] shouldTransitionToError: 에러 시 error 상태
- [x] shouldHandleServerError: 서버 error 상태 처리
- [x] shouldResetState: reset 시 idle 복원

---

## Phase 6: Zustand 스토어 (FR-2)

**Scope**: `apps/user-client/src/features/image-analysis/stores/imageAnalysisStore.ts`
**행동 목표**: 분석 옵션(설명 수준, 언어)과 결과를 전역 상태로 관리한다.
**PRD AC**: FR-2의 AC 1~3 (설명 수준, 언어, 기본값)

### Tests:
- [x] shouldHaveDefaultOptions: 기본값 detailLevel=detailed, language=ko
- [x] shouldUpdateDetailLevel: 설명 수준 변경
- [x] shouldUpdateLanguage: 출력 언어 변경
- [x] shouldSetResult: 분석 결과 저장
- [x] shouldResetToDefaults: reset 시 기본값 복원

---

# UI/UX (Non-TDD)

## Phase 7: 라우팅 및 네비게이션 (FR-5)

**Scope**: `apps/user-client/src/App.tsx`, `apps/user-client/src/components/Navbar.tsx`

### Tasks:
- [x] `App.tsx`에 `/image-analysis` Route 추가 (Layout 내부, 인증 가드 적용)
- [x] `Navbar.tsx`에 "이미지 분석" NavLink 추가 (데스크톱 + 모바일 메뉴)

---

## Phase 8: 이미지 업로드 UI (FR-1, FR-4)

**Scope**: `apps/user-client/src/features/image-analysis/components/ImageUploader.tsx`

### Tasks:
- [x] 드래그 앤 드롭 + 파일 선택 UI (FileUploader 패턴 참고)
- [x] JPEG/PNG/WebP 클라이언트 측 검증, 10MB 제한
- [x] 에러 메시지 표시 (형식, 크기)

---

## Phase 9: 분석 옵션 UI (FR-2)

**Scope**: `apps/user-client/src/features/image-analysis/components/AnalysisOptionsForm.tsx`

### Tasks:
- [x] 설명 수준 select: 간략 / 상세(기본)
- [x] 출력 언어 select: 한국어(기본) / English
- [x] Zustand 스토어 연동

---

## Phase 10: 처리 상태 UI (FR-6)

**Scope**: `apps/user-client/src/features/image-analysis/components/AnalysisStatus.tsx`

### Tasks:
- [x] 업로드 프로그레스 바
- [x] 분석 중 로딩 스피너 + 메시지
- [x] 에러 표시 + 다시 시도 버튼

---

## Phase 11: 결과 표시 UI (FR-4)

**Scope**: `apps/user-client/src/features/image-analysis/components/AnalysisResult.tsx`

### Tasks:
- [x] 이미지 유형 라벨 (표/차트/기타)
- [x] 마크다운 렌더링 (`react-markdown` 설치 완료)
- [x] 핵심 인사이트 별도 섹션
- [x] 클립보드 복사 버튼
- [x] 원본 이미지 미리보기 (좌우 레이아웃)

---

## Phase 12: 페이지 통합 (FR-1~6 전체)

**Scope**: `apps/user-client/src/features/image-analysis/pages/ImageAnalysisPage.tsx`

### Tasks:
- [x] ImageUploader + AnalysisOptionsForm + AnalysisStatus + AnalysisResult 통합
- [x] useImageAnalysis hook 연동
- [x] 상태별 UI 전환 (idle → uploading → processing → completed/error)
- [x] features/image-analysis/index.ts export 정리

---

## Notes

- **의존성**: `react-markdown` 패키지 프론트엔드에 설치 필요 (Phase 11 전에)
- **재사용**: `executeWithRetry` 유틸은 presentation 모듈에서 가져와 사용 (공유 유틸로 이동 고려하되, 이번에는 import만)
- **히스토리 미구현**: Out of Scope — DB 모델, 히스토리 저장/조회는 이번에 구현하지 않음
- **기존 테스트**: converter.service.spec.ts, script-generator.service.spec.ts에 기존 실패 테스트 있음 — 이번 기능과 무관, 건드리지 않음
