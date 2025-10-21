# Tech Stack & Build System

## Core Technologies
- **Framework**: Expo (~54.0.13) with React Native 0.81.4
- **Language**: TypeScript with strict mode enabled
- **Navigation**: Expo Router (file-based routing with typed routes)
- **State Management**: Redux Toolkit with React Redux
- **Backend**: Supabase (authentication, database, real-time)
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Package Manager**: pnpm

## Development Tools
- **Linting**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest with jsdom environment
- **Build**: EAS (Expo Application Services)
- **Local Development**: Expo CLI with hot reload

## Common Commands

### Development
```bash
pnpm start          # Start Expo dev server
pnpm ios           # Run on iOS simulator
pnpm android       # Run on Android emulator
pnpm web           # Run on web browser
```

### Code Quality
```bash
pnpm lint          # Check code with Biome
pnpm lint:fix      # Auto-fix linting issues
pnpm format        # Format code
pnpm typecheck     # TypeScript type checking
```

### Testing
```bash
pnpm test:run      # Run all tests once
pnpm test:unit     # Unit tests only
pnpm test:integration        # Integration tests (remote Supabase)
pnpm test:integration:local  # Integration tests (local Supabase)
pnpm test:coverage # Coverage report
```

### Supabase Local Development
```bash
pnpm supabase:start   # Start local Supabase stack
pnpm supabase:stop    # Stop local stack
pnpm supabase:reset   # Reset local database
```

### Build & Deploy
```bash
pnpm build:preview:android    # EAS preview build (Android)
pnpm build:preview:ios        # EAS preview build (iOS)
pnpm build:production         # Production build (both platforms)
```

### Cleanup
```bash
pnpm clean         # Clear caches
pnpm clean:all     # Clear all caches + Watchman
pnpm nuke          # Nuclear option: reinstall everything
```

## Configuration Files
- **biome.json**: Linting and formatting rules
- **app.config.ts**: Expo configuration
- **vitest.config.ts**: Test configuration
- **tsconfig.json**: TypeScript configuration
- **supabase/config.toml**: Local Supabase setup

## Environment Variables
- Use `.env.local` for local development
- Prefix public variables with `EXPO_PUBLIC_`
- Supabase URL and keys are exposed via `app.config.ts`

## Code Style
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Indentation**: 2 spaces
- **Import Organization**: Automatic via Biome
- **Type Imports**: Use `import type` for type-only imports
