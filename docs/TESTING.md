# Testing Guide

This document describes the testing strategy and tools used in the EquimApp project.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [DSL Pattern](#dsl-pattern)
- [Integration Tests](#integration-tests)
- [Best Practices](#best-practices)

## Overview

We use **Vitest** as our test runner with the following testing approaches:

1. **Unit Tests with DSL** - Use Cases are tested with a Domain-Specific Language for readability
2. **Integration Tests** - Gateway implementations are tested against real Supabase

## Test Types

### Unit Tests (DSL Pattern)

Unit tests focus on testing use cases in isolation using in-memory implementations and a fluent DSL API.

**Location**: `src/features/**/usecases/**/*.spec.ts`

**Example**:
```typescript
describe("Add Member Use Case", () => {
  let dsl: AddMemberDSL;

  beforeEach(() => {
    dsl = new AddMemberDSL();
  });

  it("should add a phantom member to a group", async () => {
    await dsl
      .givenAGroupExists()
      .givenMemberData("Lisa", 1500)
      .whenAddingPhantomMember()
      .thenShouldSucceed()
      .thenPhantomMemberShouldBeAdded();
  });
});
```

### Integration Tests

Integration tests verify that gateway implementations work correctly with Supabase.

**Location**: `src/features/**/infra/**/*.integration.spec.ts`

**Requirements**:
- Test Supabase project (separate from production)
- `.env.test` file with credentials
- Test user account

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### Integration Tests Only
```bash
pnpm test:integration
```

### Watch Mode
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### UI Mode (Interactive)
```bash
pnpm test:ui
```

## Writing Tests

### Creating a DSL for a Use Case

1. Create a DSL class extending `BaseDsl`:

```typescript
// src/features/group/usecases/example/example.dsl.ts
import { BaseDsl } from "../../../../test/dsl";

export class ExampleDSL extends BaseDsl<ResultType> {
  // GIVEN - Setup state (can be sync or async)
  givenSomeCondition(): this {
    // Setup logic
    return this;
  }

  // WHEN - Execute action (should be async)
  async whenPerformingAction(): Promise<this> {
    await this.executeAction(async () => {
      // Action logic
      return result;
    });
    return this;
  }

  // THEN - Assertions (sync)
  thenSomethingHappened(): this {
    if (!this.result) {
      throw new Error("Expected result");
    }
    // Assertion logic
    return this;
  }
}
```

2. Create test file using the DSL:

```typescript
// src/features/group/usecases/example/example.spec.ts
import { describe, it, beforeEach } from "vitest";
import { ExampleDSL } from "./example.dsl";

describe("Example Use Case", () => {
  let dsl: ExampleDSL;

  beforeEach(() => {
    dsl = new ExampleDSL();
  });

  it("should perform action successfully", async () => {
    await dsl
      .givenSomeCondition()
      .whenPerformingAction()
      .thenShouldSucceed()
      .thenSomethingHappened();
  });
});
```

## DSL Pattern

The DSL (Domain-Specific Language) pattern provides a fluent, readable API for writing behavioral tests.

### Structure

- **GIVEN** - Setup initial conditions
- **WHEN** - Execute the action being tested
- **THEN** - Assert expected outcomes

### BaseDsl Utilities

All DSL classes extend `BaseDsl` which provides:

- `executeAction()` - Execute action and capture result/error
- `thenShouldSucceed()` - Assert operation succeeded
- `thenShouldFailWithError()` - Assert specific error message
- `getResult()` - Get the last result
- `getError()` - Get the last error
- `reset()` - Reset DSL state

### Example DSLs

- `AddMemberDSL` - [src/features/group/usecases/add-member/addMember.dsl.ts](../src/features/group/usecases/add-member/addMember.dsl.ts)
- `OnboardingDSL` - [src/features/onboarding/usecases/complete-onboarding/completeOnBoarding.dsl.ts](../src/features/onboarding/usecases/complete-onboarding/completeOnBoarding.dsl.ts)
- `AcceptInvitationDSL` - [src/features/group/usecases/invitation/acceptInvitation.dsl.ts](../src/features/group/usecases/invitation/acceptInvitation.dsl.ts)

## Integration Tests

### Setup (Option 1: Supabase Local - Recommandé)

**Avantages:** Rapide, gratuit, isolation parfaite, identique à production

1. Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase

# Windows/Linux
npm install -g supabase
```

2. Initialize and start:
```bash
supabase init
pnpm supabase:start
```

3. Run integration tests:
```bash
pnpm test:integration:local
```

**📖 Guide complet:** [INTEGRATION_TESTS_QUICKSTART.md](./INTEGRATION_TESTS_QUICKSTART.md)

### Setup (Option 2: Supabase Cloud)

**Avantages:** Pas de Docker requis, test sur vraie infra

1. Create a `.env.test` file (copy from `.env.test.example`):

```bash
cp .env.test.example .env.test
```

2. Fill in your test Supabase credentials:

```env
SUPABASE_TEST_URL=https://your-test-project.supabase.co
SUPABASE_TEST_ANON_KEY=your-test-anon-key
SUPABASE_TEST_USER_EMAIL=test@example.com
SUPABASE_TEST_USER_PASSWORD=test-password
```

3. Create a test user in your test Supabase project

4. Run integration tests:
```bash
pnpm test:integration
```

### Skip Integration Tests

Set `SKIP_INTEGRATION_TESTS=true` in `.env.test` or run:

```bash
pnpm test:unit
```

### Writing Integration Tests

```typescript
import { describe, it, beforeAll, afterAll } from "vitest";
import {
  setupSupabaseTest,
  cleanupSupabaseTest,
  shouldSkipIntegrationTests,
} from "../../../test/integration/setup-supabase";

describe.skipIf(shouldSkipIntegrationTests())(
  "Gateway - Integration Tests",
  () => {
    let client, helper, gateway;

    beforeAll(async () => {
      const setup = await setupSupabaseTest();
      client = setup.client;
      helper = setup.helper;
      gateway = new MyGateway(client);
    });

    afterAll(async () => {
      await cleanupSupabaseTest(helper);
    });

    it("should perform real database operation", async () => {
      const result = await gateway.someOperation();
      helper.trackGroup(result.groupId); // Track for cleanup

      // Verify in database
      const { data } = await client
        .from("table")
        .select("*")
        .eq("id", result.id)
        .single();

      expect(data).toBeDefined();
    });
  }
);
```

## Best Practices

### Unit Tests

1. **Use DSL for readability** - Tests should read like specifications
2. **Test behaviors, not implementation** - Focus on what, not how
3. **One assertion per test** - Keep tests focused
4. **Use descriptive names** - Test names should describe the scenario
5. **Given-When-Then structure** - Clear test organization

### Integration Tests

1. **Use separate test database** - Never test against production
2. **Clean up after tests** - Use helper.trackGroup/trackProfile
3. **Skip when needed** - Use SKIP_INTEGRATION_TESTS flag
4. **Test real scenarios** - Verify complete flows end-to-end
5. **Handle async properly** - Use async/await correctly

### General

1. **Fail fast** - Throw errors early with clear messages
2. **Avoid silent failures** - Every error should be caught and reported
3. **Keep tests simple** - Avoid complex logic in tests
4. **Test edge cases** - Empty strings, null, negative numbers, etc.
5. **Mock external dependencies** - Don't rely on external services in unit tests

## Test Coverage

Our testing strategy focuses on:

- ✅ **Use Cases** - Complete behavioral coverage with DSL
- ✅ **Gateways** - Integration tests for real implementations
- ⚠️ **Components** - Currently minimal, add as needed
- ⚠️ **Selectors** - Currently minimal, add as needed

## Continuous Integration

Tests run automatically on:
- Every push to a branch
- Every pull request
- Before merging to main

Integration tests are skipped in CI by default (set `SKIP_INTEGRATION_TESTS=true`).

## Troubleshooting

### "Integration tests not running"
- Check `.env.test` file exists and has correct credentials
- Verify `SKIP_INTEGRATION_TESTS` is not set to `true`
- Ensure test Supabase project is accessible

### "Tests timing out"
- Increase timeout in vitest.config.ts
- Check network connectivity for integration tests
- Verify Supabase project is running

### "DSL tests failing"
- Ensure in-memory gateways are properly initialized
- Check that setup is completed before actions
- Verify assertions match expected behavior

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Given-When-Then Pattern](https://martinfowler.com/bliki/GivenWhenThen.html)
