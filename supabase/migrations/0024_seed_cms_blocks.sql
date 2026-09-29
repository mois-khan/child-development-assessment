-- ═══════════════════════════════════════════════════════════════════════════
-- Seed all required CMS blocks with correct IDs.
--
-- The keys MUST match what lib/narrative.ts::domainNote() calls getCmsText()
-- with: domain_note_{domain}_{grade}
--
-- Previous seed had generic IDs (domain_note_a_plus_plus) which never matched.
-- This migration upserts all 31 correct blocks.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.cms_blocks (id, description, content) values

-- ── Visual Competence ────────────────────────────────────────────────────────
('domain_note_vision_a_plus_plus',
 'Visual Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the visual competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_vision_a_plus',
 'Visual Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the visual competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_vision_a',
 'Visual Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the visual competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_vision_a_minus',
 'Visual Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the visual competence. This indicates that there is a need for ongoing support to help {name} thrive in the visual competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_vision_a_minus_minus',
 'Visual Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in visual competence. This child will benefit from structured pathology intervention to build visual competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── Auditory Competence ───────────────────────────────────────────────────────
('domain_note_auditory_a_plus_plus',
 'Auditory Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the auditory competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_auditory_a_plus',
 'Auditory Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the auditory competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_auditory_a',
 'Auditory Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the auditory competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_auditory_a_minus',
 'Auditory Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the auditory competence. This indicates that there is a need for ongoing support to help {name} thrive in the auditory competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_auditory_a_minus_minus',
 'Auditory Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in auditory competence. This child will benefit from structured pathology intervention to build auditory competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── Tactile Competence ────────────────────────────────────────────────────────
('domain_note_tactile_a_plus_plus',
 'Tactile Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the tactile competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_tactile_a_plus',
 'Tactile Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the tactile competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_tactile_a',
 'Tactile Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the tactile competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_tactile_a_minus',
 'Tactile Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the tactile competence. This indicates that there is a need for ongoing support to help {name} thrive in the tactile competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_tactile_a_minus_minus',
 'Tactile Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in tactile competence. This child will benefit from structured pathology intervention to build tactile competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── Mobility Competence ───────────────────────────────────────────────────────
('domain_note_mobility_a_plus_plus',
 'Mobility Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the mobility competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_mobility_a_plus',
 'Mobility Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the mobility competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_mobility_a',
 'Mobility Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the mobility competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_mobility_a_minus',
 'Mobility Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the mobility competence. This indicates that there is a need for ongoing support to help {name} thrive in the mobility competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_mobility_a_minus_minus',
 'Mobility Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in mobility competence. This child will benefit from structured pathology intervention to build mobility competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── Language Competence ───────────────────────────────────────────────────────
('domain_note_language_a_plus_plus',
 'Language Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the language competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_language_a_plus',
 'Language Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the language competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_language_a',
 'Language Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the language competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_language_a_minus',
 'Language Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the language competence. This indicates that there is a need for ongoing support to help {name} thrive in the language competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_language_a_minus_minus',
 'Language Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in language competence. This child will benefit from structured pathology intervention to build language competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── Manual Competence ─────────────────────────────────────────────────────────
('domain_note_hand_a_plus_plus',
 'Manual Competence · A++ (Highly Advanced)',
 '{name} demonstrates a much-beyond-age progress in the manual competence. This is a very positive sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_hand_a_plus',
 'Manual Competence · A+ (Advanced)',
 '{name} demonstrates beyond-age progress in the manual competence. This is an encouraging sign. Continued support and consistent routine at this crucial juncture will enhance this progress further. Please follow the recommendations given in the overall result section of this report.'),

('domain_note_hand_a',
 'Manual Competence · A (On Track)',
 '{name} demonstrates age appropriate progress in the manual competence. Continued support and consistent routine at this crucial juncture will accelerate the progress further. Please follow the recommendations given in the ''overall result'' section of this report.'),

('domain_note_hand_a_minus',
 'Manual Competence · A- (Mild Gap)',
 '{name} falls under a mild developmental gap category in the manual competence. This indicates that there is a need for ongoing support to help {name} thrive in the manual competence. Our activities library has the appropriate video to guide you to conduct the necessary simple activities with the child right at home. Please scan the QR code here to access the FREE video.'),

('domain_note_hand_a_minus_minus',
 'Manual Competence · A-- (Needs Focus)',
 '{name} requires immediate and intensive support in manual competence. This child will benefit from structured pathology intervention to build manual competence. With targeted support and consistent practice, meaningful progress is achievable. Please follow the recommendations given in the ''overall result'' section of this report.'),

-- ── General ───────────────────────────────────────────────────────────────────
('report_disclaimer',
 'Disclaimer shown at the bottom of Page 5 of every report.',
 'This is a developmental screening tool, not a diagnosis. It is based on parent report and is designed to show where a child may benefit from extra support or a closer look by a professional. It cannot diagnose any condition. If you have concerns about your child''s development, speak to your doctor, whatever this report says.')

on conflict (id) do update set
  content = excluded.content,
  description = excluded.description,
  updated_at = now();
