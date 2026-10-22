# Source-inert controls

The Flutter source contains **33 empty-callback call sites** (`onPressed: () {}` / `onTap: () {}`), found with
`grep -rn "onPressed: () {}\|onTap: () {}" lib/`. Some call sites render several controls (e.g. one `_securityTile`
helper renders 3 tiles), so the RN app has more inert *controls* than call sites.

Each inert control keeps its visual affordance and calls `SOURCE_INERT('<id>')` (`src/utils/sourceInert.ts`),
which does nothing except log in `__DEV__`. **No backend or product behaviour was invented.**

| # | Flutter file | Control | RN id(s) |
|---|---|---|---|
| 1–3 | ai_chat_screen/widgets/chat_input_widget.dart | Emoji, attach, camera icons | `aiChat.input.emoji`, `aiChat.input.attach`, `aiChat.input.camera` |
| 4 | consultation_screen.dart | Rating stars in "Session Ended" dialog (×5) | `consultation.endDialog.star.0…4` |
| 5 | consultation_screen.dart | User PiP tap | `consultation.pip` |
| 6 | home_dashboard_screen/widgets/ai_prompt_card_widget.dart | Mic button | `home.aiPrompt.mic` |
| 7–8 | match_kundli_screen.dart | "Get Detailed Compatibility Report — ₹399", "🤖 Ask AI About This Match" | `matchKundli.detailedReport`, `matchKundli.askAi` |
| 9–13 | my_kundli_screen.dart | App-bar share, app-bar download, Edit, "Ask AI About My Kundli", "Get Detailed Report — ₹499" | `myKundli.share`, `myKundli.download`, `myKundli.edit`, `myKundli.askAi`, `myKundli.detailedReport` |
| 14–16 | panchang_screen.dart | App-bar location, app-bar share, "Share Today's Panchang" | `panchang.location`, `panchang.shareAppBar`, `panchang.share` |
| 17 | profile_screen.dart | Settings icon | `profile.settings` |
| 18 | profile_screens/birth_profiles_screen.dart | "View Kundli" | `birthProfiles.viewKundli` |
| 19 | profile_screens/consultation_history_screen.dart | "Book Again" | `consultationHistory.bookAgain` |
| 20–21 | profile_screens/match_reports_screen.dart | "View Details", "Full Report" | `matchReports.viewDetails`, `matchReports.fullReport` |
| 22 | profile_screens/privacy_security_screens.dart | `_dataTile` → Download My Data, Delete My Account | `privacy.downloadData`, `privacy.deleteAccount` |
| 23 | profile_screens/privacy_security_screens.dart | `_securityTile` → Change Password / Phone / Email | `security.changePassword`, `security.changePhone`, `security.changeEmail` |
| 24 | profile_screens/privacy_security_screens.dart | Session "Revoke" | `security.revoke` |
| 25–26 | profile_screens/saved_astrologers_screen.dart | Chat, Call | `savedAstrologers.chat`, `savedAstrologers.call` |
| 27 | profile_screens/wallet_screen.dart | Coupon "Apply" | `wallet.coupon.apply` |
| 28 | remedies_screen/remedies_screen.dart | "Discover Your Remedies ✨" | `remedies.discover` |
| 29–31 | remedies_screen/remedy_detail_screen.dart | "Get My Personalised Report", "🤖 Ask AI", "👨‍🔮 Astrologer" | `remedyDetail.report`, `remedyDetail.askAi`, `remedyDetail.astrologer` |
| 32 | service_detail_screens.dart | "Get Report" (×6 report cards) | `astrologyReports.getReport` |
| 33 | services_screen.dart | App-bar search | `services.search` |

## Related: controls that are no-ops for other reasons (also preserved)

| Flutter location | Behaviour in source | RN |
|---|---|---|
| birth_profiles_screen.dart – PopupMenu "Edit Profile" | `onSelected` ignores `'edit'` | `SOURCE_INERT('birthProfiles.menu.edit')` |
| my_kundli_screen.dart – planet/house sheet buttons ("Ask AI About This Planet", "Close") | just `Navigator.pop` | close the sheet |
| birth_profiles_screen.dart – Add-profile sheet rows | just `Navigator.pop` | close the sheet |
| wallet_screen.dart – payment sheet rows | pop + SnackBar "Payment gateway integration required" | same (no gateway invented) |
| astrologers_filter_sheet_widget.dart – Sort/Price/Gender/Language chips | local state only, never applied to the list | same |

## Display-only (no gesture handler at all in source)

Rendered without a press handler: Home notification bell, Home carousel cards + "Chat" pill, Home personalised
recommendation rows, Astrologer Detail share button, Kundli Reports view/download icons and "Buy" pills,
Wallet payment-method list tiles, Help Centre topic tiles, Contact Support option pills.
