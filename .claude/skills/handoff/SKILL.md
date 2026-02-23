---
name: handoff
description: Generate a HANDOFF.md document that captures current work state for seamless session continuation. Use when the user says "/handoff", "핸드오프", "인수인계", "context 정리", or wants to save progress before ending a session. Also use proactively when context is running low and significant work is in progress.
---

# Handoff

Generate a `HANDOFF.md` file and update CLAUDE.md to enable seamless session continuation.

## Procedure

1. **Analyze the conversation** — Identify the feature/task, decisions made, files changed, errors encountered, and pending work.

2. **Check for existing docs** — Read CLAUDE.md's "Last Work Position" section and any relevant `docs/*/plan.md`.

3. **Write HANDOFF.md** to the project root using the format below.

4. **Update CLAUDE.md** — Replace the `## Last Work Position` section with a brief summary + pointer to HANDOFF.md:

```markdown
## Last Work Position

- **Feature**: {feature name}
- **Status**: {one-line summary}
- **Handoff**: 상세 인수인계 문서는 `HANDOFF.md` 참고. 새 세션 시작 시 반드시 읽을 것.
```

5. **Report** both file paths to the user.

## HANDOFF.md Format

```markdown
# {Feature/Task Name} - Handoff Document

## Goal
{1-2 sentences: what we're trying to achieve}

## Current Progress

### What's Been Done
- {Completed item with specific file/function names}

### What Worked
- {Approach or technique that succeeded — so the next session reuses it}

### What Didn't Work
- {Approach that failed and WHY — so the next session avoids it}
- {Skip this section if nothing failed}

## Key Decisions
- {Decision + reasoning — skip if none}

## Files Changed
- `path/to/file.ts` — {brief description}

## Test Status
- Backend: {N} tests {passing/failing}
- Frontend: {N} tests {passing/failing}
- {Note any pre-existing failures}

## Next Steps
1. {Most immediate next action — be specific}
2. {Subsequent steps in priority order}

## Resume Command
{Exact prompt the user can paste into a new session to resume work. Reference HANDOFF.md.}
```

## Guidelines

- **Be specific** — File paths, function names, line numbers. Not "fixed the bug" but "Fixed `createChunkParser()` buffer overflow in `streamParser.ts:45`".
- **Capture the WHY** — Decisions without reasoning force re-derivation.
- **Include test counts** — Run tests if not recently run.
- **Resume Command** — Reference HANDOFF.md and relevant PRD/plan docs.
- **Keep it lean** — Skip empty sections rather than writing "None".
