const fs = require('fs');
const path = require('path');

const file = 'c:/Users/PC/Desktop/astroparihar/src/app/admin-panel/components/AdminContent.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import AdminAppCosmicInsightsEditor from './AdminAppCosmicInsightsEditor';\\nimport AdminAppReviewsEditor from './AdminAppReviewsEditor';",
  "import AdminAppCosmicInsightsEditor from './AdminAppCosmicInsightsEditor';\nimport AdminAppReviewsEditor from './AdminAppReviewsEditor';"
);

code = code.replace(
  "activeTab === 'tab-app-cosmic-insights' ||\\n    activeTab === 'tab-app-reviews';",
  "activeTab === 'tab-app-cosmic-insights' ||\n    activeTab === 'tab-app-reviews';"
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed newlines in AdminContent.tsx');
