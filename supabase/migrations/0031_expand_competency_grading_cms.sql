-- Add the three low-performance narrative tiers approved in
-- docs/grading/grading_logic.md. Existing A-- blocks are deliberately retained
-- for audit history but are no longer selected by the application.

with domains(code, name) as (
  values
    ('vision', 'Visual'),
    ('auditory', 'Auditory'),
    ('tactile', 'Tactile'),
    ('mobility', 'Mobility'),
    ('language', 'Language'),
    ('hand', 'Manual')
), tiers(suffix, title, content) as (
  values
    (
      'very_weak',
      'Very weak (Focused Support)',
      '{name} shows a significant developmental gap in the {domain} competence and would benefit from focused support and consistent practice. Please follow the recommendations given in the overall result section of this report.'
    ),
    (
      'extremely_weak',
      'Extremely weak (Prompt Support)',
      '{name} shows an extremely significant developmental gap in the {domain} competence and needs prompt, structured support. Please discuss the next steps with a qualified child-development professional.'
    ),
    (
      'severely_weak',
      'Severely weak (Immediate Support)',
      '{name} shows a severe developmental gap in the {domain} competence and needs immediate, intensive support. Please arrange a prompt discussion with a qualified child-development professional.'
    )
)
insert into public.cms_blocks (id, description, content)
select
  'domain_note_' || domains.code || '_' || tiers.suffix,
  domains.name || ' Competence · ' || tiers.title,
  tiers.content
from domains cross join tiers
on conflict (id) do update set
  description = excluded.description,
  content = excluded.content,
  updated_at = now();
