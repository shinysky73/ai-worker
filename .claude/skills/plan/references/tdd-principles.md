# TDD Principles

## TDD 사이클

**Red**: 실패하는 테스트 작성 → 올바른 이유로 실패 확인
**Green**: 테스트를 통과시키는 최소 코드 작성
**Refactor**: 중복/복잡도 개선 → 테스트 재실행

## 핵심 원칙

### 테스트는 발견한다 (Tests Drive Design)

테스트를 미리 다 설계하지 않는다. 한 번에 하나의 테스트를 쓰고, 구현하면서 다음 테스트를 발견한다.

**Anti-pattern**: 42개 테스트를 미리 계획 → 기계적으로 구현
**TDD**: 테스트 하나 → 구현 → "다음에 뭘 테스트하지?" → 반복

### 행동을 테스트한다 (Behavior, not Implementation)

public API를 통해 관찰 가능한 결과를 테스트한다. private 메서드의 반환 타입이 아님.

```typescript
// Bad: 구현 디테일 (리팩터링에 취약)
"convertEvent가 배열을 반환한다"

// Good: 행동 (리팩터링에 강건)
"다중 파트 이벤트의 모든 파트가 processQuery를 통해 yield된다"
```

### 하나만 테스트한다 (Test One Thing)

```typescript
// Bad: 두 가지 행동
it('should create user and send email', () => {});

// Good: 각각 분리
it('should create user with valid data', () => {});
it('should send welcome email after creation', () => {});
```

## Tidy First — STRUCTURAL vs BEHAVIORAL

**STRUCTURAL** (동작 불변): 이름 변경, 파일 이동, 메서드 추출, 포맷팅
**BEHAVIORAL** (동작 변경): 새 기능, 버그 수정, 로직 변경

### 커밋 원칙

1. **분리 가능하면** → STRUCTURAL 먼저 커밋, BEHAVIORAL 따로
2. **같은 라인에 걸쳐 분리 불가하면** → 주요 변경 타입으로 커밋, 메시지에 부수 변경 명시

## 흔한 실수

1. **구현 테스트**: private 메서드 테스트 → public 인터페이스로 테스트
2. **과도한 mock**: 경계(API, DB)에서만 mock, 나머지는 실제 객체
3. **실패 테스트 방치**: fix 또는 delete, `skip`은 일시적만
