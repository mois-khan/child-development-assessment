const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

code = code.replace(
  /import \{ getDisclaimer, domainNote, headline, nextSteps, summary, overallSummary \} from "\@\/lib\/narrative";/,
  'import { getDisclaimer, domainNote, headline, overallSummary } from "@/lib/narrative";'
);

fs.writeFileSync('components/ReportDocument.tsx', code);
