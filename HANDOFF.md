# Code Review & Security Fixes - Handoff Document

## Goal
image-analysis 및 presentation 기능에 대한 코드 리뷰를 수행하고, 발견된 보안 취약점·테스트 실패·코드 품질 이슈를 전부 수정한다.

## Current Progress

### What's Been Done

**docs 정리 (2 commits: `7438190`, `76df6bf`)**
- `docs/` 디렉토리에 `NN-` 순번 접두사 추가 (01~05)
- 내부 참조 경로 업데이트 (plan.md, prd.md, CLAUDE.md)
- 스킬 템플릿에 `{NN}-` 패턴 반영 (go-phase, plan, CLAUDE.md)
- `docs/01-idea/ieaa.md` → `idea.md` 오타 수정

**코드 리뷰 & 보안/품질 수정 (commit: `017ea2b`) — 25파일, +484/-205**

Security fixes:
- `FileInterceptor`에 Multer `limits.fileSize` 추가 (image-analysis 10MB, presentation 50MB) — OOM DoS 방지
- `getStatus`/`getResult` 엔드포인트에 `userId` 소유권 검증 (IDOR 차단) — 양쪽 모듈
- `getHistoryImagePath`에 `path.resolve` + `HISTORY_IMAGE_DIR` 시작 검증 (Path Traversal 차단)
- `processImage`/`processPresentation` fire-and-forget에 `.catch()` 연결
- `GoogleStrategy` — `GOOGLE_CLIENT_ID` 미설정 시 `null` 반환 (조건부 생성)
- `AuthModule`에 `ConfigModule` import 추가 (DI 해결)
- `GEMINI_API_KEY` 미설정 시 fail fast (`throw Error`)

Reliability:
- `processPresentation` finally 블록에 `cleanupTempFiles()` 추가 — 임시 PPT/PDF/이미지 파일 자동 정리
- 한국어 읽기 시간 계산 개선 — 한글 30%+ 텍스트는 450 chars/min 문자 기반
- `targetMinutes` FormData string → Number 파싱 + NaN 검증
- Pagination `limit` 상한 100 + NaN 방지 (양쪽 모듈)
- Blob URL 메모리 누수 수정 (`useImageAnalysis`, `ImageAnalysisHistoryPage`)
- Nginx 프록시 헤더 추가 (X-Real-IP, X-Forwarded-For 등)
- `imageAnalysisHistoryApi`에 `extractErrorMessage` 에러 래핑 일관화

Test fixes (pre-existing failures 전부 해결):
- `converter.service.spec.ts` — `exec` → `execFile` mock, 3-arg assertion
- `presentationApi.test.ts` — `timeout`, `{ timeout }` 실제 호출 시그니처 반영
- `script-generator.service.spec.ts` — tone assertion: `expect.arrayContaining` → `mock.calls[1][0]` 직접 검사
- Controller specs — `req.user` mock 추가, 미사용 변수 제거
- `image-analysis.service.spec.ts` — `PrismaService` mock 추가 + history 테스트 추가
- Zustand stores — 미사용 `result`/`setResult` 제거 (양쪽 모듈)
- `formatTime` 유틸 테스트 추가
- `convertPdfToImages` 경로 처리: `pdfPath.replace('.pdf','')` → `path.join(dirname, basename)`

### What Worked
- code-reviewer subagent로 체계적 리뷰 → Critical/Important/Minor 분류 후 우선순위 처리
- image-analysis에서 수정한 패턴을 presentation에 동일 적용 (Multer limit, IDOR, .catch 등)

### What Didn't Work
- 리뷰어의 M1 지적(Navbar 히스토리 링크 누락)을 검증 없이 반영 → PresentationPage에 이미 인페이지 링크 존재. 사용자 피드백 후 되돌림. **리뷰어 의견도 기존 설계 의도를 확인한 후 반영할 것.**

## Key Decisions
- `getStatus`/`getResult`에서 다른 사용자가 조회 시 404가 아닌 `pending`/`null` 반환 — UUID 존재 여부 자체를 노출하지 않기 위함
- 한국어 읽기 시간: 한글 비율 30% 이상이면 문자 기반(450 chars/min), 그 외 단어 기반(150 words/min) — 한국어 발표 속도 기준
- `SlideScriptSkeleton` 컴포넌트는 barrel export에서만 제거, 파일은 유지 — 추후 사용 가능성

## Files Changed
- `apps/api-server/src/auth/auth.module.ts` — ConfigModule import, GoogleStrategy 조건부 생성
- `apps/api-server/src/image-analysis/image-analysis.controller.ts` — Multer limit, IDOR fix, pagination
- `apps/api-server/src/image-analysis/image-analysis.service.ts` — userId 검증, path traversal, .catch, mimeToExt
- `apps/api-server/src/image-analysis/image-analysis.controller.spec.ts` — req mock, history 테스트
- `apps/api-server/src/image-analysis/image-analysis.service.spec.ts` — PrismaService mock, history 테스트
- `apps/api-server/src/presentation/presentation.controller.ts` — Multer limit, IDOR fix, pagination, targetMinutes parse
- `apps/api-server/src/presentation/presentation.service.ts` — userId 검증, cleanupTempFiles, .catch, error msg
- `apps/api-server/src/presentation/script-generator.service.ts` — fail fast API key, Korean reading time
- `apps/api-server/src/presentation/converter.service.ts` — path.join 경로 처리
- `apps/api-server/src/presentation/converter.service.spec.ts` — execFile mock 수정
- `apps/api-server/src/presentation/presentation.controller.spec.ts` — req mock, 미사용 변수 제거
- `apps/api-server/src/presentation/presentation.service.spec.ts` — error msg assertion
- `apps/api-server/src/presentation/script-generator.service.spec.ts` — tone assertion 수정
- `apps/user-client/nginx.conf` — proxy headers
- `apps/user-client/src/features/image-analysis/hooks/useImageAnalysis.ts` — previewUrlRef, unmount cleanup
- `apps/user-client/src/features/image-analysis/pages/ImageAnalysisHistoryPage.tsx` — Blob URL leak fix
- `apps/user-client/src/features/image-analysis/services/imageAnalysisHistoryApi.ts` — extractErrorMessage
- `apps/user-client/src/features/image-analysis/stores/imageAnalysisStore.ts` — 미사용 result 제거
- `apps/user-client/src/features/image-analysis/stores/imageAnalysisStore.test.ts` — result 테스트 제거
- `apps/user-client/src/features/presentation/index.ts` — SlideScriptSkeleton export 제거
- `apps/user-client/src/features/presentation/services/presentationApi.ts` — non-null assertion 제거
- `apps/user-client/src/features/presentation/services/presentationApi.test.ts` — 실제 호출 시그니처 반영
- `apps/user-client/src/features/presentation/stores/presentationStore.ts` — 미사용 result 제거
- `apps/user-client/src/features/presentation/stores/presentationStore.test.ts` — result 테스트 제거
- `apps/user-client/src/features/presentation/utils/formatTime.test.ts` — 신규 테스트

## Test Status
- Backend: 103 tests passing (14 suites, 0 failures)
- Frontend: 51 tests passing (11 suites, 0 failures)
- Pre-existing test failures: **모두 해결** (converter.service.spec, script-generator.service.spec, presentationApi.test)

## Next Steps
1. 리뷰에서 스킵한 Minor 이슈 처리: M-1 (console.log → NestJS Logger), M-8 (OptionsForm parseInt 엄격화)
2. I-5 (존재하지 않는 ID에 `pending` 반환 문제) — 프론트엔드 폴링 무한루프 가능성. `not_found` 상태 추가 검토
3. I-8 (인메모리 상태 서버 재시작 유실) — Redis 또는 DB 기반 상태 관리 고려
4. 새 기능 개발 — `/prd`로 `06-` 번호부터 시작

## Resume Command
```
HANDOFF.md를 읽고 현재 작업 상태를 파악해줘. 이전 세션에서 image-analysis와 presentation 코드 리뷰 후 보안/품질 수정을 완료했어. Next Steps 기반으로 이어서 작업하자.
```
