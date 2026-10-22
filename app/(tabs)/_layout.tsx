/**
 * Tab shell — port of StatefulShellRoute.indexedStack + lib/widgets/app_scaffold.dart.
 * Scaffold(extendBody: true) → tab bar floats over content (position absolute in AppNavigation).
 * Branch state is preserved because tab screens stay mounted (indexed stack semantics).
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { AppNavigation } from '@/navigation/AppNavigation';
import { useThemeColors } from '@/theme/themeStore';

export default function TabsLayout() {
  const { background } = useThemeColors();
  return (
    <Tabs
      tabBar={(props) => <AppNavigation {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: background }, freezeOnBlur: false }}
    >
      <Tabs.Screen name="home-dashboard-screen" />
      <Tabs.Screen name="ai-chat-screen" />
      <Tabs.Screen name="live-astrologers-screen" />
      <Tabs.Screen name="services-screen" />
      <Tabs.Screen name="profile-screen" />
    </Tabs>
  );
}
