# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Runner:**
- Vitest v3.0.5
- Config: Not explicitly configured (uses Vite config)
- Test script: `npm run test` (runs `vitest run`)

**Assertion Library:**
- Not detected in dependencies
- Vitest includes built-in assertions via `expect()`

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
```

**Status:**
- Testing framework installed but **no test files present in src/**
- Test infrastructure is configured but not yet utilized
- Vitest is set up with jsdom (v27.0.0) for DOM testing support

## Test File Organization

**Location:**
- Currently: No test files in `src/`
- Recommended: Co-located with source files
- Pattern: `[name].test.ts` or `[name].spec.ts` alongside implementation

**Naming Convention:**
- Test files should use `.test.ts` or `.test.tsx` suffix
- Example: `button.test.tsx` alongside `button.tsx`

**Structure:**
```
src/
├── components/
│   ├── button.tsx
│   ├── button.test.tsx        // Test file
│   └── Header.tsx
├── hooks/
│   ├── demo.form.ts
│   └── demo.form.test.ts       // Test file
└── lib/
    ├── utils.ts
    └── utils.test.ts           // Test file
```

## Test Dependencies

**Testing Libraries Installed:**
- `@testing-library/dom` v10.4.0 - DOM testing utilities
- `@testing-library/react` v16.2.0 - React component testing
- `jsdom` v27.0.0 - DOM implementation for Node.js tests
- `vitest` v3.0.5 - Test runner

**Not Detected:**
- No specific mocking library explicitly installed (Vitest provides vi mock functions)
- No snapshot testing framework
- No E2E testing framework

## Expected Test Structure

Based on Vitest and Testing Library installation, tests should follow this pattern:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('applies variant class', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
  })
})
```

## Mocking

**Framework:**
- Vitest provides `vi` object for mocking
- Mock modules and functions via `vi.mock()`
- Mock timers via `vi.useFakeTimers()`
- No explicit mocking library configured

**Expected Patterns:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ServerFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls handler with input', async () => {
    const handler = vi.fn()
    // Test implementation
  })
})
```

**What to Mock:**
- External API calls (fetch, services)
- File system operations (fs operations in tests)
- Environment variables
- React hooks (useState, useQuery for side effects)
- Time-dependent logic (timers, intervals)

**What NOT to Mock:**
- Pure utility functions (can test directly)
- Component rendering logic (test rendered output, not internals)
- Built-in APIs unless necessary (Array methods, Object methods)

## Fixtures and Factories

**Test Data:**
- Faker.js (v10.0.0) is installed and used in production
- Can be leveraged for test data generation
- Pattern shown in `demo-table-data.ts`:
```typescript
const newPerson = (num: number): Person => {
  return {
    id: num,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int(40),
    visits: faker.number.int(1000),
    progress: faker.number.int(100),
    status: faker.helpers.shuffle<Person['status']>([...]),
  }
}
```

**Location:**
- Test fixtures should live in `src/__fixtures__/` or co-located with tests
- Factory functions can be in separate `.factory.ts` files
- Shared test data in `src/__mocks__/` for module-level mocks

## Coverage

**Requirements:**
- Not enforced (no coverage thresholds in vitest config)
- Not checked in CI/CD (no coverage reporting configured)

**View Coverage:**
```bash
npm run test -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, utilities
- Approach: Test input/output with various cases
- Examples to test:
  - `cn()` utility in `lib/utils.ts` - verify class merging
  - `makeData()` in `data/demo-table-data.ts` - verify structure and data generation
  - Form validation in components

**Integration Tests:**
- Scope: Component interactions, form submissions, data flow
- Approach: Render components with providers, test user interactions
- Examples to test:
  - Form components with validation (TextField, TextArea, Select in FormComponents)
  - Provider setup (ConvexProvider, ClerkProvider, QueryClientProvider)
  - Router navigation and data loading
  - Server functions with handlers

**E2E Tests:**
- Not currently implemented
- No testing framework configured (would recommend Playwright or Cypress)
- Could test:
  - Full user workflows
  - Form submissions and server communication
  - Navigation flows
  - Authentication flows with Clerk

## Common Patterns

**Async Testing:**
```typescript
it('loads todos on mount', async () => {
  const { rerender } = render(<TodoComponent />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')

  await waitFor(() => {
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })
})
```

**Hook Testing:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'

it('fetches data with useQuery', async () => {
  const { result } = renderHook(() =>
    useQuery({
      queryKey: ['todos'],
      queryFn: fetchTodos,
    })
  )

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
})
```

**Error Testing:**
```typescript
it('throws on missing config', () => {
  expect(() => {
    createClerkProvider({})
  }).toThrow('Add your Clerk Publishable Key')
})
```

**Form Testing:**
```typescript
import { userEvent } from '@testing-library/user-event'

it('submits form with validation', async () => {
  const user = userEvent.setup()
  render(<AddressForm />)

  await user.type(screen.getByLabelText('Address'), '123 Main St')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

## Testing Checklist for New Components

When adding new components or features, test:

1. **Rendering:**
   - Component renders without crashing
   - All text/labels visible
   - Correct default state

2. **Props:**
   - Component accepts expected props
   - Props affect rendered output
   - Optional props work correctly

3. **User Interactions:**
   - Buttons trigger callbacks
   - Inputs update state
   - Forms submit correctly

4. **Error States:**
   - Error messages display appropriately
   - Invalid input is rejected
   - Configuration errors throw

5. **Accessibility:**
   - Proper ARIA labels
   - Keyboard navigation works
   - Screen reader compatible

---

*Testing analysis: 2026-02-03*
