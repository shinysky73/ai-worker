---
name: commit-tdd
description: TDD disciplined commit - Commit with proper type indicator after tests pass. Use after completing TDD cycle, or when user says "commit", "커밋".
disable-model-invocation: true
---

# TDD Commit - Disciplined Commit Practice

Commit following Kent Beck's TDD discipline.

## Prerequisites - ONLY Commit When:

- [ ] ALL tests are passing
- [ ] ALL compiler/linter warnings resolved
- [ ] Change represents a single logical unit
- [ ] Clear whether STRUCTURAL or BEHAVIORAL

## Instructions

1. **Run all tests** one final time
2. **Verify no warnings** from compiler/linter
3. **Determine commit type** (see detection rules)
4. **Stage specific files** (avoid `git add .`)
5. **Write commit message** with type prefix
6. **Commit** the changes

## Change Type Detection

### BEHAVIORAL (adds/changes functionality):
- New test file or new `it()`/`test()` blocks
- New functions/methods with logic
- Changed algorithm or business logic
- Bug fixes

### STRUCTURAL (no behavior change):
- File/function/variable renamed
- Code moved between files
- Method extracted
- Formatting changes
- Import reorganization

## Commit Message Format

### BEHAVIORAL:
```
[BEHAVIORAL] feat: Add email validation

- Implemented validateEmail() function
- Added tests for valid and invalid formats
- Rejects emails without @ symbol

Test: auth.service.spec.ts
```

### STRUCTURAL:
```
[STRUCTURAL] refactor: Extract validation helpers

- Moved validateEmail to validation.utils.ts
- Renamed 'data' to 'userInput' for clarity
- Reorganized imports

No behavior change.
```

## Mixed Changes Warning

If both structural AND behavioral changes detected:
1. **STOP** - don't commit
2. Suggest separating changes
3. Commit structural first, then behavioral

## Success Criteria

- [ ] All tests passing
- [ ] No warnings
- [ ] Single logical change
- [ ] Correct type prefix
- [ ] Clear commit message

## When to Commit

- After completing RED → GREEN → REFACTOR
- After tidying code (structural)
- After each small working increment
- Before starting a new test

## What NOT to Do

- Don't commit with failing tests
- Don't commit with warnings
- Don't mix STRUCTURAL and BEHAVIORAL
- Don't use `git add .` blindly
