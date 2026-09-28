const fs = require('fs');
let src = fs.readFileSync('components/ReportDocument.tsx', 'utf8');

src = src.replace('import { itemBankReady, primeItemBank } from "@/lib/item-bank";', 'import { itemBankReady, primeItemBank } from "@/lib/item-bank";\nimport { primeCmsBank, cmsReady } from "@/lib/cms";');
src = src.replace('const [bankReady, setBankReady] = useState(itemBankReady());', 'const [bankReady, setBankReady] = useState(itemBankReady());\n    const [cmsReadyState, setCmsReadyState] = useState(cmsReady());');
src = src.replace('primeItemBank().finally(() => {', 'Promise.all([primeItemBank(), primeCmsBank()]).finally(() => {');
src = src.replace('if (active) setBankReady(true);', 'if (active) { setBankReady(true); setCmsReadyState(true); }');
src = src.replace('if (!bankReady) {', 'if (!bankReady || !cmsReadyState) {');

fs.writeFileSync('components/ReportDocument.tsx', src);
