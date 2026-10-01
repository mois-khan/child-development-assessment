
const fs = require('fs');
let content = fs.readFileSync('app/assessment/[id]/page.tsx', 'utf8');

content = content.replace(
  'title={Phase \$\{stage.roman\}}',
  'title={\Phase \$\{stage.roman\}\}'
);

content = content.replace(
  'stageLabel={\Stage \}',
  'stageLabel={\Stage \$\{stage.roman\}\}'
);

fs.writeFileSync('app/assessment/[id]/page.tsx', content);

