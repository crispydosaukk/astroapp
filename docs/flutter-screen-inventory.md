# Flutter → RN screen inventory

| # | Flutter class (file) | RN component | Route |
|---|---|---|---|
| 01 | SplashScreen (splash_screen.dart) | src/features/splash/SplashScreen.tsx | `/`, `/splash-screen` |
| 02 | OnboardingScreen + OnboardingSlideWidget | src/features/onboarding/OnboardingScreen.tsx | `/onboarding-screen` |
| 03 | BirthProfileSetupScreen + ProfileTypeSelector/BirthDetailsForm/BirthPlace widgets | src/features/birthProfile/BirthProfileSetupScreen.tsx | `/birth-profile-setup-screen` |
| 04 | HomeDashboardScreen + 7 widgets | src/features/home/HomeDashboardScreen.tsx | `/home-dashboard-screen` |
| 05 | AiChatScreen + 5 widgets | src/features/aiChat/AiChatScreen.tsx | `/ai-chat-screen` |
| 06 | LiveAstrologersScreen + 4 widgets | src/features/liveAstrologers/LiveAstrologersScreen.tsx | `/live-astrologers-screen` |
| 07 | ServicesScreen | src/features/services/ServicesScreen.tsx | `/services-screen` |
| 08 | ProfileScreen | src/features/profile/ProfileScreen.tsx | `/profile-screen` |
| – | AppNavigation + AppScaffold | src/navigation/AppNavigation.tsx, app/(tabs)/_layout.tsx | tab shell |
| 09 | MyKundliScreen (+ _VedicChartPainter, planet/house sheets) | src/features/myKundli/MyKundliScreen.tsx | `/my-kundli-screen` |
| 10 | MatchKundliScreen | src/features/matchKundli/MatchKundliScreen.tsx | `/match-kundli-screen` |
| 11 | HoroscopeScreen | src/features/horoscope/HoroscopeScreen.tsx | `/horoscope-screen` |
| 12 | PanchangScreen | src/features/panchang/PanchangScreen.tsx | `/panchang-screen` |
| 13 | RemediesScreen | src/features/remedies/RemediesScreen.tsx | `/remedies-screen` |
| 14 | RemedyDetailScreen (Navigator.push only) | src/features/remedies/RemedyDetailScreen.tsx | `/remedy-detail-screen` (new path) |
| 15 | AstrologerDetailScreen | src/features/astrologerDetail/AstrologerDetailScreen.tsx | `/astrologer-detail-screen` |
| 16 | ConsultationScreen | src/features/consultation/ConsultationScreen.tsx | `/consultation-screen` |
| 17 | BirthProfilesScreen | src/features/profileScreens/BirthProfilesScreen.tsx | `/birth-profiles-screen` |
| 18 | KundliReportsScreen | …/KundliReportsScreen.tsx | `/kundli-reports-screen` |
| 19 | MatchReportsScreen | …/MatchReportsScreen.tsx | `/match-reports-screen` |
| 20 | SavedAstrologersScreen | …/SavedAstrologersScreen.tsx | `/saved-astrologers-screen` |
| 21 | ConsultationHistoryScreen | …/ConsultationHistoryScreen.tsx | `/consultation-history-screen` |
| 22 | WalletScreen | …/WalletScreen.tsx | `/wallet-screen` |
| 23 | NotificationsScreen (+ NotificationSettingsContent) | …/NotificationsScreen.tsx | `/notifications-screen` |
| 24 | NotificationSettingsScreen | …/NotificationsScreen.tsx (named export) | `/notification-settings-screen` |
| 25 | LanguageScreen | …/PreferencesScreens.tsx | `/language-screen` |
| 26 | ThemeScreen | …/PreferencesScreens.tsx | `/theme-screen` |
| 27 | PrivacyScreen | …/PrivacySecurityScreens.tsx | `/privacy-screen` |
| 28 | SecurityScreen | …/PrivacySecurityScreens.tsx | `/security-screen` |
| 29 | HelpCentreScreen | …/SupportLegalScreens.tsx | `/help-centre-screen` |
| 30 | ContactSupportScreen | …/SupportLegalScreens.tsx | `/contact-support-screen` |
| 31 | TermsOfServiceScreen | …/SupportLegalScreens.tsx | `/terms-screen` |
| 32 | PrivacyPolicyScreen | …/SupportLegalScreens.tsx | `/privacy-policy-screen` |
| 33–41 | Career/Marriage/Business/Finance Astrology, Tarot, Numerology, Muhurat, Spiritual Guidance, Astrology Reports | src/features/serviceDetails/ServiceDetailScreens.tsx | 9 routes |

## Shared widgets

| Flutter | RN |
|---|---|
| custom_icon_widget.dart (name → IconData map, 469 KB) | src/components/AppIcon.tsx (name → @expo/vector-icons glyph resolver) |
| custom_image_widget.dart | src/components/AppImage.tsx (expo-image, disk cache, no-image fallback) |
| custom_error_widget.dart + ErrorWidget.builder | src/components/ErrorBoundary.tsx |
| empty_state_widget.dart, loading_skeleton_widget.dart, status_badge_widget.dart | src/components/common.tsx |
| theme_provider.dart / app_theme.dart | src/theme/themeStore.ts / src/theme/colors.ts |
| showModalBottomSheet / showDialog / SnackBar / PopupMenuButton | src/components/overlays.tsx |
| showDatePicker / showTimePicker | src/components/pickers.tsx |
| TabBar / TabBarView | src/components/Tabs.tsx |
| ListTile / SwitchListTile | src/components/tiles.tsx |
| AnimatedContainer / AnimatedSwitcher / ExpansionTile | src/components/AnimatedBox.tsx |
