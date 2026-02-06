---
name: check-tests
description: Run and verify all tests pass. Use at any TDD phase, before commits, or when user says "check tests", "run tests", "테스트 실행", "테스트 확인".
disable-model-invocation: true
---

# Check Tests

전체 테스트를 실행하고 결과를 보고한다.

## Instructions

1. **테스트 실행** — 백엔드/프론트엔드 모두 (또는 사용자가 지정한 범위)
2. **결과 보고** — 통과/실패 수, 실패 시 원인
3. **다음 단계 안내** — 통과 시 `/commit-tdd`, 실패 시 수정 방향

## 테스트 커맨드

| 경로 | 커맨드 |
|------|--------|
| `apps/api-server/**` | `pnpm -F @milo-seah/api-server test` |
| `apps/user-client/**` | `pnpm -F @milo-seah/user-client test` |
| 특정 파일 | `pnpm -F {패키지} test -- {파일명}` |

## 보고 형식

통과 시: `N tests passed. Ready for /commit-tdd.`

실패 시:
```
N passed, M failed.

Failed:
1. {테스트명} — {실패 원인 요약}
2. {테스트명} — {실패 원인 요약}

수정 방향: {간단한 제안}
```

## 원칙

- 변경된 파일뿐 아니라 **전체** 테스트를 실행한다
- 실패가 있으면 다음 단계로 넘어가지 않는다
- Pre-existing failure(우리 작업과 무관한 실패)는 구분하여 명시한다
