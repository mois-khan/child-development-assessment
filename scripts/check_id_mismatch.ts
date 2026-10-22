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

  const { data: responses } = await supabase.from('responses').select('item_id');
  const responseIds = new Set(responses?.map(r => r.item_id) || []);

  console.log('Total unique IDs in item_overrides:', overrideIds.size);
  console.log('Total unique IDs in responses table:', responseIds.size);

  let matchCount = 0;
  for (const id of responseIds) {
    if (overrideIds.has(id)) {
      matchCount++;
    } else {
      // console.log('Unmatched response item_id:', id);
    }
  }

  console.log(`Matched response item_ids: ${matchCount} / ${responseIds.size}`);
}

run().catch(console.error);
