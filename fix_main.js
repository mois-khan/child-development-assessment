const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center print:block">',
  '<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center print:block print:min-h-0">'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
