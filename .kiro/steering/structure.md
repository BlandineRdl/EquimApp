# Project Structure & Organization

## Root Structure

```
├── app/                    # Expo Router pages (file-based routing)
├── src/                    # Main application source code
├── supabase/              # Database schema, migrations, RPC functions
├── aidd/                  # AI Development Documentation
├── aidd-docs/             # Project documentation and memory bank
├── android/               # Android native code
├── ios/                   # iOS native code
├── assets/                # Static assets (icons, images)
└── public/                # Web assets
```

## App Directory (Expo Router)

```
app/
├── _layout.tsx            # Root layout
├── (auth)/               # Auth group routes
│   ├── _layout.tsx       # Auth layout
│   ├── sign-in.tsx       # Sign in screen
│   └── callback.tsx      # Auth callback
├── (app)/                # Main app routes (protected)
│   ├── _layout.tsx       # App layout
│   ├── index.tsx         # Redirect to home
│   ├── home.tsx          # Home screen
│   ├── profile.tsx       # Profile screen
│   └── onboarding/       # Onboarding flow
├── group/                # Group-related screens
│   ├── [groupId].tsx     # Group details
│   └── accept-invitation.tsx
└── invite/               # Invitation handling
    └── [token].tsx       # Accept invitation
```

## Source Directory (src/)

```
src/
├── components/           # Reusable UI components
├── config/              # App configuration
├── features/            # Feature-based modules
│   ├── auth/           # Authentication logic
│   ├── group/          # Group management
│   ├── notification/   # Notifications
│   ├── onboarding/     # User onboarding
│   └── user/           # User management
├── lib/                # External libraries & clients
│   └── supabase/       # Supabase client setup
├── navigation/         # Navigation utilities
├── store/              # Redux store configuration
├── test/               # Test utilities and setup
│   ├── dsl/           # Domain-specific test language
│   └── integration/   # Integration test helpers
├── theme/              # Design system (colors, typography, spacing)
└── types/              # TypeScript type definitions
```

## Supabase Directory

```
supabase/
├── config.toml         # Supabase local configuration
├── schema.sql          # Database schema
├── seed.sql           # Test data
├── migrations/        # Database migrations
├── rpc/              # Remote procedure calls (functions)
└── triggers/         # Database triggers
```

## Architecture Patterns

### Feature-Based Organization

- Each feature in `src/features/` is self-contained
- Features include components, hooks, types, and business logic
- Shared utilities go in `src/lib/` or `src/components/`

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: PascalCase with `.types.ts` suffix
- **Tests**: Same name as file with `.test.ts` or `.spec.ts`
- **Constants**: UPPER_SNAKE_CASE

### Import Organization

- External libraries first
- Internal imports grouped by: types, components, hooks, utils
- Relative imports last
- Use `import type` for type-only imports

### Component Structure

```typescript
// External imports
import { useState } from "react";
import { View, Text } from "react-native";

// Type imports
import type { User } from "@/types/user.types";

// Internal imports
import { Button } from "@/components/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Component definition
export function UserProfile({ user }: { user: User }) {
  // Component logic
}
```

### Testing Structure

- Unit tests alongside source files
- Integration tests in `src/test/integration/`
- Test utilities in `src/test/dsl/`
- Setup file: `src/test/setup.ts`

## Key Conventions

- Use Expo Router for navigation (file-based routing)
- Redux Toolkit for global state management
- Supabase RPC functions for complex database operations
- React Native StyleSheet for styling
- TypeScript strict mode enabled
- Feature-first organization over technical layers
