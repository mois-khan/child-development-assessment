const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center">',
  '<main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center print:block">'
);
code = code.replace(
  '<h1 className="text-[6.5rem] font-black uppercase tracking-tight leading-none text-[#4D1435]">',
  '<h1 className="text-[6.5rem] font-black uppercase tracking-normal leading-none text-[#4D1435]">'
);
code = code.replace(
  '<span style={{ WebkitTextStroke: \'3px #4D1435\', color: \'transparent\' }}>ECCTR</span>ACTION',
  '<span style={{ WebkitTextStroke: \'3px #4D1435\', color: \'transparent\' }} className="mr-1">ECCTR</span>ACTION'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
