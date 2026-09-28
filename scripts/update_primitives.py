import re

with open('components/ui/primitives.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_status_tone = '''const STATUS_TONE: Record<StatusCode, BadgeTone> = {
  "A++": "success",
  "A+": "success",
  "A": "success",
  "A-": "warn",
  "A--": "danger",
};'''

content = re.sub(r'const STATUS_TONE: Record<StatusCode, BadgeTone> = \{.*?\};', new_status_tone, content, flags=re.DOTALL)

new_status_var = '''const STATUS_VAR: Record<StatusCode, string> = {
  "A++": "var(--st-on-track)",
  "A+": "var(--st-on-track)",
  "A": "var(--st-on-track)",
  "A-": "var(--st-emerging)",
  "A--": "var(--st-consult)",
};'''

content = re.sub(r'const STATUS_VAR: Record<StatusCode, string> = \{.*?\};', new_status_var, content, flags=re.DOTALL)

with open('components/ui/primitives.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated primitives.tsx")
