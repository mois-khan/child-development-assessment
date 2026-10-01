
const fs = require('fs');
let content = fs.readFileSync('content/stages.ts', 'utf8');

content = content.replace(/name: 'Phase 1'/g, 'name: \'MEDULLA AND CORD\'');
content = content.replace(/name: 'Phase 2'/g, 'name: \'PONS\'');
content = content.replace(/name: 'Phase 3'/g, 'name: \'MID-BRAIN\'');
content = content.replace(/name: 'Phase 4'/g, 'name: \'INITIAL CORTEX\'');
content = content.replace(/name: 'Phase 5'/g, 'name: \'EARLY CORTEX\'');
content = content.replace(/name: 'Phase 6a'/g, 'name: \'PRIMITIVE CORTEX\'');
content = content.replace(/name: 'Phase 6b'/g, 'name: \'PRIMITIVE CORTEX\'');
content = content.replace(/name: 'Phase 7a'/g, 'name: \'SOPHISTICATED CORTEX\'');
content = content.replace(/name: 'Phase 7b'/g, 'name: \'SOPHISTICATED CORTEX\'');

fs.writeFileSync('content/stages.ts', content);

