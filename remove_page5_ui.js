const fs = require('fs');
let code = fs.readFileSync('app/admin/(protected)/content/page.tsx', 'utf8');

// Update getPageGroup
code = code.replace(
  /return "page5"; \/\/ Action plans, summaries, course recommendations/,
  `if (["report_overall_summary", "report_course_recommendation"].includes(id)) return "page5";
  return "hidden";`
);

// Update getPage5Subgroup to be completely flat since there are only 2 items now
code = code.replace(
  /function getPage5Subgroup[\s\S]*?return \{ title: "Always Shown", desc: "These blocks appear on every single report at the very end." \};\n\}/,
  `function getPage5Subgroup(id: string): { title: string; desc: string } | null {
  return { title: "Always Shown", desc: "These blocks appear on every single report at the very end." };
}`
);

// Remove the explanation banner for Page 5
code = code.replace(
  /\{\/\* Explanation for Page 5 \*\/\}[\s\S]*?\{\/\* The Fields \*\/\}/,
  `{/* The Fields */}`
);

fs.writeFileSync('app/admin/(protected)/content/page.tsx', code);
console.log('Removed complex Page 5 logic');
