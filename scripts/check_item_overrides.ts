import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, count, error } = await supabase
    .from('item_overrides')
    .select('*', { count: 'exact' });

  console.log('Count in item_overrides:', count, 'data length:', data?.length, 'error:', error);
  if (data && data.length > 0) {
    console.log('Sample item:', data[0]);
    console.log('Unique stages:', [...new Set(data.map(d => d.stage_id))]);
    console.log('Unique domains:', [...new Set(data.map(d => d.domain))]);
  }
}

run().catch(console.error);
