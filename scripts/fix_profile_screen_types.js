const fs = require('fs');

const profileScreenPath = 'c:/Users/PC/Desktop/astroparihar-app/src/features/profile/ProfileScreen.tsx';

let code = fs.readFileSync(profileScreenPath, 'utf8');

// 1. Fix language import
code = code.replace(
  "import { APP_LANGUAGES, AppLanguage, useLanguageStore, useTranslation } from '@/theme/languageStore';",
  "import { AppLanguage, useLanguageStore, useTranslation } from '@/theme/languageStore';"
);

// 2. Add local APP_LANGUAGES constant
const appLanguagesConst = `
const APP_LANGUAGES: { name: AppLanguage; nativeName: string }[] = [
  { name: 'Telugu', nativeName: 'తెలుగు' },
  { name: 'Hindi', nativeName: 'हिन्दी' },
  { name: 'Tamil', nativeName: 'தமிழ்' },
  { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { name: 'Malayalam', nativeName: 'മലയാളം' },
  { name: 'English', nativeName: 'English' },
];
`;

if (!code.includes('const APP_LANGUAGES')) {
  code = code.replace(
    "const STORAGE_PROFILE_CONFIG_KEY = 'astroparihar_app_profile_config_v2';",
    "const STORAGE_PROFILE_CONFIG_KEY = 'astroparihar_app_profile_config_v2';\n" + appLanguagesConst
  );
}

// 3. Fix theme comparison and types
code = code.replace(
  "const nextTheme = selectedTheme === 'light-vedic' ? 'dark-cosmic' : 'light-vedic';",
  "const nextTheme = selectedTheme === 'Light Vedic' ? 'Dark Cosmic' : 'Light Vedic';"
);
code = code.replace(
  "`Theme switched to ${nextTheme === 'light-vedic' ? 'Light Vedic' : 'Dark Cosmic'}`",
  "`Theme switched to ${nextTheme}`"
);
code = code.replace(
  "trailingValue = selectedTheme === 'light-vedic' ? 'Light' : 'Dark';",
  "trailingValue = selectedTheme === 'Light Vedic' ? 'Light' : 'Dark';"
);

fs.writeFileSync(profileScreenPath, code, 'utf8');
console.log('Fixed theme and language imports in ProfileScreen.tsx');
