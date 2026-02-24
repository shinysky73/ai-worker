# TDD Plan: Image-to-Excel (영수증/명함 → 엑셀 변환)

**PRD**: `docs/06-image-to-excel/prd.md`
**Created**: 2026-02-23
**Status**: Completed

---

# Backend (TDD)

## Phase 1: Spike — exceljs 라이브러리 검증 ✅

**목적**: 엑셀 생성 라이브러리 선정 및 기본 동작 확인
**결과**: exceljs가 모든 요구사항 충족 — 굵은 글씨, 컬럼 너비, 한글 데이터, Buffer 생성 모두 정상 동작

---

## Phase 2: 엑셀 생성 서비스 (FR-3) ✅

**Scope**: `apps/api-server/src/image-to-excel/excel-generator.service.ts`

### Tests:
- [x] shouldGenerateReceiptBuffer: 영수증 데이터 배열로 xlsx Buffer 생성
- [x] shouldHaveBoldHeaders: 첫 번째 행은 헤더(굵은 글씨)
- [x] shouldHandleEmptyValues: 모두 빈 값인 행도 포함, 원본파일명 표시
- [x] shouldHandleSpecialCharacters: 특수문자 포함 데이터 처리
- [x] shouldGenerateNamecardBuffer: 명함 데이터 배열로 xlsx Buffer 생성
- [x] shouldHandleMultipleNamecards: 여러 명함 데이터 처리

---

## Phase 3: AI 데이터 추출 서비스 (FR-2) ✅

**Scope**: `apps/api-server/src/image-to-excel/data-extractor.service.ts`

### Tests:
- [x] shouldExtractReceiptData: 영수증 이미지에서 구조화된 데이터 추출
- [x] shouldHandleMissingFields: 추출 불가능한 필드는 빈 문자열 반환
- [x] shouldHandleCodeBlockResponse: ```json 코드 블록 감싸진 응답 파싱
- [x] shouldReturnLowConfidenceOnInvalidJson: 파싱 실패 시 빈 데이터 + low 신뢰도
- [x] shouldExtractNamecardData: 명함 이미지에서 구조화된 데이터 추출
- [x] shouldHandlePartialNamecard: 일부 필드만 추출 가능한 경우

---

## Phase 4: 다중 업로드 + 처리 오케스트레이션 (FR-1, FR-4) ✅

**Scope**: `apps/api-server/src/image-to-excel/image-to-excel.service.ts`

### Tests:
- [x] shouldReturnUuidOnUpload: 업로드 완료 후 UUID 반환
- [x] shouldRejectEmptyFileList: 파일 0개 업로드 시 400 에러
- [x] shouldRejectOver20Files: 21장 이상 업로드 시 400 에러
- [x] shouldFilterInvalidFiles: 지원하지 않는 형식은 건너뛰고 유효 파일만 처리
- [x] shouldSkipEmptyFiles: 0바이트 파일은 건너뜀
- [x] shouldRejectWhenAllFilesInvalid: 유효한 파일이 0개이면 400 에러
- [x] shouldReturnProcessingStatus: 처리 중 상태 반환
- [x] shouldReturnPendingForUnknownId: 알 수 없는 ID에 대해 pending 반환
- [x] shouldDenyAccessForWrongUser: 다른 사용자의 상태 조회 시 pending 반환
- [x] shouldShowIndividualImageStatus: 개별 이미지 상태 배열 포함
- [x] shouldReturnExcelBufferAfterProcessing: 처리 완료 후 엑셀 Buffer 반환
- [x] shouldReturnNullForWrongUser: 다른 사용자의 엑셀 요청 시 null
- [x] shouldHandlePartialFailure: 일부 이미지만 실패 시 전체 상태 completed, 개별 error

---

## Phase 5: 히스토리 (FR-5) ✅

**Scope**: Prisma schema + image-to-excel.service.ts 히스토리 메서드

### Tests:
- [x] shouldReturnPaginatedList: 페이지네이션된 히스토리 목록 반환
- [x] shouldReturnDetail: 히스토리 상세 반환
- [x] shouldThrow404WhenNotFound (detail): 존재하지 않는 히스토리는 404
- [x] shouldDeleteHistory: 히스토리 삭제
- [x] shouldThrow404WhenNotFound (delete): 존재하지 않는 히스토리 삭제 시 404
- [x] shouldRegenerateExcelFromHistory: 히스토리에서 엑셀 재생성
- [x] shouldThrow404WhenNotFound (regenerate): 존재하지 않는 히스토리 재다운로드 시 404

---

## Phase 6: Controller + Module 연결 (FR-1, FR-3, FR-4, FR-5) ✅

**Scope**: controller, module, app.module.ts 등록

### Tests:
- [x] shouldCallServiceWithCorrectParams: 업로드 시 서비스에 올바른 파라미터 전달
- [x] shouldRejectInvalidType: 잘못된 타입은 400 에러
- [x] shouldReturnStatus: 상태 조회
- [x] shouldSetContentDisposition: 다운로드 시 Content-Disposition 헤더 설정
- [x] shouldThrow404WhenNoExcel: 엑셀이 없으면 404
- [x] shouldParsePagination: 페이지네이션 파라미터 파싱
- [x] shouldClampPagination: 비정상 페이지네이션 파라미터 보정

---

# Frontend Logic (TDD)

## Phase 7: API 클라이언트 + Zustand 스토어 (FR-6) ✅

### Tests (API):
- [x] shouldUploadWithFormData: 파일 배열과 타입을 FormData로 전송
- [x] shouldThrowOnError: 에러 시 메시지 추출하여 throw
- [x] shouldReturnStatus: 상태 조회 결과 반환
- [x] shouldReturnExtractedData: 추출 데이터 반환
- [x] shouldReturnBlob: 엑셀 파일 Blob 반환

### Tests (Store):
- [x] shouldHaveDefaultOptions: 기본 타입은 receipt
- [x] shouldSetOptions: 타입 변경
- [x] shouldReset: reset 시 기본값 복원

---

## Phase 8: useImageToExcel 훅 (FR-6) ✅

### Tests:
- [x] shouldStartIdle: 초기 상태는 idle
- [x] shouldTransitionToProcessing: upload 호출 후 processing 상태로 전환
- [x] shouldCompleteAfterPolling: 폴링 후 completed 상태로 전환
- [x] shouldHandleUploadError: 업로드 에러 시 error 상태
- [x] shouldHandlePollingError: 폴링 중 서버 에러
- [x] shouldReset: reset으로 초기 상태로 복구

---

# UI/UX (Non-TDD)

## Phase 9: 메인 페이지 UI (FR-6) ✅

### Tasks:
- [x] 이미지 타입 선택 UI (영수증/명함 탭)
- [x] 다중 파일 드래그 앤 드롭 업로더 (썸네일 미리보기 + 개별 삭제)
- [x] 처리 중 화면: 전체 진행률 바 + 개별 이미지 상태 목록
- [x] 결과 화면: 추출 데이터 테이블 + 엑셀 다운로드 버튼
- [x] barrel export (`index.ts`)

---

## Phase 10: 히스토리 페이지 UI (FR-5, FR-6) ✅

### Tasks:
- [x] 히스토리 목록: 날짜, 타입(영수증/명함), 이미지 수, 엑셀 재다운로드 버튼, 삭제 버튼
- [x] 히스토리 상세: 추출 데이터 테이블 표시
- [x] 페이지네이션

---

## Phase 11: 라우팅 + 네비게이션 통합 ✅

### Tasks:
- [x] `/image-to-excel` 라우트 추가
- [x] `/image-to-excel/history` 라우트 추가
- [x] Navbar에 "엑셀 변환" 링크 추가 (데스크톱 + 모바일 메뉴)

---

## Notes

- **exceljs 검증 완료**: Spike에서 모든 요구사항 충족 확인
- **retry.ts 재사용**: `apps/api-server/src/presentation/utils/retry.ts`를 data-extractor.service.ts에서 공용 사용
- **Prisma 스키마**: `ImageToExcelHistory` 모델 추가, `prisma generate` 완료
- **기존 테스트 영향 없음**: 기존 154개 테스트 모두 통과 유지
- **최종 테스트 수**: Backend 146 + Frontend 65 = 211 tests, 0 failures
