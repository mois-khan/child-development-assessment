const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const overallPercentSnippet = `{Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1))}%`;

// For page 2 header overall status
const s1_regex = /<div className="flex items-center justify-center min-w-\[100px\][^>]+>\{result\.overallStatus\.replace\(\/-\/g, '-'\)\}<\/div>/g;
content = content.replace(s1_regex, `<div className="flex items-center justify-center w-auto px-4 h-[80px] rounded-2xl border-[4px] border-[#4D1435] text-4xl font-black text-[#4D1435] bg-white whitespace-nowrap">{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-xl ml-2 font-bold text-gray-500">({${overallPercentSnippet}})</span></div>`);

// For domain mini charts status
const s2_regex = /<div className="flex items-center justify-center min-w-\[70px\][^>]+>\{STATUSES\[score\.status\]\.code\.replace\(\/-\/g, '-'\)\}<\/div>/g;
content = content.replace(s2_regex, `<div className="flex items-center justify-center w-auto px-3 h-[56px] rounded-xl border-[3px] border-[#4D1435] text-2xl font-black text-[#4D1435] whitespace-nowrap">{STATUSES[score.status].code.replace(/-/g, '\\u2212')} <span className="text-sm ml-1 font-bold text-gray-500">({Math.round(score.percent)}%)</span></div>`);

// For overall status on page 5
const s3_regex = /<div className="flex items-center justify-center min-w-\[120px\][^>]+>\{result\.overallStatus\.replace\(\/-\/g, '-'\)\}<\/div>/g;
content = content.replace(s3_regex, `<div className="flex items-center justify-center w-auto px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] whitespace-nowrap">{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-2xl ml-3 font-bold text-gray-500">({${overallPercentSnippet}})</span></div>`);

fs.writeFileSync('components/ReportDocument.tsx', content);
