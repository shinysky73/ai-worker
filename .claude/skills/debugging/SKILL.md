---
name: debugging
description: Systematic debugging frameworks for finding and fixing bugs - includes root cause analysis, defense-in-depth validation, and verification protocols
when_to_use: when encountering bugs, test failures, unexpected behavior, or needing to validate fixes before claiming completion
version: 1.0.0
languages: all
---

# Debugging Skills

A collection of systematic debugging methodologies that ensure thorough investigation before attempting fixes.

## Available Sub-Skills

### Systematic Debugging
**Location:** `systematic-debugging/SKILL.md`

Four-phase debugging framework: Root Cause Investigation → Pattern Analysis → Hypothesis Testing → Implementation. The iron law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

### Root Cause Tracing
**Location:** `root-cause-tracing/SKILL.md`

Trace bugs backward through the call stack to find the original trigger. Don't fix symptoms - find where invalid data originated and fix at the source.

### Defense-in-Depth Validation
**Location:** `defense-in-depth/SKILL.md`

Validate at every layer data passes through to make bugs structurally impossible. Four layers: Entry Point → Business Logic → Environment Guards → Debug Instrumentation.

### Verification Before Completion
**Location:** `verification-before-completion/SKILL.md`

Run verification commands and confirm output before claiming success. The iron law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.

## When to Use

- **Bug in production** → Start with systematic-debugging
- **Error deep in stack trace** → Use root-cause-tracing
- **Fixing a bug** → Apply defense-in-depth after finding root cause
- **About to claim "done"** → Use verification-before-completion

## Quick Dispatch

| Symptom | Sub-Skill |
|---------|-----------|
| Test failure, unexpected behavior | systematic-debugging |
| Error appears in wrong location | root-cause-tracing |
| Same bug keeps recurring | defense-in-depth |
| Need to confirm fix works | verification-before-completion |

## Project-Specific Context

This project uses NestJS (backend) + React (frontend) with:
- **Database**: PostgreSQL + Prisma (check N+1 queries, migration state)
- **WebSocket**: Socket.io streaming (check connection state, event handlers)
- **AI Providers**: OpenAI/Anthropic/Gemini/Perplexity (check API errors, token limits)
- **Auth**: Google OAuth + JWT (check token expiry, session state)

Common investigation commands:
```bash
# Check test failures
pnpm -F @milo-seah/api-server test --verbose
pnpm -F @milo-seah/user-client test --reporter=verbose

# Check build errors
pnpm -F @milo-seah/api-server build
pnpm -F @milo-seah/user-client build

# Database state
pnpm -F @milo-seah/api-server db:generate
```

## Core Philosophy

> "Systematic debugging is FASTER than guess-and-check thrashing."

From real debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
