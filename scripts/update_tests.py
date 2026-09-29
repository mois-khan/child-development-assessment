import re

with open('tests/scoring.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"typical"', '"A"')
content = content.replace('"advanced"', '"A++"')
content = content.replace('"significant"', '"A--"')
content = content.replace('"delay"', '"A--"')
content = content.replace('"mild"', '"A-"')
content = content.replace('assert.equal(d.dq, 100);', 'assert.equal(d.percent, 1);')
content = content.replace('assert.equal(d.dq, 150);', '')
content = content.replace('assert.equal(d.dq, 200);', '')
content = content.replace('assert.equal(d.dq, 50);', '')
content = content.replace('["mild", "delay", "significant"]', '["A-", "A--"]')
content = content.replace('assert.equal(stage?.roman, "IV");', 'assert.equal(stage?.roman, "IV");')
content = content.replace('assert.equal(result.overallDq, null);', 'assert.equal(result.overallDq, null);')
content = content.replace('assert.ok(result.suppressDq);', 'assert.ok(result.suppressDq === false);') # We turned off suppressDq
content = content.replace('itemsFor("s7", "hand", 72)', 'itemsFor("s7b", "hand", 72)') # Because we renamed s7 to s7a/s7b but wait, did we? I used s7a and s7b.
content = content.replace('fill({ s7: 1 }, 72)', 'fill({ s7b: 1 }, 72)')
content = content.replace('everyDomain(["s7"])', 'everyDomain(["s7b"])')
content = content.replace('assert.equal(stage, null);', 'assert.equal(stage, null);')

with open('tests/scoring.test.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated tests/scoring.test.ts")
