# TDD Plan: 프레젠테이션 발표 스크립트 생성기

**PRD**: `docs/presentation-script-generator/prd.md`
**Created**: 2026-02-02
**Status**: Complete

---

## Phase 0: Test Setup

### Backend Setup
**Test File**: `apps/api-server/src/presentation/presentation.service.spec.ts`
**Impl File**: `apps/api-server/src/presentation/presentation.service.ts`
**Command**: `pnpm -F @ai-worker/api-server test`

### Setup Tasks:
- [x] Create presentation module directory structure
- [x] Set up Jest mocks for external services (LibreOffice, Gemini)
- [x] Create test utilities for file handling
- [x] Verify test runs (empty)

---

# Backend (TDD)

## Phase 1: 파일 업로드 및 검증

**Test File**: `apps/api-server/src/presentation/presentation.service.spec.ts`
**Impl File**: `apps/api-server/src/presentation/presentation.service.ts`
**Command**: `pnpm -F @ai-worker/api-server test -- presentation.service.spec.ts`

### Tests:
- [x] shouldAcceptValidPptxFile: 유효한 PPTX 파일 업로드 시 UUID 반환
- [x] shouldAcceptValidPptFile: 유효한 PPT 파일 업로드 시 UUID 반환
- [x] shouldRejectInvalidFileType: PPT/PPTX가 아닌 파일 거부
- [x] shouldRejectFileTooLarge: 50MB 초과 파일 거부
- [x] shouldRejectCorruptedFile: 손상된 파일 거부
- [x] shouldStoreFileWithUuid: 파일을 UUID로 저장

---

## Phase 2: PPT → 이미지 변환

**Test File**: `apps/api-server/src/presentation/converter.service.spec.ts`
**Impl File**: `apps/api-server/src/presentation/converter.service.ts`
**Command**: `pnpm -F @ai-worker/api-server test -- converter.service.spec.ts`

### Tests:
- [x] shouldConvertPptxToPdf: PPTX 파일을 PDF로 변환
- [x] shouldConvertPdfToImages: PDF를 슬라이드별 PNG 이미지로 변환
- [x] shouldGenerateCorrectResolution: 1920x1080 해상도로 생성
- [x] shouldReturnSlideCount: 변환된 슬라이드 수 반환
- [x] shouldRetryOnFailure: 변환 실패 시 최대 3회 재시도
- [x] shouldRejectTooManySlides: 50장 초과 슬라이드 거부

---

## Phase 3: Vision AI 스크립트 생성

**Test File**: `apps/api-server/src/presentation/script-generator.service.spec.ts`
**Impl File**: `apps/api-server/src/presentation/script-generator.service.ts`
**Command**: `pnpm -F @ai-worker/api-server test -- script-generator.service.spec.ts`

### Tests:
- [x] shouldAnalyzeSlideImage: 슬라이드 이미지 분석하여 내용 추출
- [x] shouldGenerateScriptForSlide: 슬라이드별 발표 스크립트 생성
- [x] shouldCalculateEstimatedTime: 스크립트 기반 예상 시간 계산 (150단어/분)
- [x] shouldApplyFormalTone: 격식체 톤 적용
- [x] shouldApplyCasualTone: 비격식체 톤 적용
- [x] shouldHandleTextOnlySlide: 텍스트만 있는 슬라이드 처리
- [x] shouldHandleImageOnlySlide: 이미지/차트만 있는 슬라이드 처리
- [x] shouldRetryOnApiFailure: API 실패 시 재시도 (exponential backoff)

---

## Phase 4: Presentation Controller (API)

**Test File**: `apps/api-server/src/presentation/presentation.controller.spec.ts`
**Impl File**: `apps/api-server/src/presentation/presentation.controller.ts`
**Command**: `pnpm -F @ai-worker/api-server test -- presentation.controller.spec.ts`

### Tests:
- [x] shouldHandleFileUpload: POST /api/presentations/upload 엔드포인트
- [x] shouldReturnUploadStatus: GET /api/presentations/:id/status 엔드포인트
- [x] shouldReturnGeneratedResult: GET /api/presentations/:id/result 엔드포인트
- [x] shouldReturn404ForNotFound: 존재하지 않는 ID에 404 반환
- [x] shouldValidateOptions: options 파라미터 검증 (tone, targetMinutes)

---

# Frontend Logic (TDD)

## Phase 5: API 서비스

**Test File**: `apps/user-client/src/features/presentation/services/presentationApi.test.ts`
**Impl File**: `apps/user-client/src/features/presentation/services/presentationApi.ts`
**Command**: `pnpm -F @ai-worker/user-client test -- presentationApi.test.ts`

### Tests:
- [x] shouldUploadFile: 파일 업로드 API 호출
- [x] shouldPollStatus: 상태 폴링 API 호출
- [x] shouldFetchResult: 결과 조회 API 호출
- [x] shouldHandleUploadProgress: 업로드 진행률 콜백 호출

---

## Phase 6: Presentation Hook

**Test File**: `apps/user-client/src/features/presentation/hooks/usePresentation.test.ts`
**Impl File**: `apps/user-client/src/features/presentation/hooks/usePresentation.ts`
**Command**: `pnpm -F @ai-worker/user-client test -- usePresentation.test.ts`

### Tests:
- [x] shouldInitializeWithIdleState: 초기 상태는 idle
- [x] shouldTransitionToUploading: 업로드 시작 시 uploading 상태
- [x] shouldTransitionToProcessing: 업로드 완료 후 processing 상태
- [x] shouldTransitionToCompleted: 처리 완료 시 completed 상태
- [x] shouldTransitionToError: 에러 발생 시 error 상태
- [x] shouldReturnProgress: 업로드/처리 진행률 반환
- [x] shouldReturnResult: 완료 시 결과 데이터 반환

---

## Phase 7: Presentation Store (Zustand)

**Test File**: `apps/user-client/src/features/presentation/stores/presentationStore.test.ts`
**Impl File**: `apps/user-client/src/features/presentation/stores/presentationStore.ts`
**Command**: `pnpm -F @ai-worker/user-client test -- presentationStore.test.ts`

### Tests:
- [x] shouldStoreUploadedFile: 업로드된 파일 정보 저장
- [x] shouldStoreOptions: 옵션 (tone, targetMinutes) 저장
- [x] shouldStoreResult: 생성 결과 저장
- [x] shouldResetState: 상태 초기화

---

# UI/UX (Non-TDD)

## Phase 8: 컴포넌트 구현

**Files**:
- `apps/user-client/src/features/presentation/components/FileUploader.tsx`
- `apps/user-client/src/features/presentation/components/OptionsForm.tsx`
- `apps/user-client/src/features/presentation/components/ProcessingStatus.tsx`
- `apps/user-client/src/features/presentation/components/SlideScriptCard.tsx`
- `apps/user-client/src/features/presentation/components/ResultSummary.tsx`
- `apps/user-client/src/features/presentation/pages/PresentationPage.tsx`

### Tasks:
- [x] FileUploader: 드래그앤드롭 파일 업로드 영역
- [x] OptionsForm: 발표 톤/목표 시간 설정 폼
- [x] ProcessingStatus: 변환 진행률 표시
- [x] SlideScriptCard: 슬라이드 썸네일 + 스크립트 카드
- [x] ResultSummary: 전체 결과 요약 (총 시간, 다운로드)
- [x] PresentationPage: 메인 페이지 레이아웃

---

## Phase 9: 스타일링 & 폴리싱

**Files**:
- Component files with Tailwind classes

### Tasks:
- [x] 반응형 레이아웃 (모바일/태블릿/데스크톱)
- [x] 다크모드 지원
- [x] 드래그 오버 시 시각적 피드백
- [x] 업로드 진행률 애니메이션
- [x] 처리 중 스켈레톤 UI
- [x] 에러 상태 UI (토스트/인라인)
- [x] 복사 완료 피드백
- [x] 슬라이드 카드 hover 효과

---

## Progress Summary

| Section | Phase | Total | Done | Status |
|---------|-------|-------|------|--------|
| Setup | 0 | 4 | 4 | Complete |
| Backend (TDD) | 1-4 | 25 | 25 | Complete |
| Frontend Logic (TDD) | 5-7 | 15 | 15 | Complete |
| UI/UX | 8-9 | 14 | 14 | Complete |
| **Total** | - | **58** | **58** | **100%** |

---

## Notes

- Backend/Frontend Logic phases: Use `/go` or `/go-phase N`
- UI/UX phases: Implement directly (no TDD cycle)
- LibreOffice headless는 Docker 컨테이너로 실행 (로컬 개발 시 설치 필요)
- Gemini API 키는 환경변수 `GEMINI_API_KEY`로 설정
- 파일 저장소는 MVP에서 로컬 파일시스템 사용, 추후 S3 전환 고려

---

## Dependencies

```bash
# Backend
pnpm -F @ai-worker/api-server add multer uuid
pnpm -F @ai-worker/api-server add -D @types/multer

# LibreOffice headless (macOS)
brew install --cask libreoffice

# poppler (PDF to image)
brew install poppler
```
