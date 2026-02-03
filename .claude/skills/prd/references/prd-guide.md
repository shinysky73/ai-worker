# PRD Writing Guide

## Purpose of a PRD

A PRD bridges the gap between "what we want" and "how we build it." It ensures:
- Shared understanding between stakeholders
- Clear scope boundaries
- Testable acceptance criteria
- Technical feasibility assessment

## Writing Principles

### Be Specific, Not Vague

**Bad**: "The system should be fast"
**Good**: "API response time should be < 200ms for 95th percentile"

**Bad**: "Users can upload files"
**Good**: "Users can upload images (JPEG, PNG) up to 5MB"

### Focus on Behavior, Not Implementation

**Bad**: "Use Redis for caching"
**Good**: "Frequently accessed data should load within 50ms"

Implementation details belong in the technical design, not requirements.

### Make It Testable

Every requirement should be verifiable. Ask: "How would QA test this?"

**Bad**: "The UI should be intuitive"
**Good**: "Users can complete checkout in 3 clicks or fewer"

## PRD Sections

### 1. Problem Statement

Answer:
- What problem exists today?
- Who experiences this problem?
- What's the impact of not solving it?

### 2. Goals & Success Metrics

Define measurable outcomes:
- Primary goal (must achieve)
- Secondary goals (nice to have)
- How we'll measure success

### 3. User Stories

Format: "As a [user type], I want [action] so that [benefit]"

Prioritize using MoSCoW:
- **Must have**: Core functionality
- **Should have**: Important but not critical
- **Could have**: Nice to have
- **Won't have**: Explicitly out of scope

### 4. Functional Requirements

List specific behaviors:
- Input/output specifications
- Business rules
- Error handling
- Edge cases

### 5. Non-Functional Requirements

Consider:
- Performance (response times, throughput)
- Security (authentication, authorization, data protection)
- Scalability (expected load, growth)
- Reliability (uptime, recovery)

### 6. Technical Considerations

Note:
- Existing patterns to follow
- Integration points
- Dependencies
- Known constraints

### 7. Out of Scope

Explicitly list what this PRD does NOT cover. This prevents scope creep.

### 8. Open Questions

List unresolved items that need answers before implementation.

## Common Pitfalls

1. **Too vague**: Requirements that can't be tested
2. **Too detailed**: Implementation details in requirements
3. **Missing edge cases**: Only happy path considered
4. **No priorities**: Everything marked as "must have"
5. **Scope creep**: Requirements added without evaluation

## PRD Review Checklist

Before finalizing, verify:

- [ ] Problem is clearly stated
- [ ] Success can be measured
- [ ] All requirements are testable
- [ ] Priorities are assigned (MoSCoW)
- [ ] Edge cases are considered
- [ ] Out of scope is explicit
- [ ] Open questions are listed
- [ ] Technical constraints are noted
