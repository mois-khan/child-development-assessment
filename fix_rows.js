const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

const s2Regex = /\{\/\*\s*Phase column\s*\*\/\}\s*<div className="w-12 border-r-\[2px\] border-\[\#4D1435\] flex flex-col items-center justify-center text-\[10px\] font-bold text-gray-700 bg-gray-50">\s*<span>\{stage.roman\}<\/span>\s*<span className="text-\[8px\]">\{stage.averageMonths\}M<\/span>\s*<\/div>/g;

const r2 = `{/* Brain Stage column */}
                          <div className="w-[100px] border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[9px] font-extrabold text-center px-1" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <span className="text-[11px] mb-0.5">{stage.roman}</span>
                             <span>{stage.name}</span>
                          </div>
                          {/* Time Frame column */}
                          <div className="w-[80px] border-r-[2px] border-[#4D1435] flex flex-col items-start justify-center text-[8px] font-medium px-2 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <div className="w-full flex justify-between"><i className="font-serif">Superior</i><span>{stage.superiorMonths} Mon.</span></div>
                             <div className="w-full flex justify-between"><i className="font-serif">Average</i><span>{stage.averageMonths} Mon.</span></div>
                             <div className="w-full flex justify-between"><i className="font-serif">Slow</i><span>{stage.slowMonths} Mon.</span></div>
                          </div>`;

content = content.replace(s2Regex, r2);


const s4Regex = /<div className="w-8 border-r border-\[\#4D1435\] flex items-center justify-center font-bold text-gray-500 bg-gray-50">\s*\{stage.roman\}\s*<\/div>/g;

const r4 = `<div className="w-[75px] border-r border-[#4D1435] flex flex-col items-center justify-center font-bold text-[6px] text-center px-1 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                         <span className="text-[8px] mb-0.5">{stage.roman}</span>
                                         <span>{stage.name}</span>
                                       </div>
                                       <div className="w-[65px] border-r border-[#4D1435] flex flex-col items-start justify-center font-medium text-[6px] px-1 leading-[1.1]" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                          <div className="w-full flex justify-between"><i>Superior</i><span>{stage.superiorMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Average</i><span>{stage.averageMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Slow</i><span>{stage.slowMonths} Mon.</span></div>
                                       </div>`;

content = content.replace(s4Regex, r4);

fs.writeFileSync('components/ReportDocument.tsx', content);
