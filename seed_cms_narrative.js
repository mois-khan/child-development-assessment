const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const blocks = [
  { id: 'report_headline_a_plus', content: '{name} is ahead of the chart across the board.', description: 'Overall headline for A+/A++ grade' },
  { id: 'report_headline_a', content: '{name} is developing well across all six areas.', description: 'Overall headline for A grade' },
  { id: 'report_headline_a_minus', content: '{name} is growing steadily, and some areas would benefit from focused support.', description: 'Overall headline for A- grade' },
  { id: 'report_headline_a_minus_minus', content: '{name} requires immediate and intensive support.', description: 'Overall headline for A-- grade' },
  { id: 'report_summary_preemie', content: '{name} is {chronological_age} old. Because {he_she} was born early, this report compares {him_her} against a corrected age of {age}, which is the standard way to read development for children born before 37 weeks.', description: 'Intro paragraph for premature babies' },
  { id: 'report_summary_intro', content: '{name} is {age} old. This report places {him_her} on the Developmental Profile (seven stages of brain development, checked across six areas) and compares where {he_she} is against the age the chart expects each stage to be reached.', description: 'Intro paragraph for full-term babies' },
  { id: 'report_summary_suppress_dq', content: "At this age, small differences between babies are very normal and week-to-week change is fast, so we have not put a single number on {name}'s development. What follows is simply the stage {name} has already reached in each area, and what comes next.", description: 'Text shown when child is under 1 month' },
  { id: 'report_summary_a_plus_strong', content: '{name} has reached every stage we looked at earlier than the chart expects, and is furthest ahead in {strongest_domain}.', description: 'Summary for A+ with distinct strengths' },
  { id: 'report_summary_a_plus_even', content: '{name} has reached every stage we looked at earlier than the chart expects, with an even profile across all six areas.', description: 'Summary for A+ with even profile' },
  { id: 'report_summary_a_plus_closing', content: 'There is nothing here that needs acting on. The activities below are pitched at the stage above, so they stay worth doing.', description: 'Closing advice for A+ grade' },
  { id: 'report_summary_a_strong', content: 'Across the six areas, {name} is reaching each stage at or before the age the chart expects, and is particularly strong in {strongest_domain}.', description: 'Summary for A grade with distinct strengths' },
  { id: 'report_summary_a_even', content: 'Across the six areas, {name} is reaching each stage at the age the chart expects, with an even profile and no area standing out as a concern.', description: 'Summary for A grade with even profile' },
  { id: 'report_summary_a_closing', content: 'There is nothing here that needs acting on. The activities below are simply good next things to play at together.', description: 'Closing advice for A grade' },
  { id: 'report_summary_a_minus_strong', content: 'It is worth saying first that {name} is doing genuinely well in {strongest_domain}.', description: 'Summary for A- grade with strengths' },
  { id: 'report_summary_a_minus_even', content: '{name} has real strengths to build on, and this report is a starting point rather than a verdict.', description: 'Summary for A- grade with even profile' },
  { id: 'report_summary_a_minus_action', content: '{weakest_domains} {is_are} behind the age the chart expects for the stage {name} has reached. That is worth working on rather than waiting on. We would suggest the activities below every day.', description: 'Action plan for A- grade' },
  { id: 'report_summary_a_minus_minus_strong', content: '{name} is doing well in {strongest_domain}, and that is a genuine strength to build on.', description: 'Summary for A-- grade with strengths' },
  { id: 'report_summary_a_minus_minus_even', content: 'Every child has strengths to build on, and this report is a starting point rather than a verdict.', description: 'Summary for A-- grade with even profile' },
  { id: 'report_summary_a_minus_minus_action', content: "Several areas are further behind than the chart's own range allows for. We would suggest arranging an assessment with a developmental paediatrician or a child therapist, who can look at this properly in person. This is a screening result, not a diagnosis, but it is worth acting on rather than waiting.", description: 'Action plan for A-- grade' },
  { id: 'report_summary_a_minus_minus_closing', content: 'In the meantime, the activities below are still worth doing, and early support makes a real difference at this age.', description: 'Closing advice for A-- grade' },
  { id: 'report_action_plan_intro', content: 'Run this assessment again in {gap_months} months to see how {name} has moved. Progress between two reports tells you far more than any single report.', description: 'First step in the action plan' },
  { id: 'report_action_plan_focus', content: 'Pick two or three activities from the focus areas and do them most days. A little and often beats a long session once a week.', description: 'Action plan note on focus areas' },
  { id: 'report_action_plan_a_minus', content: 'Take this report to your next appointment with your doctor and ask about a developmental screening.', description: 'Medical advice for A- grade' },
  { id: 'report_action_plan_a_minus_minus', content: 'Ask your doctor to refer you to a developmental paediatrician, or contact a child development centre directly. You do not need to wait for a referral to ask.', description: 'Medical advice for A-- grade' },
  { id: 'report_action_plan_warning', content: 'Talk to your doctor sooner if {name} loses a skill {he_she} used to have, stops responding to sound, or stops making eye contact. Those are worth checking straight away, whatever this report says.', description: 'General warning for all action plans' },
  { id: 'report_overall_summary', content: 'The KECCTRA report indicates that {name} is developing {grade} for {his_her} age.', description: 'The final sentence summary on the report' }
];

async function seed() {
  for (const block of blocks) {
    const { error } = await supabase.from('cms_blocks').upsert({
      id: block.id,
      content: block.content,
      description: block.description,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.error(error);
  }
  console.log('Done!');
}
seed();
