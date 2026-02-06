---
name: commit-tdd
description: TDD disciplined commit - Commit with proper type indicator after tests pass. Use after completing TDD cycle, or when user says "commit", "커밋".
disable-model-invocation: true
---

# TDD Commit

테스트 통과 후 규율 있는 커밋.

## Prerequisites

- [ ] 전체 테스트 통과
- [ ] 변경이 하나의 논리 단위
- [ ] STRUCTURAL / BEHAVIORAL 구분 명확

## Instructions

1. **전체 테스트 실행** — 관련 테스트 파일 모두
2. **커밋 타입 결정** (아래 기준)
3. **파일 개별 스테이징** (`git add .` 금지)
4. **커밋 메시지 작성** (타입 접두사 포함)
5. **커밋 후 `git status`로 확인**

## 타입 판별

**BEHAVIORAL** (동작 변경):
- 새 테스트 추가, 로직 변경, 버그 수정

**STRUCTURAL** (동작 불변):
- 이름 변경, 파일 이동, 메서드 추출, 포맷팅

## 커밋 메시지 포맷

```
[BEHAVIORAL] feat: {한 줄 요약}

- {변경 1}
- {변경 2}

Test: {테스트 파일명}
```

```
[STRUCTURAL] refactor: {한 줄 요약}

- {변경 1}
- {변경 2}

No behavior change.
```

## Mixed Changes 처리

STRUCTURAL + BEHAVIORAL이 섞인 경우:

1. **분리 가능하면** → STRUCTURAL 먼저 커밋, BEHAVIORAL 따로
2. **같은 라인에 걸쳐 분리 불가하면** → 주요 변경 타입으로 커밋, 메시지에 부수 변경 명시

## 하지 말 것

- 실패 중인 테스트가 있으면 커밋하지 않는다
- `git add .`로 전체 스테이징하지 않는다
