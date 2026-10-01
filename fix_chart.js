const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const s1 = '<div className="w-12 border-r-[2px] border-[#4D1435] flex items-center justify-center bg-gray-50">PHASE</div>';
const r1 = '<div className="w-[100px] border-r-[2px] border-white flex items-center justify-center py-2 border-r-[2px]">BRAIN STAGE</div>\n                     <div className="w-[80px] border-r-[2px] border-white flex items-center justify-center py-2 border-r-[2px]">TIME FRAME</div>';

content = content.replace(s1, r1);

// Change border of domain columns in header
content = content.replace(/border-\[#4D1435\] py-2 bg-gray-50\">\{DOMAIN_BY_CODE\[c\]\.short\}/g, 'border-white py-2\">{DOMAIN_BY_CODE[c].name}');
content = content.replace(/border-\[#4D1435\]' : ''}\}>\{DOMAIN_BY_CODE\[c\]\.short\}/g, 'border-white\\' : \\'\\'}\}>{DOMAIN_BY_CODE[c].name}');
content = content.replace(/py-2 bg-gray-50/g, 'py-2');

// Header background
content = content.replace('<div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#4D1435] text-[10px] uppercase text-center">', '<div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#ffffff] text-[8px] uppercase text-center bg-[#4d4d4d]">');

// Phase row column replacement
const s2 = '<div className="w-12 border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[10px] font-bold text-gray-700 bg-gray-50">\n                             <span>{stage.roman}</span>\n                             <span className="text-[8px]">{stage.averageMonths}M</span>\n                          </div>';

const r2 = <div className="w-[100px] border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[9px] font-extrabold text-center px-1" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <span className="text-[11px] mb-0.5">{stage.roman}</span>
                             <span>{stage.name}</span>
                          </div>
                          <div className="w-[80px] border-r-[2px] border-[#4D1435] flex flex-col items-start justify-center text-[8px] font-medium px-2 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <div className="w-full italic">Superior</div>
                             <div className="w-full text-right pr-1 mb-0.5">{stage.superiorMonths} Mon.</div>
                             <div className="w-full italic">Average</div>
                             <div className="w-full text-right pr-1 mb-0.5">{stage.averageMonths} Mon.</div>
                             <div className="w-full italic">Slow</div>
                             <div className="w-full text-right pr-1">{stage.slowMonths} Mon.</div>
                          </div>;

content = content.replace(s2, r2);

// Mini Chart Header
const s3 = '<div className="border-b-[2px] border-[#4D1435] text-center font-extrabold text-[#4D1435] py-1 bg-gray-50 uppercase">\n                                  {domain.short} COMPETENCE\n                                </div>';

const r3 = <div className="flex border-b-[2px] border-[#4D1435] text-center font-extrabold text-white py-1 bg-[#4d4d4d] uppercase text-[7px]">
                                  <div className="w-[75px] border-r-[2px] border-white flex items-center justify-center">BRAIN STAGE</div>
                                  <div className="w-[65px] border-r-[2px] border-white flex items-center justify-center">TIME FRAME</div>
                                  <div className="flex-1 flex items-center justify-center">{domain.short} COMPETENCE</div>
                                </div>;

content = content.replace(s3, r3);

content = content.replace('<div className="w-[120px] shrink-0 border-[2px] border-[#4D1435]', '<div className="w-[280px] shrink-0 border-[2px] border-[#4D1435]');

// Mini Chart rows
const s4 = '<div className="w-8 border-r border-[#4D1435] flex items-center justify-center font-bold text-gray-500 bg-gray-50">\n                                         {stage.roman}\n                                       </div>';

const r4 = <div className="w-[75px] border-r border-[#4D1435] flex flex-col items-center justify-center font-bold text-[6px] text-center px-1 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                         <span className="text-[8px] mb-0.5">{stage.roman}</span>
                                         <span>{stage.name}</span>
                                       </div>
                                       <div className="w-[65px] border-r border-[#4D1435] flex flex-col items-start justify-center font-medium text-[6px] px-1 leading-[1.1]" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                          <div className="w-full italic">Superior</div>
                                          <div className="w-full text-right pr-1 mb-[1px]">{stage.superiorMonths} Mon.</div>
                                          <div className="w-full italic">Average</div>
                                          <div className="w-full text-right pr-1 mb-[1px]">{stage.averageMonths} Mon.</div>
                                          <div className="w-full italic">Slow</div>
                                          <div className="w-full text-right pr-1">{stage.slowMonths} Mon.</div>
                                       </div>;

content = content.replace(s4, r4);

fs.writeFileSync('components/ReportDocument.tsx', content);
