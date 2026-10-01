const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const s3Regex = /<div className="border-b-\[2px\] border-\[\#4D1435\] text-center font-extrabold text-\[\#4D1435\] py-1 bg-gray-50 uppercase">\s*\{domain.short\} COMPETENCE\s*<\/div>/g;

const r3 = `<div className="flex border-b-[2px] border-[#4D1435] text-center font-extrabold text-white py-1 bg-[#4d4d4d] uppercase text-[7px]">
                                  <div className="w-[85px] border-r-[2px] border-[#4D1435] flex items-center justify-center">BRAIN STAGE</div>
                                  <div className="w-[75px] border-r-[2px] border-[#4D1435] flex items-center justify-center">TIME FRAME</div>
                                  <div className="flex-1 flex items-center justify-center">{domain.short} COMPETENCE</div>
                                </div>`;

content = content.replace(s3Regex, r3);

const s4Regex = /<div className="w-8 border-r border-\[\#4D1435\] flex items-center justify-center font-bold text-gray-500 bg-gray-50">\s*\{stage.roman\}\s*<\/div>/g;

const r4 = `<div className="w-[85px] border-r border-[#4D1435] flex flex-col items-center justify-center font-bold text-[6px] text-center px-1 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                         <span className="text-[8px] mb-0.5">{stage.roman}</span>
                                         <span>{stage.name}</span>
                                       </div>
                                       <div className="w-[75px] border-r border-[#4D1435] flex flex-col items-start justify-center font-medium text-[6px] px-1 leading-[1.1]" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                          <div className="w-full flex justify-between"><i>Superior</i><span>{stage.superiorMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Average</i><span>{stage.averageMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Slow</i><span>{stage.slowMonths} Mon.</span></div>
                                       </div>`;

content = content.replace(s4Regex, r4);

fs.writeFileSync('components/ReportDocument.tsx', content);
