const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<h1 className="text-[6.5rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">',
  '<h1 className="text-[7.5rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
