# TDD Plan: {Feature Name}

**PRD**: `docs/{feature-name}/prd.md`
**Created**: {Date}
**Status**: Planning | In Progress | Completed

---

## Phase 0: Test Setup

**Test File**: {path to test file}
**Impl File**: {path to implementation file}
**Command**: `{test command}`

### Setup Tasks:
- [ ] Create test file with describe block
- [ ] Set up test module/mocks
- [ ] Verify test runs (empty)

---

# Backend (TDD)

## Phase 1: {API Core Functionality}

**Test File**: `apps/api-server/src/{feature}/{feature}.service.spec.ts`
**Impl File**: `apps/api-server/src/{feature}/{feature}.service.ts`
**Command**: `pnpm -F @milo-seah/api-server test -- {feature}.service.spec.ts`

### Tests:
- [ ] should{Behavior1}: {description}
- [ ] should{Behavior2}: {description}
- [ ] should{Behavior3}: {description}

---

## Phase 2: {API Validation/Edge Cases}

**Test File**: `apps/api-server/src/{feature}/{feature}.service.spec.ts`
**Impl File**: `apps/api-server/src/{feature}/{feature}.service.ts`
**Command**: `pnpm -F @milo-seah/api-server test -- {feature}.service.spec.ts`

### Tests:
- [ ] shouldReject{InvalidCase1}: {description}
- [ ] shouldReject{InvalidCase2}: {description}
- [ ] shouldHandle{EdgeCase}: {description}

---

## Phase 3: {API Error Handling}

**Test File**: `apps/api-server/src/{feature}/{feature}.service.spec.ts`
**Impl File**: `apps/api-server/src/{feature}/{feature}.service.ts`
**Command**: `pnpm -F @milo-seah/api-server test -- {feature}.service.spec.ts`

### Tests:
- [ ] shouldThrow{Error1}When{Condition}: {description}
- [ ] shouldReturn{Fallback}When{Condition}: {description}

---

# Frontend Logic (TDD)

## Phase 4: {Hooks/Services}

**Test File**: `apps/user-client/src/features/{feature}/hooks/{hook}.test.ts`
**Impl File**: `apps/user-client/src/features/{feature}/hooks/{hook}.ts`
**Command**: `pnpm -F @milo-seah/user-client test -- {hook}.test.ts`

### Tests:
- [ ] should{CallAPI}: {description}
- [ ] should{HandleLoadingState}: {description}
- [ ] should{HandleError}: {description}

---

## Phase 5: {State Management} (Optional)

**Test File**: `apps/user-client/src/features/{feature}/stores/{store}.test.ts`
**Impl File**: `apps/user-client/src/features/{feature}/stores/{store}.ts`
**Command**: `pnpm -F @milo-seah/user-client test -- {store}.test.ts`

### Tests:
- [ ] should{InitialState}: {description}
- [ ] should{UpdateState}: {description}

---

# UI/UX (Non-TDD)

## Phase 6: {Component Implementation}

**Files**:
- `apps/user-client/src/features/{feature}/components/{Component}.tsx`
- `apps/user-client/src/features/{feature}/pages/{Page}.tsx`

### Tasks:
- [ ] {Component1} 컴포넌트 구현
- [ ] {Component2} 컴포넌트 구현
- [ ] 페이지 레이아웃 구성

---

## Phase 7: {Styling & Polish}

**Files**:
- Component files with Tailwind classes

### Tasks:
- [ ] 반응형 레이아웃 (모바일/데스크톱)
- [ ] 다크모드 지원
- [ ] 로딩 상태 UI
- [ ] 에러 상태 UI
- [ ] 빈 상태 UI
- [ ] 애니메이션/트랜지션

---

## Phase 8: {Integration Testing} (Optional)

**Test File**: `apps/api-server/test/{feature}.e2e-spec.ts`
**Command**: `pnpm -F @milo-seah/api-server test:e2e`

### Tests:
- [ ] should{E2EScenario1}: {description}
- [ ] should{E2EScenario2}: {description}

---

## Progress Summary

| Section | Phase | Total | Done | Status |
|---------|-------|-------|------|--------|
| Setup | 0 | 3 | 0 | Pending |
| Backend (TDD) | 1-3 | 8 | 0 | Pending |
| Frontend Logic (TDD) | 4-5 | 5 | 0 | Pending |
| UI/UX | 6-7 | 8 | 0 | Pending |
| E2E | 8 | 2 | 0 | Pending |
| **Total** | - | **26** | **0** | **0%** |

---

## Notes

- Backend/Frontend Logic phases: Use `/go` or `/go-phase`
- UI/UX phases: Implement directly (no TDD cycle)
- {Any important notes about the implementation}
- {Dependencies or blockers}
- {Decisions made during planning}
