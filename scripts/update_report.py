import re

with open('components/ReportDocument.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('RECOMMEND_AT_OR_WORSE: StatusCode = "mild"', 'RECOMMEND_AT_OR_WORSE: StatusCode = "A-"')
content = content.replace('st === "significant" || st === "delay"', 'st === "A--" || st === "A-"')

with open('components/ReportDocument.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ReportDocument.tsx")
