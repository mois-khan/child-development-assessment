const fs = require('fs');
let content = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

// Replace main chart headers
const mainHeadersOld = `<div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#4D1435] text-[10px] uppercase text-center">
                     <div className="w-12 border-r-[2px] border-[#4D1435] flex items-center justify-center bg-gray-50">PHASE</div>
                     {inputDomainCodes.map(c => (
                       <div key={c} className="flex-1 border-r-[2px] border-[#4D1435] py-2 bg-gray-50">{DOMAIN_BY_CODE[c].short}</div>
                     ))}
                     
                     {outputDomainCodes.map((c, i) => (
                       <div key={c} className={\`flex-1 py-2 bg-gray-50 ${i !== outputDomainCodes.length - 1 ? 'border-r-[2px] border-[#4D1435]' : ''}\`}>{DOMAIN_BY_CODE[c].short}</div>
                     ))}
                  </div>`;

const mainHeadersNew = `<div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#ffffff] text-[9px] uppercase text-center bg-[#4d4d4d]">
                     <div className="w-[100px] border-r-[2px] border-[#4D1435] flex items-center justify-center py-2">BRAIN STAGE</div>
                     <div className="w-[90px] border-r-[2px] border-[#4D1435] flex items-center justify-center py-2">TIME FRAME</div>
                     {inputDomainCodes.map(c => (
                       <div key={c} className="flex-1 border-r-[2px] border-[#4D1435] py-2 px-1">{DOMAIN_BY_CODE[c].name}</div>
                     ))}
                     {outputDomainCodes.map((c, i) => (
                       <div key={c} className={\`flex-1 py-2 px-1 ${i !== outputDomainCodes.length - 1 ? 'border-r-[2px] border-[#4D1435]' : ''}\`}>{DOMAIN_BY_CODE[c].name}</div>
                     ))}
                </div>`;

// Replace main chart rows
let mainRowsOld = `{/* Phase column */}
                        <div className="w-12 border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[10px] font-bold text-gray-700 bg-gray-50">
                           <span>{stage.roman}</span>
                           <span className="text-[8px]">{stage.averageMonths}M</span>
                        </div>`;

                        mainRowsNew = `{/* Brain Stage column */}
                        <div className="w-[100px] border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[9px] font-extrabold text-center px-1" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                           <span className="text-[11px] mb-0.5">{stage.roman}</span>
                           <span>{stage.name}</span>
                        </div>
                        
                        
                        <div className="w-[90px] border-r-[2px] border-[#4D1435] flex flex-col items-start justify-center text-[8px] font-medium px-2 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                           <div className="w-full italic">Superior</div>
                           <div className="w-full text-right pr-1 mb-0.5">{stage.superiorMonths} Mon.</div>
                           <div className="w-full italic">Average</div>
                           <div className="w-full text-right pr-1 mb-0.5">{stage.averageMonths} Mon.</div>
                           <div className="w-full italic">Slow</div>
                           <div className="w-full text-right pr-1">{stage.slowMonths} Mon.</div>
                        </div>`;

// Replace mini chart
let miniChartOld = `<div className="w-[120px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative">
                               
                                <div className="border-b-[2px] border-[#4D1435] text-center font-extrabold text-[#4D1435] py-1 bg-gray-50 uppercase">
                                  {domain.short} COMPETENCE
                                </div>`;

  miniChartNew = `<div className="w-[300px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative">
                               
                                <div className="flex border-b-[2px] border-[#4D1435] text-center font-extrabold text-white py-1 bg-[#4d4d4d] uppercase text-[7px]">
                                  <div className="w-[90px] border-r-[2px] border-[#4D1435] flex items-center justify-center">BRAIN STAGE</div>
                                  <div className="w-[80px] border-r-[2px] border-[#4D1435] flex items-center justify-center">TIME FRAME</div>
                                  <div className="flex-1 flex items-center justify-center">{domain.short} COMPETENCE</div>
                                </div>`;

let miniChartRowsOld = `<div className="w-8 border-r border-[#4D1435] flex items-center justify-center font-bold text-gray-500 bg-gray-50">
                                   {stage.roman}
                                 </div>`;

  miniChartRowsNew = `<div className="w-[90px] border-r border-[#4D1435] flex flex-col items-center justify-center font-bold text-[7px] text-center px-1 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                   <span className="text-[9px] mb-0.5">{stage.roman}</span>
                                   <span>{stage.name}</span>
                                 </div>
                                 <div className="w-[80px] border-r border-[#4D1435] flex flex-col items-start justify-center font-medium text-[6px] px-1 leading-[1.1]" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                    <div className="w-full italic">Superior</div>
                                    <div className="w-full text-right pr-1 mb-[1px]">{stage.superiorMonths} Mon.</div>
                                    <div className="w-full italic">Average</div>
                                    <div className="w-full text-right pr-1 mb-[1px]">{stage.averageMonths} Mon.</div>
                                    <div className="w-full italic">Slow</div>
                                    <div className="w-full text-right pr-1">{stage.slowMonths} Mon.</div>
                                 </div>`;

function replaceIgnoringIndent(str, search, replace) {
  const searchRegexStr = search.replace(/[*.+?${()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  const regex = new RegExp(searchRegexStr, 'g');
  return str.replace(regex, replace);
}

content = replaceIgnoringIndent(content, mainHeadersOld, mainHeadersNew);
content = replaceIgnoringIndent(content, mainRowsOld, mainRowsNew);
content = replaceIgnoringIndent(content, miniChartOld, miniChartNew);
content = replaceIgnoringIndent(content, miniChartRowsOld, miniChartRowsNew);

fs.writeFileSync('components/ReportDocument.tsx', content);