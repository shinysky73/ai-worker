# PRD Writing Guide

## AC(Acceptance Criteria) 작성 원칙

### 구체적으로 — 모호하면 테스트 불가

**Bad**: "시스템이 빨라야 한다"
**Good**: "API 응답 시간이 95th percentile 기준 200ms 이내"

**Bad**: "사용자가 파일을 업로드할 수 있다"
**Good**: "JPEG, PNG 파일을 5MB까지 업로드할 수 있다"

### 행동 중심 — 구현이 아니라 결과

**Bad**: "Redis로 캐싱한다"
**Good**: "자주 접근하는 데이터가 50ms 이내에 로드된다"

### 테스트 가능 — "QA가 어떻게 검증하는가?"

**Bad**: "UI가 직관적이어야 한다"
**Good**: "체크아웃을 3번 이내의 클릭으로 완료할 수 있다"

## Edge Cases 작성법

Edge Case는 **상황: 기대 동작** 형식으로 쓴다.

```
- executionId가 누락된 이벤트: toolName 기반 폴백 매칭
- parts가 빈 배열: 빈 배열 반환
- 네트워크 오류로 usage 이벤트 미수신: 타임아웃 후 캐시 무효화
```

## 흔한 실수

1. **모호한 AC**: 테스트할 수 없는 요구사항
2. **구현 지시**: "Redis를 써라" 대신 "50ms 이내 응답"
3. **Edge Case 누락**: Happy path만 고려
4. **범위 누락**: Out of Scope 미정의로 scope creep
