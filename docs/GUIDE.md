# AI Worker 프로젝트 가이드

> PPT/PDF 파일을 업로드하면 AI가 슬라이드별 발표 스크립트를 자동으로 만들어주는 서비스

---

## 목차

### Part 1: 프로젝트 이해하기

- [1. AI Worker란?](#1-ai-worker란)
- [2. 전체 동작 흐름](#2-전체-동작-흐름)
- [3. AI 파이프라인 상세](#3-ai-파이프라인-상세)
- [4. 시스템 구성도](#4-시스템-구성도)
- [5. 기술 스택 요약](#5-기술-스택-요약)

### Part 2: 따라하기 (Step-by-Step)

- [6. 사전 준비](#6-사전-준비)
- [7. 프로젝트 다운로드](#7-프로젝트-다운로드)
- [8. 환경 변수 설정](#8-환경-변수-설정)
- [9. Docker로 실행하기](#9-docker로-실행하기)
- [10. 로컬 개발 환경으로 실행하기](#10-로컬-개발-환경으로-실행하기)
- [11. 사용해보기](#11-사용해보기)

### Part 3: 부록

- [12. 자주 묻는 질문 (FAQ)](#12-자주-묻는-질문-faq)
- [13. 문제 해결 (Troubleshooting)](#13-문제-해결-troubleshooting)
- [14. 프로젝트 폴더 구조 설명](#14-프로젝트-폴더-구조-설명)

---

# Part 1: 프로젝트 이해하기

## 1. AI Worker란?

**AI Worker**는 AI 기반 발표 스크립트 자동 생성기입니다.

### 어떤 문제를 해결하나요?

발표 준비를 할 때 슬라이드는 만들었지만, 각 슬라이드에서 **무슨 말을 해야 할지** 고민되는 경우가 많습니다. AI Worker는 PPT나 PDF 파일을 업로드하면, AI가 각 슬라이드의 내용을 분석하고, 슬라이드별로 자연스러운 발표 스크립트를 자동으로 생성해 줍니다.

### 누가 사용하나요?

- 발표 준비가 필요한 직장인, 학생, 연구자
- 발표 스크립트 초안이 필요한 누구나

### 주요 기능

- **PPT/PDF 업로드**: 발표 파일을 올리면 자동 처리
- **AI 스크립트 생성**: 슬라이드별 발표 대본 자동 작성
- **발표 톤 선택**: 격식체, 캐주얼 등 원하는 말투 설정
- **목표 시간 설정**: 발표 총 시간에 맞춰 스크립트 길이 조절
- **히스토리 관리**: 이전 생성 결과를 저장하고 다시 볼 수 있음
- **이미지 분석**: 개별 이미지를 업로드하여 AI 분석 결과 확인

---

## 2. 전체 동작 흐름

사용자 관점에서 파일 업로드부터 스크립트를 받기까지의 흐름입니다.

```
┌─────────────────────────────────────────────────────────┐
│                    사용자의 여정                          │
└─────────────────────────────────────────────────────────┘

  ① Google 로그인
     │
     ▼
  ② PPT 또는 PDF 파일 업로드
     │  + 발표 톤 선택 (예: 격식체)
     │  + 목표 발표 시간 설정 (예: 10분)
     │
     ▼
  ③ "처리 중" 화면에서 대기
     │  (AI가 분석 중... 보통 1~2분 소요)
     │
     ▼
  ④ 결과 확인
     │  - 슬라이드별 발표 스크립트
     │  - 각 슬라이드 예상 소요 시간
     │  - 전체 예상 발표 시간
     │
     ▼
  ⑤ 히스토리에서 언제든 다시 확인 가능
```

**간단 요약**: 파일 올리고 → 옵션 설정하고 → 기다리면 → 스크립트 완성!

---

## 3. AI 파이프라인 상세

AI Worker는 내부적으로 3단계 파이프라인을 거쳐 스크립트를 생성합니다.

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  1단계        │    │  2단계            │    │  3단계        │
│  슬라이드     │ ──▶│  맥락 기반        │ ──▶│  후처리       │
│  분석         │    │  스크립트 생성     │    │  리파인       │
└──────────────┘    └──────────────────┘    └──────────────┘
```

### 1단계: 슬라이드 분석

- PPT 파일을 이미지로 변환합니다 (PPT → PDF → 이미지).
- 각 슬라이드 이미지를 AI(Google Gemini Vision)에게 보내서 "이 슬라이드에 무엇이 있는지" 분석합니다.
- 제목, 본문, 차트, 이미지 등의 내용을 추출합니다.

**비유**: 슬라이드를 사진 찍어서 AI한테 "여기 뭐가 적혀 있어?"라고 물어보는 것과 같습니다.

### 2단계: 맥락 기반 스크립트 생성

- 1단계에서 분석한 내용을 바탕으로 발표 스크립트를 작성합니다.
- **이전 슬라이드의 맥락**을 참고하여 자연스러운 연결을 만듭니다.
- 사용자가 선택한 톤(격식체/캐주얼 등)과 목표 시간을 반영합니다.

**비유**: 슬라이드 내용을 이해한 AI 작가가 "앞 슬라이드에서 이런 얘기를 했으니, 이번에는 이렇게 이어가겠습니다"라고 자연스럽게 대본을 쓰는 것과 같습니다.

### 3단계: 후처리 리파인

- 생성된 스크립트를 다듬고 개선합니다.
- 발표 시간에 맞게 길이를 조절합니다.
- 부자연스러운 표현을 수정합니다.

**비유**: 작성된 초안을 편집자가 한 번 더 검토하고 다듬는 과정입니다.

---

## 4. 시스템 구성도

AI Worker는 크게 4가지 구성 요소로 이루어져 있습니다.

```
┌─────────────┐         ┌─────────────────┐
│  사용자의    │  HTTPS  │  프론트엔드      │
│  웹 브라우저 │ ◀─────▶ │  (React)        │
└─────────────┘         │  - 화면 표시     │
                        │  - 파일 업로드   │
                        │  - 결과 표시     │
                        └────────┬────────┘
                                 │ API 호출
                                 ▼
                        ┌─────────────────┐
                        │  백엔드          │
                        │  (NestJS)       │
                        │  - 파일 처리     │
                        │  - AI 호출      │
                        │  - 인증 관리     │
                        └───┬─────────┬───┘
                            │         │
                   DB 조회   │         │  AI 요청
                            ▼         ▼
                  ┌──────────┐  ┌──────────────┐
                  │ 데이터    │  │ Google       │
                  │ 베이스    │  │ Gemini AI    │
                  │(Postgre  │  │ (Vision API) │
                  │  SQL)    │  │              │
                  └──────────┘  └──────────────┘
```

| 구성 요소 | 역할 | 비유 |
|-----------|------|------|
| **프론트엔드** | 사용자가 보는 화면, 파일 업로드/결과 표시 | 식당의 주문 카운터 |
| **백엔드** | 파일 변환, AI 호출, 데이터 관리 | 식당의 주방 |
| **데이터베이스** | 사용자 정보, 생성 히스토리 저장 | 식당의 냉장고 (보관) |
| **Google Gemini AI** | 슬라이드 분석 및 스크립트 생성 | 전문 셰프 (핵심 기술) |

---

## 5. 기술 스택 요약

이 프로젝트에서 사용하는 기술들과 각각의 역할입니다.

### 프론트엔드 (사용자 화면)

| 기술 | 역할 |
|------|------|
| **React** | 화면을 구성하는 핵심 라이브러리 (레고 블록처럼 UI를 조립) |
| **Vite** | 개발 서버 및 빌드 도구 (코드 변경 시 즉시 반영) |
| **Zustand** | 상태 관리 (여러 화면에서 공유하는 데이터 관리) |
| **Tailwind CSS** | 디자인/스타일링 도구 (미리 만들어진 스타일을 클래스명으로 적용) |
| **React Router** | 페이지 이동 관리 (로그인 페이지 → 메인 페이지 등) |
| **Axios** | 백엔드와 데이터를 주고받는 통신 라이브러리 |

### 백엔드 (서버)

| 기술 | 역할 |
|------|------|
| **NestJS** | 서버 애플리케이션 프레임워크 (요청 처리, 비즈니스 로직) |
| **Express** | HTTP 요청을 처리하는 기반 엔진 |
| **Prisma** | 데이터베이스와 대화하는 도구 (SQL 대신 코드로 DB 조작) |
| **PostgreSQL** | 데이터 저장소 (사용자 정보, 히스토리 등) |
| **Passport + JWT** | 로그인 인증 (Google 계정 로그인, 토큰 기반 인증) |

### AI & 인프라

| 기술 | 역할 |
|------|------|
| **Google Gemini** | AI 모델 (슬라이드 이미지를 분석하고 스크립트 생성) |
| **LibreOffice** | PPT 파일을 PDF로 변환하는 오픈소스 오피스 (서버에 설치) |
| **Poppler** | PDF를 이미지로 변환하는 도구 (서버에 설치) |
| **Docker** | 실행 환경을 패키징 (어떤 컴퓨터에서든 동일하게 실행) |
| **Nginx** | 웹 서버 (프론트엔드 파일 제공 + 백엔드로 요청 전달) |

---

# Part 2: 따라하기 (Step-by-Step)

## 6. 사전 준비

아래 프로그램들을 컴퓨터에 설치해야 합니다.

### 6.1 Git (프로젝트 다운로드 도구)

Git은 소스 코드를 다운로드하기 위해 필요합니다.

- **Windows**: https://git-scm.com/download/win 에서 다운로드 후 설치
- **macOS**: 터미널에서 `git --version` 실행. 설치되어 있지 않으면 자동 설치 안내가 나옵니다.
- **Linux**: `sudo apt-get install git` (Ubuntu/Debian 기준)

설치 확인:

```bash
git --version
# 예: git version 2.39.0
```

### 6.2 Docker (가장 쉬운 실행 방법)

Docker를 사용하면 복잡한 설정 없이 한 번에 실행할 수 있습니다.

1. https://www.docker.com/products/docker-desktop/ 에서 Docker Desktop 다운로드
2. 운영체제에 맞는 버전 선택 (Windows / macOS Intel / macOS Apple Silicon)
3. 설치 후 Docker Desktop 실행

설치 확인:

```bash
docker --version
# 예: Docker version 24.0.0

docker compose version
# 예: Docker Compose version v2.20.0
```

> **Docker만으로 실행하려면**: Git + Docker만 설치하면 됩니다. [9. Docker로 실행하기](#9-docker로-실행하기)로 건너뛰세요.

### 6.3 Node.js (로컬 개발 시 필요)

로컬에서 직접 개발하려면 Node.js가 필요합니다. 버전 20 이상이어야 합니다.

1. https://nodejs.org/ 에서 LTS 버전 다운로드
2. 설치 프로그램 실행

설치 확인:

```bash
node --version
# 예: v20.11.0 (20 이상이면 OK)
```

### 6.4 pnpm (패키지 관리 도구, 로컬 개발 시 필요)

pnpm은 이 프로젝트에서 사용하는 패키지 관리 도구입니다. 버전 10 이상이어야 합니다.

Node.js 설치 후 터미널에서:

```bash
npm install -g pnpm
```

설치 확인:

```bash
pnpm --version
# 예: 10.28.1 (10 이상이면 OK)
```

---

## 7. 프로젝트 다운로드

터미널(명령 프롬프트)을 열고 원하는 폴더에서 다음 명령어를 실행합니다.

```bash
git clone https://github.com/shinysky73/ai-worker.git
cd ai-worker
```

---

## 8. 환경 변수 설정

AI Worker가 정상 동작하려면 Google OAuth(로그인)와 Gemini API(AI) 키가 필요합니다.

### 8.1 Google OAuth 자격 증명 발급

Google 로그인 기능을 위해 OAuth 자격 증명을 만들어야 합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 로그인합니다.
2. 상단의 프로젝트 선택 드롭다운에서 **새 프로젝트**를 클릭하고, 프로젝트 이름을 입력한 뒤 **만들기**를 클릭합니다.
3. 왼쪽 메뉴에서 **API 및 서비스** → **OAuth 동의 화면**으로 이동합니다.
4. **외부** (External)를 선택하고 **만들기**를 클릭합니다.
5. 앱 이름, 사용자 지원 이메일, 개발자 연락처 이메일을 입력하고 **저장 후 계속**을 눌러 설정을 완료합니다.
6. 왼쪽 메뉴에서 **API 및 서비스** → **사용자 인증 정보**로 이동합니다.
7. 상단의 **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**를 선택합니다.
8. 애플리케이션 유형: **웹 애플리케이션** 선택
9. 이름을 입력합니다 (예: AI Worker Local).
10. **승인된 리디렉션 URI**에 다음을 추가합니다:
    ```
    http://localhost:3002/auth/google/callback
    ```
11. **만들기**를 클릭하면 **클라이언트 ID**와 **클라이언트 보안 비밀번호**가 표시됩니다. 이 두 값을 복사해 둡니다.

### 8.2 Google Gemini API 키

AI 기능을 위해 Gemini API 키가 필요합니다.

**회사에서 발급한 Gemini API 키**를 사용합니다. 담당자에게 키를 전달받아 아래 `.env` 파일에 입력하세요.

> 키를 아직 받지 못했다면 팀 리더 또는 프로젝트 담당자에게 문의하세요.

### 8.3 .env 파일 작성

프로젝트 루트에서 `apps/api-server/.env` 파일을 생성하고 아래 내용을 붙여넣습니다.

```env
DATABASE_URL=postgresql://postgres:post1234@localhost:5432/brett-ai?schema=public
GEMINI_API_KEY=여기에-Gemini-API-키-붙여넣기
GOOGLE_CLIENT_ID=여기에-OAuth-클라이언트-ID-붙여넣기
GOOGLE_CLIENT_SECRET=여기에-OAuth-클라이언트-보안-비밀번호-붙여넣기
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback
JWT_SECRET=아무-긴-문자열-적기-예시-my-super-secret-key-12345
CORS_ORIGIN=http://localhost:5175
PORT=3002
```

각 항목 설명:

| 변수명 | 설명 |
|--------|------|
| `DATABASE_URL` | 데이터베이스 연결 주소. Docker로 실행하면 기본값 그대로 사용 |
| `GEMINI_API_KEY` | 8.2에서 발급한 Gemini API 키 |
| `GOOGLE_CLIENT_ID` | 8.1에서 발급한 OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 8.1에서 발급한 OAuth 클라이언트 보안 비밀번호 |
| `GOOGLE_CALLBACK_URL` | 로그인 후 돌아올 주소 (기본값 그대로 사용) |
| `JWT_SECRET` | 로그인 토큰 암호화 키 (아무 긴 문자열) |
| `CORS_ORIGIN` | 프론트엔드 주소 (기본값 그대로 사용) |
| `PORT` | 서버 포트 (기본값 그대로 사용) |

> **중요**: `.env` 파일에는 민감한 정보가 포함되어 있으므로 절대 Git에 커밋하지 마세요. (이미 `.gitignore`에 등록되어 있습니다.)

---

## 9. Docker로 실행하기

Docker를 사용하면 LibreOffice, PostgreSQL 등을 별도로 설치할 필요 없이 한 번에 실행됩니다. **가장 쉬운 실행 방법**입니다.

### 9.1 실행

```bash
docker compose up --build
```

처음 실행 시 Docker 이미지를 빌드하므로 몇 분 정도 걸릴 수 있습니다.

아래와 같은 로그가 나타나면 정상 실행된 것입니다:

```
db-1           | database system is ready to accept connections
api-server-1   | Running Prisma migrations...
api-server-1   | Starting API server...
user-client-1  | ... ready ...
```

### 9.2 접속

- **웹 화면**: http://localhost:5175
- **API 서버**: http://localhost:3002

### 9.3 백그라운드 실행

터미널을 닫아도 계속 실행하려면:

```bash
docker compose up -d --build
```

### 9.4 종료

```bash
docker compose down
```

### 9.5 Docker 실행 시 DATABASE_URL 참고

Docker로 실행할 때, `docker-compose.yml`에서 `DATABASE_URL`을 자동으로 `postgresql://postgres:post1234@db:5432/brett-ai?schema=public`로 덮어씁니다 (호스트명이 `localhost`가 아닌 `db`). `.env` 파일의 값과 무관하게 Docker 내부에서는 올바르게 연결됩니다.

---

## 10. 로컬 개발 환경으로 실행하기

코드를 수정하며 개발하려면 이 방법을 사용합니다.

> **Windows 사용자**: 로컬 개발 환경은 macOS/Linux 기준으로 작성되어 있습니다. Windows에서 개발하려면 [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/ko-kr/windows/wsl/install)을 설치한 뒤, WSL 터미널에서 아래 명령어들을 실행하세요. PowerShell에서 `wsl --install` 한 줄이면 설치됩니다.

### 10.1 사전 요구사항

- Node.js 20 이상, pnpm 10 이상 설치 (6장 참고)
- PostgreSQL 데이터베이스 실행 중
- LibreOffice, Poppler 설치 (PPT 파일 변환에 필요)

**PostgreSQL 실행 (Docker 활용)**:

데이터베이스만 Docker로 실행하는 것도 가능합니다:

```bash
docker run -d \
  --name ai-worker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=post1234 \
  -e POSTGRES_DB=brett-ai \
  -p 5432:5432 \
  postgres:16-alpine
```

**LibreOffice 설치** (PPT → PDF 변환에 필요):

- macOS: `brew install --cask libreoffice`
- Ubuntu: `sudo apt-get install libreoffice`
- Windows: https://www.libreoffice.org/ 에서 다운로드

**Poppler 설치** (PDF → 이미지 변환에 필요):

- macOS: `brew install poppler`
- Ubuntu: `sudo apt-get install poppler-utils`
- Windows: https://github.com/oschwartz10612/poppler-windows/releases 에서 다운로드

### 10.2 의존성 설치

프로젝트 루트에서:

```bash
pnpm install
```

### 10.3 데이터베이스 마이그레이션

Prisma를 사용하여 데이터베이스 테이블을 생성합니다:

```bash
cd apps/api-server && npx prisma generate && npx prisma migrate dev
```

> 프로젝트 루트로 돌아오려면 `cd ../..`을 입력하세요.

### 10.4 개발 서버 실행

프로젝트 루트에서:

```bash
pnpm dev
```

이 명령어는 백엔드(포트 3002)와 프론트엔드(포트 5175)를 동시에 실행합니다.

### 10.5 접속

- **웹 화면**: http://localhost:5175
- **API 서버**: http://localhost:3002

---

## 11. 사용해보기

### 11.1 로그인

1. 브라우저에서 http://localhost:5175 에 접속합니다.
2. **Google 로그인** 버튼을 클릭합니다.
3. Google 계정으로 로그인합니다.

### 11.2 발표 스크립트 생성

1. PPT 또는 PDF 파일을 업로드합니다 (최대 50MB).
2. 발표 톤을 선택합니다 (예: 격식체, 캐주얼).
3. 목표 발표 시간을 설정합니다 (분 단위).
4. **생성** 버튼을 클릭합니다.
5. 처리 중 화면이 나타나며, AI가 분석을 진행합니다 (보통 1~2분).
6. 완료되면 슬라이드별 발표 스크립트와 예상 소요 시간이 표시됩니다.

### 11.3 히스토리 확인

이전에 생성한 스크립트들은 히스토리 페이지에서 다시 확인할 수 있습니다.

---

# Part 3: 부록

## 12. 자주 묻는 질문 (FAQ)

**Q: 무료로 사용할 수 있나요?**
A: 프로젝트 자체는 무료입니다. 다만 Google Gemini API 사용량에 따라 비용이 발생할 수 있습니다. 무료 티어만으로도 테스트하기에 충분합니다.

**Q: PPT 외에 다른 파일도 지원하나요?**
A: PPT(.pptx)와 PDF 파일을 지원합니다. PPT 파일은 서버에서 자동으로 PDF → 이미지로 변환됩니다.

**Q: 발표 스크립트 생성에 얼마나 걸리나요?**
A: 슬라이드 수에 따라 다르지만, 보통 10~20장 기준 1~2분 정도 소요됩니다.

**Q: 생성된 스크립트를 수정할 수 있나요?**
A: 현재는 웹 화면에서 직접 수정하는 기능은 없습니다. 결과를 복사하여 별도로 편집하세요.

**Q: Docker 없이도 실행할 수 있나요?**
A: 네, 가능합니다. 다만 PostgreSQL, LibreOffice, Poppler를 직접 설치해야 합니다. [10. 로컬 개발 환경으로 실행하기](#10-로컬-개발-환경으로-실행하기)를 참고하세요.

**Q: Google 이외의 계정으로 로그인할 수 있나요?**
A: 현재는 Google OAuth만 지원합니다.

---

## 13. 문제 해결 (Troubleshooting)

### Docker 관련

**증상**: `docker compose up` 실행 시 포트 충돌 에러

```
Error: bind: address already in use
```

**해결**: 해당 포트를 이미 사용 중인 프로세스가 있습니다.

```bash
# 어떤 프로세스가 포트를 사용 중인지 확인 (예: 3002 포트)
lsof -i :3002

# 또는 Docker 컨테이너가 남아있다면
docker compose down
```

---

**증상**: 데이터베이스 연결 실패

```
Can't reach database server at `db`:`5432`
```

**해결**: DB 컨테이너가 아직 준비되지 않았을 수 있습니다. 잠시 후 다시 시도하거나, DB 컨테이너 상태를 확인합니다:

```bash
docker compose ps
docker compose logs db
```

---

### 로컬 개발 관련

**증상**: `pnpm install` 실패

**해결**: Node.js와 pnpm 버전을 확인합니다:

```bash
node --version   # 20 이상 필요
pnpm --version   # 10 이상 필요
```

---

**증상**: PPT 파일 변환 실패 (`soffice: command not found`)

**해결**: LibreOffice가 설치되어 있지 않습니다.

```bash
# macOS
brew install --cask libreoffice

# Ubuntu
sudo apt-get install libreoffice
```

---

**증상**: PDF → 이미지 변환 실패 (`pdftoppm: command not found`)

**해결**: Poppler가 설치되어 있지 않습니다.

```bash
# macOS
brew install poppler

# Ubuntu
sudo apt-get install poppler-utils
```

---

**증상**: `GEMINI_API_KEY is not set` 에러

**해결**: `apps/api-server/.env` 파일에 `GEMINI_API_KEY`가 올바르게 설정되어 있는지 확인합니다.

---

**증상**: Google 로그인 후 에러 발생

**해결**: Google OAuth 설정을 확인합니다:

1. Google Cloud Console에서 승인된 리디렉션 URI가 `http://localhost:3002/auth/google/callback`인지 확인
2. `.env` 파일의 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 값이 올바른지 확인
3. OAuth 동의 화면에서 테스트 사용자로 본인 이메일이 추가되어 있는지 확인

---

## 14. 프로젝트 폴더 구조 설명

```
ai-worker/
│
├── apps/                          # 애플리케이션 모음
│   │
│   ├── api-server/                # 백엔드 서버 (NestJS)
│   │   ├── src/
│   │   │   ├── auth/              # 로그인/인증 관련
│   │   │   ├── image-analysis/    # 이미지 분석 기능
│   │   │   ├── presentation/      # 핵심! 발표 스크립트 생성
│   │   │   │   ├── converter.service.ts        # PPT→PDF→이미지 변환
│   │   │   │   ├── script-generator.service.ts # AI 스크립트 생성
│   │   │   │   ├── presentation.service.ts     # 전체 흐름 관리
│   │   │   │   └── presentation.controller.ts  # API 엔드포인트
│   │   │   ├── prisma/            # 데이터베이스 연결
│   │   │   ├── app.module.ts      # 앱 설정 (모든 모듈 연결)
│   │   │   └── main.ts            # 서버 시작점
│   │   ├── prisma/
│   │   │   └── schema.prisma      # 데이터베이스 테이블 정의
│   │   ├── Dockerfile             # Docker 빌드 설정
│   │   └── package.json
│   │
│   └── user-client/               # 프론트엔드 (React)
│       ├── src/
│       │   ├── features/
│       │   │   ├── auth/          # 로그인 화면/로직
│       │   │   ├── presentation/  # 발표 스크립트 관련 화면
│       │   │   ├── history/       # 히스토리 관련 화면
│       │   │   └── image-analysis/# 이미지 분석 화면
│       │   ├── components/
│       │   │   ├── Layout.tsx     # 전체 레이아웃 (인증 가드)
│       │   │   └── Navbar.tsx     # 상단 네비게이션 바
│       │   ├── App.tsx            # 라우팅 설정
│       │   └── main.tsx           # 앱 시작점
│       ├── nginx.conf             # Nginx 설정 (Docker용)
│       ├── Dockerfile             # Docker 빌드 설정
│       └── package.json
│
├── docs/                          # 문서 모음
│   ├── 01-idea/                   # 초기 아이디어
│   ├── 02-presentation-script-generator/  # v1 기획
│   ├── 03-presentation-script-generator-v2/ # v2 기획
│   ├── 04-auth-history-navigation/  # 인증/히스토리 기획
│   └── 05-image-analysis/         # 이미지 분석 기획
│
├── docker-compose.yml             # Docker 전체 실행 설정
├── pnpm-workspace.yaml            # 모노레포 워크스페이스 설정
├── package.json                   # 루트 패키지 설정
├── CLAUDE.md                      # Claude Code 가이드
├── HANDOFF.md                     # 인수인계 문서
└── README.md                      # 프로젝트 소개
```

### 핵심 파일 한눈에 보기

| 파일 | 한 줄 설명 |
|------|-----------|
| `docker-compose.yml` | `docker compose up`으로 전체 서비스를 한번에 실행하는 설정 |
| `apps/api-server/.env` | API 키, DB 연결 정보 등 비밀 설정값 (직접 생성 필요) |
| `apps/api-server/prisma/schema.prisma` | 데이터베이스 테이블 구조 정의 (User, PresentationHistory 등) |
| `apps/api-server/src/presentation/` | 발표 스크립트 생성의 핵심 로직이 있는 폴더 |
| `apps/user-client/src/App.tsx` | 프론트엔드 페이지 라우팅(경로) 설정 |
