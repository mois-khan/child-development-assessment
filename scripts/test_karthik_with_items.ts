import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { scoreAssessment } from '../lib/scoring';
import { __setItemBankForTests } from '../lib/item-bank';
import { ITEMS } from '../content/items';
import type { ResponseValue } from '../lib/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Prime with the shipped ITEMS that match s4-vision-01, s3-vision-01, etc.
  __setItemBankForTests(ITEMS);

  const { data: a, error: aError } = await supabase
    .from("assessments")
    .select("*, children(*)")
    .eq("id", "97a00094-9833-4e6e-941e-83e3608e4763")
    .single();

  const { data: rData, error: rError } = await supabase
    .from("responses")
    .select("*")
    .eq("assessment_id", a.id);

  const responses: Record<string, ResponseValue> = {};
  for (const r of (rData || [])) {
    responses[r.item_id] = r.value as ResponseValue;
  }

  const child = Array.isArray(a.children) ? a.children[0] : a.children;

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

  console.log('--- SCORING WITH ORIGINAL QUESTION BANK (ITEMS) ---');
  console.log('Overall Status:', result.overallStatus);
  console.log('Overall DQ / Percent:', result.overallDq);
  for (const ds of result.domainScores) {
    console.log(`Domain: ${ds.domain} -> Status: ${ds.status}, Percent: ${ds.percent * 100}%, AchievedStage: ${ds.achievedStage}, Raw: ${ds.raw}/${ds.max}`);
  }
}

run().catch(console.error);
