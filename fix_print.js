const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  'style={{ height: "297mm", maxHeight: "297mm", pageBreakAfter: "always", breakAfter: "page", pageBreakInside: "avoid", breakInside: "avoid" }}',
  'style={{ height: "297mm", maxHeight: "297mm", pageBreakInside: "avoid", breakInside: "avoid" }}'
);
code = code.replace(
  'break-after-page text-black',
  'break-after-page print:last:break-after-auto text-black'
);
fs.writeFileSync('components/ReportDocument.tsx', code);
