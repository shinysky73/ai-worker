---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements - dispatches code-reviewer subagent to review implementation against plan or requirements before proceeding
---

# Requesting Code Review

Dispatch code-reviewer subagent to catch issues before they cascade.

**Core principle:** Review early, review often.

## When to Request Review

Mandatory:
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

Optional but valuable:
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

1. Get git SHAs:
   ```bash
   BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
   HEAD_SHA=$(git rev-parse HEAD)
   ```

2. Dispatch code-reviewer subagent via Task tool with these placeholders:
   - `{WHAT_WAS_IMPLEMENTED}` - What you just built
   - `{PLAN_OR_REQUIREMENTS}` - What it should do
   - `{BASE_SHA}` - Starting commit
   - `{HEAD_SHA}` - Ending commit
   - `{DESCRIPTION}` - Brief summary

3. Act on feedback:
   - Fix **Critical** issues immediately
   - Fix **Important** issues before proceeding
   - Note **Minor** issues for later
   - Push back if reviewer is wrong (with reasoning)

## Code Reviewer Subagent Prompt Template

```
You are a code reviewer. Review the changes between {BASE_SHA} and {HEAD_SHA}.

WHAT WAS IMPLEMENTED:
{WHAT_WAS_IMPLEMENTED}

REQUIREMENTS/PLAN:
{PLAN_OR_REQUIREMENTS}

DESCRIPTION:
{DESCRIPTION}

Review for:
1. Security vulnerabilities (injection, XSS, auth bypass, exposed secrets)
2. Performance issues (N+1 queries, missing indexes, memory leaks)
3. Correctness (logic errors, edge cases, error handling)
4. Standards compliance (TypeScript types, NestJS patterns, React patterns)
5. Test coverage gaps

For each issue found, categorize as:
- CRITICAL: Must fix before proceeding (security, data loss, broken functionality)
- IMPORTANT: Should fix before merge (performance, maintainability)
- MINOR: Nice to fix (style, minor optimizations)

Format: [SEVERITY] File:line - Issue description + suggested fix
```

## Integration with TDD Workflow

In this project's `/prd → /plan → /go-phase → /check-tests → /commit-tdd` workflow:

- After `/go-phase` completes a phase → Request review
- Before `/commit-tdd` with `[BEHAVIORAL]` tag → Verify no regressions
- After major refactor with `[STRUCTURAL]` tag → Check for unintended behavioral changes

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck
