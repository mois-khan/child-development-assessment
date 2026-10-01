
const fs = require('fs');
let code = fs.readFileSync('replace.js', 'utf8');
code = code.replace(/\$\{.*?Time Frame.*?\}/g, '');
code = code.replace(/\$\{.*?Phase column.*?\}/g, '');
code = code.replace(/\$\{.*?Brain Stage column.*?\}/g, '');
fs.writeFileSync('replace2.js', code);

