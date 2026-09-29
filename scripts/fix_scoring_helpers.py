import re

with open('lib/scoring.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"advanced" as StatusCode', '"A++" as StatusCode')
content = content.replace('STATUS_SEVERITY.mild', 'STATUS_SEVERITY["A-"]')
content = content.replace('STAGE_BY_ID[d.achievedStage]?.order ?? 0) * 20', 'STAGE_BY_ID[d.achievedStage]?.order ?? 0) * 20')

with open('lib/scoring.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed worstOf and pickHighlights")
