import re

with open('lib/stage.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_stage_for_age = '''export function stageForAge(months: number): BrainStage {
  for (let i = BRAIN_STAGES.length - 1; i >= 0; i--) {
    const stage = BRAIN_STAGES[i];
    if (months >= stage.averageMonths) {
      return stage;
    }
  }
  return FIRST_STAGE;
}'''

content = re.sub(r'export function stageForAge\(months: number\): BrainStage \{.*?\n\}', new_stage_for_age, content, flags=re.DOTALL)

with open('lib/stage.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated stageForAge in lib/stage.ts")
