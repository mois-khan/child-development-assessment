"""
Builds the workbook the content client fills in.

Every list in here is copied from the app, not invented:
  - the six sections are content/domains.ts (name + code)
  - the five bands are the report's own bands; band_id is what the code will
    key off, so the client's wording can change without breaking the import
  - the video and course columns are named after lib/admin/videos.ts and
    lib/admin/courses.ts fields, so importing is a straight column copy

Regenerate with:  python scripts/build-content-sheet.py
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.utils import get_column_letter

OUT = "KGKP-Report-Content-Collection.xlsx"

# The six sections, from content/domains.ts
SECTIONS = [
    ("vision", "Visual Competence", "VIS"),
    ("auditory", "Auditory Competence", "AUD"),
    ("tactile", "Tactile Competence", "TAC"),
    ("mobility", "Mobility Competence", "MOB"),
    ("language", "Language Competence", "LAN"),
    ("hand", "Manual Competence", "MAN"),
]

# The five bands. band_id is the stable key the code will use.
BANDS = [
    ("significant_delay", 1, "Significant developmental delay",
     "Several areas sit well outside the chart's expected range. The report points the family to a specialist."),
    ("delay", 2, "Developmental delay",
     "Clearly later than the chart expects. Needs structured support, not watchful waiting."),
    ("mild_gaps", 3, "Mild developmental gaps",
     "Broadly on track with one or two areas lagging. Practice at home is the main answer."),
    ("typical", 4, "Typically developing",
     "Reaching each stage at the age the chart expects. Nothing to act on."),
    ("advanced", 5, "Advanced development",
     "Ahead of the chart. Activities are pitched one stage up."),
]

FONT = "Arial"
H1 = Font(name=FONT, size=14, bold=True, color="1A1A1A")
H2 = Font(name=FONT, size=11, bold=True, color="FFFFFF")
H3 = Font(name=FONT, size=11, bold=True, color="2E5A8A")
BODY = Font(name=FONT, size=10)
BODY_B = Font(name=FONT, size=10, bold=True)
MUTED = Font(name=FONT, size=9, color="6B6B6B")
EXAMPLE = Font(name=FONT, size=10, italic=True, color="1F6F43")
RED = Font(name=FONT, size=10, bold=True, color="9B2C2C")

HEAD_FILL = PatternFill("solid", fgColor="2E5A8A")
LOCK_FILL = PatternFill("solid", fgColor="EDEDED")
FILL_FILL = PatternFill("solid", fgColor="FFF6D6")
CALC_FILL = PatternFill("solid", fgColor="F2F7FB")
EX_FILL = PatternFill("solid", fgColor="EAF6EE")
BAD_FILL = PatternFill("solid", fgColor="F8D7DA")

THIN = Side(style="thin", color="C8C8C8")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
TOP = Alignment(vertical="top", wrap_text=True)
TOPL = Alignment(vertical="top", horizontal="left", wrap_text=True)
CTR = Alignment(vertical="center", horizontal="center", wrap_text=True)

BULLET = "•  "


def words(ref):
    """Word count that reads 0 for an empty cell rather than 1."""
    t = "TRIM(" + ref + ")"
    return ('=IF(' + ref + '="",0,LEN(' + t + ')-LEN(SUBSTITUTE(' + t + '," ",""))+1)')


def header_row(ws, row, headers, widths):
    for i, (text, width) in enumerate(zip(headers, widths), start=1):
        c = ws.cell(row=row, column=i, value=text)
        c.font = H2
        c.fill = HEAD_FILL
        c.alignment = CTR
        c.border = BOX
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[row].height = 34


wb = Workbook()

# ---------------------------------------------------------------- Start here
ws = wb.active
ws.title = "Start here"
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 26
ws.column_dimensions["C"].width = 104

rows = [
    ("h1", "Kaushalya Kids Genius Programme - report content", ""),
    ("sub", "", "Everything the assessment report says to a family, in one workbook. Fill the yellow cells only."),
    ("gap", "", ""),
    ("h2", "What we need", ""),
    ("kv", "Tab 1 - Section summaries",
     "30 summaries: 6 sections x 5 bands. One paragraph per box, plus a recommended video for that box."),
    ("kv", "Tab 2 - Overall summaries",
     "5 overall write-ups, one per band. This is the block at the top of the report, before the six sections."),
    ("kv", "Tab 3 - Courses",
     "5 courses, one per band. This is what the report recommends at the end."),
    ("kv", "Tab 4 - Lists",
     "Reference only. Do not edit - the dropdowns read from it."),
    ("gap", "", ""),
    ("h2", "Colour key", ""),
    ("legend_fill", "Yellow", "Please fill this in. These are the only cells you need to touch."),
    ("legend_lock", "Grey",
     "Fixed by the system. Do not edit or reorder these rows - the ID column is how the text gets loaded into the app."),
    ("legend_calc", "Pale blue",
     "Calculated automatically (word counts). Turns red when a piece of text is outside the suggested length."),
    ("legend_ex", "Green italic",
     "An example row showing the expected format. Delete the example rows before sending the file back."),
    ("gap", "", ""),
    ("h2", "House rules for the writing", ""),
    ("bullet", "", "Write to the parent, not about the child. Use \"your child\" and \"they\"."),
    ("bullet", "", "Never use the words delay, fail, deficit, abnormal or behind as a verdict in parent-facing text. Name what is there, then what comes next."),
    ("bullet", "", "Always name a genuine strength before naming a concern."),
    ("bullet", "", "Always end with something concrete the parent can do this week."),
    ("bullet", "", "No numbers, percentages or scores in the prose - the report shows those separately."),
    ("bullet", "", "Plain language. If a word would not appear in a conversation with a parent, cut it."),
    ("bullet", "", "The same text is shown to every family in that box, so do not write anything that only fits one child."),
    ("gap", "", ""),
    ("h2", "Video and course links", ""),
    ("bullet", "", "Paste the full URL, e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX - not a shortened or share-tracking link."),
    ("bullet", "", "The video must be public or unlisted. Private videos will not play for parents."),
    ("bullet", "", "The same video may be reused across several boxes. Just paste the same URL again."),
    ("bullet", "", "Course links go on Tab 3, one per band. The report recommends exactly one course, chosen by the child's band."),
    ("gap", "", ""),
    ("h2", "When you are done", ""),
    ("bullet", "", "Check no yellow cell is empty and no word-count cell is red, delete the example rows, then send the file back."),
]

r = 1
for kind, label, text in rows:
    if kind == "gap":
        r += 1
        continue
    if kind == "h1":
        c = ws.cell(row=r, column=2, value=label)
        c.font = H1
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    elif kind == "sub":
        c = ws.cell(row=r, column=2, value=text)
        c.font = MUTED
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    elif kind == "h2":
        c = ws.cell(row=r, column=2, value=label)
        c.font = H3
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    elif kind == "kv":
        a = ws.cell(row=r, column=2, value=label)
        a.font = BODY_B
        a.alignment = TOPL
        b = ws.cell(row=r, column=3, value=text)
        b.font = BODY
        b.alignment = TOPL
    elif kind == "bullet":
        c = ws.cell(row=r, column=3, value=BULLET + text)
        c.font = BODY
        c.alignment = TOPL
    elif kind.startswith("legend"):
        swatch = {"legend_fill": FILL_FILL, "legend_lock": LOCK_FILL,
                  "legend_calc": CALC_FILL, "legend_ex": EX_FILL}[kind]
        c = ws.cell(row=r, column=2, value=label)
        c.font = EXAMPLE if kind == "legend_ex" else BODY_B
        c.fill = swatch
        c.border = BOX
        c.alignment = CTR
        t = ws.cell(row=r, column=3, value=text)
        t.font = BODY
        t.alignment = TOPL
    r += 1

# ------------------------------------------------------- 1. Section summaries
s1 = wb.create_sheet("1. Section summaries")
s1.sheet_view.showGridLines = False
s1["A1"] = "Section summaries - 6 sections x 5 bands = 30"
s1["A1"].font = H1
s1["A2"] = ("One paragraph per box, written to the parent. 60-90 words. This is the text that appears under that "
            "section's heading in the report when the child lands in that band. Rows are fixed - please do not add, "
            "delete or reorder them.")
s1["A2"].font = MUTED
s1["A2"].alignment = TOPL
s1.merge_cells("A1:K1")
s1.merge_cells("A2:K2")
s1.row_dimensions[2].height = 30

HEADERS_1 = ["ID", "Section", "Section code", "Band", "Band code",
             "Summary shown to the parent  (60-90 words)", "Words",
             "Video title", "Video URL", "Video language", "Notes for us"]
WIDTHS_1 = [10, 21, 13, 25, 17, 62, 8, 26, 40, 14, 26]
header_row(s1, 4, HEADERS_1, WIDTHS_1)
s1.freeze_panes = "F5"

EX_SUMMARY = ("Your child is using sounds with real intent - they call for you, and they change their tone when they "
              "want something. What has not quite arrived yet is joining two words together, which usually follows "
              "soon after. The most useful thing you can do is name what they are already reaching for, one word at a "
              "time, and leave a pause for them to try it back. Ten minutes a day is plenty.")

ex = 5
example = ["EXAMPLE", "Language Competence", "language", "Mild developmental gaps", "mild_gaps",
           EX_SUMMARY, None, "Two-word turns at home",
           "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "English",
           "Delete this row before sending back"]
for i, v in enumerate(example, start=1):
    c = s1.cell(row=ex, column=i, value=v)
    c.font = EXAMPLE
    c.fill = EX_FILL
    c.border = BOX
    c.alignment = TOP
s1.cell(row=ex, column=7, value=words("F5")).font = EXAMPLE
s1.row_dimensions[ex].height = 78

row = 6
first_data = row
for scode, sname, abbr in SECTIONS:
    for bid, bnum, bname, _note in BANDS:
        vals = [abbr + "-B" + str(bnum), sname, scode, bname, bid,
                None, None, None, None, None, None]
        for i, v in enumerate(vals, start=1):
            c = s1.cell(row=row, column=i, value=v)
            c.font = BODY
            c.border = BOX
            c.alignment = TOP
            if i <= 5:
                c.fill = LOCK_FILL
            elif i == 7:
                c.fill = CALC_FILL
                c.alignment = CTR
            else:
                c.fill = FILL_FILL
        s1.cell(row=row, column=1).font = BODY_B
        s1.cell(row=row, column=1).alignment = CTR
        s1.cell(row=row, column=7, value=words("F" + str(row)))
        s1.row_dimensions[row].height = 66
        row += 1
last_data = row - 1

s1.conditional_formatting.add(
    "G" + str(first_data) + ":G" + str(last_data),
    CellIsRule(operator="notBetween", formula=["60", "90"], fill=BAD_FILL, font=RED),
)
s1.conditional_formatting.add(
    "I" + str(first_data) + ":I" + str(last_data),
    FormulaRule(formula=['AND(I' + str(first_data) + '<>"",LEFT(I' + str(first_data) + ',4)<>"http")'],
                fill=BAD_FILL),
)

# ------------------------------------------------------- 2. Overall summaries
s2 = wb.create_sheet("2. Overall summaries")
s2.sheet_view.showGridLines = False
s2["A1"] = "Overall summaries - one per band"
s2["A1"].font = H1
s2["A2"] = ("The block at the top of the report, before the six sections. Four pieces per band, in the order they are "
            "printed: headline, then the opening, then what it means, then what to do next.")
s2["A2"].font = MUTED
s2["A2"].alignment = TOPL
s2.merge_cells("A1:K1")
s2.merge_cells("A2:K2")
s2.row_dimensions[2].height = 30

HEADERS_2 = ["Band code", "Band", "What this band means (for us)",
             "Headline  (one line, max 15 words)",
             "Opening paragraph  (50-80 words)",
             "What this means for your child  (60-100 words)",
             "What to do next  (50-80 words)",
             "Words: opening", "Words: means", "Words: next",
             "Recommended course code"]
WIDTHS_2 = [17, 25, 34, 40, 52, 52, 52, 11, 11, 11, 20]
header_row(s2, 4, HEADERS_2, WIDTHS_2)
s2.freeze_panes = "D5"

EX_OPEN = ("Across the six areas we looked at, your child is reaching each stage at the age we would expect, with an "
           "even profile and no single area standing out as a worry. This report is a snapshot of where they are "
           "today, and a starting point for what to play at together next.")
EX_MEANS = ("An even profile at this age means the foundations are in place: your child is taking the world in through "
            "their eyes, ears and hands at roughly the same pace as they are putting it back out through movement, "
            "speech and their hands. There is nothing here that needs acting on.")
EX_NEXT = ("Pick two or three of the activities below and do them most days - a little and often beats one long "
           "session a week. Run this assessment again in six months; the change between two reports tells you far "
           "more than any single report can.")

ex = 5
example2 = ["typical", "Typically developing", "Reaching each stage at the age the chart expects.",
            "Your child is developing well across all six areas.",
            EX_OPEN, EX_MEANS, EX_NEXT, None, None, None, "KGKP-TYP"]
for i, v in enumerate(example2, start=1):
    c = s2.cell(row=ex, column=i, value=v)
    c.font = EXAMPLE
    c.fill = EX_FILL
    c.border = BOX
    c.alignment = TOP
for col, src in ((8, "E5"), (9, "F5"), (10, "G5")):
    s2.cell(row=ex, column=col, value=words(src)).font = EXAMPLE
s2.row_dimensions[ex].height = 104

row = 6
f2 = row
for bid, bnum, bname, bnote in BANDS:
    vals = [bid, bname, bnote, None, None, None, None, None, None, None, None]
    for i, v in enumerate(vals, start=1):
        c = s2.cell(row=row, column=i, value=v)
        c.font = BODY
        c.border = BOX
        c.alignment = TOP
        if i <= 3:
            c.fill = LOCK_FILL
        elif i in (8, 9, 10):
            c.fill = CALC_FILL
            c.alignment = CTR
        else:
            c.fill = FILL_FILL
    s2.cell(row=row, column=8, value=words("E" + str(row)))
    s2.cell(row=row, column=9, value=words("F" + str(row)))
    s2.cell(row=row, column=10, value=words("G" + str(row)))
    s2.row_dimensions[row].height = 96
    row += 1
l2 = row - 1

for col, lo, hi in (("H", 50, 80), ("I", 60, 100), ("J", 50, 80)):
    s2.conditional_formatting.add(
        col + str(f2) + ":" + col + str(l2),
        CellIsRule(operator="notBetween", formula=[str(lo), str(hi)], fill=BAD_FILL, font=RED),
    )

# ----------------------------------------------------------------- 3. Courses
s3 = wb.create_sheet("3. Courses")
s3.sheet_view.showGridLines = False
s3["A1"] = "Recommended courses - one per band"
s3["A1"].font = H1
s3["A2"] = ("Shown at the end of the report. A child in a given band is offered exactly one course. Course code is "
            "your own reference - keep it short, no spaces, and use the same code on the Overall summaries tab.")
s3["A2"].font = MUTED
s3["A2"].alignment = TOPL
s3.merge_cells("A1:J1")
s3.merge_cells("A2:J2")
s3.row_dimensions[2].height = 30

HEADERS_3 = ["Band code", "Band", "Course code", "Course title",
             "Short description  (25-45 words)", "Price", "Currency",
             "Checkout / landing URL", "Thumbnail image URL", "Live?"]
WIDTHS_3 = [17, 25, 16, 32, 52, 10, 10, 42, 42, 9]
header_row(s3, 4, HEADERS_3, WIDTHS_3)
s3.freeze_panes = "C5"

EX_DESC = ("Eight weeks of daily ten-minute activities across all six areas, with a short video for each one and a "
           "weekly check-in. Built for children who are on track and ready for the next stage.")

ex = 5
example3 = ["typical", "Typically developing", "KGKP-TYP", "Genius Foundations - Stage 4",
            EX_DESC, 4999, "INR", "https://kaushalyakids.com/courses/foundations-4",
            "https://kaushalyakids.com/img/foundations-4.jpg", "Yes"]
for i, v in enumerate(example3, start=1):
    c = s3.cell(row=ex, column=i, value=v)
    c.font = EXAMPLE
    c.fill = EX_FILL
    c.border = BOX
    c.alignment = TOP
s3.cell(row=ex, column=6).number_format = "#,##0"
s3.row_dimensions[ex].height = 62

row = 6
f3 = row
for bid, bnum, bname, _note in BANDS:
    vals = [bid, bname, None, None, None, None, None, None, None, None]
    for i, v in enumerate(vals, start=1):
        c = s3.cell(row=row, column=i, value=v)
        c.font = BODY
        c.border = BOX
        c.alignment = TOP
        c.fill = LOCK_FILL if i <= 2 else FILL_FILL
    s3.cell(row=row, column=6).number_format = "#,##0"
    s3.row_dimensions[row].height = 56
    row += 1
l3 = row - 1

for col in ("H", "I"):
    s3.conditional_formatting.add(
        col + str(f3) + ":" + col + str(l3),
        FormulaRule(formula=['AND(' + col + str(f3) + '<>"",LEFT(' + col + str(f3) + ',4)<>"http")'],
                    fill=BAD_FILL),
    )

# ------------------------------------------------------------------- 4. Lists
s4 = wb.create_sheet("4. Lists")
s4.sheet_view.showGridLines = False
s4["A1"] = "Reference lists - do not edit"
s4["A1"].font = H1
s4["A2"] = "The dropdowns on the other tabs read from these columns."
s4["A2"].font = MUTED

header_row(s4, 4, ["Band code", "Band (in order)", "Section code", "Section",
                   "Language", "Currency", "Live?"],
           [18, 27, 14, 22, 14, 11, 9])
for i, (bid, _n, bname, _x) in enumerate(BANDS):
    s4.cell(row=5 + i, column=1, value=bid)
    s4.cell(row=5 + i, column=2, value=bname)
for i, (scode, sname, _a) in enumerate(SECTIONS):
    s4.cell(row=5 + i, column=3, value=scode)
    s4.cell(row=5 + i, column=4, value=sname)
for i, v in enumerate(["English", "Hindi", "Marathi", "Both"]):
    s4.cell(row=5 + i, column=5, value=v)
for i, v in enumerate(["INR", "USD", "AED", "GBP"]):
    s4.cell(row=5 + i, column=6, value=v)
for i, v in enumerate(["Yes", "No"]):
    s4.cell(row=5 + i, column=7, value=v)
for rr in range(5, 11):
    for cc in range(1, 8):
        cell = s4.cell(row=rr, column=cc)
        cell.font = BODY
        cell.fill = LOCK_FILL
        cell.border = BOX

# --------------------------------------------------------------- Dropdowns
dv_lang = DataValidation(type="list", formula1="='4. Lists'!$E$5:$E$8", allow_blank=True)
s1.add_data_validation(dv_lang)
dv_lang.add("J" + str(first_data) + ":J" + str(last_data))

dv_cur = DataValidation(type="list", formula1="='4. Lists'!$F$5:$F$8", allow_blank=True)
s3.add_data_validation(dv_cur)
dv_cur.add("G" + str(f3) + ":G" + str(l3))

dv_live = DataValidation(type="list", formula1="='4. Lists'!$G$5:$G$6", allow_blank=True)
s3.add_data_validation(dv_live)
dv_live.add("J" + str(f3) + ":J" + str(l3))

dv_course = DataValidation(type="list",
                           formula1="='3. Courses'!$C$" + str(f3) + ":$C$" + str(l3),
                           allow_blank=True)
s2.add_data_validation(dv_course)
dv_course.add("K" + str(f2) + ":K" + str(l2))

wb.save(OUT)
print("wrote " + OUT + " (" + str(last_data - first_data + 1) + " section rows)")
