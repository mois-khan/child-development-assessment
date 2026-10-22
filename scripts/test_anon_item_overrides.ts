import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function run() {
  const { data, count, error } = await supabaseAnon
    .from('item_overrides')
    .select('*', { count: 'exact' });

  console.log('Anon key query - count:', count, 'data length:', data?.length, 'error:', error);
}

run().catch(console.error);
