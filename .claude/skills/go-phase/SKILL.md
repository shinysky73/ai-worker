---
name: go-phase
description: Execute TDD cycle for a phase. Discovers tests from PRD AC + code, then runs Red → Green → Refactor. Use when user says "go", "go-phase", "phase 실행", "다음 테스트", "TDD 실행".
disable-model-invocation: true
---

# Go Phase - TDD 실행

Plan의 Phase를 읽고, PRD AC와 코드를 보면서 테스트를 **발견**하고 실행한다.

## 핵심 원칙

**테스트는 미리 설계하지 않는다.** PRD AC + 현재 코드를 보면서 하나씩 발견한다 (Kent Beck TDD).

## Plan / PRD 위치

| 사용법 | Plan | PRD |
|--------|------|-----|
| `/go-phase feature 1` | `docs/feature/plan.md` Phase 1 | `docs/feature/prd.md` |
| `/go-phase feature` | 첫 미완료 Phase | 동일 |
| `/go-phase` | 사용자에게 질문 | 동일 |

## 실행 흐름

### 1. Phase 파악

- `plan.md`에서 대상 Phase 읽기
- 행동 목표, PRD AC, Edge Cases, 위험 요소 확인

### 2. 테스트 발견

- PRD의 **Acceptance Criteria**와 **Edge Cases** 확인
- **실제 코드**를 읽고 현재 동작 파악
- AC 하나당 테스트 하나(또는 그 이상)를 **그 자리에서** 설계

### 3. TDD 사이클 (테스트마다 반복)

**RED**: 실패하는 테스트 작성 → 실행 → 올바른 이유로 실패 확인
**GREEN**: 테스트를 통과시키는 최소 코드 작성 → 전체 테스트 실행
**REFACTOR**: 중복/복잡도 개선 필요 시 구조 변경 → 테스트 재실행

다음 테스트로 자동 진행. 사용자 확인 불필요.

### 4. 기존 테스트 영향 처리

Plan의 ⚠ 위험 요소에 기존 테스트 깨짐이 명시되어 있으면:
- 깨진 테스트를 새 동작에 맞게 업데이트
- 업데이트 후 전체 테스트 통과 확인

### 5. 진행 기록

테스트를 **발견하면** `plan.md`의 해당 Phase에 추가하고, 완료하면 `[x]`로 체크한다.

```markdown
### Tests:
- [x] shouldReturnArrayFromConvertEvent: 배열 반환 확인
- [x] shouldProcessMultiplePartsInOneEvent: 다중 파트 처리
- [ ] shouldReturnEmptyArrayForNullContent: null content 처리
```

이렇게 하면:
- Plan 작성 시에는 테스트 이름이 없음 (미리 설계 안 함)
- `/go-phase` 실행 중에 발견하면서 기록
- 중단 후 재개 시 `[ ]`를 보고 이어서 진행
- Phase 내 모든 테스트가 `[x]`이면 Phase 완료

### 6. 재개 (Resume)

중단 후 다시 `/go-phase`를 실행하면:
1. `plan.md`에서 `[ ]`가 남은 첫 Phase를 찾는다
2. 해당 Phase의 `[ ]` 테스트부터 이어서 진행
3. `[ ]`가 없으면 PRD AC를 다시 확인하여 누락된 테스트가 있는지 검토

## 중단 조건

| 상황 | 행동 |
|------|------|
| 전체 완료 | 결과 보고 |
| 예상 외 테스트 실패 | 중단, 원인 보고 |
| 구현 방향 불명확 | 중단, 사용자에게 질문 |
| 기존 테스트 회귀 | 중단, 회귀 보고 |

## 테스트 커맨드

| 경로 | 커맨드 |
|------|--------|
| `apps/api-server/**` | `pnpm -F @milo-seah/api-server test -- {파일}` |
| `apps/user-client/**` | `pnpm -F @milo-seah/user-client test -- {파일}` |

## 하지 말 것

- RED 단계를 건너뛰지 않는다
- 실패 중인 테스트가 있으면 다음으로 넘어가지 않는다
- 테스트를 미리 전부 작성하지 않는다 — 하나씩 발견
