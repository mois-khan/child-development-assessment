import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: children, error: cErr } = await supabase
    .from('children')
    .select('*')
    .ilike('name', '%Karthik%');

  console.log('Children found:', children?.length, cErr ?? '');
  if (!children || children.length === 0) return;

  for (const child of children) {
    console.log('Child:', child.id, child.name, child.dob);
    const { data: assessments, error: aErr } = await supabase
      .from('assessments')
      .select('*')
      .eq('child_id', child.id);
    
    console.log(`Assessments for ${child.name}:`, assessments?.length, aErr ?? '');
    if (assessments) {
      for (const a of assessments) {
        console.log('Assessment ID:', a.id, 'status:', a.status, 'start_stage:', a.start_stage, 'stages_by_domain:', a.stages_by_domain);
        const { data: responses, error: rErr } = await supabase
          .from('responses')
          .select('*')
          .eq('assessment_id', a.id);
        console.log('Responses count:', responses?.length, rErr ?? '');
        console.log('Sample responses:', responses);
      }
    }
  }
}

run().catch(console.error);
