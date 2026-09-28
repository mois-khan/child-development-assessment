const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<div className="text-center mt-12 mb-16 flex flex-wrap items-baseline justify-center gap-4">',
  '<div className="w-full mt-12 mb-16 flex items-baseline justify-center gap-3 whitespace-nowrap">'
);
code = code.replace(
  '<h1 className="text-[6.5rem] font-black uppercase tracking-normal leading-none text-[#4D1435]">',
  '<h1 className="text-[8.5rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">'
);
code = code.replace(
  '<span style={{ WebkitTextStroke: \'3px #4D1435\', color: \'transparent\' }} className="mr-3 pr-2">ECCTR</span>ACTION',
  '<span style={{ WebkitTextStroke: \'4px #4D1435\', color: \'transparent\', marginRight: \'4px\' }}>ECCTR</span>ACTION'
);
code = code.replace(
  '<h2 className="text-[3rem] font-bold uppercase text-[#4D1435] tracking-[0.2em]">Plan</h2>',
  '<h2 className="text-[4rem] font-bold uppercase text-[#4D1435] tracking-widest">Plan</h2>'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
