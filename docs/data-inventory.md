# Data inventory

All demo datasets were ported verbatim (no backend added).

| Dataset | Flutter source | RN location |
|---|---|---|
| Onboarding slides (3) | onboarding_screen.dart | OnboardingScreen.tsx `ONBOARDING_SLIDES` |
| Profile types, place suggestions, popular cities | birth_profile_setup widgets | BirthProfileSetupScreen.tsx |
| Quick actions, horoscope categories, recs, carousel astrologers | home widgets | HomeDashboardScreen.tsx |
| AI initial message, topics, prompts, 4 canned replies | ai_chat_screen + widgets | AiChatScreen.tsx (`getAiResponse`, `TYPING_DELAY_MS`) |
| Live astrologers (8), categories (19), filter options | live_astrologers_screen + widgets | src/data/astrologers.ts, LiveAstrologersScreen.tsx |
| Services (23) | services_screen.dart | ServicesScreen.tsx `SERVICES` |
| Profile menus (20 rows) | profile_screen.dart | ProfileScreen.tsx |
| Kundli planets (9), sections (14), interpretations, house info | my_kundli_screen.dart | MyKundliScreen.tsx |
| Guna Milan (8), compatibility areas (6) | match_kundli_screen.dart | MatchKundliScreen.tsx |
| Zodiacs (12), horoscope data (Aries/Taurus/Gemini) | horoscope_screen.dart | HoroscopeScreen.tsx |
| Panchang, sun/moon, timings, choghadiya | panchang_screen.dart | PanchangScreen.tsx |
| Remedies (8) + all detail lists | remedies_screen.dart, remedy_detail_screen.dart | src/data/remedies.ts |
| Astrologer detail reviews/expertise/default data | astrologer_detail_screen.dart | AstrologerDetailScreen.tsx |
| Consultation default astrologer, canned replies | consultation_screen.dart | ConsultationScreen.tsx |
| Profiles, reports, matches, saved, history, wallet, notifications, languages, themes, privacy, FAQs, legal text | profile_screens/*.dart | src/features/profileScreens/* |
| Service detail content (9 screens) | service_detail_screens.dart | ServiceDetailScreens.tsx |

## Remote images
All remote URLs (rocket.new, pexels, pixabay, unsplash) are kept as-is. Failures fall back to `assets/images/no-image.jpg`
(CustomImageWidget behaviour) or to the source's own `errorBuilder` (person icon) where one existed.

## Environment
`env.json` held dummy keys; nothing reads them. `.env.example` lists placeholder names only.
