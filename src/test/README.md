# Test Utilities

This directory contains shared testing utilities and configuration.

## Structure

```
src/test/
├── dsl/              # DSL framework for behavioral testing
│   ├── BaseDsl.ts    # Base class for all DSLs
│   └── index.ts      # Exports
├── integration/      # Integration test setup
│   └── setup-supabase.ts  # Supabase test helpers
├── setup.ts          # Global test setup (Vitest)
└── README.md         # This file
```

## DSL Framework

The DSL (Domain-Specific Language) framework provides a fluent API for writing readable behavioral tests.

### BaseDsl

Base class that all DSL classes should extend:

```typescript
import { BaseDsl } from "./dsl";

export class MyUseCaseDSL extends BaseDsl<ResultType> {
  // Your DSL methods here
}
```

**Provided utilities:**
- `executeAction()` - Execute and capture result/error
- `thenShouldSucceed()` - Assert success
- `thenShouldFailWithError()` - Assert error message
- `getResult()` - Get last result
- `getError()` - Get last error
- `reset()` - Reset state

### Example Usage

```typescript
const dsl = new MyUseCaseDSL();

await dsl
  .givenSomeCondition()
  .whenExecutingAction()
  .thenShouldSucceed()
  .thenSomeAssertion();
```

## Integration Tests

Utilities for testing against real Supabase.

### Setup

```typescript
import { setupSupabaseTest, cleanupSupabaseTest } from "./integration/setup-supabase";

let client, helper;

beforeAll(async () => {
  const setup = await setupSupabaseTest();
  client = setup.client;
  helper = setup.helper;
});

afterAll(async () => {
  await cleanupSupabaseTest(helper);
});
```

### SupabaseTestHelper

**Methods:**
- `trackGroup(groupId)` - Track group for cleanup
- `trackProfile(profileId)` - Track profile for cleanup
- `cleanup()` - Clean up all tracked data
- `getCurrentUser()` - Get authenticated user
- `signInTestUser()` - Sign in with test credentials
- `signOut()` - Sign out current user

### Configuration

Required environment variables in `.env.test`:

```env
SUPABASE_TEST_URL=https://your-test-project.supabase.co
SUPABASE_TEST_ANON_KEY=your-test-anon-key
SUPABASE_TEST_USER_EMAIL=test@example.com
SUPABASE_TEST_USER_PASSWORD=test-password
SKIP_INTEGRATION_TESTS=false
```

## Global Setup

The `setup.ts` file configures global test behavior:

- Mocks React Native dependencies
- Configures test environment
- Runs before all tests

## Best Practices

1. **Use DSL for use cases** - Makes tests readable as specifications
2. **Clean up after integration tests** - Always track created resources
3. **Skip integration tests in CI** - Set `SKIP_INTEGRATION_TESTS=true`
4. **Keep utilities generic** - Reusable across features
5. **Document complex utilities** - Help other developers

## See Also

- [Testing Guide](../../docs/TESTING.md) - Complete testing documentation
- [Vitest Docs](https://vitest.dev/) - Test runner documentation
