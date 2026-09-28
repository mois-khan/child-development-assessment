const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<h1 className="text-[13rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">',
  '<h1 className="text-[52rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">'
);
code = code.replace(
  '<h2 className="text-[5.5rem] font-bold uppercase text-[#4D1435] tracking-widest">Plan</h2>',
  '<h2 className="text-[22rem] font-bold uppercase text-[#4D1435] tracking-widest">Plan</h2>'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
