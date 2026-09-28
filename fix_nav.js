const fs = require('fs');
let src = fs.readFileSync('app/admin/(protected)/layout.tsx', 'utf8');

src = src.replace('{ href: "/admin/item-bank",        label: "Question Bank",         icon: <IconBolt size={18} /> },', '{ href: "/admin/item-bank",        label: "Question Bank",         icon: <IconBolt size={18} /> },\n  { href: "/admin/content",          label: "Report Narratives",     icon: <IconSparkle size={18} /> },');

fs.writeFileSync('app/admin/(protected)/layout.tsx', src);
