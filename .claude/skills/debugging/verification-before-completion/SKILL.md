---
name: Verification Before Completion
description: Run verification commands and confirm output before claiming success
when_to_use: when about to claim work is complete, fixed, or passing, before committing or creating PRs
version: 1.1.0
languages: all
---

# Verification Before Completion

**Core principle:** Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## The Gate Function

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

## Project Verification Commands

```bash
# All tests (required before "tests pass" claim)
pnpm test

# Backend only
pnpm -F @milo-seah/api-server test

# Frontend only
pnpm -F @milo-seah/user-client test

# Full build (required before "build succeeds" claim)
pnpm build

# Lint check
pnpm lint
```

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Done!", "Fixed!", "Works!")
- About to commit/push/PR without running tests
- Trusting agent success reports without verifying
- Relying on partial test runs
- "Just this once"

## The Bottom Line

Run the command. Read the output. THEN claim the result. This is non-negotiable.

See also: `../../../code-review/references/verification-before-completion.md` for the full protocol.
