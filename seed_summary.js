require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.from('cms_blocks').upsert([
    {
      id: 'report_overall_summary',
      content: 'The KECCTRA report indicates that {name} is developing {grade} for his/her age.',
      description: 'The overall summary text appearing on the final page of the report.'
    }
  ]);
  if (error) console.error("Error:", error);
  else console.log("Success inserting report_overall_summary");
}

run();
