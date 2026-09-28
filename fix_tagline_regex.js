const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const regex = /<div className="w-full mt-12 mb-16 flex items-baseline justify-center gap-4 whitespace-nowrap">[\s\S]*?<\/h2>\s*<\/div>/;

const newBlock = `<div className="w-full mt-12 mb-16 flex justify-center">
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-4 whitespace-nowrap">
                <h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435]" style={{ fontSize: "5rem" }}>
                  <span style={{ WebkitTextStroke: '3px #4D1435', color: 'white', marginRight: '2px' }}>ECCTR</span>ACTION
                </h1>
                <h2 className="font-bold uppercase text-[#4D1435] tracking-widest" style={{ fontSize: "2.2rem" }}>Plan</h2>
              </div>
              <div className="bg-[#FFE600] text-[#4D1435] tracking-[0.2em] font-bold px-3 py-[2px] mt-1 text-[0.8rem] whitespace-nowrap">
                EARLY&nbsp;&nbsp;CHILDHOOD&nbsp;&nbsp;COMPETENCE&nbsp;&nbsp;TRACKING&nbsp;&nbsp;REPORT
              </div>
            </div>
          </div>`;

code = code.replace(regex, newBlock);
fs.writeFileSync('components/ReportDocument.tsx', code);
