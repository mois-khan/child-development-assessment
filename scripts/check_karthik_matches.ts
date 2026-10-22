import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: overrides } = await supabase.from('item_overrides').select('id, stage_id, domain');
  const overrideIds = new Set(overrides?.map(o => o.id) || []);

  const { data: responses } = await supabase
    .from('responses')
    .select('item_id')
    .eq('assessment_id', '97a00094-9833-4e6e-941e-83e3608e4763');

  let matchCount = 0;
  for (const r of (responses || [])) {
    if (overrideIds.has(r.item_id)) {
      matchCount++;
    } else {
      console.log('Karthik unmatched response item_id:', r.item_id);
    }
  }

  console.log(`Karthik matched response item_ids: ${matchCount} / ${responses?.length}`);
}

run().catch(console.error);
