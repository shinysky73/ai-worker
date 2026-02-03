---
name: prd
description: Create a Product Requirements Document (PRD) for new features or changes. Use when starting a new feature, planning a refactoring, or documenting requirements before implementation. Triggers on "PRD 작성", "요구사항 정리", "기능 명세", or when user describes a feature they want to build.
---

# PRD - Product Requirements Document

Create structured PRD documents that capture requirements clearly before implementation.

## Workflow

### 1. Gather Context

Ask clarifying questions to understand:
- **Problem**: What problem are we solving?
- **Users**: Who will use this feature?
- **Scope**: What's in scope and out of scope?
- **Constraints**: Technical, time, or resource constraints?

### 2. Analyze Codebase

Before writing the PRD:
- Explore relevant existing code
- Identify affected components
- Note existing patterns to follow
- Find potential integration points

### 3. Generate PRD

Use the template in [assets/prd-template.md](assets/prd-template.md) to create a structured document.

Write the PRD to: `docs/{feature-name}/prd.md`

### 4. Review with User

Present the PRD and ask:
- Does this capture your requirements correctly?
- Any missing acceptance criteria?
- Priority adjustments needed?

## PRD Quality Checklist

- [ ] Problem statement is clear and specific
- [ ] Success metrics are measurable
- [ ] Scope boundaries are explicit
- [ ] Technical approach references existing patterns
- [ ] Acceptance criteria are testable
- [ ] Out of scope items are listed

## References

- [PRD Writing Guide](references/prd-guide.md) - Best practices for writing effective PRDs

## Output

After completion:
1. PRD saved to `docs/{feature-name}/prd.md`
2. Ready to run `/plan` to create TDD implementation plan
