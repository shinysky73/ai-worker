# TDD Plan: Google 로그인, History 저장, 네비게이션 메뉴

**PRD**: `docs/auth-history-navigation/prd.md`
**Created**: 2026-02-06
**Status**: Complete

---

# Backend (TDD)

## Phase 1: Prisma 설정 및 DB 스키마 (FR-1, FR-2)

**Scope**: `prisma/schema.prisma`, `apps/api-server/src/prisma/`
**행동 목표**: Prisma가 PostgreSQL에 연결되고, User와 PresentationHistory 테이블이 존재한다.
**PRD AC**: FR-1 AC5 (사용자 레코드 자동 생성), FR-2 AC1 (스키마 정의), FR-2 AC2 (필드 정의)
**Edge Cases**: 없음

### Tests:
- [x] PrismaService should be defined
- [x] PrismaService should expose user model delegate (findUnique, upsert)
- [x] PrismaService should expose presentationHistory model delegate (findMany, create, delete)
- [x] PrismaService should call $connect on module init
- [x] PrismaService should call $disconnect on module destroy
- [x] PrismaModule should provide PrismaService globally

### Done:
- Prisma 스키마: User (id, email, name, picture, googleId, timestamps), PresentationHistory (id, userId, filename, tone, targetMinutes, slides JSON, totalEstimatedSeconds, createdAt)
- PrismaService: PrismaClient 래핑, user/presentationHistory/\$transaction getter 노출
- PrismaModule: @Global() 모듈로 등록, AppModule에 import
- DB 마이그레이션 실행 완료 (`20260206092254_init_user_and_history`)

---

## Phase 2: Auth 모듈 — Google OAuth + JWT (FR-1)

**Scope**: `apps/api-server/src/auth/`
**행동 목표**: Google OAuth 로그인 → 사용자 upsert → JWT 발급 흐름이 동작한다. JWT 가드가 유효하지 않은 토큰을 거부한다.
**PRD AC**: FR-1 AC2 (OAuth → JWT 발급), FR-1 AC3 (JWT 페이로드), FR-1 AC4 (JWT 가드 401), FR-1 AC5 (DB upsert)
**Edge Cases**: JWT 만료 시 401, Google 인증 실패/취소 시 에러 리다이렉트

### ⚠ 위험 요소
- GoogleStrategy는 실제 Google API에 의존 → 테스트에서 mock 필요
- `@nestjs/passport` 설정이 NestJS 11과 호환되는지 확인 필요

### Tests:
- [x] AuthService.validateGoogleUser: DB upsert 후 JWT 토큰 반환
- [x] AuthService.validateGoogleUser: JWT payload에 id, email, name, picture 포함
- [x] JwtStrategy.validate: 유효한 JWT payload에서 사용자 정보 추출
- [x] JwtStrategy.validate: picture 없는 payload 처리
- [x] GoogleStrategy.validate: Google 프로필을 GoogleProfile로 변환
- [x] GoogleStrategy.validate: 사진 없는 프로필 처리
- [x] GoogleStrategy.validate: 이메일 없으면 에러
- [x] AuthController.googleCallback: 성공 시 JWT 토큰과 함께 프론트로 리다이렉트
- [x] AuthController.googleCallback: user 없으면 에러 리다이렉트
- [x] AuthModule: AuthService 제공
- [x] AuthModule: AuthController 제공

### Done:
- AuthService: Google 프로필 upsert + JWT 발급
- JwtStrategy: Bearer 토큰에서 사용자 정보 추출
- GoogleStrategy: Google OAuth 프로필 변환
- AuthController: /api/auth/google (로그인), /api/auth/google/callback (콜백 → JWT → 프론트 리다이렉트)
- AuthModule: PassportModule, JwtModule, strategies, service, controller 통합
- AppModule에 AuthModule import 완료

---

## Phase 3: Presentation 엔드포인트에 JWT 가드 적용 (FR-1)

**Scope**: `apps/api-server/src/presentation/presentation.controller.ts`
**행동 목표**: 모든 `/api/presentations/*` 엔드포인트가 JWT 인증을 요구한다. 토큰 없이 요청하면 401이 반환된다.
**PRD AC**: FR-1 AC4 (JWT 가드 적용)
**Edge Cases**: 없음

### ⚠ 위험 요소
- 기존 `presentation.controller.spec.ts` 테스트가 깨질 수 있음 (인증 없이 호출하고 있을 경우)

### Tests:
- [x] shouldHaveJwtGuardOnController: 컨트롤러에 JWT 가드가 적용되어 있어야 한다

### Done:
- `@UseGuards(AuthGuard('jwt'))` 컨트롤러 레벨에 적용
- 기존 테스트 모두 통과 (단위 테스트에서는 가드 우회됨)

---

## Phase 4: History CRUD API (FR-2)

**Scope**: `apps/api-server/src/presentation/presentation.service.ts`, `apps/api-server/src/presentation/presentation.controller.ts`
**행동 목표**: 스크립트 생성 완료 시 DB에 저장되고, 사용자별 히스토리 목록/상세/삭제 API가 동작한다.
**PRD AC**: FR-2 AC3 (생성 완료 시 DB 저장), FR-2 AC4 (목록 API), FR-2 AC5 (상세 API), FR-2 AC6 (삭제 API)
**Edge Cases**: 타 사용자 히스토리 접근 → 404, DB 저장 실패 → 에러 로그만 남김 (생성 자체는 성공)

### ⚠ 위험 요소
- `processPresentation` 메서드가 현재 userId를 받지 않음 → 시그니처 변경 필요
- 기존 `presentation.service.spec.ts` 테스트에 영향

### Tests:
- [x] shouldSaveHistoryToDb: 스크립트 생성 완료 시 DB에 저장
- [x] shouldReturnUserHistoryList: 사용자별 히스토리 목록 반환 (최신순, 페이지네이션)
- [x] shouldReturnHistoryDetail: 본인 히스토리 상세 조회
- [x] shouldReturn404ForOtherUserHistory: 타 사용자 히스토리 접근 시 404
- [x] shouldDeleteOwnHistory: 본인 히스토리 삭제
- [x] shouldReturn404WhenDeletingOtherUserHistory: 타 사용자 히스토리 삭제 시 404
- [x] shouldReturnHistoryList (controller): 로그인 사용자의 히스토리 목록 반환
- [x] shouldReturnHistoryDetail (controller): 히스토리 상세 조회
- [x] shouldDeleteHistory (controller): 히스토리 삭제

### Done:
- PrismaService 주입, saveHistory/getHistoryList/getHistoryDetail/deleteHistory 구현
- Controller에 GET /history, GET /history/:id, DELETE /history/:id 추가
- 타 사용자 접근 시 404 반환 (userId 기반 접근 제어)
- 기존 mock 파일 수정 (createMockInvalidFile: text/plain으로 변경)

---

# Frontend Logic (TDD)

## Phase 5: Auth 상태 관리 및 API 클라이언트 (FR-1)

**Scope**: `apps/user-client/src/features/auth/`
**행동 목표**: 로그인 상태(JWT)를 관리하고, API 요청에 Authorization 헤더를 자동 첨부하며, 401 응답 시 로그인 페이지로 리다이렉트한다.
**PRD AC**: FR-1 AC1 (비로그인 리다이렉트), FR-1 AC2 (JWT 프론트 저장), FR-1 AC6 (로그아웃 시 토큰 삭제)
**Edge Cases**: JWT 만료 → 401 → 리다이렉트

### Tests:
- [x] shouldStartLoggedOut: 초기 상태는 로그아웃
- [x] shouldSetTokenAndDecodeUser: 토큰 설정 시 사용자 정보 디코딩
- [x] shouldClearOnLogout: 로그아웃 시 토큰과 사용자 정보 삭제
- [x] shouldHandleUserWithoutPicture: picture 없는 사용자 처리
- [x] shouldSetupRequestInterceptor: request 인터셉터 등록
- [x] shouldSetupResponseInterceptor: response 인터셉터 등록
- [x] shouldAttachAuthorizationHeader: 토큰 있으면 Authorization 헤더 첨부
- [x] shouldNotAttachHeaderWhenNoToken: 토큰 없으면 헤더 미첨부
- [x] shouldLogoutOn401: 401 응답 시 로그아웃

### Done:
- authStore: Zustand 기반 JWT 토큰 저장, 디코딩, 로그아웃
- apiClient: axios 인터셉터 (Authorization 헤더 자동 첨부, 401 시 로그아웃)
- barrel export (index.ts)

---

## Phase 6: History API 클라이언트 및 Hook (FR-3)

**Scope**: `apps/user-client/src/features/history/`
**행동 목표**: 히스토리 목록/상세/삭제 API를 호출하는 서비스와 hook이 동작한다.
**PRD AC**: FR-3 AC1 (목록), FR-3 AC2 (목록 필드), FR-3 AC3 (상세), FR-3 AC4 (삭제)
**Edge Cases**: 페이지네이션, 삭제된 항목 상세 접근

### Tests:
- [x] shouldFetchHistoryList: 히스토리 목록 API 호출
- [x] shouldFetchWithPagination: 페이지네이션 파라미터 전달
- [x] shouldFetchHistoryDetail: 히스토리 상세 API 호출
- [x] shouldDeleteHistoryItem: 히스토리 삭제 API 호출
- [x] shouldStartWithEmptyState: 초기 상태는 빈 목록
- [x] shouldFetchList (hook): 목록 조회
- [x] shouldHandleFetchError: 조회 실패 시 에러 상태
- [x] shouldDeleteItem (hook): 항목 삭제 후 목록에서 제거

### Done:
- historyApi: fetchList(page, limit), fetchDetail(id), deleteItem(id)
- useHistory hook: items, total, loading, error, fetchList, deleteItem
- barrel export (index.ts)

---

# UI/UX (Non-TDD)

## Phase 7: 로그인 페이지 (FR-1)

**Scope**: `apps/user-client/src/features/auth/pages/LoginPage.tsx`

### Tasks:
- [x] Google 로그인 버튼이 있는 로그인 페이지 구현
- [x] 앱 로고/이름, 설명 텍스트 표시
- [x] Google 인증 실패 시 에러 메시지 표시
- [x] 이미 로그인 상태면 홈으로 리다이렉트
- [x] AuthCallbackPage: OAuth 콜백에서 토큰 저장 후 홈 리다이렉트

---

## Phase 8: 네비게이션 바 + Layout (FR-4)

**Scope**: `apps/user-client/src/components/Layout.tsx`, `apps/user-client/src/components/Navbar.tsx`, `apps/user-client/src/App.tsx`

### Tasks:
- [x] Layout 컴포넌트: Navbar + children(Outlet), 비로그인 시 /login 리다이렉트
- [x] Navbar: 로고/앱이름, "스크립트 생성", "히스토리" 메뉴
- [x] 현재 활성 메뉴 시각적 표시 (NavLink active)
- [x] 우측 사용자 프로필 (이미지 + 이름), 클릭 시 로그아웃 드롭다운
- [x] 프로필 이미지 로드 실패 시 이니셜 대체
- [x] 모바일 반응형 (햄버거 메뉴)
- [x] App.tsx 라우트 재구성: Layout 래핑, /login, /auth/callback, /history 추가
- [x] localStorage에서 토큰 복원 (앱 시작 시)

---

## Phase 9: History 페이지 (FR-3)

**Scope**: `apps/user-client/src/features/history/pages/HistoryPage.tsx`

### Tasks:
- [x] 히스토리 목록: 파일명, 생성일시, 슬라이드 수, 총 발표 시간 카드
- [x] 항목 클릭 → 상세 보기 (SlideScriptCard 재사용)
- [x] 삭제 버튼 + 확인 다이얼로그
- [x] 빈 상태 안내 메시지
- [x] 페이지네이션

---

## Notes

- Phase 1 → 2 → 3 → 4 순서 의존 (DB → Auth → Guard → History CRUD)
- Phase 5는 Phase 2 완료 후 진행 가능 (백엔드 Auth 엔드포인트 필요)
- Phase 7, 8, 9는 Phase 5, 6 완료 후 진행 (Auth/History hook 필요)
- `.env`의 `GOOGLE_CALLBACK_URL`이 `http://localhost:3002/api/auth/google/callback`으로 설정되어 있으므로 Auth 컨트롤러 경로를 이에 맞춰야 함
- 기존 인메모리 상태 관리(statusStore, resultStore)는 처리 중 상태 추적용으로 유지. DB 저장은 완료 시점에만 수행.
