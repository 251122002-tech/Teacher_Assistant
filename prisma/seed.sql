-- Teacher Assistant - fictional sample data for the v0.2.0 schema (PostgreSQL).
-- Run after the init migration:  npm run db:seed
-- Fixed UUIDs keep the rows readable and the script re-runnable (ON CONFLICT DO NOTHING).
-- password_hash values are placeholders and cannot be used to sign in.

BEGIN;

-- Reference data ------------------------------------------------------------

INSERT INTO subjects (id, code, name) VALUES
    (1, 'MATH', 'Mathematics'),
    (2, 'PHYS', 'Physics'),
    (3, 'KAZ_LANG', 'Kazakh Language'),
    (4, 'HIST', 'History'),
    (5, 'BIO', 'Biology'),
    (6, 'INF', 'Informatics'),
    (7, 'ENG', 'English'),
    (8, 'GEO', 'Geography'),
    (9, 'CHEM', 'Chemistry'),
    (10, 'PRIMARY', 'Primary Education')
ON CONFLICT DO NOTHING;

-- Keep the SERIAL sequence ahead of the explicit ids above.
SELECT setval(pg_get_serial_sequence('subjects', 'id'), (SELECT MAX(id) FROM subjects));

INSERT INTO users (id, email, password_hash, first_name, last_name, role, updated_at) VALUES
    ('11111111-0000-4000-8000-000000000001', 'ainur.abisheva@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Ainur', 'Abisheva', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000002', 'dias.saparov@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Dias', 'Saparov', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000003', 'aigerim.nurgaliyeva@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Aigerim', 'Nurgaliyeva', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000004', 'nursultan.beketov@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Nursultan', 'Beketov', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000005', 'madina.orazbayeva@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Madina', 'Orazbayeva', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000006', 'arman.zhaksylykov@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Arman', 'Zhaksylykov', 'ADMIN', now()),
    ('11111111-0000-4000-8000-000000000007', 'dana.tolegen@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Dana', 'Tolegen', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000008', 'yerlan.iskakov@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Yerlan', 'Iskakov', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000009', 'zhanar.omarova@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Zhanar', 'Omarova', 'TEACHER', now()),
    ('11111111-0000-4000-8000-000000000010', 'alibek.kasymov@example.edu', '$2b$12$seed.placeholder.hash.not.valid.for.login', 'Alibek', 'Kasymov', 'TEACHER', now())
ON CONFLICT DO NOTHING;

-- N:M teacher <-> subject. Arman teaches two subjects to show the junction.
INSERT INTO teacher_subjects (user_id, subject_id) VALUES
    ('11111111-0000-4000-8000-000000000001', 1),
    ('11111111-0000-4000-8000-000000000002', 2),
    ('11111111-0000-4000-8000-000000000003', 3),
    ('11111111-0000-4000-8000-000000000004', 4),
    ('11111111-0000-4000-8000-000000000005', 5),
    ('11111111-0000-4000-8000-000000000006', 6),
    ('11111111-0000-4000-8000-000000000006', 1),
    ('11111111-0000-4000-8000-000000000007', 7),
    ('11111111-0000-4000-8000-000000000008', 8),
    ('11111111-0000-4000-8000-000000000009', 9),
    ('11111111-0000-4000-8000-000000000010', 10)
ON CONFLICT DO NOTHING;

INSERT INTO class_groups (id, teacher_id, name, grade_level, academic_year, student_count) VALUES
    ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '5A', 5, '2026-2027', 24),
    ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', '6B', 6, '2026-2027', 22),
    ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000003', '7A', 7, '2026-2027', 25),
    ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000004', '8B', 8, '2026-2027', 21),
    ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000005', '9A', 9, '2026-2027', 23),
    ('22222222-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000006', '10B', 10, '2026-2027', 18),
    ('22222222-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000007', '5B', 5, '2026-2027', 26),
    ('22222222-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000008', '6A', 6, '2026-2027', 24),
    ('22222222-0000-4000-8000-000000000009', '11111111-0000-4000-8000-000000000009', '7B', 7, '2026-2027', 20),
    ('22222222-0000-4000-8000-000000000010', '11111111-0000-4000-8000-000000000010', '4A', 4, '2026-2027', 27)
ON CONFLICT DO NOTHING;

INSERT INTO learning_objectives (id, subject_id, code, grade_level, description) VALUES
    ('33333333-0000-4000-8000-000000000001', 1, '5.1.2.1', 5, 'Read, write and compare common fractions.'),
    ('33333333-0000-4000-8000-000000000002', 2, '6.2.1.1', 6, 'Describe motion using distance, time and speed.'),
    ('33333333-0000-4000-8000-000000000003', 3, '7.1.1.1', 7, 'Identify the main idea of a literary text.'),
    ('33333333-0000-4000-8000-000000000004', 4, '8.3.1.2', 8, 'Explain causes of the formation of the Kazakh Khanate.'),
    ('33333333-0000-4000-8000-000000000005', 5, '9.1.4.1', 9, 'Describe the structure and function of the cell.'),
    ('33333333-0000-4000-8000-000000000006', 6, '10.3.2.1', 10, 'Write algorithms that use loops and conditions.'),
    ('33333333-0000-4000-8000-000000000007', 7, '5.1.2.1', 5, 'Use vocabulary about daily routines in short dialogues.'),
    ('33333333-0000-4000-8000-000000000008', 8, '6.2.1.1', 6, 'Read physical and political maps using a legend.'),
    ('33333333-0000-4000-8000-000000000009', 9, '7.1.2.1', 7, 'Distinguish physical and chemical changes.'),
    ('33333333-0000-4000-8000-000000000010', 10, '4.1.1.1', 4, 'Retell a short story in the correct sequence.'),
    ('33333333-0000-4000-8000-000000000011', 1, '5.1.2.2', 5, 'Add and subtract fractions with like denominators.')
ON CONFLICT DO NOTHING;

-- Lesson planning -----------------------------------------------------------

INSERT INTO lesson_plans (id, author_id, subject_id, topic, grade_level, duration_minutes, status, created_at, updated_at) VALUES
    ('44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 1, 'Common fractions', 5, 45, 'PUBLISHED', '2026-08-25 09:00+05', now()),
    ('44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', 2, 'Speed and distance', 6, 45, 'PUBLISHED', '2026-08-26 09:00+05', now()),
    ('44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000003', 3, 'Main idea of a text', 7, 45, 'PUBLISHED', '2026-08-26 10:00+05', now()),
    ('44444444-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000004', 4, 'The Kazakh Khanate', 8, 45, 'PUBLISHED', '2026-08-27 09:00+05', now()),
    ('44444444-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000005', 5, 'Cell structure', 9, 45, 'PUBLISHED', '2026-08-27 11:00+05', now()),
    ('44444444-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000006', 6, 'Loops and conditions', 10, 45, 'PUBLISHED', '2026-08-28 09:00+05', now()),
    ('44444444-0000-4000-8000-000000000007', '11111111-0000-4000-8000-000000000007', 7, 'Daily routines', 5, 45, 'PUBLISHED', '2026-08-28 10:00+05', now()),
    ('44444444-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000008', 8, 'Reading maps', 6, 45, 'PUBLISHED', '2026-08-29 09:00+05', now()),
    ('44444444-0000-4000-8000-000000000009', '11111111-0000-4000-8000-000000000009', 9, 'Physical and chemical changes', 7, 45, 'PUBLISHED', '2026-08-29 11:00+05', now()),
    ('44444444-0000-4000-8000-000000000010', '11111111-0000-4000-8000-000000000010', 10, 'Story retelling', 4, 40, 'DRAFT', '2026-08-30 09:00+05', now())
ON CONFLICT DO NOTHING;

-- N:M lesson plan <-> curriculum objective. Plan 1 targets two objectives.
INSERT INTO lesson_plan_objectives (lesson_plan_id, objective_id) VALUES
    ('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001'),
    ('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000011'),
    ('44444444-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002'),
    ('44444444-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000003'),
    ('44444444-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000004'),
    ('44444444-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000005'),
    ('44444444-0000-4000-8000-000000000006', '33333333-0000-4000-8000-000000000006'),
    ('44444444-0000-4000-8000-000000000007', '33333333-0000-4000-8000-000000000007'),
    ('44444444-0000-4000-8000-000000000008', '33333333-0000-4000-8000-000000000008'),
    ('44444444-0000-4000-8000-000000000009', '33333333-0000-4000-8000-000000000009'),
    ('44444444-0000-4000-8000-000000000010', '33333333-0000-4000-8000-000000000010')
ON CONFLICT DO NOTHING;

-- Every plan gets the same three-stage structure; the activity text names its topic.
INSERT INTO lesson_plan_modules (lesson_plan_id, position, title, activity, duration_minutes)
SELECT plan.id, stage.position, stage.title, stage.activity_prefix || plan.topic || '.', stage.minutes
FROM lesson_plans AS plan
CROSS JOIN (VALUES
    (1, 'Starter', 'Warm-up questions that activate prior knowledge about ', 5),
    (2, 'Main activity', 'Guided practice and pair work on ', 30),
    (3, 'Reflection', 'Exit ticket and self-assessment on ', 10)
) AS stage (position, title, activity_prefix, minutes)
WHERE plan.id::text LIKE '44444444-%'
ON CONFLICT DO NOTHING;

-- N:M lesson plan <-> class group, dated (replaces the old tblDate table).
-- Plan 6 is taught to the same class twice to show the dated junction.
INSERT INTO class_lessons (lesson_plan_id, class_group_id, scheduled_on, notes) VALUES
    ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', '2026-09-01', NULL),
    ('44444444-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002', '2026-09-02', NULL),
    ('44444444-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', '2026-09-03', NULL),
    ('44444444-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000004', '2026-09-04', NULL),
    ('44444444-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000005', '2026-09-05', 'Microscopes booked in lab 2.'),
    ('44444444-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000006', '2026-09-06', NULL),
    ('44444444-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000006', '2026-09-13', 'Repeat with extension tasks.'),
    ('44444444-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000007', '2026-09-07', NULL),
    ('44444444-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000008', '2026-09-08', NULL),
    ('44444444-0000-4000-8000-000000000009', '22222222-0000-4000-8000-000000000009', '2026-09-09', NULL)
ON CONFLICT DO NOTHING;

-- Assessment and edu-games --------------------------------------------------

INSERT INTO quizzes (id, author_id, lesson_plan_id, title, time_limit_seconds, updated_at) VALUES
    ('55555555-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', 'Fractions check-up', 600, now()),
    ('55555555-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000006', NULL, 'Informatics warm-up (standalone)', NULL, now())
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, position, prompt, question_type, points) VALUES
    ('66666666-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000001', 1, 'Which fraction is greater: 3/4 or 2/3?', 'SINGLE_CHOICE', 1),
    ('66666666-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001', 2, '1/5 + 2/5 = 3/5', 'TRUE_FALSE', 1),
    ('66666666-0000-4000-8000-000000000003', '55555555-0000-4000-8000-000000000002', 1, 'Which of these are loop statements?', 'MULTIPLE_CHOICE', 2)
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, position, option_text, is_correct) VALUES
    ('66666666-0000-4000-8000-000000000001', 1, '3/4', TRUE),
    ('66666666-0000-4000-8000-000000000001', 2, '2/3', FALSE),
    ('66666666-0000-4000-8000-000000000002', 1, 'True', TRUE),
    ('66666666-0000-4000-8000-000000000002', 2, 'False', FALSE),
    ('66666666-0000-4000-8000-000000000003', 1, 'for', TRUE),
    ('66666666-0000-4000-8000-000000000003', 2, 'while', TRUE),
    ('66666666-0000-4000-8000-000000000003', 3, 'if', FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO flashcard_decks (id, author_id, lesson_plan_id, title, updated_at) VALUES
    ('77777777-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000007', '44444444-0000-4000-8000-000000000007', 'Daily routines vocabulary', now()),
    ('77777777-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000003', NULL, 'Kazakh literary terms (standalone)', now())
ON CONFLICT DO NOTHING;

INSERT INTO flashcards (deck_id, position, front_text, back_text) VALUES
    ('77777777-0000-4000-8000-000000000001', 1, 'get up', 'to leave your bed after sleeping'),
    ('77777777-0000-4000-8000-000000000001', 2, 'have breakfast', 'to eat the first meal of the day'),
    ('77777777-0000-4000-8000-000000000001', 3, 'catch the bus', 'to get on a bus in time'),
    ('77777777-0000-4000-8000-000000000002', 1, 'Epithet', 'A descriptive word that characterises a person or thing'),
    ('77777777-0000-4000-8000-000000000002', 2, 'Metaphor', 'A hidden comparison without "like" or "as"')
ON CONFLICT DO NOTHING;

COMMIT;
