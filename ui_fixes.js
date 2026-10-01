const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// 1. Logo size and margins
content = content.replace('<Wordmark height={256} />', '<Wordmark height={140} />');
content = content.replace('text-center mt-12 mb-8 flex justify-center', 'text-center mt-4 mb-4 flex justify-center');
content = content.replace('w-full mt-12 mb-16 flex justify-center', 'w-full mt-4 mb-10 flex justify-center');
content = content.replace('className="mt-20"', 'className="mt-12"');

// 2. Grades formatting with minus sign and percent
const overallPercentSnippet = `{Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1))}%`;

// For page 2 header overall status
const s1 = `<div className="flex items-center justify-center min-w-[100px] px-4 h-[80px] rounded-2xl border-[4px] border-[#4D1435] text-4xl font-black text-[#4D1435] bg-white flex-wrap sm:flex-nowrap">{result.overallStatus.replace(/-/g, '-')}</div>`;
const r1 = `<div className="flex items-center justify-center min-w-[100px] w-auto px-4 h-[80px] rounded-2xl border-[4px] border-[#4D1435] text-4xl font-black text-[#4D1435] bg-white flex-wrap sm:flex-nowrap whitespace-nowrap whitespace-nowrap">{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-xl ml-2 font-bold text-gray-500">({${overallPercentSnippet}})</span></div>`;
content = content.replace(s1, r1);

// For domain mini charts status
const s2 = `<div className="flex items-center justify-center min-w-[70px] px-3 h-[56px] rounded-xl border-[3px] border-[#4D1435] text-2xl font-black text-[#4D1435] flex-wrap sm:flex-nowrap">{STATUSES[score.status].code.replace(/-/g, '-')}</div>`;
const r2 = `<div className="flex items-center justify-center min-w-[70px] w-auto px-3 h-[56px] rounded-xl border-[3px] border-[#4D1435] text-2xl font-black text-[#4D1435] flex-wrap sm:flex-nowrap whitespace-nowrap whitespace-nowrap">{STATUSES[score.status].code.replace(/-/g, '\\u2212')} <span className="text-sm ml-1 font-bold text-gray-500">({Math.round(score.percent)}%)</span></div>`;
content = content.replace(s2, r2);

// For overall status on page 5
const s3 = `<div className="flex items-center justify-center min-w-[120px] px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] flex-wrap sm:flex-nowrap">{result.overallStatus.replace(/-/g, '-')}</div>`;
const r3 = `<div className="flex items-center justify-center min-w-[120px] w-auto px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] flex-wrap sm:flex-nowrap whitespace-nowrap">{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-2xl ml-3 font-bold text-gray-500">({${overallPercentSnippet}})</span></div>`;
content = content.replace(s3, r3);


// 3. Disclaimer on new page
const s4 = `<div className="mt-auto pt-8 border-t-[3px] border-[#4D1435]">
               <h4 className="text-lg font-bold uppercase text-[#4D1435] tracking-wider mb-3">Disclaimer:</h4>
               <p className="text-[0.85rem] leading-relaxed text-gray-600 text-justify">
                 {DISCLAIMER}
               </p>
               <p className="mt-4 text-[0.85rem] text-gray-500 font-medium">
                  Milestones adapted from the CDC <em>Learn the Signs. Act Early.</em> checklists, the NIDCD hearing and communication checklist, and WHO motor milestone data.
               </p>
             </div>
          </A4Page>`;

const r4 = `</A4Page>

          {/* Page 6: Disclaimer */}
          <A4Page>
             <div className="pt-8">
               <h4 className="text-lg font-bold uppercase text-[#4D1435] tracking-wider mb-3">Disclaimer:</h4>
               <p className="text-[0.85rem] leading-relaxed text-gray-600 text-justify whitespace-pre-wrap">
                 {DISCLAIMER}
               </p>
               <p className="mt-4 text-[0.85rem] text-gray-500 font-medium">
                  Milestones adapted from the CDC <em>Learn the Signs. Act Early.</em> checklists, the NIDCD hearing and communication checklist, and WHO motor milestone data.
               </p>
             </div>
          </A4Page>`;

// Just in case spacing is different, let's use a simpler replace
const s4_regex = /<div className="mt-auto pt-8 border-t-\[3px\] border-\[\#4D1435\]">\s*<h4 className="text-lg font-bold uppercase text-\[\#4D1435\] tracking-wider mb-3">Disclaimer:<\/h4>\s*<p className="text-\[0\.85rem\] leading-relaxed text-gray-600 text-justify">\s*\{DISCLAIMER\}\s*<\/p>\s*<p className="mt-4 text-\[0\.85rem\] text-gray-500 font-medium">\s*Milestones adapted from the CDC <em>Learn the Signs\. Act Early\.<\/em> checklists, the NIDCD hearing and communication checklist, and WHO motor milestone data\.\s*<\/p>\s*<\/div>\s*<\/A4Page>/g;

content = content.replace(s4_regex, r4);

fs.writeFileSync('components/ReportDocument.tsx', content);
