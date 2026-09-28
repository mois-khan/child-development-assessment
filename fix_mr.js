const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  'className="mr-1">ECCTR</span>ACTION',
  'className="mr-3 pr-2">ECCTR</span>ACTION'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
