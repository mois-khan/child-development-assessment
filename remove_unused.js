const fs = require('fs');
let code = fs.readFileSync('lib/narrative.ts', 'utf8');

const summaryIndex = code.indexOf('export function summary');
if (summaryIndex !== -1) {
  // We want to delete from summaryIndex all the way to overallSummary
  const overallIndex = code.indexOf('export function overallSummary');
  if (overallIndex !== -1) {
    code = code.substring(0, summaryIndex) + code.substring(overallIndex);
  }
}

fs.writeFileSync('lib/narrative.ts', code);
