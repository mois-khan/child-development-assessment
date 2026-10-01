const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const regex = /<div className="flex justify-center w-full max-w-\[90%\] mx-auto mb-2 sm:mb-4">\s*<img src="\/ECCTR\.svg" alt="ECCTRACTION PLAN" className="h-auto w-\[250px\] sm:w-\[550px\] print:w-\[550px\] object-contain" \/>\s*<\/div>/;

const replacement = `<div className="relative flex justify-center w-full max-w-[90%] mx-auto mb-2 sm:mb-4 overflow-hidden h-[70px] sm:h-[150px] print:h-[150px]">
                <img src="/ECCTR.svg" alt="ECCTRACTION PLAN" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[750px] print:w-[750px] max-w-none h-auto object-contain" />
              </div>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('components/ReportDocument.tsx', code);
    console.log("Success");
} else {
    console.log("Not matched");
}
