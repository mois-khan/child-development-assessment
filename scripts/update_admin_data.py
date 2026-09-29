import re

with open('lib/admin/data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('st === "significant" || st === "delay"', 'st === "A--" || st === "A-"')

with open('lib/admin/data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated lib/admin/data.ts")
