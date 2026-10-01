"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE, INPUT_DOMAINS, OUTPUT_DOMAINS } from "@/content/domains";
import { formatAge, summariseAge } from "@/lib/age";
import { PLATFORM_NAME, PLATFORM_SHORT, phaseLabel, reportName } from "@/lib/naming";
import { DISCLAIMER, domainNote, headline, nextSteps, summary, overallSummary } from "@/lib/narrative";
import { STATUS_SEVERITY, STATUSES, scoreAssessment } from "@/lib/scoring";
import { itemBankReady, primeItemBank } from "@/lib/item-bank";
import { primeCmsBank, cmsReady } from "@/lib/cms";
import { stageForAge } from "@/lib/stage";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type {
  AssessmentResult,
  BrainStage,
  Child,
  DomainCode,
  DomainScore,
  StatusCode,
} from "@/lib/types";
import { BRAIN_STAGES, STAGE_BY_ID, stageAbove, cellFor } from "@/content/stages";
import { MilestoneVideoRow } from "@/components/report/MilestoneVideoRow";
import { CourseRow } from "@/components/report/CourseRow";
import { Avatar, LoadError, TopBar, Wordmark, Button } from "@/components/ui";

const STAGE_COLORS: Record<string, string> = {
  s1: "#EF4444",
  s2: "#F97316",
  s3: "#F59E0B",
  s4: "#22C55E",
  s5: "#0EA5E9",
  s6a: "#6366F1",
  s6b: "#6366F1",
  s7a: "#A855F7",
  s7b: "#A855F7",
};

const A4Page = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`w-full max-w-[210mm] mx-auto bg-white sm:my-8 sm:shadow-lg print:m-0 print:shadow-none relative overflow-hidden break-after-page print:last:break-after-auto text-black flex flex-col p-4 sm:p-[12mm] md:p-[15mm] border border-gray-200 print:border-none print:h-[297mm] print:max-h-[297mm] min-h-screen sm:min-h-[297mm] h-auto ${className}`}
    style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
  >
    {children}
  </div>
);

export function ReportDocument({
  id,
  isAdmin = false,
}: {
  id: string;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [bankReady, setBankReady] = useState(itemBankReady());
  const [cmsLoaded, setCmsLoaded] = useState(cmsReady());

  useEffect(() => {
    let active = true;
    primeItemBank().finally(() => {
      if (active) setBankReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    primeCmsBank().finally(() => {
      if (active) setCmsLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    getAssessment(id)
      .then(found => {
        if (active) setRecord(found);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  const result = useMemo<AssessmentResult | null>(() => {
    if (!record || !bankReady) return null;
    return scoreAssessment({
      child: record.child,
      assessedOn: record.assessedOn,
      responses: record.responses,
      details: record.details,
      stagesByDomain: record.stagesByDomain,
    });
  }, [record, bankReady]);

  useEffect(() => {
    if (!record || !result) return;
    const previous = document.title;
    const stage = stageForAge(
      summariseAge(record.child.dob, record.assessedOn, record.child.gestationalWeeks)
        .assessedMonths,
    );
    document.title = reportName(record.child.name, stage);
    return () => {
      document.title = previous;
    };
  }, [record, result]);

  useEffect(() => {
    if (result && searchParams.get("download") === "1") {
      const t = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(t);
    }
  }, [result, searchParams]);

  if (loadError) return <div className="p-8 text-red-500">Failed to load report.</div>;
  if (record === undefined || !bankReady || !cmsLoaded) return <div className="p-8 text-gray-500">Loading...</div>;
  if (record === null || result === null) return <div className="p-8 text-gray-500">Report not found.</div>;

  const child = record.child;
  const age = summariseAge(child.dob, record.assessedOn, child.gestationalWeeks);
  const startStage = stageForAge(age.assessedMonths);
  
  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const reversedStages = [...BRAIN_STAGES].reverse();
  const inputDomainCodes = INPUT_DOMAINS;
  const outputDomainCodes = OUTPUT_DOMAINS;
  
  const getAgeTopPercent = (months: number) => {
    const stage = stageForAge(months);
    // reversedStages has Phase VII-B (order=9) at top (0%) and Phase I (order=1) at bottom
    // The top of the child's phase row = (9 - stage.order) / 9 * 100
    return ((9 - stage.order) / 9) * 100;
  };

  const getFillHeight = (stage: BrainStage, score: DomainScore) => {
    const achievedOrder = STAGE_BY_ID[score.achievedStage]?.order || 0;
    if (stage.order <= achievedOrder) return 100;
    if (stage.order === achievedOrder + 1) {
      // Proportional shading based on partial completion can go here, using 50% for now.
      // Alternatively, we map the exact raw vs max.
      if (score.percent === 1) return 100;
      return Math.max(0, Math.min(99, Math.round(score.percent * 100)));
    }
    return 0;
  };

  const renderCellFill = (stage: BrainStage, score: DomainScore) => {
    const fillHeight = getFillHeight(stage, score);
    if (fillHeight === 0) return null;
    const color = STAGE_COLORS[stage.id];
    const cell = cellFor(stage.id, score.domain as any);
    return (
      <>
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{ 
            height: `${fillHeight}%`,
            background: `repeating-linear-gradient(45deg, ${color}40, ${color}40 4px, ${color}80 4px, ${color}80 8px)`
          }} 
        />
        <div className="absolute inset-0 p-[2px] flex flex-col justify-center items-center text-center z-10 overflow-hidden">
          <p 
            className="text-[6px] sm:text-[7px] leading-[1.1] font-bold text-gray-900 drop-shadow-md"
            style={{ textShadow: "0 0 2px white, 0 0 3px white, 0 0 4px white" }}
          >
            {cell?.description}
          </p>
        </div>
      </>
    );
  };

  const overallScoreValue = result.overallDq !== null ? Math.round(result.overallDq) : Math.round(
    result.domainScores.reduce((acc, d) => acc + (d.percent * 100), 0) / 6
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print { @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      {!isAdmin && <TopBar />}
      <main className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center print:block print:min-h-0">
        <div className="no-print fixed bottom-8 right-8 z-50">
          <Button variant="sun" className="shadow-2xl rounded-full px-8 py-6 text-lg font-bold flex items-center gap-2 border-[3px] border-[#4D1435]" onClick={() => window.print()}>
             Download PDF
          </Button>
        </div>

        {/* Page 1: Cover */}
        <A4Page>
          <div className="text-center mt-4 mb-4 flex justify-center">
             <Wordmark height={140} className="h-[50px] sm:h-[120px] print:h-[120px] w-auto" />
          </div>
          <div className="w-full mt-4 mb-10 flex justify-center px-4 sm:px-0">
            <div className="flex flex-col items-stretch max-w-full">
              <div className="flex items-baseline gap-2 sm:gap-4 flex-nowrap justify-center">
                <h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435] text-[1.7rem] sm:text-[5.5rem] print:text-[5.5rem]">
                  <span className="text-white mr-[2px] [-webkit-text-stroke:1.5px_#4D1435] sm:[-webkit-text-stroke:3px_#4D1435] print:[-webkit-text-stroke:3px_#4D1435]">ECCTR</span>ACTION
                </h1>
                <h2 className="font-bold uppercase text-[#4D1435] tracking-widest text-[1.1rem] sm:text-[2.5rem] print:text-[2.5rem]">Plan</h2>
              </div>
              <div className="bg-[#FFE600] text-[#4D1435] font-bold px-3 sm:px-4 py-[3px] sm:py-[4px] mt-1 sm:mt-2 text-[0.45rem] sm:text-[0.7rem] print:text-[0.7rem] w-full flex justify-between items-center tracking-[0.05em] sm:tracking-widest print:tracking-widest">
                <span>EARLY</span>
                <span>CHILDHOOD</span>
                <span>COMPETENCE</span>
                <span>TRACKING</span>
                <span>REPORT</span>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-[0.9rem] sm:text-[1.1rem] print:text-[1.1rem] leading-[1.8] text-[#1D1D1B] text-justify font-medium">
            Competency tracking is a broad term that involves assessment of essential milestones in the areas of 6 human Competencies achieved in any child along the seven phases of brain development in the first six years of age. Major portion of the IQ is developed during this time span. Brain development is a cohesive all-competencies-inclusive process. No competency domain exists in isolation.
          </p>

          <div className="mt-12">
            <h3 className="text-lg font-bold uppercase mb-8 tracking-wider text-gray-500 text-center">THIS REPORT IS GENERATED FOR:</h3>
            <div className="space-y-3 sm:space-y-5 text-[0.85rem] sm:text-[1rem] print:text-[1rem] max-w-lg mx-auto">
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">Name:</span> <span className="font-medium text-gray-800">{child.name}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">Date of Birth:</span> <span className="font-medium text-gray-800">{formatDate(child.dob)}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">Gender:</span> <span className="font-medium capitalize text-gray-800">{child.gender === 'boy' ? 'Male' : child.gender === 'girl' ? 'Female' : child.gender}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">School/Clinic/Parent:</span> <span className="font-medium text-gray-800">{child.parentName || "—"}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">Assessment Date:</span> <span className="font-medium text-gray-800">{formatDate(record.assessedOn)}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-32 sm:w-48 print:w-48 text-[#4D1435] shrink-0">Assessment Tool:</span> <span className="font-medium text-gray-800">KECCTR (Phase {startStage.roman})</span></div>
            </div>
          </div>
        </A4Page>

        {/* Page 2: Progress & Spectrum */}
        <A4Page>
          <div className="border-b-[3px] border-[#4D1435] pb-3 mb-8">
             <h2 className="text-[0.9rem] sm:text-[1.1rem] print:text-[1.1rem] font-extrabold uppercase text-[#4D1435] tracking-wide">
               {child.name}'S KAUSHALYA ECCTRACTION PLAN (PHASE {startStage.roman})
             </h2>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 sm:gap-0">
             <div className="w-full sm:flex-1 sm:pr-8">
                <h3 className="text-[0.85rem] sm:text-lg print:text-lg font-bold uppercase mb-3 text-[#4D1435] tracking-wide truncate">CHILD'S OVERALL DEVELOPMENT ({child.name})</h3>
                <p className="text-[#1D1D1B] font-medium leading-relaxed w-full">{headline(result, child)}</p>
             </div>
             <div className="flex-shrink-0 self-start sm:self-auto">
                <div className="flex flex-col items-center justify-center min-w-[90px] sm:min-w-[110px] px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border-[3px] sm:border-[4px] border-[#4D1435] bg-[#4D1435] text-white shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">{result.overallStatus.replace(/-/g, '\u2212')}</span>
                  <span className="text-xs sm:text-sm font-bold mt-1 opacity-80">{Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1) * 100)}%</span>
                </div>
             </div>
          </div>

          <p className="text-sm font-bold text-[#4D1435] mb-6 tracking-wide">
            Following are the milestones achieved corresponding to {child.name}'s age.
          </p>

          <div className="w-full flex-1 flex flex-col items-center">
             <h4 className="text-center font-bold uppercase tracking-widest mb-4 text-[#4D1435] text-lg">
               {child.name}'S COMPETENCIES SPECTRUM
             </h4>
             
             {/* Spectrum Chart */}
               <div className="w-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pb-2" style={{ scrollbarWidth: 'thin' }}>
                 <div className="relative min-w-[700px] flex-1 min-h-0 w-full border-[2px] border-[#4D1435] flex flex-col font-sans text-xs mb-4 print:min-w-0">
                
                {/* Headers */}
                <div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#ffffff] text-[8px] uppercase text-center bg-[#4d4d4d]">
                   <div className="w-[100px] border-r-[2px] border-[#4D1435] flex items-center justify-center py-2">BRAIN STAGE</div>
                     <div className="w-[80px] border-r-[2px] border-[#4D1435] flex items-center justify-center py-2">TIME FRAME</div>
                   {inputDomainCodes.map(c => (
                     <div key={c} className="flex-1 border-r-[2px] border-[#4D1435] py-2">{DOMAIN_BY_CODE[c].name}</div>
                   ))}
                   
                   {outputDomainCodes.map((c, i) => (
                     <div key={c} className={`flex-1 py-2 ${i !== outputDomainCodes.length - 1 ? 'border-r-[2px] border-[#4D1435]' : ''}`}>{DOMAIN_BY_CODE[c].name}</div>
                   ))}
                </div>

                {/* Rows */}
                <div className="flex-1 flex flex-col relative">
                  {/* Red dotted line for age */}
                <div 
                  className="absolute left-0 w-full border-t-2 border-red-500 border-dashed z-10 flex items-center"
                  style={{ top: `${getAgeTopPercent(age.assessedMonths)}%` }}
                >
                  <span className="absolute left-0 -translate-y-full text-red-600 font-bold flex-wrap sm:flex-nowrap text-[10px] bg-white px-1 leading-none">
                    {age.assessedMonths} MONTHS
                  </span>
                </div>
                  {reversedStages.map((stage, idx) => {
                    const isLastRow = idx === reversedStages.length - 1;
                    return (
                      <div key={stage.id} className={`flex-1 flex ${!isLastRow ? 'border-b border-gray-400' : ''}`}>
                        {/* Brain Stage column */}
                          <div className="w-[100px] border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[9px] font-extrabold text-center px-1" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <span className="text-[11px] mb-0.5">{stage.roman}</span>
                             <span>{stage.name}</span>
                          </div>
                          {/* Time Frame column */}
                          <div className="w-[80px] border-r-[2px] border-[#4D1435] flex flex-col items-start justify-center text-[8px] font-medium px-2 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                             <div className="w-full flex justify-between"><i className="font-serif">Superior</i><span>{stage.superiorMonths} Mon.</span></div>
                             <div className="w-full flex justify-between"><i className="font-serif">Average</i><span>{stage.averageMonths} Mon.</span></div>
                             <div className="w-full flex justify-between"><i className="font-serif">Slow</i><span>{stage.slowMonths} Mon.</span></div>
                          </div>
                        
                        {/* Input Domains */}
                        {inputDomainCodes.map(c => {
                          const score = result.domainScores.find(d => d.domain === c)!;
                          return (
                            <div key={c} className="flex-1 border-r border-gray-300 relative">
                               {renderCellFill(stage, score)}
                            </div>
                          )
                        })}
                          {/* Output Domains */}

                        {outputDomainCodes.map((c, i) => {
                          const score = result.domainScores.find(d => d.domain === c)!;
                          return (
                            <div key={c} className={`flex-1 relative ${i !== outputDomainCodes.length - 1 ? 'border-r border-gray-300' : ''}`}>
                               {renderCellFill(stage, score)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
             </div>
             </div>
          </div>
        </A4Page>

        {/* Page 3+: Breakdowns */}
        {(() => {
           // We will split the 6 domains into 2 per page to fit A4 nicely without squishing.
           const orderedScores = [...result.domainScores].sort((a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order);
           const pages = [];
           for (let i = 0; i < orderedScores.length; i += 2) {
             pages.push(orderedScores.slice(i, i + 2));
           }

           return pages.map((pair, pIdx) => (
             <A4Page key={pIdx}>
               <div className="flex-1 flex flex-col gap-10">
                 {pair.map((score, idxInPage) => {
                   const domain = DOMAIN_BY_CODE[score.domain];
                   const romanDomain = ["I", "II", "III", "IV", "V", "VI"][domain.order - 1];
                   const nextStageId = stageAbove(STAGE_BY_ID[score.achievedStage])?.roman || startStage.roman;
                   const scoreValue = score.dq !== null ? Math.round(score.dq) : Math.round(score.percent * 100);

                   return (
                     <div key={score.domain} className="flex-1 flex flex-col border-b-2 border-gray-100 pb-8 last:border-0 last:pb-0">
                        <div className="flex flex-row justify-between items-center mb-4 sm:mb-6 border-b border-[#4D1435] pb-2 gap-2 sm:gap-0">
                           <h2 className="text-[1.1rem] sm:text-xl font-bold uppercase text-[#4D1435] tracking-wide flex items-center">
                             <span className="mr-2 sm:mr-3 border-2 border-[#4D1435] rounded-full w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center text-[0.8rem] sm:text-sm shrink-0">{romanDomain}</span>
                             <span className="truncate">{domain.name}</span>
                           </h2>
                            <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-[#4D1435] bg-[#4D1435] text-white shadow-md shrink-0">
                            <span className="text-lg sm:text-xl font-black tracking-tight leading-none">{STATUSES[score.status].code.replace(/-/g, '\u2212')}</span>
                            <span className="text-[10px] sm:text-xs font-bold mt-0.5 opacity-80">{Math.round(score.percent * 100)}%</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                           {/* Mini Chart */}
                           <div className="w-[280px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative">
                             

                              <div className="flex border-b-[2px] border-[#4D1435] text-center font-extrabold text-white py-1 bg-[#4d4d4d] uppercase text-[7px]">
                                  <div className="w-[85px] border-r-[2px] border-[#4D1435] flex items-center justify-center">BRAIN STAGE</div>
                                  <div className="w-[75px] border-r-[2px] border-[#4D1435] flex items-center justify-center">TIME FRAME</div>
                                  <div className="flex-1 flex items-center justify-center">{domain.short} COMPETENCE</div>
                                </div>
                              <div className="flex-1 flex flex-col relative">
                                {/* Age Line */}
                              <div 
                                className="absolute left-0 w-full border-t border-red-500 border-dashed z-10 flex items-center"
                                style={{ top: `${getAgeTopPercent(age.assessedMonths)}%` }}
                              >
                                <span className="absolute left-0 -translate-y-full text-red-600 font-bold flex-wrap sm:flex-nowrap text-[8px] bg-white px-1 leading-none">
                                  {age.assessedMonths} MONTHS
                                </span>
                              </div>
                                {reversedStages.map((stage, sIdx) => {
                                const isLast = sIdx === reversedStages.length - 1;
                                return (
                                  <div key={stage.id} className={`flex h-10 ${!isLast ? 'border-b border-gray-400' : ''}`}>
                                     <div className="w-[75px] border-r border-[#4D1435] flex flex-col items-center justify-center font-bold text-[6px] text-center px-1 leading-tight" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                         <span className="text-[8px] mb-0.5">{stage.roman}</span>
                                         <span>{stage.name}</span>
                                       </div>
                                       <div className="w-[65px] border-r border-[#4D1435] flex flex-col items-start justify-center font-medium text-[6px] px-1 leading-[1.1]" style={{ backgroundColor: STAGE_COLORS[stage.id], color: (stage.id === 's3' || stage.id === 's2' || stage.id === 's4') ? '#000' : '#fff' }}>
                                          <div className="w-full flex justify-between"><i>Superior</i><span>{stage.superiorMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Average</i><span>{stage.averageMonths} Mon.</span></div>
                                          <div className="w-full flex justify-between"><i>Slow</i><span>{stage.slowMonths} Mon.</span></div>
                                       </div>
                                     <div className="flex-1 relative border-r border-[#4D1435]">
                                       {renderCellFill(stage, score)}
                                     </div>
                                  </div>
                                )
                              })}
                              </div>
                           </div>

                           {/* Narrative */}
                           <div className="flex-1 flex flex-col">
                              <div className="mb-4">
                                <h3 className="text-[1.1rem] font-bold text-[#4D1435] mb-2 uppercase tracking-wide">Summary:</h3>
                                <div className="text-[1rem] leading-relaxed text-gray-800 border-b border-gray-300 pb-3">
                                  {domainNote(score, child)}
                                </div>
                              </div>
                              {/* Milestone QR video card — replaces hardcoded Recommendation text */}
                              <MilestoneVideoRow
                                  stageId={score.achievedStage}
                                  domain={score.domain}
                                  domainName={domain.name}
                                />
                           </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             </A4Page>
           ));
        })()}

        {/* Page 5: Overall Result */}
        <A4Page>
           <div className="border-b-[3px] border-[#4D1435] pb-4 mb-10 flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-baseline print:items-baseline gap-4 mt-4">
             <h2 className="text-2xl font-extrabold uppercase text-[#4D1435] tracking-wide">OVERALL RESULT:</h2>
              <div className="flex flex-col items-center justify-center min-w-[140px] px-8 py-4 rounded-2xl border-[5px] border-[#4D1435] bg-[#4D1435] text-white shadow-xl">
               <span className="text-5xl font-black tracking-tight leading-none">{result.overallStatus.replace(/-/g, '\u2212')}</span>
               <span className="text-lg font-bold mt-1.5 opacity-80">{Math.round(result.domainScores.reduce((acc, curr) => acc + (curr.percent || 0), 0) / (result.domainScores.length || 1) * 100)}%</span>
             </div>
           </div>

           <div className="space-y-12">
             <div>
               <p className="text-xl leading-[2] text-gray-800 font-medium">{overallSummary(result, child)}</p>
             </div>

             <div>
               <h3 className="text-xl font-bold uppercase text-[#4D1435] tracking-wider mb-4">Recommendation:</h3>
               <p className="text-xl leading-[2] text-gray-800 font-medium">
                  <span className="font-bold underline px-1">{child.name}</span> needs to join <span className="font-bold">Phase {startStage.roman} Course</span> of the KGKP for further enhancement of his/her Competencies to raise the DQ. Please use the link below to explore the Course to help you make a decision to continue further.
               </p>
               
               <div className="mt-8">
                    <CourseRow stageId={startStage.id} childName={child.name} />
                  </div>
             </div>
           </div>

           </A4Page>

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
          </A4Page>

      </main>
    </>
  );
}
