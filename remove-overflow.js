const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
content = content.replace(/<div className="w-full overflow-x-auto overflow-y-hidden pb-4 -mb-4">/g, '<div className="w-full">');
fs.writeFileSync('components/ReportDocument.tsx', content);
