---
name: go
description: Execute full TDD cycle - Red, Green, Refactor for the next test in plan.md. Use to start or continue TDD workflow, or when user says "go", "다음 테스트", "TDD 실행", "next test".
disable-model-invocation: true
---

# TDD Go - Execute Full Cycle

Execute the complete Kent Beck TDD cycle: Red → Green → Refactor.

## Plan File Location

Find plan at: `docs/{feature-name}/plan.md`

| Usage | Location |
|-------|----------|
| `/go user-auth` | `docs/user-auth/plan.md` |
| `/go chat-history` | `docs/chat-history/plan.md` |
| `/go` (no arg) | Ask user which feature, or find most recent `docs/*/plan.md` |

## Instructions

1. **Read plan.md** from `docs/{feature-name}/plan.md`
2. **Execute TDD Cycle** (details below)
3. **Run all tests** to verify
4. **Mark test complete** in plan.md
5. **Ask user**: Continue to next test?

---

## Phase 1: RED - Write Failing Test

**Goal**: Write the simplest test that fails for the right reason.

### Steps:
1. Find next test (`[ ]`) or resume in-progress (`[🔴]`)
2. Update marker to `[🔴]`
3. Write test with descriptive name (`shouldDoSomething`)
4. Run test - must FAIL
5. Verify failure reason is correct

### Principles:
- ONE assertion per test
- Test name describes behavior
- No implementation yet

### Failure Recovery:
| Problem | Solution |
|---------|----------|
| Compile error | Fix imports, types |
| Test passes | Feature already exists, write more specific test |
| Wrong failure | Check test logic, mock setup |

---

## Phase 2: GREEN - Make Test Pass

**Goal**: Write minimum code to make the test pass.

### Steps:
1. Update marker to `[🟢]`
2. Write MINIMUM code to pass
3. Run ALL tests (not just new one)
4. All must pass

### Principles:
- Minimum code only - no extras
- Hard-coding is OK
- Duplication is OK (for now)
- Don't optimize yet

### Examples of Minimum Code:
```typescript
// Test expects 5? Return 5.
function getValue() { return 5; }

// Test expects 2+3? Return 2+3.
function add() { return 2 + 3; }
```

### Failure Recovery:
| Problem | Solution |
|---------|----------|
| New test fails | Adjust implementation |
| Other tests broke | STOP, review changes, fix without breaking new test |

---

## Phase 3: REFACTOR - Improve Structure

**Goal**: Clean up code while keeping all tests green.

### Steps:
1. Update marker to `[🔄]`
2. Check if refactoring needed (see checklist)
3. Make ONE change at a time
4. Run tests after EACH change
5. If test fails → revert immediately

### Refactor Checklist:
- [ ] Duplication (3+ times)? → Extract
- [ ] Function > 10 lines? → Split
- [ ] Unclear names? → Rename
- [ ] Deep nesting? → Simplify

**All "No"? → Skip refactor, mark `[x]`**

### Common Refactorings:
| Pattern | When |
|---------|------|
| Extract Method | Complex logic |
| Rename | Unclear intent |
| Remove Duplication | Same code 3+ places |
| Simplify Conditional | Deep nesting |

### Tidy First Principle:
- Structural changes (rename, extract, move) → Commit separately
- Behavioral changes (new logic) → Commit separately
- NEVER mix in same commit

---

## Checkpoint System

| Marker | Stage | Meaning |
|--------|-------|---------|
| `[ ]` | Pending | Not started |
| `[🔴]` | RED | Writing failing test |
| `[🟢]` | GREEN | Implementing code |
| `[🔄]` | REFACTOR | Improving structure |
| `[x]` | Done | Completed |

## Resume from Interruption

| Found Marker | Resume From |
|--------------|-------------|
| `[🔴]` | GREEN phase |
| `[🟢]` | REFACTOR phase |
| `[🔄]` | Complete refactor → commit |

## Test Command Detection

| Path Pattern | Command |
|--------------|---------|
| `apps/api-server/**` | `pnpm -F @milo-seah/api-server test` |
| `apps/user-client/**` | `pnpm -F @milo-seah/user-client test` |

Specific file: `pnpm -F @milo-seah/api-server test -- {filename}`

## Success Criteria

- [ ] Test written and failing (RED)
- [ ] Minimum code passes test (GREEN)
- [ ] Structure improved if needed (REFACTOR)
- [ ] ALL tests passing
- [ ] Marker updated to `[x]`

## What NOT to Do

- Don't skip RED phase
- Don't write multiple tests at once
- Don't mix structural/behavioral changes
- Don't proceed with failing tests
- Don't optimize prematurely
