const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  '<h1 className="text-[26rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">',
  '<h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435]" style={{ fontSize: "6rem" }}>'
);
code = code.replace(
  '<h2 className="text-[10rem] font-bold uppercase text-[#4D1435] tracking-widest">Plan</h2>',
  '<h2 className="font-bold uppercase text-[#4D1435] tracking-widest" style={{ fontSize: "2.5rem" }}>Plan</h2>'
);
code = code.replace(
  '<span style={{ WebkitTextStroke: \'6px #4D1435\', color: \'white\', marginRight: \'8px\' }}>ECCTR</span>',
  '<span style={{ WebkitTextStroke: \'3px #4D1435\', color: \'white\', marginRight: \'2px\' }}>ECCTR</span>'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
