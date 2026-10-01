const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// ============================================================
// FIX 1: PERCENTAGE CALCULATION — percent is 0-1, not 0-100
// Line 254: overall grade box on page 2
// Line 364: per-domain grade box 
// Line 437: overall grade box on page 5
// ============================================================

// Helper to compute the overall percent correctly (average of domain percents, each already 0-1 -> * 100)
const OVERALL_PCT = `Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1) * 100)`;
const DOMAIN_PCT = `Math.round(score.percent * 100)`;

// ============================================================
// FIX 2: Grade Box — Beautiful pill design, no bracket
// ============================================================

// Page 2 overall grade (line 254)
const OLD_GRADE_P2 = `<div className="flex items-center justify-center w-auto px-4 h-[80px] rounded-2xl border-[4px] border-[#4D1435] text-4xl font-black text-[#4D1435] bg-white whitespace-nowrap">{result.overallStatus.replace(/\\-/g, '\\u2212')} <span className="text-xl ml-2 font-bold text-gray-500">({Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1))}%)</span></div>`;

const NEW_GRADE_P2 = `<div className="flex flex-col items-center justify-center min-w-[110px] px-5 py-3 rounded-2xl border-[4px] border-[#4D1435] bg-[#4D1435] text-white shadow-lg">
                  <span className="text-3xl font-black tracking-tight leading-none">{result.overallStatus.replace(/-/g, '\\u2212')}</span>
                  <span className="text-sm font-bold mt-1 opacity-80">{${OVERALL_PCT}}%</span>
                </div>`;

content = content.replace(OLD_GRADE_P2, NEW_GRADE_P2);

// Per-domain grade box (line 364)
const OLD_GRADE_DOMAIN = `<div className="flex items-center justify-center w-auto px-3 h-[56px] rounded-xl border-[3px] border-[#4D1435] text-2xl font-black text-[#4D1435] whitespace-nowrap">{STATUSES[score.status].code.replace(/\\-/g, '\\u2212')} <span className="text-sm ml-1 font-bold text-gray-500">({Math.round(score.percent)}%)</span></div>`;

const NEW_GRADE_DOMAIN = `<div className="flex flex-col items-center justify-center min-w-[90px] px-4 py-2 rounded-xl border-[3px] border-[#4D1435] bg-[#4D1435] text-white shadow-md">
                            <span className="text-xl font-black tracking-tight leading-none">{STATUSES[score.status].code.replace(/-/g, '\\u2212')}</span>
                            <span className="text-xs font-bold mt-0.5 opacity-80">{${DOMAIN_PCT}}%</span>
                          </div>`;

content = content.replace(OLD_GRADE_DOMAIN, NEW_GRADE_DOMAIN);

// Page 5 overall grade (line 437)
const OLD_GRADE_P5 = `<div className="flex items-center justify-center w-auto px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] whitespace-nowrap">{result.overallStatus.replace(/\\-/g, '\\u2212')} <span className="text-2xl ml-3 font-bold text-gray-500">({Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1))}%)</span></div>`;

const NEW_GRADE_P5 = `<div className="flex flex-col items-center justify-center min-w-[140px] px-8 py-4 rounded-2xl border-[5px] border-[#4D1435] bg-[#4D1435] text-white shadow-xl">
               <span className="text-5xl font-black tracking-tight leading-none">{result.overallStatus.replace(/-/g, '\\u2212')}</span>
               <span className="text-lg font-bold mt-1.5 opacity-80">{${OVERALL_PCT}}%</span>
             </div>`;

content = content.replace(OLD_GRADE_P5, NEW_GRADE_P5);

// ============================================================
// FIX 3: COVER PAGE — Responsive title without overflow/wrap
// ============================================================

// Make ECCTRACTION title scale nicely on mobile
const OLD_H1 = `<h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435] text-[2.5rem] sm:text-[5rem] print:text-[5rem]">
                   <span style={{ WebkitTextStroke: '3px #4D1435', color: 'white', marginRight: '2px' }}>ECCTR</span>ACTION
                 </h1>
                 <h2 className="font-bold uppercase text-[#4D1435] tracking-widest text-xl sm:text-[2.2rem] print:text-[2.2rem]">Plan</h2>`;

const NEW_H1 = `<h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435] text-[2rem] sm:text-[4.5rem] print:text-[4.5rem]">
                   <span style={{ WebkitTextStroke: '2px #4D1435', color: 'white', marginRight: '2px' }}>ECCTR</span>ACTION
                 </h1>
                 <h2 className="font-bold uppercase text-[#4D1435] tracking-widest text-lg sm:text-[2rem] print:text-[2rem]">Plan</h2>`;

content = content.replace(OLD_H1, NEW_H1);

// Tagline smaller on mobile
const OLD_TAGLINE = `<div className="bg-[#FFE600] text-[#4D1435] tracking-[0.2em] font-bold px-3 py-[2px] mt-1 text-[0.8rem] whitespace-normal sm:whitespace-nowrap print:whitespace-nowrap">
                  EARLY&nbsp;&nbsp;CHILDHOOD&nbsp;&nbsp;COMPETENCE&nbsp;&nbsp;TRACKING&nbsp;&nbsp;REPORT
                </div>`;

const NEW_TAGLINE = `<div className="bg-[#FFE600] text-[#4D1435] tracking-[0.1em] sm:tracking-[0.2em] font-bold px-2 sm:px-3 py-[2px] mt-1 text-[0.55rem] sm:text-[0.8rem] print:text-[0.8rem] whitespace-nowrap overflow-hidden">
                  EARLY&nbsp;&nbsp;CHILDHOOD&nbsp;&nbsp;COMPETENCE&nbsp;&nbsp;TRACKING&nbsp;&nbsp;REPORT
                </div>`;

content = content.replace(OLD_TAGLINE, NEW_TAGLINE);

// Make title section not wrap — keep it nowrap on mobile
const OLD_TITLE_WRAPPER = `<div className="flex items-baseline gap-2 sm:gap-4 flex-wrap sm:flex-nowrap print:flex-nowrap">`;
const NEW_TITLE_WRAPPER = `<div className="flex items-baseline gap-2 sm:gap-4 flex-nowrap">`;
content = content.replace(OLD_TITLE_WRAPPER, NEW_TITLE_WRAPPER);

// ============================================================
// FIX 4: Child details table — smaller fonts, tighter on mobile
// ============================================================

const OLD_DETAILS_OUTER = `<div className="space-y-6 text-[1.1rem] max-w-lg mx-auto">`;
const NEW_DETAILS_OUTER = `<div className="space-y-3 sm:space-y-5 text-[0.85rem] sm:text-[1rem] print:text-[1rem] max-w-lg mx-auto">`;
content = content.replace(OLD_DETAILS_OUTER, NEW_DETAILS_OUTER);

// Make the label column narrower on mobile
content = content.replace(/className="font-bold w-56 text-\[#4D1435\]"/g, 'className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0"');

// ============================================================
// FIX 5: Page 2 layout — flex-col on mobile, row on desktop
// ============================================================
const OLD_P2_LAYOUT = `<div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-8">`;
const NEW_P2_LAYOUT = `<div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center gap-4 mb-6">
              <div className="flex-1 pr-0 sm:pr-8 print:pr-8">`;
content = content.replace(OLD_P2_LAYOUT, NEW_P2_LAYOUT);

// The grade div wrapper on page 2 — remove left border and left padding on mobile
const OLD_GRADE_WRAPPER = `<div className="flex-shrink-0 text-left sm:text-right print:text-right border-l-0 sm:border-l-[3px] print:border-l-[3px] border-[#4D1435] pl-0 sm:pl-6 print:pl-6 py-2">`;
const NEW_GRADE_WRAPPER = `<div className="flex-shrink-0">`;
content = content.replace(OLD_GRADE_WRAPPER, NEW_GRADE_WRAPPER);

fs.writeFileSync('components/ReportDocument.tsx', content);
console.log('Done.');
