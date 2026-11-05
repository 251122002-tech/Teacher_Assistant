-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'TEACHER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "user_id" UUID NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("user_id","subject_id")
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teacher_id" UUID NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "grade_level" SMALLINT NOT NULL,
    "academic_year" VARCHAR(9) NOT NULL,
    "student_count" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_id" INTEGER NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "grade_level" SMALLINT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "topic" VARCHAR(80) NOT NULL,
    "grade_level" SMALLINT NOT NULL,
    "duration_minutes" SMALLINT NOT NULL DEFAULT 45,
    "status" VARCHAR(12) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plan_objectives" (
    "lesson_plan_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,

    CONSTRAINT "lesson_plan_objectives_pkey" PRIMARY KEY ("lesson_plan_id","objective_id")
);

-- CreateTable
CREATE TABLE "lesson_plan_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_plan_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "activity" TEXT NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,

    CONSTRAINT "lesson_plan_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_plan_id" UUID NOT NULL,
    "class_group_id" UUID NOT NULL,
    "scheduled_on" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "lesson_plan_id" UUID,
    "title" VARCHAR(120) NOT NULL,
    "time_limit_seconds" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quiz_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "prompt" TEXT NOT NULL,
    "question_type" VARCHAR(20) NOT NULL DEFAULT 'SINGLE_CHOICE',
    "points" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "lesson_plan_id" UUID,
    "title" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deck_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "front_text" VARCHAR(255) NOT NULL,
    "back_text" VARCHAR(500) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE INDEX "teacher_subjects_subject_id_idx" ON "teacher_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_groups_teacher_id_name_academic_year_key" ON "class_groups"("teacher_id", "name", "academic_year");

-- CreateIndex
CREATE INDEX "learning_objectives_subject_id_grade_level_idx" ON "learning_objectives"("subject_id", "grade_level");

-- CreateIndex
CREATE UNIQUE INDEX "learning_objectives_subject_id_code_key" ON "learning_objectives"("subject_id", "code");

-- CreateIndex
CREATE INDEX "lesson_plans_author_id_created_at_idx" ON "lesson_plans"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lesson_plans_subject_id_grade_level_idx" ON "lesson_plans"("subject_id", "grade_level");

-- CreateIndex
CREATE INDEX "lesson_plan_objectives_objective_id_idx" ON "lesson_plan_objectives"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plan_modules_lesson_plan_id_position_key" ON "lesson_plan_modules"("lesson_plan_id", "position");

-- CreateIndex
CREATE INDEX "class_lessons_lesson_plan_id_idx" ON "class_lessons"("lesson_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_lessons_class_group_id_scheduled_on_lesson_plan_id_key" ON "class_lessons"("class_group_id", "scheduled_on", "lesson_plan_id");

-- CreateIndex
CREATE INDEX "quizzes_author_id_created_at_idx" ON "quizzes"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "quizzes_lesson_plan_id_idx" ON "quizzes"("lesson_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quiz_id_position_key" ON "quiz_questions"("quiz_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_position_key" ON "question_options"("question_id", "position");

-- CreateIndex
CREATE INDEX "flashcard_decks_author_id_created_at_idx" ON "flashcard_decks"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "flashcard_decks_lesson_plan_id_idx" ON "flashcard_decks"("lesson_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_deck_id_position_key" ON "flashcards"("deck_id", "position");

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_objectives" ADD CONSTRAINT "lesson_plan_objectives_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_objectives" ADD CONSTRAINT "lesson_plan_objectives_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_modules" ADD CONSTRAINT "lesson_plan_modules_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_lesson_plan_id_fkey" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- CHECK constraints (hand-written: Prisma schema cannot express CHECK)
-- ---------------------------------------------------------------------------

-- users
ALTER TABLE "users" ADD CONSTRAINT "users_email_format_chk" CHECK ("email" ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
ALTER TABLE "users" ADD CONSTRAINT "users_role_chk" CHECK ("role" IN ('TEACHER', 'ADMIN'));
ALTER TABLE "users" ADD CONSTRAINT "users_names_not_blank_chk" CHECK (btrim("first_name") <> '' AND btrim("last_name") <> '');

-- subjects
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_code_format_chk" CHECK ("code" ~ '^[A-Z0-9_]{2,20}$');

-- class_groups
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_grade_level_chk" CHECK ("grade_level" BETWEEN 0 AND 12);
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_academic_year_chk" CHECK ("academic_year" ~ '^[0-9]{4}-[0-9]{4}$' AND CAST(right("academic_year", 4) AS INTEGER) = CAST(left("academic_year", 4) AS INTEGER) + 1);
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_student_count_chk" CHECK ("student_count" BETWEEN 0 AND 60);

-- learning_objectives
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_grade_level_chk" CHECK ("grade_level" BETWEEN 0 AND 12);

-- lesson_plans
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_topic_not_blank_chk" CHECK (btrim("topic") <> '');
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_grade_level_chk" CHECK ("grade_level" BETWEEN 0 AND 12);
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_duration_chk" CHECK ("duration_minutes" BETWEEN 10 AND 180);
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_status_chk" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));

-- lesson_plan_modules
ALTER TABLE "lesson_plan_modules" ADD CONSTRAINT "lesson_plan_modules_position_chk" CHECK ("position" >= 1);
ALTER TABLE "lesson_plan_modules" ADD CONSTRAINT "lesson_plan_modules_duration_chk" CHECK ("duration_minutes" BETWEEN 1 AND 180);

-- quizzes
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_time_limit_chk" CHECK ("time_limit_seconds" IS NULL OR "time_limit_seconds" BETWEEN 30 AND 7200);

-- quiz_questions
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_position_chk" CHECK ("position" >= 1);
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_type_chk" CHECK ("question_type" IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'));
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_points_chk" CHECK ("points" BETWEEN 1 AND 100);

-- question_options
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_position_chk" CHECK ("position" >= 1);

-- flashcards
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_position_chk" CHECK ("position" >= 1);
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_text_not_blank_chk" CHECK (btrim("front_text") <> '' AND btrim("back_text") <> '');
