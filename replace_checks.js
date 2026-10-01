const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

replaceInFile('app/admin/(protected)/page.tsx', /finished check/g, 'finished assessment');
replaceInFile('app/api/cron/reminders/route.ts', /next check/g, 'next assessment');
replaceInFile('app/assessment/[id]/page.tsx', /'s check/g, "'s assessment");
replaceInFile('app/assessment/[id]/page.tsx', /that check/g, 'that assessment');
replaceInFile('app/children/[id]/page.tsx', /New check/g, 'New assessment');
replaceInFile('app/children/page.tsx', /Resume the check/g, 'Resume the assessment');
replaceInFile('app/children/page.tsx', /Check again/g, 'Assess again');
replaceInFile('app/dashboard/page.tsx', /check\$\{totals\.done/g, 'assessment${totals.done');
replaceInFile('app/dashboard/page.tsx', /'s check/g, "'s assessment");
replaceInFile('app/dashboard/page.tsx', /new check/g, 'new assessment');
replaceInFile('app/dashboard/page.tsx', /Check done/g, 'Assessment done');
replaceInFile('app/dashboard/page.tsx', /Checks done/g, 'Assessments done');

console.log('Done replacing more occurrences of check');
