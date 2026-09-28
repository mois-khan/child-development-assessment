import re

with open('lib/narrative.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('case "advanced":', 'case "A++":\n    case "A+":')
content = content.replace('case "typical":', 'case "A":')
content = content.replace('case "mild":', 'case "A-":')
content = content.replace('case "delay":', '// A- handles mild cases\n')
content = content.replace('case "significant":', 'case "A--":')
content = content.replace('result.overallStatus === "delay"', 'result.overallStatus === "A-"')
content = content.replace('result.overallStatus === "significant"', 'result.overallStatus === "A--"')

with open('lib/narrative.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated lib/narrative.ts")
