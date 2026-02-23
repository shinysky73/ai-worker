# PRD: Google 로그인, History 저장, 네비게이션 메뉴

**Created**: 2026-02-06
**Status**: Draft
**Prerequisites**: PostgreSQL DB 접속 가능 (`.env`에 `DATABASE_URL` 설정 완료)

---

## 1. Problem

### 배경

현재 ai-worker는 발표 스크립트 생성 결과를 인메모리 Map에 저장한다. 서버 재시작 시 모든 데이터가 소실되며, 사용자 구분 없이 누구나 접근 가능하다. `.env`에 PostgreSQL URL과 Google OAuth 인증 정보가 이미 준비되어 있으나 코드에서 사용하지 않고 있다.

### 문제

1. **데이터 휘발**: 생성된 스크립트가 인메모리에만 존재하여 서버 재시작 시 소실
2. **사용자 구분 없음**: 인증이 없어 누가 생성한 결과인지 알 수 없음
3. **재열람 불가**: 한 번 브라우저를 닫으면 이전 결과를 다시 볼 방법이 없음
4. **확장성 부재**: 메뉴/네비게이션이 없어 기능 추가 시 진입점이 없음

### 영향

- 사용자가 생성한 스크립트를 다시 확인하려면 매번 파일을 재업로드해야 함
- 개인별 이용 내역 관리 불가
- 향후 기능 추가 시 라우팅과 네비게이션을 처음부터 설계해야 함

---

## 2. Functional Requirements

### FR-1: Google OAuth 로그인

**Description**: Google 계정으로 로그인하여 사용자를 식별한다. 로그인하지 않으면 서비스 이용 불가.

**현재 코드**: `apps/api-server/src/main.ts` — 인증 미들웨어 없음, `apps/user-client/src/App.tsx` — 인증 가드 없음

**Acceptance Criteria**:
- [ ] 비로그인 상태에서 모든 페이지 접근 시 로그인 페이지로 리다이렉트
- [ ] Google OAuth 버튼 클릭 → Google 인증 → 콜백 → JWT 발급 → 프론트 저장
- [ ] JWT에 사용자 ID, 이메일, 이름, 프로필 이미지가 포함됨
- [ ] `api/presentations/*` 엔드포인트에 JWT 가드 적용, 유효하지 않으면 401
- [ ] 최초 로그인 시 DB에 사용자 레코드 자동 생성 (upsert)
- [ ] 로그아웃 시 프론트의 토큰 삭제 후 로그인 페이지로 이동

**Edge Cases**:
- JWT 만료: 401 응답 시 프론트에서 로그인 페이지로 리다이렉트
- Google 인증 실패/취소: 에러 메시지 표시 후 로그인 페이지에 머무름

### FR-2: History 저장 (DB)

**Description**: 스크립트 생성 완료 시 결과를 PostgreSQL에 저장하고, 사용자별로 조회 가능하게 한다.

**현재 코드**: `apps/api-server/src/presentation/presentation.service.ts:270-276` — 인메모리 Map에 결과 저장

**Acceptance Criteria**:
- [ ] Prisma 스키마에 `User`, `PresentationHistory` 모델 정의
- [ ] `PresentationHistory`에 저장되는 필드: id, userId, filename, tone, targetMinutes, slides(JSON), totalEstimatedSeconds, createdAt
- [ ] 스크립트 생성 완료 시 자동으로 DB에 저장 (기존 인메모리 저장과 별도)
- [ ] `GET /api/presentations/history` — 로그인 사용자의 히스토리 목록 반환 (최신순, 페이지네이션)
- [ ] `GET /api/presentations/history/:id` — 특정 히스토리 상세 조회 (본인 것만)
- [ ] `DELETE /api/presentations/history/:id` — 특정 히스토리 삭제 (본인 것만)

**Edge Cases**:
- 다른 사용자의 히스토리 접근 시도: 404 반환
- DB 저장 실패: 스크립트 생성 자체는 성공으로 유지, 에러 로그만 남김

### FR-3: History 페이지 (프론트)

**Description**: 과거 생성한 스크립트를 목록으로 보여주고, 상세 내용을 다시 열람할 수 있다.

**현재 코드**: 해당 없음 — 신규 페이지

**Acceptance Criteria**:
- [ ] `/history` 라우트에 히스토리 목록 페이지 표시
- [ ] 목록에 파일명, 생성일시, 슬라이드 수, 총 발표 시간 표시
- [ ] 목록 항목 클릭 시 상세 보기 — 기존 ResultSummary + SlideScriptCard 재사용
- [ ] 히스토리 항목 삭제 버튼 (확인 다이얼로그 포함)
- [ ] 목록이 비어있을 때 빈 상태 안내 메시지 표시

**Edge Cases**:
- 히스토리가 많을 경우: 무한 스크롤 또는 페이지네이션으로 처리
- 상세 보기 중 해당 항목이 삭제된 경우: 목록으로 돌아가며 알림

### FR-4: 네비게이션 메뉴

**Description**: 상단에 공통 네비게이션 바를 추가하여 페이지 간 이동과 사용자 정보를 표시한다.

**현재 코드**: `apps/user-client/src/App.tsx` — 레이아웃 없이 라우트만 존재

**Acceptance Criteria**:
- [ ] 공통 Layout 컴포넌트에 상단 네비게이션 바 포함
- [ ] 네비 항목: 로고/앱이름, "스크립트 생성" (홈), "히스토리"
- [ ] 현재 활성 메뉴에 시각적 표시 (active state)
- [ ] 우측에 사용자 프로필 (이미지 + 이름) 표시
- [ ] 프로필 클릭 시 드롭다운: 로그아웃 버튼
- [ ] 모바일에서 반응형 처리 (햄버거 메뉴 또는 축소 레이아웃)

**Edge Cases**:
- 프로필 이미지 로드 실패: 이름 이니셜로 대체

---

## 3. Affected Code

**신규 생성:**
- `prisma/schema.prisma` — User, PresentationHistory 모델
- `apps/api-server/src/auth/` — AuthModule, AuthController, AuthService, GoogleStrategy, JwtStrategy, JwtGuard
- `apps/user-client/src/features/auth/` — LoginPage, AuthProvider, useAuth hook
- `apps/user-client/src/features/history/` — HistoryPage, HistoryList, HistoryDetail
- `apps/user-client/src/components/Layout.tsx` — 공통 레이아웃 + 네비게이션
- `apps/user-client/src/components/Navbar.tsx` — 네비게이션 바

**수정 대상:**
- `apps/api-server/src/app.module.ts` — AuthModule, PrismaModule import 추가
- `apps/api-server/src/presentation/presentation.service.ts` — 결과 저장 시 DB 기록 추가
- `apps/api-server/src/presentation/presentation.controller.ts` — JWT 가드 적용, history 엔드포인트 추가
- `apps/user-client/src/App.tsx` — Layout 래핑, 라우트 추가 (/history, /login), AuthProvider
- `apps/api-server/package.json` — prisma, @prisma/client, passport, passport-google-oauth20, @nestjs/passport, @nestjs/jwt 추가
- `apps/user-client/package.json` — 필요 시 추가 의존성

**의존성:**
- `prisma` + `@prisma/client` — DB ORM
- `@nestjs/passport` + `passport-google-oauth20` — Google OAuth
- `@nestjs/jwt` + `passport-jwt` — JWT 인증

---

## 4. Out of Scope

- 회원가입 폼 (Google OAuth만 사용)
- 이메일/비밀번호 로그인
- 업로드한 원본 파일의 DB 저장 (결과 텍스트만 저장)
- 히스토리 검색/필터 기능
- 사용자 간 스크립트 공유
- 관리자 페이지
- Refresh Token 구현 (1차에서는 Access Token만)
