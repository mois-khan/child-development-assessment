import { stageForAge } from "../lib/stage";

const cases: { months: number; expectedRoman: string; label: string }[] = [
  // Phase-I (0 - 1 month)
  { months: 0, expectedRoman: "I", label: "0 month (05/11/2026)" },
  { months: 1, expectedRoman: "II", label: "1 month (05/10/2026) -> Phase II starts at 1mo" },

  // Phase-II (1 - 2.5 months)
  { months: 2, expectedRoman: "II", label: "2 months (05/09/2026)" },

  // Phase-III (2.5 - 7 months)
  { months: 2.5, expectedRoman: "III", label: "2.5 months boundary" },
  { months: 3, expectedRoman: "III", label: "3 months (05/08/2026)" },
  { months: 5, expectedRoman: "III", label: "5 months (05/06/2026)" },
  { months: 7, expectedRoman: "IV", label: "7 months (05/04/2026) -> Phase IV starts at 7mo" },

  // Phase-IV (7 - 12 months)
  { months: 8, expectedRoman: "IV", label: "8 months (05/03/2026)" },
  { months: 10, expectedRoman: "IV", label: "10 months (05/01/2026)" },
  { months: 12, expectedRoman: "V", label: "12 months (05/11/2025) -> Phase V starts at 12mo" },

  // Phase-V (12 - 18 months)
  { months: 13, expectedRoman: "V", label: "13 months (05/10/2025)" },
  { months: 15, expectedRoman: "V", label: "15 months (05/08/2025)" },
  { months: 17, expectedRoman: "V", label: "17 months (05/06/2025)" },
  { months: 18, expectedRoman: "VIA", label: "18 months (05/05/2025) -> Phase VI-A starts at 18mo" },

  // Phase-VI A (18 - 27 months)
  { months: 19, expectedRoman: "VIA", label: "19 months (05/04/2025)" },
  { months: 24, expectedRoman: "VIA", label: "24 months (05/11/2024)" },
  { months: 26, expectedRoman: "VIA", label: "26 months (05/09/2024)" },
  { months: 27, expectedRoman: "VIB", label: "27 months (05/08/2024) -> Phase VI-B starts at 27mo" },

  // Phase-VI B (27 to 36 months)
  { months: 28, expectedRoman: "VIB", label: "28 months (05/07/2024)" },
  { months: 29, expectedRoman: "VIB", label: "29 months (05/06/2024)" },
  { months: 32, expectedRoman: "VIB", label: "32 months (05/03/2024)" },
  { months: 34, expectedRoman: "VIB", label: "34 months (05/01/2024)" },
  { months: 36, expectedRoman: "VIIA", label: "36 months (05/11/2023) -> Phase VII-A starts at 36mo" },

  // Phase-VII A (36 to 54 months)
  { months: 43, expectedRoman: "VIIA", label: "43 months (05/04/2023)" },
  { months: 44, expectedRoman: "VIIA", label: "44 months (05/03/2023)" },
  { months: 50, expectedRoman: "VIIA", label: "50 months (05/09/2022)" },
  { months: 52, expectedRoman: "VIIA", label: "52 months (05/07/2022)" },
  { months: 54, expectedRoman: "VIIB", label: "54 months (05/05/2022) -> Phase VII-B starts at 54mo" },

  // Phase-VII B (54 to 72 months)
  { months: 56, expectedRoman: "VIIB", label: "56 months (05/03/2022)" },
  { months: 66, expectedRoman: "VIIB", label: "66 months (05/05/2021)" },
  { months: 70, expectedRoman: "VIIB", label: "70 months (05/01/2021)" },
  { months: 72, expectedRoman: "VIIB", label: "72 months (05/11/2020)" },
];

console.log("=== VERIFYING ALL CLIENT TEST CASES FROM HANDWRITTEN SHEET ===");
let allPassed = true;
for (const c of cases) {
  const result = stageForAge(c.months);
  const pass = result.roman === c.expectedRoman;
  if (!pass) allPassed = false;
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}: ${c.label} => Result: Phase ${result.roman} (Expected: Phase ${c.expectedRoman})`);
}

if (allPassed) {
  console.log("\n🎉 ALL 32 CLIENT SHEET TEST CASES MATCH 100%!");
} else {
  console.error("\n❌ Some test cases failed.");
  process.exit(1);
}
