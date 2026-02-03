# PRD: 프레젠테이션 발표 스크립트 생성기

**Author**: AI Worker Team
**Created**: 2026-02-02
**Status**: Draft

---

## 1. Problem Statement

### Background
발표 준비 시 슬라이드 제작 후 발표 스크립트 작성에 많은 시간이 소요된다. 특히 시각적 자료(차트, 다이어그램)를 말로 풀어서 설명하는 것이 어렵다.

### Problem
- 슬라이드별 발표 스크립트 작성에 시간이 많이 걸림
- 시각적 요소를 청중에게 효과적으로 전달하는 멘트 구성이 어려움
- 전체 발표 시간 예측이 어려워 시간 배분 실패

### Impact
발표 준비 시간 증가, 발표 품질 저하, 시간 초과/부족으로 인한 발표 실패

---

## 2. Goals & Success Metrics

### Primary Goal
PPT 파일 업로드만으로 슬라이드별 발표 스크립트와 예상 발표 시간을 자동 생성한다.

### Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| 스크립트 작성 시간 | 슬라이드당 5-10분 | 전체 1분 이내 |
| 사용자 만족도 | - | 4.0/5.0 이상 |
| 스크립트 수정 비율 | - | 30% 이하 |

---

## 3. User Stories

### Must Have (P0)
- [ ] 사용자로서, PPT/PPTX 파일을 업로드하면 각 슬라이드별 발표 스크립트를 받고 싶다
- [ ] 사용자로서, 전체 발표 예상 시간을 알고 싶다
- [ ] 사용자로서, 생성된 스크립트를 복사하거나 다운로드하고 싶다

### Should Have (P1)
- [ ] 사용자로서, 발표 톤(격식체/비격식체)을 선택하고 싶다
- [ ] 사용자로서, 목표 발표 시간을 설정하면 스크립트 길이를 조절받고 싶다
- [ ] 사용자로서, 이미지 파일(PNG/JPG)도 직접 업로드하고 싶다

### Could Have (P2)
- [ ] 사용자로서, Google Slides URL을 입력해서 스크립트를 생성하고 싶다
- [ ] 사용자로서, 생성된 스크립트를 PPT 발표자 노트에 자동 삽입하고 싶다

---

## 4. Functional Requirements

### FR-1: PPT 파일 업로드
**Description**: 사용자가 PPT/PPTX 파일을 업로드한다.

**Acceptance Criteria**:
- [ ] PPT, PPTX 파일 형식 지원
- [ ] 최대 파일 크기: 50MB
- [ ] 최대 슬라이드 수: 50장
- [ ] 업로드 진행률 표시

**Edge Cases**:
- 손상된 파일: "파일을 읽을 수 없습니다" 에러 메시지
- 빈 슬라이드만 있는 경우: "내용이 있는 슬라이드가 없습니다" 안내

### FR-2: PPT → 이미지 변환
**Description**: 서버에서 업로드된 PPT를 슬라이드별 이미지로 변환한다.

**Acceptance Criteria**:
- [ ] LibreOffice headless를 사용하여 PPT → PDF → PNG 변환
- [ ] 각 슬라이드를 개별 PNG 파일로 생성
- [ ] 이미지 해상도: 1920x1080 (Full HD)
- [ ] 변환 실패 시 재시도 (최대 3회)

**Edge Cases**:
- 특수 폰트 미지원: 기본 폰트로 대체
- 애니메이션/전환효과: 최종 상태만 캡처

### FR-3: Vision AI 분석 및 스크립트 생성
**Description**: 각 슬라이드 이미지를 Vision AI로 분석하여 발표 스크립트를 생성한다.

**Acceptance Criteria**:
- [ ] Gemini Vision API 사용
- [ ] 슬라이드의 텍스트, 차트, 다이어그램, 이미지 내용 분석
- [ ] 슬라이드 맥락을 고려한 자연스러운 발표 스크립트 생성
- [ ] 슬라이드당 예상 발표 시간 계산 (분당 150단어 기준)

**Edge Cases**:
- 텍스트만 있는 슬라이드: 핵심 포인트 강조하는 스크립트
- 이미지/차트만 있는 슬라이드: 시각 자료 설명 스크립트

### FR-4: 결과 출력
**Description**: 생성된 스크립트와 발표 시간을 사용자에게 제공한다.

**Acceptance Criteria**:
- [ ] 슬라이드 썸네일 + 스크립트 나란히 표시
- [ ] 전체 발표 예상 시간 표시
- [ ] 슬라이드별 예상 시간 표시
- [ ] 마크다운/텍스트 파일 다운로드
- [ ] 클립보드 복사 기능

---

## 5. Non-Functional Requirements

### Performance
- PPT 변환: 슬라이드당 2초 이내
- 스크립트 생성: 슬라이드당 5초 이내
- 전체 처리: 20장 슬라이드 기준 2분 이내

### Security
- 업로드된 파일은 처리 후 24시간 내 자동 삭제
- 파일 저장 시 UUID로 익명화

### Reliability
- API 실패 시 자동 재시도 (exponential backoff)
- 부분 실패 시 성공한 슬라이드 결과는 반환

---

## 6. Technical Considerations

### Architecture
```
[Client] → [API Server] → [File Storage]
                ↓
         [PPT Converter]  (LibreOffice headless)
                ↓
         [Gemini Vision API]
                ↓
         [Script Generator]
```

### Dependencies
- LibreOffice headless (PPT → PDF 변환)
- pdf2image / pdftoppm (PDF → PNG 변환)
- @google/generative-ai (Gemini Vision API)
- multer (파일 업로드)

### API Design
```
POST /api/presentations/upload
  - multipart/form-data
  - file: PPT/PPTX 파일
  - options: { tone: 'formal' | 'casual', targetMinutes?: number }

GET /api/presentations/:id/status
  - 변환 진행 상태 조회

GET /api/presentations/:id/result
  - 생성된 스크립트 결과 조회
```

---

## 7. Out of Scope

- Google Slides URL 직접 입력 (Phase 3)
- PPT 발표자 노트 자동 삽입 (Phase 3)
- 실시간 발표 연습 기능
- 다국어 지원 (한국어만 지원)
- 음성 합성 (TTS)

---

## 8. Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| LibreOffice Docker 이미지 선정 | Dev | - | - |
| Gemini API 비용 최적화 방안 | Dev | - | - |
| 파일 저장소 선택 (로컬 vs S3) | Dev | - | - |

---

## Appendix

### User Flow
```
1. 메인 페이지 접속
2. PPT 파일 드래그앤드롭 또는 선택
3. (선택) 발표 톤, 목표 시간 설정
4. "스크립트 생성" 버튼 클릭
5. 로딩 화면 (진행률 표시)
6. 결과 화면: 슬라이드별 스크립트 + 예상 시간
7. 다운로드 또는 복사
```

### Wireframe
```
┌─────────────────────────────────────────────┐
│  🎤 발표 스크립트 생성기                      │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │     PPT 파일을 여기에 드래그하세요     │    │
│  │          또는 클릭하여 선택           │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  발표 톤: ○ 격식체  ● 비격식체               │
│  목표 시간: [    ] 분 (선택)                 │
│                                             │
│           [ 스크립트 생성하기 ]              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📊 결과 - 총 예상 시간: 15분 30초            │
├─────────────────────────────────────────────┤
│  ┌────────┐  슬라이드 1 (1분 20초)          │
│  │ thumb  │  ───────────────────────────    │
│  │   1    │  안녕하세요, 오늘 발표를        │
│  └────────┘  시작하겠습니다. 이 슬라이드는...│
│              [복사]                          │
├─────────────────────────────────────────────┤
│  ┌────────┐  슬라이드 2 (2분 10초)          │
│  │ thumb  │  ───────────────────────────    │
│  │   2    │  이 차트를 보시면...            │
│  └────────┘                                 │
│              [복사]                          │
├─────────────────────────────────────────────┤
│         [ 전체 다운로드 (.md) ]              │
└─────────────────────────────────────────────┘
```
