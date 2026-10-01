const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

replaceInFile('app/dashboard/page.tsx', /&rsquo;s check/g, "&rsquo;s assessment");
replaceInFile('app/admin/(protected)/item-bank/page.tsx', /How to check/g, 'How to assess');
replaceInFile('app/page.tsx', /then check all six areas/g, 'then assess all six areas');

console.log('Done additional replaces');
