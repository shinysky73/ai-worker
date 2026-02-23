# TDD Principles - Kent Beck's Guidelines

## The TDD Cycle

### Red → Green → Refactor

1. **Red**: Write a failing test
   - Test must compile
   - Test must fail for the right reason
   - Test should be the simplest possible

2. **Green**: Make it pass
   - Write the minimum code to pass
   - It's okay to hard-code values
   - Don't think ahead

3. **Refactor**: Improve structure
   - Remove duplication
   - Improve names
   - Extract methods/classes
   - All tests must stay green

## Core Principles

### 1. Test One Thing

Each test should verify exactly one behavior.

**Bad**:
```typescript
it('should create user and send email', () => {
  // Testing two behaviors
});
```

**Good**:
```typescript
it('should create user with valid data', () => {});
it('should send welcome email after creation', () => {});
```

### 2. Meaningful Test Names

Test names should describe behavior, not implementation.

**Bad**: `testCreateUser`, `test1`, `shouldWork`
**Good**: `shouldCreateUserWithValidEmail`, `shouldRejectDuplicateEmail`

Pattern: `should{ExpectedBehavior}When{Condition}`

### 3. Arrange-Act-Assert (AAA)

```typescript
it('should calculate total with tax', () => {
  // Arrange
  const cart = new Cart();
  cart.addItem({ price: 100 });

  // Act
  const total = cart.calculateTotal(0.1);

  // Assert
  expect(total).toBe(110);
});
```

### 4. Fake It Till You Make It

Start with the simplest implementation:
1. Return a constant
2. Use obvious implementation
3. Triangulate with more tests

```typescript
// First test: return constant
function add(a, b) {
  return 4; // Just make it pass
}

// Second test forces real implementation
function add(a, b) {
  return a + b;
}
```

### 5. Triangulation

When unsure of the general solution:
1. Write two or more tests with different values
2. Find the pattern
3. Implement the general solution

## Writing Good Tests

### Test Isolation

- Tests should not depend on each other
- Each test sets up its own data
- No shared mutable state

### Test Clarity

- Tests are documentation
- Anyone should understand what's being tested
- Avoid complex setup when possible

### Edge Cases

Always consider:
- Empty inputs
- Null/undefined
- Boundary values
- Error conditions

## Tidy First Principle

Separate structural changes from behavioral changes.

### Structural Changes (Tidy)
- Rename variables/functions
- Extract methods
- Move code
- Format code

### Behavioral Changes
- Add new features
- Fix bugs
- Change logic

**Rule**: Never mix them in one commit.

### Workflow
1. Notice needed structural change
2. Finish current TDD cycle
3. Commit behavioral change
4. Make structural changes
5. Commit structural change
6. Continue with new behavior

## Common Mistakes

1. **Testing implementation, not behavior**
   - Don't test private methods
   - Test through public interface

2. **Too many assertions**
   - One logical assertion per test
   - Multiple `expect()` is okay if testing one concept

3. **Testing the framework**
   - Don't test that Jest/Vitest works
   - Focus on your business logic

4. **Over-mocking**
   - Mock at boundaries (APIs, databases)
   - Don't mock everything

5. **Ignoring failing tests**
   - Fix or delete, never ignore
   - `skip` is temporary only

## Test Organization

### By Feature (Recommended)
```
src/
  auth/
    auth.service.ts
    auth.service.spec.ts
  chat/
    chat.service.ts
    chat.service.spec.ts
```

### describe Blocks
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should authenticate valid credentials', () => {});
    it('should reject invalid password', () => {});
  });

  describe('logout', () => {
    it('should clear session', () => {});
  });
});
```
