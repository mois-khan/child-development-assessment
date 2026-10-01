const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// 1. Cover page responsivness
content = content.replace('<Wordmark height={140} />', '<Wordmark height={140} className="h-[70px] sm:h-[140px] print:h-[140px] w-auto" />');
content = content.replace('className="font-black uppercase tracking-tight leading-none text-[#4D1435] text-5xl \nsm:text-[5rem] print:text-[5rem]"', 'className="font-black uppercase tracking-tight leading-none text-[#4D1435] text-[2.5rem] sm:text-[5rem] print:text-[5rem]"');
content = content.replace('text-5xl sm:text-[5rem] print:text-[5rem]', 'text-[2.5rem] sm:text-[5rem] print:text-[5rem]');
content = content.replace('text-2xl sm:text-[2.2rem]', 'text-xl sm:text-[2.2rem]');
content = content.replace('gap-4 flex-wrap sm:flex-nowrap', 'gap-2 sm:gap-4 flex-wrap sm:flex-nowrap print:flex-nowrap');

// 2. Page 2 Overall Result layout (CHILD'S OVERALL DEVELOPMENT)
const s2 = `<div className="flex justify-between items-start mb-6">
               <div className="flex-1 pr-8">`;
const r2 = `<div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center mb-6 gap-4">
               <div className="flex-1 pr-0 sm:pr-8 print:pr-8">`;
content = content.replace(s2, r2);

const s3 = `<div className="flex-shrink-0 text-right border-l-[3px] border-[#4D1435] pl-6 py-2">`;
const r3 = `<div className="flex-shrink-0 text-left sm:text-right print:text-right border-l-0 sm:border-l-[3px] print:border-l-[3px] border-[#4D1435] pl-0 sm:pl-6 print:pl-6 py-2">`;
content = content.replace(s3, r3);

// 3. Mini-charts headers layout
const s4 = `<div className="flex justify-between items-baseline mb-6 border-b border-[#4D1435] pb-2">`;
const r4 = `<div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-baseline print:items-baseline mb-6 border-b border-[#4D1435] pb-2 gap-4 sm:gap-0 print:gap-0">`;
content = content.replace(s4, r4);

// 4. Page 5 Overall Result layout
const s5 = `<div className="border-b-[3px] border-[#4D1435] pb-4 mb-10 flex justify-between items-baseline mt-4">`;
const r5 = `<div className="border-b-[3px] border-[#4D1435] pb-4 mb-10 flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-baseline print:items-baseline gap-4 mt-4">`;
content = content.replace(s5, r5);

// 5. Overflow container for charts so it scrolls on mobile instead of squishing and breaking lines!
// The Spectrum Chart container
const s6 = `<div className="border-[3px] border-[#4D1435] rounded-xl overflow-hidden flex flex-col font-sans relative">`;
const r6 = `<div className="w-full overflow-x-auto pb-4"><div className="border-[3px] border-[#4D1435] rounded-xl overflow-hidden flex flex-col font-sans relative min-w-[700px]">`;
content = content.replace(s6, r6);

// The Mini-charts containers
// Wait, the mini-charts are already wrapped in something?
const s7 = `<div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                             <div className="w-[280px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative">`;
const r7 = `<div className="flex flex-col sm:flex-row print:flex-row gap-6 sm:gap-8">
                             <div className="w-[280px] sm:w-[280px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative mx-auto sm:mx-0 print:mx-0">`;
content = content.replace(s7, r7);

// For the right-side text of mini chart
// Ensure it wraps correctly on mobile
// `<div className="flex-1 flex flex-col pt-1">` is fine.

fs.writeFileSync('components/ReportDocument.tsx', content);
