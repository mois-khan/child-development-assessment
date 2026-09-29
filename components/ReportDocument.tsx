"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE, INPUT_DOMAINS, OUTPUT_DOMAINS } from "@/content/domains";
import { formatAge, summariseAge } from "@/lib/age";
import { PLATFORM_NAME, PLATFORM_SHORT, phaseLabel, reportName } from "@/lib/naming";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
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
  s1: "#FF0000",
  s2: "#FFA500",
  s3: "#FFD700",
  s4: "#008000",
  s5: "#0000FF",
  s6a: "#4B0082",
  s6b: "#4B0082",
  s7a: "#8A2BE2",
  s7b: "#8A2BE2",
};

const A4Page = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`w-full max-w-[210mm] mx-auto bg-white sm:my-8 sm:shadow-lg print:m-0 print:shadow-none relative overflow-hidden break-after-page print:last:break-after-auto text-black flex flex-col p-[12mm] sm:p-[15mm] border border-gray-200 print:border-none ${className}`}
    style={{ height: "297mm", maxHeight: "297mm", breakAfter: "page", pageBreakInside: "avoid", breakInside: "avoid" }}
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
          <div className="text-center mt-12 mb-8 flex justify-center">
             <Wordmark height={64} />
          </div>
          <div className="w-full mt-12 mb-16 flex justify-center">
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-4 whitespace-nowrap">
                <h1 className="font-black uppercase tracking-tight leading-none text-[#4D1435]" style={{ fontSize: "5rem" }}>
                  <span style={{ WebkitTextStroke: '3px #4D1435', color: 'white', marginRight: '2px' }}>ECCTR</span>ACTION
                </h1>
                <h2 className="font-bold uppercase text-[#4D1435] tracking-widest" style={{ fontSize: "2.2rem" }}>Plan</h2>
              </div>
              <div className="bg-[#FFE600] text-[#4D1435] tracking-[0.2em] font-bold px-3 py-[2px] mt-1 text-[0.8rem] whitespace-nowrap">
                EARLY&nbsp;&nbsp;CHILDHOOD&nbsp;&nbsp;COMPETENCE&nbsp;&nbsp;TRACKING&nbsp;&nbsp;REPORT
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-[1.1rem] leading-[1.8] text-[#1D1D1B] text-justify font-medium">
            Competency tracking is a broad term that involves assessment of essential milestones in the areas of 6 human Competencies achieved in any child along the seven phases of brain development in the first six years of age. Major portion of the IQ is developed during this time span. Brain development is a cohesive all-competencies-inclusive process. No competency domain exists in isolation.
          </p>

          <div className="mt-20">
            <h3 className="text-lg font-bold uppercase mb-8 tracking-wider text-gray-500 text-center">THIS REPORT IS GENERATED FOR:</h3>
            <div className="space-y-6 text-[1.1rem] max-w-lg mx-auto">
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">Name:</span> <span className="font-medium text-gray-800">{child.name}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">Date of Birth:</span> <span className="font-medium text-gray-800">{formatDate(child.dob)}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">Gender:</span> <span className="font-medium capitalize text-gray-800">{child.gender}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">School/Clinic/Parent:</span> <span className="font-medium text-gray-800">{child.parentName || "—"}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">Assessment Date:</span> <span className="font-medium text-gray-800">{formatDate(record.assessedOn)}</span></div>
               <div className="flex border-b border-gray-300 pb-2"><span className="font-bold w-56 text-[#4D1435]">Assessment Tool:</span> <span className="font-medium text-gray-800">KECCTR (Phase {startStage.roman})</span></div>
            </div>
          </div>
        </A4Page>

        {/* Page 2: Progress & Spectrum */}
        <A4Page>
          <div className="border-b-[3px] border-[#4D1435] pb-3 mb-8">
             <h2 className="text-[1.1rem] font-extrabold uppercase text-[#4D1435] tracking-wide">
               {child.name}'S KAUSHALYA ECCTRACTION PLAN (PHASE {startStage.roman})
             </h2>
          </div>
          <div className="flex justify-between items-start mb-6">
             <div className="flex-1 pr-8">
                <h3 className="text-lg font-bold uppercase mb-3 text-[#4D1435] tracking-wide">CHILD'S OVERALL DEVELOPMENT ({child.name})</h3>
                <p className="text-[#1D1D1B] font-medium leading-relaxed">{headline(result, child)}</p>
             </div>
             <div className="flex-shrink-0 text-right border-l-[3px] border-[#4D1435] pl-6 py-2">
                <div className="flex items-center justify-center min-w-[100px] px-4 h-[80px] rounded-2xl border-[4px] border-[#4D1435] text-4xl font-black text-[#4D1435] bg-white whitespace-nowrap">{result.overallStatus.replace(/-/g, '−')}</div>
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
             <div className="relative flex-1 min-h-0 w-full border-[2px] border-[#4D1435] flex flex-col font-sans text-xs mb-4">
                
                {/* Headers */}
                <div className="flex border-b-[2px] border-[#4D1435] font-extrabold text-[#4D1435] text-[10px] uppercase text-center">
                   <div className="w-12 border-r-[2px] border-[#4D1435] flex items-center justify-center bg-gray-50">PHASE</div>
                   {inputDomainCodes.map(c => (
                     <div key={c} className="flex-1 border-r-[2px] border-[#4D1435] py-2 bg-gray-50">{DOMAIN_BY_CODE[c].short}</div>
                   ))}
                   <div className="w-16 border-r-[2px] border-[#4D1435] flex items-center justify-center bg-gray-50 text-[9px] leading-tight">BRAIN<br/>STAGE</div>
                   {outputDomainCodes.map((c, i) => (
                     <div key={c} className={`flex-1 py-2 bg-gray-50 ${i !== outputDomainCodes.length - 1 ? 'border-r-[2px] border-[#4D1435]' : ''}`}>{DOMAIN_BY_CODE[c].short}</div>
                   ))}
                </div>

                {/* Rows */}
                <div className="flex-1 flex flex-col relative">
                  {/* Red dotted line for age */}
                <div 
                  className="absolute left-0 w-full border-t-2 border-red-500 border-dashed z-10 flex items-center"
                  style={{ top: `${getAgeTopPercent(age.assessedMonths)}%` }}
                >
                  <span className="absolute left-0 -translate-y-full text-red-600 font-bold whitespace-nowrap text-[10px] bg-white px-1 leading-none">
                    {age.assessedMonths} MONTHS
                  </span>
                </div>
                  {reversedStages.map((stage, idx) => {
                    const isLastRow = idx === reversedStages.length - 1;
                    return (
                      <div key={stage.id} className={`flex-1 flex ${!isLastRow ? 'border-b border-gray-400' : ''}`}>
                        {/* Phase column */}
                        <div className="w-12 border-r-[2px] border-[#4D1435] flex flex-col items-center justify-center text-[10px] font-bold text-gray-700 bg-gray-50">
                           <span>{stage.roman}</span>
                           <span className="text-[8px]">{stage.averageMonths}M</span>
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

                        {/* Mascot / Divider */}
                        <div className="w-16 border-r-[2px] border-l-[2px] border-[#4D1435] flex items-center justify-center relative overflow-hidden bg-gray-50">
                          {idx === Math.floor(reversedStages.length / 2) && (
                            <span className="absolute rotate-90 text-[10px] tracking-[0.2em] font-black text-[#4D1435] opacity-50 whitespace-nowrap">
                              HUMANOID PICTURE
                            </span>
                          )}
                        </div>

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
                        <div className="flex justify-between items-baseline mb-6 border-b border-[#4D1435] pb-2">
                           <h2 className="text-xl font-bold uppercase text-[#4D1435] tracking-wide">
                             <span className="mr-3 border-2 border-[#4D1435] rounded-full w-8 h-8 inline-flex items-center justify-center text-sm">{romanDomain}</span>
                             {domain.name}
                           </h2>
                           <div className="flex items-center justify-center min-w-[70px] px-3 h-[56px] rounded-xl border-[3px] border-[#4D1435] text-2xl font-black text-[#4D1435] whitespace-nowrap">{STATUSES[score.status].code.replace(/-/g, '−')}</div>
                        </div>

                        <div className="flex gap-8">
                           {/* Mini Chart */}
                           <div className="w-[120px] shrink-0 border-[2px] border-[#4D1435] flex flex-col font-sans text-[9px] relative">
                             

                              <div className="border-b-[2px] border-[#4D1435] text-center font-extrabold text-[#4D1435] py-1 bg-gray-50 uppercase">
                                {domain.short} COMPETENCE
                              </div>
                              <div className="flex-1 flex flex-col relative">
                                {/* Age Line */}
                              <div 
                                className="absolute left-0 w-full border-t border-red-500 border-dashed z-10 flex items-center"
                                style={{ top: `${getAgeTopPercent(age.assessedMonths)}%` }}
                              >
                                <span className="absolute left-0 -translate-y-full text-red-600 font-bold whitespace-nowrap text-[8px] bg-white px-1 leading-none">
                                  {age.assessedMonths} MONTHS
                                </span>
                              </div>
                                {reversedStages.map((stage, sIdx) => {
                                const isLast = sIdx === reversedStages.length - 1;
                                return (
                                  <div key={stage.id} className={`flex h-10 ${!isLast ? 'border-b border-gray-400' : ''}`}>
                                     <div className="w-8 border-r border-[#4D1435] flex items-center justify-center font-bold text-gray-500 bg-gray-50">
                                       {stage.roman}
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
                              {!isAdmin && (
                                <MilestoneVideoRow
                                  stageId={score.achievedStage}
                                  domain={score.domain}
                                  domainName={domain.name}
                                />
                              )}
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
           <div className="border-b-[3px] border-[#4D1435] pb-4 mb-10 flex justify-between items-baseline mt-4">
             <h2 className="text-2xl font-extrabold uppercase text-[#4D1435] tracking-wide">OVERALL RESULT:</h2>
             <div className="flex items-center justify-center min-w-[120px] px-6 h-[96px] rounded-2xl border-[5px] border-[#4D1435] text-5xl font-black text-[#4D1435] whitespace-nowrap">{result.overallStatus.replace(/-/g, '−')}</div>
           </div>

           <div className="space-y-12">
             <div>
               <p className="text-xl leading-[2] text-gray-800 font-medium">
                  The KECCTRA report indicates that <span className="font-bold underline px-1">{child.name}</span> is developing <span className="font-bold underline px-1 text-[#4D1435]">
                    {result.overallStatus === "A++" || result.overallStatus === "A+" ? "beyond expectation" : result.overallStatus === "A" ? "as expected" : "below expectation"}
                  </span> for his/her age.
               </p>
             </div>

             <div>
               <h3 className="text-xl font-bold uppercase text-[#4D1435] tracking-wider mb-4">Recommendation:</h3>
               <p className="text-xl leading-[2] text-gray-800 font-medium">
                  <span className="font-bold underline px-1">{child.name}</span> needs to join <span className="font-bold">Phase {startStage.roman} Course</span> of the KGKP for further enhancement of his/her Competencies to raise the DQ. Please use the link below to explore the Course to help you make a decision to continue further.
               </p>
               
               {!isAdmin && (
                  <div className="mt-8">
                    <CourseRow stageId={startStage.id} childName={child.name} />
                  </div>
               )}
             </div>
           </div>

           <div className="mt-auto pt-8 border-t-[3px] border-[#4D1435]">
             <h4 className="text-lg font-bold uppercase text-[#4D1435] tracking-wider mb-3">Disclaimer:</h4>
             <p className="text-[0.85rem] leading-relaxed text-gray-600 text-justify">
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
