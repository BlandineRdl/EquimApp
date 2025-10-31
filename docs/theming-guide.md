# Tamagui Theming Guide

This guide explains how the Tamagui theming system works in EquimApp and how to customize it when Design Assets arrive.

## Overview

EquimApp uses **Tamagui** as its UI framework and design system. Tamagui provides:

- Pre-built, performant components
- Token-based theming system
- Automatic dark/light mode support
- Built-in animations and motion design
- Cross-platform consistency (iOS, Android, Web)

## Architecture

### Configuration File: `tamagui.config.ts`

This is the central configuration file where all design tokens are defined.

**Location**: `/tamagui.config.ts` (project root)

**Structure**:
```typescript
const config = createTamagui({
  themes: {
    light: { /* light theme colors */ },
    dark: { /* dark theme colors */ },
  },
  tokens: {
    color: { /* color palette */ },
    space: { /* spacing scale */ },
    size: { /* size scale */ },
    radius: { /* border radius */ },
  },
  fonts: {
    body: { /* typography for body text */ },
    heading: { /* typography for headings */ },
  },
});
```

## Theme Tokens

### Colors

Colors are defined in the `tokens.color` section and themed variants in `themes.light` and `themes.dark`.

**Semantic Colors** (change based on theme):
- `$background` - Primary background
- `$backgroundSecondary` - Secondary background
- `$backgroundTertiary` - Tertiary background
- `$color` - Primary text color
- `$colorSecondary` - Secondary text color
- `$borderColor` - Border color

**Brand Colors** (from existing palette):
- `$primary`, `$primaryHover`, `$primaryPress`
- `$success`, `$successHover`
- `$warning`, `$warningHover`
- `$error`, `$errorHover`

**Full Color Palette** (all shades):
- `$primary50` through `$primary900`
- `$success50` through `$success900`
- `$warning50` through `$warning900`
- `$error50` through `$error900`
- `$gray50` through `$gray900`

### Spacing

Spacing tokens for margins, paddings, gaps:

- `$xs` (4px)
- `$sm` (8px)
- `$md` (12px)
- `$base` (16px)
- `$lg` (20px)
- `$xl` (24px)
- `$2xl` (32px)
- `$3xl` (40px)
- `$4xl` (48px)
- `$5xl` (64px)
- `$6xl` (80px)

Also supports numeric values: `$1`, `$2`, `$3`, etc.

### Border Radius

- `$none` (0)
- `$sm` (4px)
- `$base` (8px)
- `$md` (12px)
- `$lg` (16px)
- `$xl` (24px)
- `$full` (9999px - fully rounded)

### Typography

**Font Sizes**:
- `$xs` (12px)
- `$sm` (14px)
- `$base` (16px)
- `$lg` (18px)
- `$xl` (20px)
- `$2xl` (24px)
- `$3xl` (30px)
- `$4xl` (36px)
- `$5xl` (48px)

**Font Weights**:
- `$normal` (400)
- `$medium` (500)
- `$semibold` (600)
- `$bold` (700)

## Using Tokens in Components

### Example: Custom Component with Tamagui

```typescript
import { YStack, XStack, Text } from 'tamagui';

export function MyComponent() {
  return (
    <YStack
      backgroundColor="$background"
      padding="$base"
      borderRadius="$md"
      gap="$sm"
    >
      <Text fontSize="$lg" fontWeight="$semibold" color="$color">
        Title
      </Text>
      <Text fontSize="$base" color="$colorSecondary">
        Description text
      </Text>
    </YStack>
  );
}
```

### Using Theme-Aware Components

Import from `src/components/` to use pre-built components:

```typescript
import { Button } from '../components/Button';
import { Card } from '../components/Card';

<Card elevated>
  <Button variant="primary">Click me</Button>
  <Button variant="secondary">Cancel</Button>
</Card>
```

## Dark/Light Mode

### How It Works

The app automatically detects the system color scheme and applies the appropriate theme:

- **Light mode**: Uses `themes.light` colors
- **Dark mode**: Uses `themes.dark` colors

### Accessing Theme in Components

Use the `useAppTheme` hook:

```typescript
import { useAppTheme } from '../hooks/useAppTheme';

export function MyComponent() {
  const { isDark, colorScheme } = useAppTheme();

  return (
    <Text>
      Current theme: {isDark ? 'Dark' : 'Light'}
    </Text>
  );
}
```

## Updating Theme When Design Assets Arrive

When you receive your Design Assets (DA), follow these steps:

### Step 1: Update Color Tokens

Open `tamagui.config.ts` and update the color values in `tokens.color`:

```typescript
tokens: {
  color: {
    // Update these hex values with your DA colors
    primary500: '#YOUR_PRIMARY_COLOR',
    success500: '#YOUR_SUCCESS_COLOR',
    // ... etc
  }
}
```

### Step 2: Update Light/Dark Theme Colors

Update the `themes.light` and `themes.dark` objects:

```typescript
const lightColors = {
  background: '#YOUR_LIGHT_BG',
  color: '#YOUR_LIGHT_TEXT',
  primary: '#YOUR_PRIMARY',
  // ...
};

const darkColors = {
  background: '#YOUR_DARK_BG',
  color: '#YOUR_DARK_TEXT',
  primary: '#YOUR_PRIMARY_DARK',
  // ...
};
```

### Step 3: Update Typography (if needed)

If your DA includes custom fonts:

1. Add font files to `assets/fonts/`
2. Update `app.config.ts` to load fonts
3. Update `tamagui.config.ts` fonts configuration:

```typescript
fonts: {
  body: {
    family: 'YourCustomFont',
    // ... rest of config
  }
}
```

### Step 4: Update Spacing/Radius (if needed)

Adjust spacing or border radius scales if your DA specifies different values:

```typescript
tokens: {
  space: {
    xs: 6,  // Changed from 4
    sm: 12, // Changed from 8
    // ...
  }
}
```

### Step 5: Test All Platforms

After making changes:

```bash
# Clear cache and restart
npm run clean
npm start

# Test on each platform
npm run ios
npm run android
npm run web
```

## Advanced Customization

### Creating Custom Variants

You can extend Tamagui components with custom variants:

```typescript
import { styled, YStack } from 'tamagui';

export const Container = styled(YStack, {
  variants: {
    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  },
});

// Usage: <Container centered>...</Container>
```

### Accessing Raw Theme Values

```typescript
import { useTheme } from 'tamagui';

const theme = useTheme();
const primaryColor = theme.primary.val; // Gets the hex value
```

## Troubleshooting

### Theme not updating

1. Check that `TamaguiProvider` wraps your app in `app/_layout.tsx`
2. Ensure `app.config.ts` has `userInterfaceStyle: "automatic"`
3. Clear cache: `npm run clean`

### Type errors with tokens

1. Restart TypeScript server
2. Check `tamagui.config.ts` exports `AppConfig` type correctly
3. Ensure declaration merging is present:
   ```typescript
   declare module 'tamagui' {
     interface TamaguiCustomConfig extends AppConfig {}
   }
   ```

### Component not using theme

Make sure you're using `$` prefix for token values:

```typescript
// ✅ Correct
<View backgroundColor="$background" />

// ❌ Wrong
<View backgroundColor="background" />
```

## Resources

- [Tamagui Documentation](https://tamagui.dev)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [Current Theme Tokens](../tamagui.config.ts)

## Migration Checklist

When migrating existing components to Tamagui:

- [ ] Replace `View` with `YStack` or `XStack`
- [ ] Replace `Text` with Tamagui `Text`
- [ ] Use design tokens instead of hardcoded values
- [ ] Test dark/light mode appearance
- [ ] Verify TypeScript types are correct
- [ ] Check animations work properly
- [ ] Test on iOS, Android, and Web
