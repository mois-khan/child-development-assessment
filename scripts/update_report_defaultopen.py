import re

with open('components/ReportDocument.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('score.status === "mild" || score.status === "delay" || score.status === "significant"', 'score.status === "A-" || score.status === "A--"')

with open('components/ReportDocument.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ReportDocument.tsx defaultOpen")
