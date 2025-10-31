# Instruction: Integrate Tamagui Design System Framework

## Feature

- **Summary**: Integrate Tamagui UI framework to provide a comprehensive design system with pre-built components, theming capabilities, motion design support, and dark/light mode. Prepare architecture for easy theme customization when Design Assets arrive.
- **Stack**: `React Native 0.81.4`, `Expo ~54.0.12`, `React 19.1.0`, `TypeScript ~5.9.3`, `Tamagui ^1.x`, `@tamagui/config`, `@tamagui/animations-react-native`

## Existing files

- @src/theme/colors.ts
- @src/theme/spacing.ts
- @src/theme/typography.ts
- @src/theme/index.ts
- @app/_layout.tsx
- @app.config.ts
- @babel.config.js

### New file to create

- tamagui.config.ts
- src/lib/tamagui/theme-provider.tsx
- src/hooks/useAppTheme.ts
- docs/theming-guide.md

## Implementation phases

### Phase 1: Install and configure Tamagui

> Set up Tamagui packages and basic configuration files

1. Install core packages: tamagui, @tamagui/config, @tamagui/animations-react-native
2. Create tamagui.config.ts at project root with base configuration from @tamagui/config
3. Update babel.config.js to include Tamagui babel plugin
4. Configure Metro bundler for Tamagui support (web + native)
5. Update app.config.ts to set userInterfaceStyle to "automatic" for dark/light mode

### Phase 2: Migrate existing theme tokens to Tamagui format

> Convert current design tokens from src/theme/ to Tamagui configuration format

1. Create color tokens in tamagui.config.ts based on src/theme/colors.ts structure
2. Define light and dark color schemes using existing color palette
3. Create spacing tokens matching src/theme/spacing.ts values
4. Create typography tokens (fontSize, fontWeight, lineHeight) from src/theme/typography.ts
5. Add borderRadius and shadow tokens from src/theme/index.ts
6. Ensure all tokens follow Tamagui naming conventions and type system

### Phase 3: Integrate TamaguiProvider in application

> Wrap application with Tamagui provider and implement theme switching

1. Create src/lib/tamagui/theme-provider.tsx wrapper component
2. Integrate TamaguiProvider in app/_layout.tsx root layout
3. Implement automatic color scheme detection using useColorScheme hook
4. Configure provider with tamagui.config
5. Create useAppTheme hook in src/hooks/useAppTheme.ts for theme access throughout app
6. Test dark/light mode switching works correctly on all platforms

### Phase 4: Proof of concept component migration

> Migrate 2-3 simple components to validate Tamagui integration

1. Identify 2-3 simple reusable components to migrate (Button, Card recommended)
2. Rewrite components using Tamagui primitives (Button, Card, YStack, XStack, etc)
3. Ensure migrated components consume theme tokens correctly
4. Test animations work properly on migrated components
5. Verify visual parity with original components
6. Document any differences or migration patterns discovered

### Phase 5: Documentation

> Create comprehensive guide for theme customization and future DA integration

1. Create docs/theming-guide.md explaining Tamagui theme system
2. Document how to modify theme tokens in tamagui.config.ts
3. Provide examples of creating custom components with Tamagui
4. Document process for replacing theme when Design Assets arrive
5. Include visual examples of all available tokens
6. Document dark/light mode implementation and customization

### Phase 6: Testing and validation

> Ensure all functionality works across platforms and existing tests pass

1. Test application on iOS simulator
2. Test application on Android emulator
3. Test web build functionality
4. Verify dark/light mode switching works on all platforms
5. Verify animations perform well
6. Run existing test suite and ensure no regressions
7. Run linter and typecheck to ensure code quality
8. Measure bundle size impact and document findings

## Reviewed implementation

- [ ] Phase 1: Tamagui installed and configured
- [ ] Phase 2: Theme tokens migrated
- [ ] Phase 3: TamaguiProvider integrated
- [ ] Phase 4: POC components migrated
- [ ] Phase 5: Documentation created
- [ ] Phase 6: Testing completed across platforms

## Validation flow

1. Start fresh application build
2. Verify app launches without errors on iOS, Android, and Web
3. Open migrated components and verify visual appearance matches expectations
4. Toggle system dark/light mode and verify app theme switches automatically
5. Test animations on migrated components work smoothly
6. Open docs/theming-guide.md and verify documentation is clear and complete
7. Modify a color token in tamagui.config.ts and verify change reflects throughout app
8. Run full test suite: npm run test:run
9. Run typecheck: npm run typecheck
10. Run linter: npm run lint
11. Build for all platforms to ensure no build errors

## Estimations

- Confidence: 8/10
- Time to implement: 4-6 hours
- Reasons for high confidence:
  - ✅ Tamagui has official Expo support and documentation
  - ✅ Existing theme system is well-structured and ready to migrate
  - ✅ Clear token-based architecture aligns with project goals
  - ✅ Strong TypeScript support in both project and Tamagui
  - ✅ Active community and recent 2025 guides available
  - ✅ Performance benefits are well-documented
- Reasons for caution:
  - ❌ Learning curve for Tamagui paradigm may slow initial implementation
  - ❌ Metro configuration for Tamagui can be tricky with Expo
  - ❌ Need to ensure bundle size increase is acceptable
  - ❌ May discover edge cases during component migration
