/**
 * CMS seed script — upserts all required cms_blocks into Supabase.
 *
 * Run: SUPABASE_SERVICE_ROLE_KEY=<key> node seed_cms.js
 *
 * Each domain (vision, auditory, tactile, mobility, language, hand) needs
 * 5 grade-specific blocks. Keys must match exactly what lib/narrative.ts
 * passes to getCmsText(): domain_note_{domain}_{grade}
 *
 * The placeholder {name} is replaced with the child's name.
 * The placeholder {domain} is replaced with the competence name (e.g. "visual").
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xragqqjmctpwgvyqxjet.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=<key> node seed_cms.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DOMAINS = [
  { code: 'vision',    name: 'Visual' },
  { code: 'auditory',  name: 'Auditory' },
  { code: 'tactile',   name: 'Tactile' },
  { code: 'mobility',  name: 'Mobility' },
  { code: 'language',  name: 'Language' },
  { code: 'hand',      name: 'Manual' },
];

const GRADE_TEMPLATES = {
  a_plus_plus: (domainName) =>
    `{name} demonstrates a much-beyond-age progress in the ${domainName} competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.`,

  a_plus: (domainName) =>
    `{name} demonstrates beyond-age progress in the ${domainName} competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.`,

  a: (domainName) =>
    `{name} demonstrates age appropriate progress in the ${domainName} competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the 'overall result' section of this report.`,

  a_minus: (domainName) =>
    `{name} falls under a mild developmental gap category in the ${domainName} competence. This indicates that there is a need for ongoing support to help {name} thrive in the ${domainName} competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.`,

  a_minus_minus: (domainName) =>
    `{name} requires immediate and intensive support in ${domainName} competence. This child will benefit from structured pathology intervention to build ${domainName} competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the 'overall result' section of this report.`,
};

const GRADE_DESCRIPTIONS = {
  a_plus_plus: 'Grade: A++ (Highly Advanced) — shown when score > 120%',
  a_plus:      'Grade: A+ (Advanced) — shown when score 101–120%',
  a:           'Grade: A (On Track) — shown when score 80–100%',
  a_minus:     'Grade: A- (Mild Gap) — shown when score 50–79%',
  a_minus_minus:'Grade: A-- (Needs Focus) — shown when score < 50%',
};

async function run() {
  const blocks = [];

  // Per-domain, per-grade blocks
  for (const domain of DOMAINS) {
    for (const [grade, templateFn] of Object.entries(GRADE_TEMPLATES)) {
      blocks.push({
        id: `domain_note_${domain.code}_${grade}`,
        description: `${domain.name} Competence · ${GRADE_DESCRIPTIONS[grade]}`,
        content: templateFn(domain.name.toLowerCase()),
      });
    }
  }

  // General blocks
  blocks.push({
    id: 'report_disclaimer',
    description: 'Disclaimer shown at the bottom of Page 5 of every report.',
    content: `This is a developmental screening tool, not a diagnosis. It is based on parent report and is designed to show where a child may benefit from extra support or a closer look by a professional. It cannot diagnose any condition. If you have concerns about your child's development, speak to your doctor, whatever this report says.`,
  });

  console.log(`Seeding ${blocks.length} CMS blocks...`);

  for (const block of blocks) {
    const { error } = await supabase
      .from('cms_blocks')
      .upsert(block, { onConflict: 'id' });

    if (error) {
      console.error(`FAILED: ${block.id} —`, error.message);
    } else {
      console.log(`OK: ${block.id}`);
    }
  }

  console.log('\nDone! Total blocks:', blocks.length);
  console.log('Expected: 30 domain blocks + 1 disclaimer = 31 blocks');
}

run().catch(console.error);
