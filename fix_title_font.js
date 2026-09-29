const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// The current title code from fix_title_scale.js
code = code.replace(
  '<div className="w-full mt-12 mb-16 flex items-baseline justify-center gap-[0.5rem] whitespace-nowrap">',
  '<div className="w-full mt-12 mb-16 flex items-baseline justify-center gap-4 whitespace-nowrap">'
);
code = code.replace(
  '<h1 className="text-[5.5rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]" style={{ transform: "scaleY(1.3)", transformOrigin: "bottom" }}>',
  '<h1 className="text-[6.5rem] font-black uppercase tracking-tighter leading-none text-[#4D1435]">'
);
code = code.replace(
  '<h2 className="text-[2.5rem] font-bold uppercase text-[#4D1435] tracking-widest" style={{ transform: "scaleY(1.3)", transformOrigin: "bottom" }}>Plan</h2>',
  '<h2 className="text-[3rem] font-bold uppercase text-[#4D1435] tracking-widest">Plan</h2>'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
