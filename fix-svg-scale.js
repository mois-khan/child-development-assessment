const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const regex = /<div className="relative flex justify-center w-full max-w-\[90%\] mx-auto mb-2 sm:mb-4 overflow-hidden h-\[70px\] sm:h-\[150px\] print:h-\[150px\]">[\s\S]*?<\/div>/;

const replacement = `<div className="relative flex justify-center w-full max-w-[320px] sm:max-w-[750px] print:max-w-[750px] mx-auto mb-2 sm:mb-4 overflow-hidden h-[80px] sm:h-[180px] print:h-[180px]">
                <img src="/ECCTR.svg" alt="ECCTRACTION PLAN" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto object-contain scale-[1.5] sm:scale-[1.8] print:scale-[1.8]" />
              </div>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('components/ReportDocument.tsx', code);
    console.log("Success");
} else {
    console.log("Not matched");
}
