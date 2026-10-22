import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { scoreAssessment } from '../lib/scoring';
import { primeItemBank } from '../lib/item-bank';
import type { ResponseValue } from '../lib/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await primeItemBank();

  const { data: a, error: aError } = await supabase
    .from("assessments")
    .select("*, children(*)")
    .eq("id", "97a00094-9833-4e6e-941e-83e3608e4763")
    .single();

  if (aError || !a) {
    console.error('Error fetching assessment:', aError);
    return;
  }

  const { data: rData, error: rError } = await supabase
    .from("responses")
    .select("*")
    .eq("assessment_id", a.id);

  const responses: Record<string, ResponseValue> = {};
  for (const r of (rData || [])) {
    responses[r.item_id] = r.value as ResponseValue;
  }

  const child = Array.isArray(a.children) ? a.children[0] : a.children;

  console.log('Child DOB:', child.dob);
  console.log('Assessed On:', a.assessed_on);
  console.log('Stages by domain:', a.stages_by_domain);
  console.log('Total responses:', Object.keys(responses).length);

  const result = scoreAssessment({
    child: {
      id: child.id,
      name: child.name,
      dob: child.dob,
      gender: child.gender,
      gestationalWeeks: child.gestational_weeks ?? undefined,
    },
    assessedOn: a.assessed_on,
    responses,
    details: a.details,
    stagesByDomain: a.stages_by_domain,
  });

  console.log('Overall Status:', result.overallStatus);
  console.log('Overall DQ / Percent:', result.overallDq);
  for (const ds of result.domainScores) {
    console.log(`Domain: ${ds.domain}`);
    console.log(`  achievedStage: ${ds.achievedStage}`);
    console.log(`  status: ${ds.status}`);
    console.log(`  percent: ${ds.percent}`);
    console.log(`  raw: ${ds.raw}, max: ${ds.max}`);
    console.log(`  achieved items:`, ds.achieved.map(i => i.id));
    console.log(`  notYet items:`, ds.notYet.map(i => i.id));
  }
}

run().catch(console.error);
