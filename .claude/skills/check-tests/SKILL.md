---
name: check-tests
description: Run and verify all tests pass. Use at any TDD phase, before commits, or when user says "check tests", "run tests", "테스트 실행".
disable-model-invocation: true
---

# Check Tests - Verify All Tests Pass

Run and verify test status according to Kent Beck's TDD practices.

## Instructions

1. **Detect test framework** from plan.md or file paths
2. **Run all tests** (not just changed ones)
3. **Analyze results** clearly
4. **Report with visual indicators**
5. **Provide recommendations**

## Test Command Detection

| Path Pattern | Framework | Command |
|--------------|-----------|---------|
| `apps/api-server/**` | Jest | `pnpm -F @milo-seah/api-server test` |
| `apps/user-client/**` | Vitest | `pnpm -F @milo-seah/user-client test` |

### Run Specific Test File:
```bash
pnpm -F @milo-seah/api-server test -- auth.service.spec.ts
pnpm -F @milo-seah/user-client test -- MessageList.test.tsx
```

## What to Check

- [ ] All tests execute without error
- [ ] All tests pass
- [ ] No compilation errors
- [ ] No linter warnings
- [ ] Coverage exists for new code

## Success Report Format

```
🧪 TEST RESULTS
================
✅ Tests Passed: 42/42
❌ Tests Failed: 0
⚠️  Warnings: None

Status: 🟢 ALL PASSING
Next: Ready to proceed with /refactor or /commit-tdd
```

## Failure Report Format

```
🧪 TEST RESULTS
================
✅ Tests Passed: 40/42
❌ Tests Failed: 2
⚠️  Warnings: 1

Status: 🔴 FAILING

Failed Tests:
1. AuthService > login > shouldRejectInvalidPassword
   Expected: UnauthorizedException
   Received: undefined

2. UserService > create > shouldHashPassword
   Expected: hashed string
   Received: plain text

Recommendations:
- Check AuthService.login() error handling
- Verify bcrypt is called in UserService.create()
```

## When to Check Tests

| TDD Phase | Purpose |
|-----------|---------|
| After RED | Verify test fails correctly |
| After GREEN | Verify all tests pass |
| After REFACTOR | Verify no regression |
| Before COMMIT | Final verification |

## Core Principles

- Run ALL tests, not just the new one
- Zero failures required to proceed
- Zero warnings is the standard
- Fast feedback is essential

## What NOT to Do

- Don't skip "slow" tests
- Don't ignore warnings
- Don't proceed with failures
- Don't run only the new test
