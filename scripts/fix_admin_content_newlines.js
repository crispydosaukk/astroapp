const fs = require('fs');
const path = require('path');

const adminContentPath = 'c:/Users/PC/Desktop/astroparihar/src/app/admin-panel/components/AdminContent.tsx';
let content = fs.readFileSync(adminContentPath, 'utf8');

content = content.replace(
  "import AdminAppServicesEditor from './AdminAppServicesEditor';\\nimport AdminAppProfileEditor from './AdminAppProfileEditor';",
  "import AdminAppServicesEditor from './AdminAppServicesEditor';\nimport AdminAppProfileEditor from './AdminAppProfileEditor';"
);

content = content.replace(
  "{activeTab === 'tab-app-services' && <AdminAppServicesEditor />}\\n        {activeTab === 'tab-app-profile' && <AdminAppProfileEditor />}",
  "{activeTab === 'tab-app-services' && <AdminAppServicesEditor />}\n        {activeTab === 'tab-app-profile' && <AdminAppProfileEditor />}"
);

fs.writeFileSync(adminContentPath, content, 'utf8');
console.log('Fixed newlines in AdminContent.tsx');
