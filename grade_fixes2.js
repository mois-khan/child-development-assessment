const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const overallPercentSnippet = `{Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1))}%`;

content = content.replace(
  /min-w-\[100px\]([^>]*?)>\{result\.overallStatus\.replace\(\/-\/g, '-'\)\}/g,
  `w-auto whitespace-nowrap$1>{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-xl ml-2 font-bold text-gray-500">({${overallPercentSnippet}})</span>`
);

content = content.replace(
  /min-w-\[70px\]([^>]*?)>\{STATUSES\[score\.status\]\.code\.replace\(\/-\/g, '-'\)\}/g,
  `w-auto whitespace-nowrap$1>{STATUSES[score.status].code.replace(/-/g, '\\u2212')} <span className="text-sm ml-1 font-bold text-gray-500">({Math.round(score.percent)}%)</span>`
);

content = content.replace(
  /min-w-\[120px\]([^>]*?)>\{result\.overallStatus\.replace\(\/-\/g, '-'\)\}/g,
  `w-auto whitespace-nowrap$1>{result.overallStatus.replace(/-/g, '\\u2212')} <span className="text-2xl ml-3 font-bold text-gray-500">({${overallPercentSnippet}})</span>`
);

fs.writeFileSync('components/ReportDocument.tsx', content);
