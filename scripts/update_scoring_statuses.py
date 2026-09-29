import re

with open('lib/scoring.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_statuses = '''export const STATUSES: Record<StatusCode, Status> = {
  "A++": {
    code: "A++",
    label: "Highly Advanced",
    meaning: "Mastered current phase and multiple advanced milestones.",
  },
  "A+": {
    code: "A+",
    label: "Advanced",
    meaning: "Mastered current phase and showing advanced skills.",
  },
  "A": {
    code: "A",
    label: "Average",
    meaning: "Development is on proper phase according to their age.",
  },
  "A-": {
    code: "A-",
    label: "Slightly Below Average",
    meaning: "Missed some expected milestones. Monitor closely.",
  },
  "A--": {
    code: "A--",
    label: "Needs Focus",
    meaning: "Missing foundational milestones. We recommend targeted practice.",
  },
};

export const STATUS_SEVERITY: Record<StatusCode, number> = {
  "A++": 0,
  "A+": 1,
  "A": 2,
  "A-": 3,
  "A--": 4,
};

const SEVERITY_STATUS: StatusCode[] = ["A++", "A+", "A", "A-", "A--"];'''

content = re.sub(r'export const STATUSES: Record<StatusCode, Status> = \{.*?\n\};.*?const SEVERITY_STATUS: StatusCode\[\] = \[.*?\];', new_statuses, content, flags=re.DOTALL)

with open('lib/scoring.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated statuses in lib/scoring.ts")
