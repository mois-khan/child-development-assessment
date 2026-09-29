const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const regex1 = /\{\/\* Mascot \/ Divider \*\/\}\s*<div className="w-16 border-r-\[2px\] border-l-\[2px\] border-\[#4D1435\] flex items-center justify-center relative overflow-hidden bg-gray-50">\s*\{idx === Math\.floor\(reversedStages\.length \/ 2\) && \(\s*<span className="absolute rotate-90 text-\[10px\] tracking-\[0\.2em\] font-black text-\[#4D1435\] opacity-50 whitespace-nowrap">\s*HUMANOID PICTURE\s*<\/span>\s*\)\}\s*<\/div>/g;

content = content.replace(regex1, '');

fs.writeFileSync('components/ReportDocument.tsx', content);
