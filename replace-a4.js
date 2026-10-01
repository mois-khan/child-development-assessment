const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// Replace the A4Page className to fix it to 210mm
content = content.replace(
  /className=\{`w-full max-w-\[210mm\] mx-auto bg-white sm:my-8 sm:shadow-lg print:m-0 print:shadow-none relative overflow-hidden break-after-page print:last:break-after-auto text-black flex flex-col p-4 sm:p-\[12mm\] md:p-\[15mm\] border border-gray-200 print:border-none print:h-\[297mm\] print:max-h-\[297mm\] min-h-screen sm:min-h-\[297mm\] h-auto \$\{className\}`\}/g,
  "className={`w-[210mm] mx-auto bg-white my-8 shadow-lg print:my-0 print:shadow-none relative overflow-hidden break-after-page print:last:break-after-auto text-black flex flex-col p-[15mm] border border-gray-200 print:border-none print:h-[297mm] print:max-h-[297mm] min-h-[297mm] ${className}`}"
);

fs.writeFileSync('components/ReportDocument.tsx', content);
console.log('Done');
