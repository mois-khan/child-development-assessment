const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<div className="flex items-center justify-center w-24 h-24 rounded-full border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435]">{result.overallStatus.replace(/-/g, \'−\')}</div>',
  '<div className="flex items-center justify-center min-w-[120px] px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] whitespace-nowrap">{result.overallStatus.replace(/-/g, \'−\')}</div>'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
