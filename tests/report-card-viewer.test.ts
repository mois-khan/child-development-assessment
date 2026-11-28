import assert from "node:assert/strict";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";

import { DOMAINS } from "@/content/domains";
import { cellFor, FIRST_STAGE } from "@/content/stages";
import { ReportCardViewer } from "@/components/report/ReportCardViewer";
import type { AssessmentResult, Child } from "@/lib/types";

Object.assign(globalThis, { React });

const child: Child = {
  name: "Priya",
  dob: "2022-08-28",
  gender: "girl",
};

const result: AssessmentResult = {
  assessedMonths: 51,
  assessedExactMonths: 51.3,
  chronologicalMonths: 51,
  corrected: false,
  startStage: FIRST_STAGE.id,
  stages: [FIRST_STAGE],
  domainScores: DOMAINS.map((domain) => ({
    domain: domain.code,
    achievedStage: FIRST_STAGE.id,
    cell: cellFor(FIRST_STAGE.id, domain.code),
    stagesAsked: [FIRST_STAGE.id],
    raw: 0,
    max: 1,
    percent: 0,
    stageProgress: {},
    neurologicalMonths: 0,
    dq: null,
    status: "severely_weak",
    achieved: [],
    notYet: [],
    details: {},
  })),
  overallDq: 43,
  overallStatus: "very_weak",
  overallRaisedBy: null,
  strengths: [],
  focusAreas: [],
  suppressDq: false,
  answeredCount: 0,
};

test("keeps the detailed-report action before support and makes the overview mobile-safe", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ReportCardViewer, {
      child,
      result,
      startStage: FIRST_STAGE,
      ageExactMonths: 51.3,
      onShare: () => {},
      onDownload: () => {},
      onViewSheet: () => {},
    }),
  );
  const detailedReportIndex = markup.indexOf("View detailed report");
  const suggestedSupportIndex = markup.indexOf("Suggested support");

  assert.ok(detailedReportIndex >= 0);
  assert.ok(suggestedSupportIndex > detailedReportIndex);
  assert.ok(suggestedSupportIndex < markup.indexOf("Save as PDF"));
  assert.ok(markup.indexOf("Six competencies") < detailedReportIndex);
  assert.match(markup, /flex-col[^"]*min-\[400px\]:flex-row/);
  assert.match(markup, /grid-cols-1[^"]*min-\[400px\]:grid-cols-2[^"]*sm:grid-cols-3/);
  assert.doesNotMatch(markup, /truncate text-2xl font-black/);
  assert.match(markup, /whitespace-nowrap[^"]*">Score for age/);
});
