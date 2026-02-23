---
name: plan
description: Create a lightweight TDD implementation plan from PRD or feature request. Use after /prd or when ready to implement a feature. Triggers on "plan 작성", "TDD 계획", "구현 계획", or when user wants to start implementing a documented feature.
---

# Plan - Lightweight TDD Implementation Plan

Phase 단위 방향과 위험 요소만 정의한다. 구체적인 테스트는 `/go-phase` 실행 시 코드를 보면서 발견한다.

## 핵심 원칙

**Plan이 담아야 할 것**: Phase 순서, 행동 목표, 영향 범위, 위험 요소
**Plan이 담지 말아야 할 것**: 테스트 이름, 라인 번호, 구현 방향, 정확한 테스트 수

테스트 설계는 `/go-phase` 때 코드를 읽고 PRD AC를 보면서 한다 (Kent Beck TDD).

## Workflow

### 1. PRD 확인

- `docs/{NN}-{feature-name}/prd.md` 읽기
- Acceptance Criteria와 Edge Cases 파악
- UI/UX 요구사항 분리

### 2. 코드베이스 탐색

- 영향받는 파일과 모듈 파악
- 기존 테스트 패턴 확인
- 변경의 영향 범위(blast radius) 평가

### 3. Phase 설계

관련된 FR/AC를 논리적 단위로 묶어 Phase를 구성한다.

| Section | Method |
|---------|--------|
| Backend (TDD) | `/go-phase` |
| Frontend Logic (TDD) | `/go-phase` |
| UI/UX (Non-TDD) | Direct implementation |

**Phase 묶기 기준**:
- 같은 파일/모듈을 수정하는 FR은 하나의 Phase로
- 의존성이 있으면 순서 지정
- 불확실한 것(미확인 API 등)은 Spike Phase로 분리

### 4. plan.md 생성

`docs/{NN}-{feature-name}/plan.md`에 저장한다. (PRD와 동일한 번호 디렉토리 사용)
템플릿: [assets/plan-template.md](assets/plan-template.md)

## Phase Format

### TDD Phase
```markdown
## Phase N: {Phase Name} (FR-X, FR-Y)

**Scope**: {영향받는 파일/모듈}
**행동 목표**: {이 Phase가 끝나면 시스템이 어떻게 달라지는지}
**PRD AC**: FR-X의 AC 1, 2, 3 / FR-Y의 AC 1
**Edge Cases**: {PRD에서 해당하는 edge cases}

### ⚠ 위험 요소
- {기존 테스트 깨짐, 타입 변경 영향 등 — 없으면 섹션 생략}

### Tests:
_(비워둠 — `/go-phase` 실행 시 발견하면서 추가)_
```

### Spike Phase (불확실한 것)
```markdown
## Phase N: Spike — {조사 대상}

**목적**: {무엇을 확인하는지}
**질문**: {답해야 할 질문들}
**결과에 따른 분기**: A이면 → Phase X 진행, B이면 → 대안 접근
```

### UI/UX Phase (Non-TDD)
```markdown
## Phase N: {UI 기능}

**Scope**: `{컴포넌트 파일}`

### Tasks:
- [ ] {구체적 UI 작업}
```

## Plan Quality Checklist

- [ ] 모든 PRD FR이 최소 하나의 Phase에 매핑됨
- [ ] Phase 간 의존성이 순서에 반영됨
- [ ] 기존 코드 깨짐 위험이 명시됨
- [ ] 불확실한 부분이 Spike Phase로 분리됨
- [ ] Tests 섹션이 비어있음 (테스트는 /go-phase에서 발견)

## References

- [TDD Principles](references/tdd-principles.md) - Kent Beck's TDD guidelines

## Output

1. Plan saved to `docs/{NN}-{feature-name}/plan.md`
2. Ready to run `/go-phase` — 코드를 읽고 테스트를 발견하면서 구현
3. UI/UX phases: 직접 구현 (TDD 없음)
