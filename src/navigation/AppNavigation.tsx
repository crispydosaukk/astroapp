/**
 * Port of lib/widgets/app_navigation.dart — floating glass bottom navigation.
 * 68 px high, 32 px radius, blur σ20, surface @ alpha 217, accent border @ alpha 51,
 * active pill accent @ alpha 26 (AnimatedContainer 250 ms easeOutCubic), label 200 ms.
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { withAlpha } from '@/theme/colors';
import { ralewayFamily } from '@/theme/fonts';
import { useThemeColors } from '@/theme/themeStore';

type TabSpec = { route: string; label: string; icon: string; activeIcon: string; testID: string };

export const TABS: TabSpec[] = [
  { route: 'home-dashboard-screen', label: 'Home', icon: 'home_outlined', activeIcon: 'home_rounded', testID: 'nav.tab.home' },
  { route: 'ai-chat-screen', label: 'AI Astro', icon: 'auto_awesome_outlined', activeIcon: 'auto_awesome', testID: 'nav.tab.aiAstro' },
  { route: 'live-astrologers-screen', label: 'Astrologers', icon: 'people_outline', activeIcon: 'people_rounded', testID: 'nav.tab.astrologers' },
  { route: 'services-screen', label: 'Services', icon: 'grid_view_outlined', activeIcon: 'grid_view_rounded', testID: 'nav.tab.services' },
  { route: 'profile-screen', label: 'Profile', icon: 'person_outline_rounded', activeIcon: 'person_rounded', testID: 'nav.tab.profile' },
];

function TabItem({
  spec, active, onPress, accent, muted,
}: { spec: TabSpec; active: boolean; onPress: () => void; accent: string; muted: string }) {
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [active, p]);
  // Computed on the JS thread: plain JS helpers must not be called inside a UI-thread worklet.
  const pillColor = withAlpha(accent, 26);
  const pill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(0,0,0,0)', pillColor]),
  }));
  const color = active ? accent : muted;
  return (
    <Pressable
      testID={spec.testID}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[{ flex: 1, marginHorizontal: 4, marginVertical: 8, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, pill]}
      >
        <AppIcon name={active ? spec.activeIcon : spec.icon} color={color} size={22} />
        <Animated.Text
          allowFontScaling={false}
          style={{ marginTop: 3, fontSize: 10, color, fontFamily: ralewayFamily(active ? 700 : 400) }}
        >
          {spec.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function AppNavigation({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { accent, surface, textMuted } = useThemeColors();
  const currentName = state.routes[state.index]?.name;

  const onTabTap = (spec: TabSpec) => {
    const route = state.routes.find((r) => r.name === spec.route);
    if (!route) return;
    const isActive = currentName === spec.route;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    // goBranch(index, initialLocation: index == currentIndex): each branch holds a single route,
    // so re-selecting the active tab is a no-op beyond the tabPress event (scroll-to-top hook).
    if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 12 }}
    >
      <View style={{ height: 68, borderRadius: 32, overflow: 'hidden' }}>
        <BlurView
          intensity={60}
          tint="dark"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            flex: 1, flexDirection: 'row', borderRadius: 32, borderWidth: 1,
            borderColor: withAlpha(accent, 51), backgroundColor: withAlpha(surface, 217),
          }}
        >
          {TABS.map((t) => (
            <TabItem key={t.route} spec={t} active={currentName === t.route} onPress={() => onTabTap(t)} accent={accent} muted={textMuted} />
          ))}
        </View>
      </View>
    </View>
  );
}
