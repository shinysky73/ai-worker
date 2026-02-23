---
name: prd
description: Create a Product Requirements Document (PRD) for new features or changes. Use when starting a new feature, planning a refactoring, or documenting requirements before implementation. Triggers on "PRD 작성", "요구사항 정리", "기능 명세", or when user describes a feature they want to build.
---

# PRD - Lightweight Product Requirements Document

문제와 요구사항을 정의한다. 구현 방법이 아니라 **무엇을 해결하는가**에 집중한다.

## 핵심 원칙

**PRD가 담아야 할 것**: 문제 정의, 기능 요구사항(AC + Edge Cases), 영향 범위, 경계
**PRD가 담지 말아야 할 것**: 구현 방법, 성공 지표 테이블, User Stories, NFR 일반론

`/plan`이 소비하는 건 FR의 AC와 Edge Cases뿐이다. 나머지는 채우는 데 시간만 든다.

## Workflow

### 1. 문제 파악

사용자와 대화하거나 코드를 탐색하여:
- **문제**: 현재 뭐가 잘못되어 있는가?
- **영향**: 안 고치면 어떻게 되는가?
- **범위**: 어디까지 고칠 것인가?

### 2. 코드베이스 탐색

PRD 작성 전에:
- 영향받는 파일과 현재 코드 위치 파악
- 기존 패턴 확인
- 변경의 영향 범위 평가

### 3. PRD 생성

템플릿: [assets/prd-template.md](assets/prd-template.md)

**저장 위치 결정 (자동 번호 매기기)**:
1. `docs/` 디렉토리에서 `NN-` 접두사가 붙은 기존 디렉토리를 확인한다
2. 가장 큰 번호를 찾아 +1 한다 (없으면 01부터 시작)
3. 저장 위치: `docs/{NN}-{feature-name}/prd.md` (예: `docs/28-my-feature/prd.md`)

### 4. 사용자 확인

- 요구사항이 맞는지 확인
- 빠진 AC나 Edge Case 보완
- Out of Scope 합의

## PRD Quality Checklist

- [ ] 문제가 구체적으로 정의됨
- [ ] 모든 FR에 테스트 가능한 AC가 있음
- [ ] Edge Cases가 명시됨
- [ ] 영향받는 코드 위치가 파악됨
- [ ] Out of Scope이 명확함

## References

- [PRD Writing Guide](references/prd-guide.md) - AC 작성 원칙

## Output

1. PRD saved to `docs/{NN}-{feature-name}/prd.md`
2. Ready to run `/plan` to create TDD implementation plan
