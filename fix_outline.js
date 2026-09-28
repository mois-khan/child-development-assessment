const fs = require('fs');
let code = fs.readFileSync('components/ReportDocument.tsx', 'utf8');
code = code.replace(
  "<span style={{ WebkitTextStroke: '4px #4D1435', color: 'transparent', marginRight: '4px' }}>ECCTR</span>",
  "<span style={{ WebkitTextStroke: '6px #4D1435', color: 'white', marginRight: '8px' }}>ECCTR</span>"
);
fs.writeFileSync('components/ReportDocument.tsx', code);
