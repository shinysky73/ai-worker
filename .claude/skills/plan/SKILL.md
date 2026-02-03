---
name: plan
description: Create a TDD implementation plan from PRD or feature request. Use after /prd or when ready to implement a feature. Triggers on "plan 작성", "TDD 계획", "구현 계획", or when user wants to start implementing a documented feature.
---

# Plan - TDD Implementation Plan

Generate a test-driven implementation plan organized by sections (Backend, Frontend Logic, UI/UX) and phases.

## Workflow

### 1. Understand Requirements

Read the PRD or gather requirements:
- Check `docs/{feature-name}/prd.md` for existing PRD
- Or ask user for feature requirements
- Identify all acceptance criteria
- Note UI/UX requirements separately

### 2. Analyze Codebase

Explore the codebase to understand:
- Existing test patterns and conventions
- Related modules and their structure
- Test file locations and naming
- Test framework (Jest for backend, Vitest for frontend)
- Existing UI components and styling patterns

### 3. Design Test Plan

Break down requirements into sections:

| Section | Phases | Method |
|---------|--------|--------|
| Backend (TDD) | API core, validation, error handling | `/go`, `/go-phase` |
| Frontend Logic (TDD) | Hooks, services, state management | `/go`, `/go-phase` |
| UI/UX (Non-TDD) | Components, styling, polish | Direct implementation |
| E2E (Optional) | Integration testing | `/go`, `/go-phase` |

### 4. Generate plan.md

Use the template in [assets/plan-template.md](assets/plan-template.md).

Write the plan to: `docs/{feature-name}/plan.md`

## Plan Structure

```markdown
# Setup
  Phase 0: Test Setup

# Backend (TDD)
  Phase 1: API Core Functionality
  Phase 2: API Validation/Edge Cases
  Phase 3: API Error Handling

# Frontend Logic (TDD)
  Phase 4: Hooks/Services
  Phase 5: State Management (Optional)

# UI/UX (Non-TDD)
  Phase 6: Component Implementation
  Phase 7: Styling & Polish

# E2E (Optional)
  Phase 8: Integration Testing
```

## Phase Format Rules

### TDD Phases (Backend, Frontend Logic)
```markdown
## Phase N: {Phase Name}

**Test File**: {full path to test file}
**Impl File**: {full path to implementation file}
**Command**: `{test command for this file}`

### Tests:
- [ ] shouldDoX: {description}
- [ ] shouldDoY: {description}
```

### UI/UX Phases (Non-TDD)
```markdown
## Phase N: {Phase Name}

**Files**:
- {component file paths}

### Tasks:
- [ ] {Component} 컴포넌트 구현
- [ ] 반응형 레이아웃 적용
- [ ] 다크모드 지원
```

## Test Naming

- Use `should` prefix: `shouldValidateEmail`, `shouldRejectEmpty`
- Describe behavior, not implementation
- One behavior per test

## Test Command Detection

| Path Pattern | Command |
|--------------|---------|
| `apps/api-server/**` | `pnpm -F @milo-seah/api-server test -- {file}` |
| `apps/user-client/**` | `pnpm -F @milo-seah/user-client test -- {file}` |

## UI/UX Common Tasks

Include relevant items from this checklist:
- [ ] 컴포넌트 기본 구현
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱)
- [ ] 다크모드 지원
- [ ] 로딩 상태 UI (스켈레톤, 스피너)
- [ ] 에러 상태 UI
- [ ] 빈 상태 UI
- [ ] 폼 유효성 검사 피드백
- [ ] 애니메이션/트랜지션
- [ ] 접근성 (키보드, 스크린리더)

## Plan Quality Checklist

- [ ] TDD phases have Test File, Impl File, Command
- [ ] UI/UX phases have Files and Tasks
- [ ] Tests are ordered by dependency
- [ ] Test names describe behavior clearly
- [ ] One test = one behavior
- [ ] Edge cases are included
- [ ] Error cases are covered
- [ ] UI/UX tasks cover all states (loading, error, empty)

## References

- [TDD Principles](references/tdd-principles.md) - Kent Beck's TDD guidelines

## Output

After completion:
1. Plan saved to `docs/{feature-name}/plan.md`
2. Ready to run `/go` or `/go-phase` for TDD phases
3. UI/UX phases: implement directly without TDD cycle
