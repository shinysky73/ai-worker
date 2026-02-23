---
name: go-phase
description: Execute all tests in a phase sequentially. Use when user says "phase 실행", "go-phase", "전체 테스트 실행", "phase 전체", or wants to run multiple tests at once.
disable-model-invocation: true
---

# TDD Go Phase - Execute All Tests in a Phase

Execute the complete TDD cycle (Red → Green → Refactor) for ALL tests in a specified phase.

## Plan File Location

Find plan at: `docs/{feature-name}/plan.md`

| Usage | Location |
|-------|----------|
| `/go-phase user-auth 1` | `docs/user-auth/plan.md` Phase 1 |
| `/go-phase chat-history` | `docs/chat-history/plan.md` first incomplete phase |
| `/go-phase` (no arg) | Ask user which feature |

## Instructions

1. **Read plan.md** from `docs/{feature-name}/plan.md`
2. **Identify target phase**
3. **For each pending test** in order:
   - Execute full TDD cycle (Red → Green → Refactor)
   - Mark `[x]` when complete
   - Continue to next test automatically
4. **Report summary** when phase complete

---

## Phase Selection

| User Input | Action |
|------------|--------|
| `/go-phase user-auth 1` | Execute Phase 1 of user-auth |
| `/go-phase user-auth` | Execute first incomplete phase of user-auth |
| `/go-phase` | Ask which feature to work on |

---

## Execution Loop

For each test with `[ ]`, `[🔴]`, `[🟢]`, or `[🔄]` marker:

### 1. RED Phase
- Update marker to `[🔴]`
- Write failing test
- Verify test fails for correct reason

### 2. GREEN Phase
- Update marker to `[🟢]`
- Write minimum code to pass
- Run ALL tests - must pass

### 3. REFACTOR Phase
- Update marker to `[🔄]`
- Apply refactoring if needed (duplication, naming, complexity)
- Run tests after each change
- Mark `[x]` when complete

### 4. Continue
- Move to next test automatically
- No user confirmation between tests

---

## Stop Conditions

Stop execution and report to user when:

| Condition | Action |
|-----------|--------|
| All tests in phase complete | Report success summary |
| Test fails unexpectedly | Stop, report issue, wait for guidance |
| Implementation unclear | Stop, ask for clarification |
| Breaking other tests | Stop, report regression |

---

## Progress Reporting

During execution, show brief progress:
```
[1/5] ✓ shouldCreateUser
[2/5] ✓ shouldValidateEmail
[3/5] 🔴 shouldHashPassword (RED)
```

---

## Final Summary

When phase complete, report:

```markdown
## Phase X Complete

| Status | Count |
|--------|-------|
| ✓ Completed | 5 |
| ⏭ Skipped | 0 |
| ✗ Failed | 0 |

### Tests Completed:
1. shouldCreateUser
2. shouldValidateEmail
3. shouldHashPassword
4. shouldGenerateToken
5. shouldReturnUserDto

All tests passing. Ready for /commit-tdd or next phase.
```

---

## Test Command Detection

| Path Pattern | Command |
|--------------|---------|
| `apps/api-server/**` | `pnpm -F @milo-seah/api-server test` |
| `apps/user-client/**` | `pnpm -F @milo-seah/user-client test` |

Specific file: `pnpm -F @milo-seah/api-server test -- {filename}`

---

## What NOT to Do

- Don't skip RED phase for any test
- Don't proceed if any test is failing
- Don't mix structural/behavioral changes in same commit
- Don't continue if implementation is unclear
- Don't ignore regressions in existing tests
