# Image-to-Excel 기능 준비 - Handoff Document

## Goal
영수증/명함 사진을 여러 장 업로드하면 AI가 정보를 추출하여 정리된 엑셀(.xlsx) 파일로 다운로드할 수 있는 기능을 구현한다.

## Current Progress

### What's Been Done

**프로젝트 가이드 문서 작성**
- `docs/GUIDE.md` — 비개발자용 프로젝트 이해 + 실습 가이드 (한국어, 14개 섹션)
- `docs/GUIDE.html` — HTML 버전 (사이드바 네비게이션, 시각적 스타일링)
- Gemini API 키는 회사 발급 키 사용하도록 안내
- git clone URL: `https://github.com/shinysky73/ai-worker.git`

**PRD 작성 완료**
- `docs/06-image-to-excel/prd.md` — 6개 FR, AC, Edge Cases 정의
  - FR-1: 다중 이미지 업로드 (최대 20장)
  - FR-2: AI 기반 구조화 데이터 추출 (영수증/명함 필드별)
  - FR-3: 엑셀 파일 생성 및 다운로드
  - FR-4: 다중 이미지 처리 상태 추적 (개별 + 전체)
  - FR-5: 히스토리 관리
  - FR-6: 프론트엔드 UI

**TDD Plan 작성 완료**
- `docs/06-image-to-excel/plan.md` — 11 Phases
  - Backend TDD: Phase 1(Spike) ~ Phase 6(Controller)
  - Frontend TDD: Phase 7(API client) ~ Phase 8(Hook)
  - UI/UX Non-TDD: Phase 9(메인 페이지) ~ Phase 11(라우팅)

**브랜치 생성**
- `feat/image-to-excel` 브랜치에서 작업 중

### What Worked
- 기존 `image-analysis` 모듈을 패턴 참고 대상으로 삼아 PRD/Plan 설계 → 일관된 아키텍처 유지
- Explore agent로 기존 코드 패턴을 한 번에 파악 → PRD의 Affected Code, Plan의 위험 요소 정확히 식별

## Key Decisions
- **엑셀 라이브러리**: Phase 1 Spike에서 `exceljs` 우선 검증 후 결정. 대안은 `xlsx`(SheetJS)
- **백엔드 모듈 분리**: 기존 `image-analysis`와 별도 모듈 (`image-to-excel/`)로 생성. AI 호출 코드는 독자적 서비스 (`data-extractor.service.ts`)
- **상태 관리**: 기존 image-analysis와 동일한 인메모리 TTL 패턴. 개별 이미지 상태 배열 추가
- **다중 업로드**: `FilesInterceptor` (Multer) 사용, 개별 10MB + 전체 100MB 제한
- **retry.ts**: 기존 `presentation/utils/retry.ts` 공용 재사용

## Files Changed
- `docs/GUIDE.md` — 비개발자용 프로젝트 가이드 (신규)
- `docs/GUIDE.html` — HTML 버전 가이드 (신규)
- `docs/06-image-to-excel/prd.md` — PRD (신규)
- `docs/06-image-to-excel/plan.md` — TDD Plan (신규)

## Test Status
- Backend: 103 tests passing (14 suites, 0 failures)
- Frontend: 51 tests passing (11 suites, 0 failures)
- 총 154개 테스트 all green. 기존 코드 변경 없음.

## Next Steps
1. `/go-phase` Phase 1 — exceljs Spike (라이브러리 설치 + 기본 동작 검증)
2. `/go-phase` Phase 2 — 엑셀 생성 서비스 TDD
3. `/go-phase` Phase 3 — AI 데이터 추출 서비스 TDD
4. Phase 4~11 순차 진행

## Resume Command
```
HANDOFF.md를 읽고 현재 작업 상태를 파악해줘. feat/image-to-excel 브랜치에서 영수증/명함→엑셀 변환 기능을 구현 중이야. PRD(docs/06-image-to-excel/prd.md)와 Plan(docs/06-image-to-excel/plan.md) 작성 완료. /go-phase Phase 1(exceljs Spike)부터 시작하자.
```
