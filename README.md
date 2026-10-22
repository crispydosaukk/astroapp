# AstroParihar — React Native (Expo) port

TypeScript port of the Flutter `astroparihar` app, following `astroparihar_flutter_to_react_native_migration_plan.md`.
Stack: Expo SDK 54 · expo-router 6 · React Native 0.81 (New Architecture) · Reanimated 4 · Zustand · AsyncStorage ·
react-native-svg · expo-image · expo-blur · expo-linear-gradient · @expo-google-fonts/raleway.

## Run

```bash
npm install
npx expo install --fix      # aligns every native package with the installed Expo SDK
npx expo start              # Expo Go / dev client
# or native builds
npx expo run:android
npx expo run:ios
```

> `@react-native-community/datetimepicker` and `expo-blur` need a dev client / native build if your Expo Go version
> doesn't bundle them. `npx tsc --noEmit` runs the type check.

## Layout

```
app/                      expo-router routes (1 file per Flutter GoRouter path, identical URLs)
  _layout.tsx             root stack: fonts, theme rehydration, portrait lock, error boundary, snackbar/picker hosts
  (tabs)/_layout.tsx      5-tab shell (StatefulShellRoute) with the floating glass AppNavigation
src/
  components/             Text, AppIcon, AppImage, AppBar, AnimatedBox, overlays (sheet/dialog/snackbar/popup),
                          pickers, Tabs, tiles, fields, common (EmptyState, StatusBadge, Skeleton, buttons, rings)
  features/<screen>/      one folder per Flutter presentation folder
  data/                   shared demo datasets (astrologers, remedies)
  navigation/             AppRoutes, push/go/pop/useExtra helpers, AppNavigation (bottom bar)
  theme/                  AppTheme colours, persisted theme/accent store, fonts
  utils/                  animation helpers, SOURCE_INERT marker
docs/                     the 8 ledgers required by the migration plan
```

## Behaviour guarantees

* All 41 routes + the code-reachable `RemedyDetailScreen` (`/remedy-detail-screen`).
* Payloads preserved: astrologer → detail; `{type, astrologer}` → consultation; remedy → remedy detail.
* AI chat stays local and deterministic (1800 ms delay, 4 branches) — no API added.
* Theme + accent persist (AsyncStorage) and rehydrate before the native splash hides.
* 33 empty Flutter callbacks are kept visible and marked `SOURCE_INERT` (see `docs/source-inert-controls.md`).
* Known deviations are listed in `docs/migration-status.md`.

## Verification status

TypeScript syntax/structure was checked against stubbed library typings in the authoring environment (no network
there, so `npm install` and device builds could not run). Run `npx tsc --noEmit` and the Android/iOS builds after
installing; all screens are marked `READY_FOR_QA` until that QA pass is done.
