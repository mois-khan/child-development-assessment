const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xragqqjmctpwgvyqxjet.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const defaults = [
    { id: 'domain_note_a_plus_plus', description: 'Narrative for A++ score', content: '{name} demonstrates a much-beyond-age progress in the {domain} competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.' },
    { id: 'domain_note_a_plus', description: 'Narrative for A+ score', content: '{name} demonstrates beyond-age progress in the {domain} competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.' },
    { id: 'domain_note_a', description: 'Narrative for A score', content: '{name} demonstrates age appropriate progress in the {domain} competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the \'overall result\' section of this report.' },
    { id: 'domain_note_a_minus', description: 'Narrative for A- score', content: '{name} falls under a mild developmental gap category in the {domain} competence. This indicates that there is a need for ongoing support to help {name} thrive in the {domain} competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.' },
    { id: 'domain_note_a_minus_minus', description: 'Narrative for A-- score', content: '{name} requires immediate and intensive support in {domain} competence. This child will benefit from structured pathology intervention to build {domain} competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the \'overall result\' section of this report.' },
    { id: 'report_disclaimer', description: 'Report Disclaimer Footer', content: 'This is a developmental screening tool, not a diagnosis. It is based on parent report and is designed to show where a child may benefit from extra support or a closer look by a professional. It cannot diagnose any condition. If you have concerns about your child\'s development, speak to your doctor, whatever this report says.' }
  ];

  for (const block of defaults) {
    await supabase.from('cms_blocks').upsert(block, { onConflict: 'id' });
  }
  console.log('Seeded successfully!');
}
run();
