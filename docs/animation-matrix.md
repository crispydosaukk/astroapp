# Animation matrix

| Source widget / controller | Trigger | From → To | Duration / curve | Repeat | RN implementation |
|---|---|---|---|---|---|
| GoRouter `_slidePage` | push | x 100 %→0 + fade | 300 ms easeOutCubic | – | native-stack `slide_from_right` (no simultaneous fade) |
| Splash/Onboarding page transitions | go | fade (+4 % slide) | 280 / 320 ms | – | native-stack `fade` |
| Splash `_particleController` | mount | twinkle sin | 8 s linear | repeat | `useController` + SVG circles |
| Splash `_logoController` | +300 ms | scale 0.6→1, opacity Interval(0,.7), tagline Interval(.5,1) | 1200 ms easeOutCubic/easeOut | – | `useController` + `interval()` |
| Splash `_sweepController` | +300 ms | sweep 0→2π | 1800 ms easeInOut | – | SVG arc segments |
| AppNavigation pill / label | tab change | bg accent α26, weight 400→700 | 250 / 200 ms easeOutCubic | – | Reanimated `interpolateColor` |
| Onboarding dots | page | width 6→24 | 250 ms easeOutCubic | – | Reanimated width |
| Birth profile progress | step | (n+1)/3 | 400 ms easeOutCubic | – | Reanimated width % |
| Birth profile AnimatedSwitcher | step | slide 5 % + fade | 350 ms easeOutCubic | – | Reanimated `Keyframe` entering |
| Profile type cards / radio / gender pills | select | colours, border | 200 / 180 ms | – | `AnimatedPressable` (Reanimated CSS transitions) |
| Home horoscope chips / card switcher | select | colours / slide 3 % + fade | 200 / 300 ms | – | `AnimatedPressable` / `Keyframe` |
| AI chat bubbles | insert | fade + slide ±6 % | 280 ms, delay i·25 (≤180) | – | `withDelay(withTiming)` |
| AI chat typing dots | typing | bounce staggered | 900 ms | repeat | `useController` |
| AI chat topic chips | select | colours | 180 ms | – | `AnimatedPressable` |
| Live astrologer cards | mount | fade + 5 % slide-up | 400 ms, delay i·60 (≤400) | – | Reanimated |
| Filter sheet / category chips | select | colours | 180 / 200 ms | – | `AnimatedPressable` |
| My Kundli `_chartController` | mount | opacity 0→1, scale 0.8→1 | 1200 ms easeOutCubic | – | Reanimated |
| My Kundli ExpansionTile | tap | expand | ~200 ms | – | `Expandable` + `LinearTransition` |
| Match Kundli `_scoreController` | results | 0→total | 1500 ms easeOutCubic | – | `useController` + `ProgressRing` |
| Match Kundli `_rotateController` | calculating | 0→2π | 3 s linear | repeat | `withRepeat` rotate |
| Horoscope `_fadeController` | zodiac/date change | reverse→swap→forward | 350 ms easeOut | – | shared value + `runOnJS` |
| Horoscope zodiac & date buttons | select | colours/border | 200 ms | – | `AnimatedPressable` |
| Remedies `_pulseController` | mount | scale .95↔1.05 | 1500 ms easeInOut | repeat reverse | `withRepeat(…, true)` |
| Remedies `_wheelController` | mount | rotate 0→0.05·2π | 20 s | repeat | `withRepeat` rotate |
| Consultation `_pulseController` | connected (voice) | scale .95↔1.05 | 1500 ms | repeat reverse | `withRepeat` |
| Consultation `_connectingController` | connecting | ripple scale/opacity, dots | 800 ms linear | repeat | `useController` |
| Consultation control buttons | toggle | colours | 200 ms | – | `AnimatedBox` |
| Theme cards / accent swatches | select | border, shadow | 200 ms | – | `AnimatedPressable` / `AnimatedBox` |
| Tarot Major Arcana card | tap | colours + expand | 200 ms | – | `AnimatedPressable` |
| TabBar indicators (5 screens) | tab | slide | ~300 ms | – | `TabBar` translateX |
| LoadingSkeletonWidget | mount | gradient shift | 1400 ms easeInOutSine | repeat | `LoadingSkeleton` (unused in source screens; ported) |
| Bottom sheets / dialogs | open/close | slide / fade | 250 ms / Modal fade | – | `BottomSheet`, `Dialog` |
