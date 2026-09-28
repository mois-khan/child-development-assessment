import re

with open('content/stages.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_brain_stages = '''export const BRAIN_STAGES: BrainStage[] = [
  { id: "s1", order: 1, roman: "I", name: "Phase 1", superiorMonths: 0.5, averageMonths: 1, slowMonths: 2.5, hue: 0 },
  { id: "s2", order: 2, roman: "II", name: "Phase 2", superiorMonths: 1, averageMonths: 2.5, slowMonths: 7, hue: 24 },
  { id: "s3", order: 3, roman: "III", name: "Phase 3", superiorMonths: 2.5, averageMonths: 7, slowMonths: 12, hue: 50 },
  { id: "s4", order: 4, roman: "IV", name: "Phase 4", superiorMonths: 7, averageMonths: 12, slowMonths: 18, hue: 140 },
  { id: "s5", order: 5, roman: "V", name: "Phase 5", superiorMonths: 12, averageMonths: 18, slowMonths: 27, hue: 195 },
  { id: "s6a", order: 6, roman: "VIA", name: "Phase 6a", superiorMonths: 18, averageMonths: 27, slowMonths: 36, hue: 220 },
  { id: "s6b", order: 7, roman: "VIB", name: "Phase 6b", superiorMonths: 27, averageMonths: 36, slowMonths: 54, hue: 245 },
  { id: "s7a", order: 8, roman: "VIIA", name: "Phase 7a", superiorMonths: 36, averageMonths: 54, slowMonths: 72, hue: 275 },
  { id: "s7b", order: 9, roman: "VIIB", name: "Phase 7b", superiorMonths: 54, averageMonths: 72, slowMonths: 144, hue: 292 }
];'''

content = re.sub(r'export const BRAIN_STAGES: BrainStage\[\] = \[.*?\];', new_brain_stages, content, flags=re.DOTALL)

old_cells_match = re.search(r'const CELL_ROWS:.*?\[(.*?)\n\];', content, flags=re.DOTALL)

new_cell_rows = '''const CELL_ROWS: {
  stage: string;
  cells: Record<CompetenceCode, [number: number, competence: string, kind: string]>;
}[] = [
  {
    stage: "s1",
    cells: {
      vision: [1, "Light reflex", "Reflex reception"],
      auditory: [2, "Startle reflex", "Reflex reception"],
      tactile: [3, "Babinski reflex", "Reflex reception"],
      mobility: [4, "Movement of arms and legs without bodily movement", "Reflex response"],
      language: [5, "Birth cry and crying", "Reflex response"],
      hand: [6, "Grasp reflex", "Reflex response"],
    },
  },
  {
    stage: "s2",
    cells: {
      vision: [7, "Outline perception", "Vital perception"],
      auditory: [8, "Vital response to threatening sounds", "Vital perception"],
      tactile: [9, "Perception of vital sensation", "Vital perception"],
      mobility: [10, "Crawling in the prone position culminating in cross pattern crawling", "Vital response"],
      language: [11, "Vital crying in response to threats to life", "Vital response"],
      hand: [12, "Vital release", "Vital response"],
    },
  },
  {
    stage: "s3",
    cells: {
      vision: [13, "Appreciation of detail within a configuration", "Meaningful appreciation"],
      auditory: [14, "Appreciation of meaningful sounds", "Meaningful appreciation"],
      tactile: [15, "Appreciation of gnostic sensation", "Meaningful appreciation"],
      mobility: [16, "Creeping on hands and knees, culminating in cross pattern creeping", "Meaningful response"],
      language: [17, "Creation of meaningful sounds", "Meaningful response"],
      hand: [18, "Prehensile grasp", "Meaningful response"],
    },
  },
  {
    stage: "s4",
    cells: {
      vision: [19, "Convergence of vision resulting in simple depth perception", "Initial human understanding"],
      auditory: [20, "Understanding of two words of speech", "Initial human understanding"],
      tactile: [21, "Tactile understanding of the third dimension in objects which appear to be flat", "Initial human understanding"],
      mobility: [22, "Walking with arms in a primary balance role most frequently at or above shoulder height", "Initial human expression"],
      language: [23, "Two words of speech used spontaneously and meaningfully", "Initial human expression"],
      hand: [24, "Cortical opposition in either hand", "Initial human expression"],
    },
  },
  {
    stage: "s5",
    cells: {
      vision: [25, "Differentiation of similar but unlike simple visual symbols", "Early human understanding"],
      auditory: [26, "Understanding of 10 to 25 words and two word couplets", "Early human understanding"],
      tactile: [27, "Tactile differentiation of similar but unlike objects", "Early human understanding"],
      mobility: [28, "Walking with arms freed from the primary balance role", "Early human expression"],
      language: [29, "10 to 25 words of language and two word couplets", "Early human expression"],
      hand: [30, "Cortical opposition bilaterally and simultaneously", "Early human expression"],
    },
  },
  {
    stage: "s6a",
    cells: {
      vision: [31, "Identification of visual symbols and letters within experience (VIA)", "Primitive human understanding"],
      auditory: [32, "Understanding of simple sentences (VIA)", "Primitive human understanding"],
      tactile: [33, "Ability to determine characteristics of objects by tactile means (VIA)", "Primitive human understanding"],
      mobility: [34, "Walking and running (VIA)", "Primitive human expression"],
      language: [35, "Language and short sentences (VIA)", "Primitive human expression"],
      hand: [36, "Bimanual function (VIA)", "Primitive human expression"],
    },
  },
  {
    stage: "s6b",
    cells: {
      vision: [37, "Identification of visual symbols and letters within experience (VIB)", "Primitive human understanding"],
      auditory: [38, "Understanding of simple sentences (VIB)", "Primitive human understanding"],
      tactile: [39, "Ability to determine characteristics of objects by tactile means (VIB)", "Primitive human understanding"],
      mobility: [40, "Walking and running (VIB)", "Primitive human expression"],
      language: [41, "Language and short sentences (VIB)", "Primitive human expression"],
      hand: [42, "Bimanual function (VIB)", "Primitive human expression"],
    },
  },
  {
    stage: "s7a",
    cells: {
      vision: [43, "Reading with total understanding (VIIA)", "Sophisticated human understanding"],
      auditory: [44, "Understanding of complete vocabulary and proper sentences (VIIA)", "Sophisticated human understanding"],
      tactile: [45, "Tactile identification of objects (VIIA)", "Sophisticated human understanding"],
      mobility: [46, "Using a leg in a skilled role (VIIA)", "Sophisticated human expression"],
      language: [47, "Complete vocabulary and proper sentence structure (VIIA)", "Sophisticated human expression"],
      hand: [48, "Using a hand to write (VIIA)", "Sophisticated human expression"],
    },
  },
  {
    stage: "s7b",
    cells: {
      vision: [49, "Reading with total understanding (VIIB)", "Sophisticated human understanding"],
      auditory: [50, "Understanding of complete vocabulary and proper sentences (VIIB)", "Sophisticated human understanding"],
      tactile: [51, "Tactile identification of objects (VIIB)", "Sophisticated human understanding"],
      mobility: [52, "Using a leg in a skilled role (VIIB)", "Sophisticated human expression"],
      language: [53, "Complete vocabulary and proper sentence structure (VIIB)", "Sophisticated human expression"],
      hand: [54, "Using a hand to write (VIIB)", "Sophisticated human expression"],
    },
  }
];'''

content = re.sub(r'const CELL_ROWS:.*?\[.*?\];', new_cell_rows, content, flags=re.DOTALL)

with open('content/stages.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated content/stages.ts")
