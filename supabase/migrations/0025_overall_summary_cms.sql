insert into public.cms_blocks (id, content, description)
values (
  'report_overall_summary',
  'The KECCTRA report indicates that {name} is developing {grade} for his/her age.',
  'The overall summary text appearing on the final page of the report. Variables: {name}, {grade}, {age}.'
) on conflict (id) do nothing;
