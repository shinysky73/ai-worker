---
name: Systematic Debugging
description: Four-phase debugging framework that ensures root cause investigation before attempting fixes. Never jump to solutions.
when_to_use: when encountering any bug, test failure, or unexpected behavior, before proposing fixes
version: 2.1.0
languages: all
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Full error text, not just the last line
   - Stack trace from top to bottom
   - Any associated context (request ID, timestamp, user)

2. **Reproduce Consistently**
   - Can you reproduce it? If not, gather more data first
   - Minimal reproduction case
   - Is it intermittent? (suggests race condition or state issue)

3. **Check Recent Changes**
   - `git log --oneline -20` — what changed recently?
   - `git diff HEAD~1` — what's different?
   - Did it work before? When did it break?

4. **Gather Evidence in Multi-Component Systems**
   - Add diagnostic instrumentation at each component boundary
   - NestJS: add `@Logger()` decorators, check middleware logs
   - Prisma: enable query logging (`log: ['query', 'error']`)
   - WebSocket: log emit/receive events
   - Collect ALL evidence before proposing fixes

5. **Trace Data Flow**
   - Use root-cause-tracing for backward tracing
   - Follow data from entry point to failure point

### Phase 2: Pattern Analysis

- Find working examples of similar functionality
- Compare against references completely
- Identify all differences (not just obvious ones)
- Understand dependencies and side effects

### Phase 3: Hypothesis and Testing

- Form SINGLE hypothesis based on evidence
- Test minimally (one variable at a time)
- Verify hypothesis before continuing
- If hypothesis is wrong: gather more evidence, form new hypothesis

### Phase 4: Implementation

1. Create failing test case (proves the bug exists)
2. Implement single fix
3. Verify fix (run the test, see it pass)
4. Run full test suite (no regressions)

**If fix doesn't work after 3+ attempts: STOP**
- Each fix revealing a new problem in a different place = architectural flaw
- Requires fundamental redesign discussion, not more fixes
- Escalate to human partner

## Red Flags - STOP and Follow Process

- "Quick fix for now, investigate later"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals new problem in different place
- "I know what this is" (before checking evidence)

## Real-World Impact

- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
