# Interaction matrix (summary)

Every interactive element carries a stable `testID` (`<screen>.<element>[.<index>]`). Full list of ids:
`grep -rhoE "testID[=:] ?[{\"'\`][^}\"'\`]+" src app`.

| Screen | Interactions (type → effect) |
|---|---|
| Splash | auto-nav (timer) |
| Onboarding | swipe pages; Continue/Get Started; Sign In |
| Birth Profile | back, skip, 5 profile types, name input, 3 gender pills, date picker, time picker, place search + ≤5 suggestions, 6 popular cities, Back/Continue/Complete |
| Home | pull-to-refresh, guidance CTA, 6 quick actions, 5 horoscope chips, View Full Horoscope, AI prompt input, mic (inert), Ask AI Astrologer, View All |
| AI Chat | back, 8 topic chips, 6 suggested prompts, input, send (enabled only with text), emoji/attach/camera (inert) |
| Live Astrologers | search, filter button → sheet (online switch, 4 chip groups, Apply), 19 category chips, cards/Chat/Call, Clear Filters, pull-to-refresh |
| Services | search (inert), 23 cards |
| Profile | settings (inert), 20 menu rows, Sign Out → dialog Cancel/Sign Out |
| My Kundli | back, share/download/edit (inert), chart tap (house), 9 planet chips, 14 expandable sections, Ask AI (inert), detailed report (inert), sheet buttons |
| Match Kundli | back (results → form), 2 name inputs, Calculate (disabled while calculating), report/AI (inert) |
| Horoscope | back, 12 zodiac, 3 date buttons, 5 expandable categories, Ask AI, Talk to Astrologer |
| Panchang | back, location/share (inert), prev/next day, date picker, share (inert) |
| Remedies | back, discover (inert), 8 wheel nodes, 8 grid cards |
| Remedy Detail | back, 3 CTAs (inert) |
| Astrologer Detail | back, bookmark toggle, 3 tabs (tap + swipe), Chat/Call/Book → sheet → Proceed |
| Consultation | Cancel (connecting), mute, camera (video), speaker, chat panel open/close, chat input/send, End → dialog (stars inert, Done) |
| Birth Profiles | back, add (+ button & card) → sheet (5 rows), per-card menu (Edit inert / Set Active / Delete), View Kundli (inert) |
| Kundli Reports | back, 2 tabs |
| Match Reports | back, New Match, View Details/Full Report (inert), empty CTA |
| Saved Astrologers | back, Find More, unsave bookmark, Chat/Call (inert), empty CTA |
| Consultation History | back, 2 tabs, Book Again (inert) |
| Wallet | back, 2 tabs, 6 amounts, Add Money → sheet (3 methods → SnackBar), coupon Apply (inert) |
| Notifications | back, Mark all read, 2 tabs, item tap → read, 10 setting switches |
| Notification Settings | back, 10 switches |
| Language | back, 12 options, Save (SnackBar + pop) |
| Theme | back, 4 themes, 6 accents (persisted) |
| Privacy | back, 6 switches, data rows (inert), policy/terms links |
| Security | back, 3 switches (2FA drives score), 3 account rows (inert), Revoke (inert) |
| Help Centre | back, search + clear, contact banner, 7 FAQ expanders |
| Contact Support | back, subject + description inputs, Submit (SnackBar) |
| Terms / Privacy Policy | back |
| Service details ×9 | back, Chat Now / Consult Now; Tarot 8 cards; Numerology 2 inputs + Calculate; Reports Get Report (inert) |
