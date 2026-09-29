const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xragqqjmctpwgvyqxjet.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const domains = [
  { code: 'vision', name: 'visual' },
  { code: 'auditory', name: 'auditory' },
  { code: 'tactile', name: 'tactile' },
  { code: 'mobility', name: 'mobility' },
  { code: 'language', name: 'language' },
  { code: 'manual', name: 'manual' },
];

const statuses = [
  { status: 'A++', key: 'a_plus_plus', template: '{name} demonstrates a much-beyond-age progress in the {domain} competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.' },
  { status: 'A+', key: 'a_plus', template: '{name} demonstrates beyond-age progress in the {domain} competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.' },
  { status: 'A', key: 'a', template: '{name} demonstrates age appropriate progress in the {domain} competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the \'overall result\' section of this report.' },
  { status: 'A-', key: 'a_minus', template: '{name} falls under a mild developmental gap category in the {domain} competence. This indicates that there is a need for ongoing support to help {name} thrive in the {domain} competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.' },
  { status: 'A--', key: 'a_minus_minus', template: '{name} requires immediate and intensive support in {domain} competence. This child will benefit from structured pathology intervention to build {domain} competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the \'overall result\' section of this report.' },
];

async function run() {
  const blocks = [];
  for (const d of domains) {
    for (const s of statuses) {
      blocks.push({
        id: `domain_note_${d.code}_${s.key}`,
        description: `Narrative for ${d.name.charAt(0).toUpperCase() + d.name.slice(1)} Competence (${s.status})`,
        content: s.template.replace('{domain}', d.name)
      });
    }
  }

  for (const block of blocks) {
    await supabase.from('cms_blocks').upsert(block, { onConflict: 'id' });
  }
  
  // Also delete the old generic ones to keep CMS clean
  const oldKeys = ['domain_note_a_plus_plus', 'domain_note_a_plus', 'domain_note_a', 'domain_note_a_minus', 'domain_note_a_minus_minus'];
  for (const k of oldKeys) {
    await supabase.from('cms_blocks').delete().eq('id', k);
  }
  
  console.log('Seeded all 30 successfully!');
}
run();
