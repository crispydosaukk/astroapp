# Navigation matrix

All 41 GoRouter paths exist as expo-router files under `app/` with identical URLs, plus the code-reachable
`RemedyDetailScreen` (`/remedy-detail-screen`). Helpers live in `src/navigation/routes.ts`:
`push(route, extra?)` ≙ `context.push`, `go(route)` ≙ `context.go` (dismisses stack + replace), `pop()` ≙ `context.pop`,
`useExtra<T>()` ≙ `state.extra` (JSON-serialised param `extra`).

| Flutter path | RN file | Shell | Transition (Flutter → RN) |
|---|---|---|---|
| `/` | app/index.tsx | root | fade 280 ms → `fade` (280 ms iOS) |
| `/splash-screen` | app/splash-screen.tsx | root | fade 280 ms → `fade` |
| `/onboarding-screen` | app/onboarding-screen.tsx | root | slide 4 % + fade 320 ms → `fade` 320 ms |
| `/birth-profile-setup-screen` | app/birth-profile-setup-screen.tsx | root | slide 4 % + fade 320 ms → `fade` 320 ms |
| `/home-dashboard-screen` | app/(tabs)/home-dashboard-screen.tsx | tab 0 | indexed stack |
| `/ai-chat-screen` | app/(tabs)/ai-chat-screen.tsx | tab 1 | indexed stack |
| `/live-astrologers-screen` | app/(tabs)/live-astrologers-screen.tsx | tab 2 | indexed stack |
| `/services-screen` | app/(tabs)/services-screen.tsx | tab 3 | indexed stack |
| `/profile-screen` | app/(tabs)/profile-screen.tsx | tab 4 | indexed stack |
| all 33 other paths + `/remedy-detail-screen` | app/<path>.tsx | root stack | slide+fade 300 ms easeOutCubic → `slide_from_right` 300 ms |

## Navigation calls (source → target)

| From | Control | Call | Target |
|---|---|---|---|
| Splash | timer 2800 ms | go | /onboarding-screen |
| Onboarding | Get Started (last slide) | go | /birth-profile-setup-screen |
| Onboarding | Sign In | go | /home-dashboard-screen |
| Birth Profile | Skip / Complete Setup | go | /home-dashboard-screen |
| Birth Profile | Back on step 1 | go | /onboarding-screen |
| Home | View Today's Guidance, Ask AI Astrologer, Quick Action "AI Astrologer" | push | /ai-chat-screen |
| Home | View All, Quick Action "Talk to Astrologer" | push | /live-astrologers-screen |
| Home | Quick Actions My Kundli / Match Kundli / Panchang / Remedies | push | resp. routes |
| Home | View Full Horoscope | push | /horoscope-screen |
| AI Chat | back | pop, else go | home (see deviations) |
| Live Astrologers | card / Chat / Call | push + extra astrologer | /astrologer-detail-screen |
| Services | 23 cards | push | exact route per card (Vastu…Dāna & Seva → /remedies-screen) |
| Profile | 20 menu rows | push | per row (Wallet/Transactions/Payment Methods → /wallet-screen; FAQs → /help-centre-screen) |
| Profile | Sign Out dialog → Sign Out | go | `/` |
| Horoscope | Ask AI / Talk to Astrologer | push | /ai-chat-screen, /live-astrologers-screen |
| Remedies | wheel node / grid card | push + extra remedy | /remedy-detail-screen |
| Astrologer Detail | sheet Proceed (Chat / Call / Book) | push + `{type, astrologer}` | /consultation-screen (voice / voice / video) |
| Consultation | Cancel (connecting) / Done (dialog) | pop | previous |
| Match Reports | New Match, Match Kundli Now | push | /match-kundli-screen |
| Saved Astrologers | Find More, Find Astrologers | go | /live-astrologers-screen |
| Privacy | Privacy Policy / Terms rows | push | /privacy-policy-screen, /terms-screen |
| Help Centre | Need more help? | push | /contact-support-screen |
| Service detail ×9 | Chat Now / Consult Now | push | /live-astrologers-screen |
| Error screen | Back | pop, else replace | `/` |

## Payloads

| Destination | Payload | Missing-payload fallback (same as Flutter) |
|---|---|---|
| AstrologerDetail | `AstrologerData` | `_defaultData` (Swami Shankarananda Giri) |
| Consultation | `{ type: 'voice' \| 'video', astrologer }` | type → video; `_defaultAstrologer` |
| RemedyDetail | `Remedy` (colour serialised as hex) | Flutter required it; RN shows a "Remedy not found" empty state |
