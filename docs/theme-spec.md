# Theme spec

`src/theme/colors.ts` = `AppTheme` constants. `src/theme/themeStore.ts` = `ThemeProvider`
(Zustand + AsyncStorage keys `selected_theme`, `selected_accent`; rehydrated before the splash screen hides).

| Theme | background | surface | surfaceVariant | text primary/secondary/muted |
|---|---|---|---|---|
| Light Vedic (default) | #FAF9F6 | #FFFFFF | #F5F2EB | #1A1A2E / #383852 / #5D6679 |
| Dark Cosmic | #080D1A | #0D1B2A | #1A2640 | #F0EAD6 / #A0A8C0 / #7E8BA8 |

Accents: Sacred Gold #C9A84C, Cosmic Purple #9370DB, Divine Red #8B1A1A, Celestial Blue #4FC3F7, Emerald #2D9E6B, Saffron #FFB347.

**Parity note:** in Flutter only `AppScaffold`, `AppNavigation` and `ThemeScreen` read the provider; every other screen
uses the fixed `AppTheme` dark palette. RN reproduces exactly that (tab background, floating nav, Theme screen, status bar).
Making every screen theme-aware would be a product change, so it was not done.

Typography: Raleway bundled through `@expo-google-fonts/raleway` (300–900). `src/components/Text.tsx` maps
`fontWeight` → family (Android ignores weight on custom fonts) and disables font scaling (`TextScaler.linear(1.0)`).
