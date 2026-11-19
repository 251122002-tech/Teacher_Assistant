# Teacher Assistant: Software Requirements Specification

## 1. Document Control

- **Project:** Teacher Assistant
- **Team:** Shattyk Rahmetolla, Assel Sergazy
- **Document version:** 0.3.0 (Deliverable 3: System Analysis and UML). Supersedes the v0.2.0 specification.
- **Current frontend scope:** Lesson-plan generator prototype
- **Status:** Prototype. A frontend exists, and a database schema is designed and verified. There is no backend, API or authentication yet.
- **Primary artifact:** React web interface for generating sample lesson-plan modules
- **Related documents:** [database-schema.md](./database-schema.md) (ERD and schema), [diagrams/](./diagrams/) (UML), [../development.md](../development.md) (developer guide)

### 1.1 Status vocabulary

Every requirement, use case and diagram element carries one of two statuses:

| Status | Meaning |
| --- | --- |
| **Implemented** | Works in the current repository (`frontend/app.jsx`) or exists as a verified artifact (`prisma/` migration). It can be demonstrated or tested today. |
| **Planned (v0.3+)** | Designed in this document but not built. That covers everything involving the API gateway, REST endpoints, JWT sessions, persistence through the API, and admin review. |

---

## 2. Problem Space

*This section describes the world as it is today. It contains no solution.*

### 2.1 The problem

Teachers in Kazakhstan's general-education schools must write a **short-term lesson plan (қысқа мерзімді жоспар, ҚМЖ)** for every lesson they teach. Each plan follows a fixed structure: curriculum learning objectives with their codes (e.g. `5.1.2.1`), lesson stages with timings, activities, descriptors and assessment. Teachers also prepare differentiated worksheets and review quizzes by hand.

| Observation | Consequence |
| --- | --- |
| A teacher with 4 to 5 lessons a day writes 18 to 25 plans a week, often typing the same structure again in Word. | Many hours of evening and weekend work, and burnout. |
| Curriculum objective codes and wording are copied by hand from PDF programmes. | Wrong or outdated codes. Methodologists send plans back for correction. |
| Plans live in personal files on one laptop or USB stick. | Plans are lost, cannot be reused across classes or years, and colleagues cannot easily share them. |
| Quizzes and flashcards are created separately from the plan, in other tools. | Assessment duplicates the plan's content, and nothing links a quiz to the objective it checks. |
| Methodologists review plans on paper or in chat messages. | Slow feedback, and no record of which plans were reviewed. |

### 2.2 Who is affected

Subject teachers (the main sufferers), school methodologists who check plans, and students, who get less teacher attention when preparation consumes the teacher's time. See the personas in Section 4.

### 2.3 Constraints from the environment

- School computers are often old, and teachers frequently prepare on phones. Mobile 4G is common.
- Plans must use the state curriculum's objective codes, and lessons last 40 to 45 minutes.
- Content is bilingual (Kazakh and Russian, with English as a subject). The prototype UI is English only.

---

## 3. Solution Space

*This section describes what Teacher Assistant does about the problem.*

### 3.1 Product vision

Teacher Assistant is a web application where a teacher picks a subject and topic, gets a structured lesson-plan draft, links it to curriculum objectives, schedules it for a class, and turns it into a quiz or flashcard deck. All of this is stored in one account, so plans can be reused.

### 3.2 Capabilities

| Capability | Requirements | Status |
| --- | --- | --- |
| Generate lesson-plan modules from subject + topic | FR-01 to FR-06 | **Implemented** (sample content from JSONPlaceholder, not curriculum content) |
| Accounts and sessions | FR-07 to FR-09 | Planned (v0.3+) |
| Save, edit, publish, archive, list and delete lesson plans | FR-10 to FR-13, FR-19 | Planned (v0.3+) |
| Link plans to curriculum objectives, schedule them for classes | FR-14, FR-15 | Planned (v0.3+) |
| Quizzes and flashcard decks | FR-16, FR-17, FR-20 | Planned (v0.3+) |
| Methodologist (ADMIN) review | FR-18 | Planned (v0.3+) |
| Relational data model for all of the above | DM-01 to DM-06 | **Implemented** (`prisma/`, verified on PostgreSQL engine) |

### 3.3 Out of scope

These items are explicitly **not** part of the product up to v0.4:

- AI-generated curriculum-accurate content. The external content service is a placeholder until an AI provider is chosen.
- The Presentation Builder and the worksheet generator (the README vision). No tables or requirements exist for them yet.
- Student accounts, student logins, quiz attempts and grades. Students only *view* games on the teacher's screen (FR-20).
- Storage of review comments. ADMIN review is limited to listing and archiving (FR-18), because the schema has no review table.
- Integration with Kundelik.kz or other school information systems.
- Offline mode, native mobile apps, and multi-school tenancy.
- Payments and subscriptions.

---

## 4. User Personas

| | **P1: Aigerim, subject teacher (primary)** | **P2: Gulnara, school methodologist (ADMIN)** | **P3: Dias, 7th-grade student (future)** |
| --- | --- | --- | --- |
| Role in system | `users.role = 'TEACHER'` | `users.role = 'ADMIN'` | No account (out of scope). Sees games on the class screen. |
| Profile | 31, teaches Kazakh language and literature to grades 5 to 7, 22 lessons a week | 48, deputy director for teaching methods, checks 30+ plans a week | 13, likes phone games, loses focus in long revisions |
| Goals | Produce a correct ҚМЖ in under 10 minutes, reuse plans next year, and get a review quiz with no extra work | See which plans are published, spot plans with wrong objectives, and archive non-compliant ones | Review the lesson quickly and in a fun way |
| Pain points | Retypes the same structure every evening, copies objective codes from PDFs, and has lost plans on a broken laptop | Paper plans, no overview of who has published what, feedback by chat | Paper quizzes are boring, and he never sees the answers explained |
| Tech skill | Medium: Word, WhatsApp, Kundelik | Medium-low: prefers simple lists and filters | High on phones, low on desktop |
| Devices | School PC (Windows, 1366×768), Android phone at home | Office PC with a large monitor (1920×1080) | Classroom projector (teacher's laptop), own phone |
| Key FRs | FR-01 to FR-17, FR-19 | FR-08, FR-09, FR-18 | FR-20 |

---

## 5. Functional Requirements

Priority uses MoSCoW: **M**ust, **S**hould, **C**ould, **W**on't (this release). Every requirement is a single, testable behaviour. "Teacher" means an authenticated user with `role = 'TEACHER'`, and "ADMIN" means `role = 'ADMIN'`.

| ID | Requirement | Priority | Status | Acceptance criteria |
| --- | --- | --- | --- | --- |
| FR-01 | The system shall display a lesson-plan generator containing a subject selector, a topic field, a submit control, a status region and a generated-module area. | M | **Implemented** | On page load, all five elements are present and each form control has a visible associated `<label>`. |
| FR-02 | The system shall reject a blank or whitespace-only topic before any network request is sent. | M | **Implemented** | Submitting `""` or `"   "` sends 0 requests, the status region shows "Enter a topic before generating a lesson plan." (or the browser's native required-field message for an empty field), and focus returns to the topic field. |
| FR-03 | The system shall limit the topic to at most 80 characters. | M | **Implemented** | The topic input has `maxLength=80`, so typing an 81st character has no effect. Planned API: a topic longer than 80 characters returns `400` (see FR-10). DB: `lesson_plans.topic VARCHAR(80)`. |
| FR-04 | The system shall generate up to six lesson-plan modules for a valid topic, each showing title, subject, target grade, learning objectives, duration and key activities. | M | **Implemented** | With the content service reachable, 1 to 6 cards render, and each card shows all six fields. Content is currently JSONPlaceholder sample text. |
| FR-05 | The system shall announce loading and successful generation through a polite live region. | M | **Implemented** | During the request the region reads "Building lesson plan modules...". After success it reads "Generated N lesson plan modules for <topic>.". The region has `role="status"` and `aria-live="polite"`. |
| FR-06 | The system shall clear previously generated modules and announce an error when generation fails. | M | **Implemented** | With the network blocked or a non-2xx response, 0 cards remain and the region reads "Unable to generate the lesson plan. …". |
| FR-07 | The system shall register a new account from a unique email, first name, last name and a password of at least 8 characters, assigning role `TEACHER`. | M | Planned (v0.3+) | `POST /api/auth/register` returns `201`. A duplicate email returns `409`. The stored `password_hash` is bcrypt (cost ≥ 12), and no plain password is stored. |
| FR-08 | The system shall authenticate an active user by email and password and issue a 15-minute access token and a 7-day refresh token. | M | Planned (v0.3+) | `POST /api/auth/login` returns `200` with both tokens. Wrong credentials return `401`. A user with `is_active = false` gets `403`. After 5 failures in 15 minutes the account is locked and `423` is returned (NFR-S5). |
| FR-09 | The system shall end a session on logout and require re-authentication when the refresh token has expired or been revoked. | M | Planned (v0.3+) | `POST /api/auth/logout` returns `204` and revokes the refresh token. `POST /api/auth/refresh` with a revoked or 7-day-old token returns `401`, and the UI shows the login form. |
| FR-10 | The system shall save a generated lesson plan for the authenticated teacher as a `DRAFT` with at least one module. | M | Planned (v0.3+) | `POST /api/lesson-plans` returns `201` and a `Location` header. Rows are inserted into `lesson_plans` (status `DRAFT`) and `lesson_plan_modules` (positions 1..N) in one transaction. A blank topic or one longer than 80 characters returns `400`, a CHECK violation returns `422`, and a duplicate module position returns `409`. |
| FR-11 | The system shall let the author edit the topic, grade, duration and modules of a `DRAFT` lesson plan. | S | Planned (v0.3+) | `PATCH /api/lesson-plans/{id}` returns `200` and updates `updated_at`. Editing a `PUBLISHED` or `ARCHIVED` plan returns `409`, and a non-author gets `403`. |
| FR-12 | The system shall change a lesson plan's status only along the transitions of the LessonPlan state machine (publish, unpublish, archive, restore). | S | Planned (v0.3+) | `POST /api/lesson-plans/{id}/publish` succeeds only when the plan has ≥ 1 module and ≥ 1 objective. `/unpublish` and `/restore` require 0 `class_lessons`. Any other transition returns `409`. The stored status is always one of `DRAFT`, `PUBLISHED` or `ARCHIVED` (`lesson_plans_status_chk`). |
| FR-13 | The system shall list the authenticated teacher's lesson plans, newest first, 20 per page, optionally filtered by status. | M | Planned (v0.3+) | `GET /api/lesson-plans?page=1&status=DRAFT` returns ≤ 20 items ordered by `created_at DESC`, only with `author_id` = the caller, served by index `lesson_plans_author_id_created_at_idx`. |
| FR-14 | The system shall link a lesson plan to one or more curriculum learning objectives of the plan's subject. | S | Planned (v0.3+) | `PUT /api/lesson-plans/{id}/objectives` with objective IDs returns `200` and replaces the rows in `lesson_plan_objectives`. An objective from another subject returns `422`. |
| FR-15 | The system shall schedule a `PUBLISHED` lesson plan for one of the teacher's class groups on a date. | S | Planned (v0.3+) | `POST /api/class-groups/{id}/lessons` returns `201` and inserts into `class_lessons`. Booking the same plan for the same class on the same date returns `409`, and a non-`PUBLISHED` plan returns `409`. |
| FR-16 | The system shall create a quiz, standalone or attached to a lesson plan, in which every question has at least two options and at least one correct option. | S | Planned (v0.3+) | `POST /api/quizzes` returns `201` and inserts into `quizzes`, `quiz_questions` and `question_options`. A question with < 2 options or 0 correct options returns `400`. `lesson_plan_id` may be `null`. |
| FR-17 | The system shall create a flashcard deck, standalone or attached to a lesson plan, with non-blank front and back text on every card. | C | Planned (v0.3+) | `POST /api/flashcard-decks` returns `201`. A blank side returns `400` (DB guard: `flashcards_text_not_blank_chk`). |
| FR-18 | The system shall let an ADMIN list `PUBLISHED` lesson plans of all teachers by subject and grade, and archive a non-compliant plan. | C | Planned (v0.3+) | `GET /api/admin/lesson-plans?subjectId=&gradeLevel=` returns `200` for an ADMIN and `403` for a TEACHER. `POST /api/lesson-plans/{id}/archive` by an ADMIN sets status `ARCHIVED`. Review comments are out of scope. |
| FR-19 | The system shall delete a `DRAFT` lesson plan that has never been scheduled, together with its modules and objective links. | S | Planned (v0.3+) | `DELETE /api/lesson-plans/{id}` returns `204`, cascades to modules and objective links, and sets `lesson_plan_id = NULL` on related quizzes and decks. A plan with `class_lessons` returns `409` (FK RESTRICT). |
| FR-20 | The system shall present a quiz one question at a time in a full-screen class mode and reveal the correct option(s) on the teacher's command. | C | Planned (v0.4+) | In class mode, only one question is visible, and correct options are marked with text and an icon, not colour alone, after "Reveal". No student data is stored. |

**Won't (this release):** presentation builder, worksheet generator, student accounts and quiz attempts, review comments (see 3.3).

**Schema note:** FR-07 to FR-09 need session data that the v0.2.0 schema does not have: a `refresh_tokens` table plus `failed_login_attempts` and `locked_until` on `users`. This is a planned v0.3 migration. All other FRs map onto existing tables (see Section 8).

### 5.1 Data Model Requirements (Deliverable 2)

| ID | Requirement | Status | Acceptance criteria |
| --- | --- | --- | --- |
| DM-01 | Provide a Crow's Foot ERD. | **Implemented** | `docs/erd.pdf` and `docs/erd.png` show every table with PK/FK badges and labeled cardinalities. |
| DM-02 | Specify every column. | **Implemented** | `docs/database-schema.md` lists the SQL type, constraints and description of every column. |
| DM-03 | Normalize to 3NF. | **Implemented** | N:M relationships use the junctions `teacher_subjects`, `lesson_plan_objectives` and `class_lessons`, and the 3NF check is documented. |
| DM-04 | Enforce integrity in the database. | **Implemented** | FKs declare ON DELETE CASCADE / RESTRICT / SET NULL as documented, and CHECK constraints guard enumerations, ranges and blank text. |
| DM-05 | Keep the lesson-plan topic rule consistent. | **Implemented** | `lesson_plans.topic` is `VARCHAR(80)` with a not-blank CHECK, matching FR-02 and FR-03. |
| DM-06 | Index foreign keys. | **Implemented** | Every FK column is the leading column of a B-Tree index. |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| NFR-P1 | Performance | CRUD API endpoints respond quickly under normal load. | p95 latency < 500 ms at 50 concurrent users | k6 load test against staging, 10 min run | Planned (v0.3+) |
| NFR-P2 | Performance | Lesson-plan generation completes quickly. | Generation (`POST /api/lesson-plans/generate`) p95 < 5 s, timeout at 10 s → `503` | k6 + server timing logs | Planned (v0.3+) |
| NFR-P3 | Performance | The page loads fast on mobile networks. | First Contentful Paint < 2 s on "Fast 4G" with a mid-tier mobile profile, JS bundle < 250 kB raw | Lighthouse CI. The current production build is 227 kB JS, verified with `npm run build`. | Planned (v0.3+) (bundle budget currently met) |
| NFR-A1 | Availability | The service is available during the school year. | ≥ 99.5 % monthly uptime (≤ 3 h 39 min downtime) | Uptime monitor on `GET /api/health` every 1 min | Planned (v0.3+) |
| NFR-A2 | Availability | Data can be recovered after failure. | RPO ≤ 24 h (nightly `pg_dump`), RTO ≤ 4 h | Quarterly restore drill into an empty database | Planned (v0.3+) |
| NFR-S1 | Security | Passwords are stored irreversibly. | bcrypt with cost ≥ 12, no plaintext in DB or logs | Unit test on the hash prefix `$2b$12$`, plus log review | Planned (v0.3+) |
| NFR-S2 | Security | Sessions are short-lived. | JWT access token TTL = 15 min. Refresh token TTL = 7 days, rotated on every use and revocable | Integration test with a clock skewed past expiry gets `401` | Planned (v0.3+) |
| NFR-S3 | Security | Traffic is encrypted. | HTTPS only, TLS 1.2+, HSTS max-age ≥ 6 months | SSL Labs grade ≥ A | Planned (v0.3+) |
| NFR-S4 | Security | Common web vulnerabilities are mitigated. | 0 high or critical findings for OWASP Top 10 (2021) categories. Parameterised queries only (Prisma). Authorisation checked on every `/api/*` route. | OWASP ZAP baseline scan in CI, plus `npm audit --audit-level=high` | Planned (v0.3+) |
| NFR-S5 | Security | Brute-force login is throttled. | 5 failed logins per account in 15 min → locked for 15 min (`423`). ≤ 100 requests/min per IP on `/api/auth/*`. | Integration test: 6th attempt returns `423` | Planned (v0.3+) |
| NFR-AC1 | Accessibility | The UI uses accessible semantics. | Native controls with associated labels, a visible `:focus-visible` style, a `role="status"` live region, and status never conveyed by colour alone | Manual keyboard pass (development.md §5) | **Implemented** |
| NFR-AC2 | Accessibility | The UI conforms to WCAG 2.1 AA. | 0 serious or critical axe-core violations, contrast ≥ 4.5:1 for body text | axe DevTools / `@axe-core/cli` on every page | Planned (v0.3+) |
| NFR-U1 | Usability / responsive | Layout works from phone to desktop. | No horizontal scroll from 320 px to 1920 px width. Form fields stack below 560 px. | Manual check at 320, 375, 1280 and 1920 px | **Implemented** (generator page) |
| NFR-U2 | Usability | A first-time teacher can save a plan without help. | ≥ 4 of 5 test teachers save a plan in < 10 min | Moderated usability test with persona P1 | Planned (v0.3+) |
| NFR-M1 | Maintainability | Code stays simple and conventional. | React UI in components, CSS only in `styles.css`, no inline styles. Conventional Commits. Each service class has one responsibility (see CRC cards). | Code review checklist, `npm run build` passes | **Implemented** (frontend), Planned (v0.3+) (services) |
| NFR-M2 | Maintainability | Schema changes are versioned. | Every change ships as a Prisma migration in Git. `docs/database-schema.md` and the diagrams are updated in the same commit. | PR review, `npm run db:validate` | **Implemented** |
| NFR-D1 | Data integrity | The database rejects invalid data even if the API has a bug. | 22 CHECK constraints (e.g. `lesson_plans_status_chk`, `lesson_plans_topic_not_blank_chk`, `class_groups_academic_year_chk`), UNIQUE keys and FK RESTRICT/CASCADE/SET NULL as listed in database-schema.md §4 | Constraint test suite run on the PostgreSQL engine (database-schema.md §6.2) | **Implemented** (schema) |
| NFR-D2 | Data integrity | Multi-row writes are atomic. | Saving a plan with modules and objectives is one transaction. On any error, 0 rows persist. | Integration test injecting a CHECK failure on the 3rd module | Planned (v0.3+) |

---

## 7. Core Workflow (current prototype)

1. The user opens the lesson-plan generator.
2. The user selects a subject and enters a topic.
3. The user submits the form and sees loading feedback.
4. The frontend requests sample post content from JSONPlaceholder and presents up to six entries as lesson-plan modules.
5. The interface announces success or a request error.

The planned end-to-end workflow (generate → save → publish → schedule) is modelled in [diagrams/behavioral/activity.md](./diagrams/behavioral/activity.md).

### 7.1 Planned REST API surface (v0.3+)

These endpoints are used consistently by the activity diagram, the sequence diagrams and this SRS. **None of them exist yet.**

| Method and path | FR | Success |
| --- | --- | --- |
| `POST /api/auth/register` | FR-07 | `201` |
| `POST /api/auth/login` | FR-08 | `200` |
| `POST /api/auth/refresh` | FR-09 | `200` |
| `POST /api/auth/logout` | FR-09 | `204` |
| `POST /api/lesson-plans/generate` | FR-04 (server-side version) | `200` |
| `POST /api/lesson-plans` | FR-10 | `201` |
| `GET /api/lesson-plans` | FR-13 | `200` |
| `PATCH /api/lesson-plans/{id}` | FR-11 | `200` |
| `POST /api/lesson-plans/{id}/publish`, `/unpublish`, `/archive`, `/restore` | FR-12, FR-18 | `200` |
| `DELETE /api/lesson-plans/{id}` | FR-19 | `204` |
| `PUT /api/lesson-plans/{id}/objectives` | FR-14 | `200` |
| `POST /api/class-groups/{id}/lessons` | FR-15 | `201` |
| `POST /api/quizzes` | FR-16 | `201` |
| `POST /api/flashcard-decks` | FR-17 | `201` |
| `GET /api/admin/lesson-plans` | FR-18 | `200` |

---

## 8. Traceability Matrix

UC IDs refer to [diagrams/behavioral/use-case.md](./diagrams/behavioral/use-case.md). Diagram abbreviations: **UC** use case, **ACT** activity, **SM-LP** LessonPlan state machine, **SM-S** session state machine, **CRC** CRC cards, **CD** class diagram, **SEQ-1** save-plan sequence, **SEQ-2** login sequence.

| FR | Use case(s) | Diagram(s) | Table(s) | Status |
| --- | --- | --- | --- | --- |
| FR-01 | UC-01 | UC, ACT | none (UI only) | Implemented |
| FR-02 | UC-02 | UC, ACT, SEQ-1 | `lesson_plans` (`topic_not_blank_chk`) | Implemented |
| FR-03 | UC-02 | UC, ACT, SEQ-1 | `lesson_plans` (`topic VARCHAR(80)`) | Implemented |
| FR-04 | UC-01 | UC, ACT, CRC, CD | none (in memory). Saved later in `lesson_plan_modules`. | Implemented |
| FR-05 | UC-01 | UC, ACT, SEQ-1 | none | Implemented |
| FR-06 | UC-03 | UC, ACT | none | Implemented |
| FR-07 | UC-04 | UC, SM-S, CRC, CD | `users` | Planned (v0.3+) |
| FR-08 | UC-05 | UC, SM-S, SEQ-2, CRC, CD | `users` (+ planned `refresh_tokens`) | Planned (v0.3+) |
| FR-09 | UC-06 | UC, SM-S, SEQ-1 (401 branch) | `users` (+ planned `refresh_tokens`) | Planned (v0.3+) |
| FR-10 | UC-07 | UC, ACT, SM-LP, SEQ-1, CRC, CD | `lesson_plans`, `lesson_plan_modules`, `lesson_plan_objectives` | Planned (v0.3+) |
| FR-11 | UC-08 | UC, SM-LP, CD | `lesson_plans`, `lesson_plan_modules` | Planned (v0.3+) |
| FR-12 | UC-09 | UC, SM-LP, CD | `lesson_plans`, `lesson_plan_objectives`, `class_lessons` | Planned (v0.3+) |
| FR-13 | UC-10 | UC, CRC, CD | `lesson_plans` | Planned (v0.3+) |
| FR-14 | UC-11 | UC, CD | `lesson_plan_objectives`, `learning_objectives` | Planned (v0.3+) |
| FR-15 | UC-12 | UC, SM-LP, CD | `class_lessons`, `class_groups` | Planned (v0.3+) |
| FR-16 | UC-13, UC-14 | UC, CRC, CD | `quizzes`, `quiz_questions`, `question_options` | Planned (v0.3+) |
| FR-17 | UC-15 | UC, CRC, CD | `flashcard_decks`, `flashcards` | Planned (v0.3+) |
| FR-18 | UC-16 | UC, SM-LP, CD | `lesson_plans`, `users` | Planned (v0.3+) |
| FR-19 | UC-17 | UC, SM-LP, CD | `lesson_plans` (+ CASCADE / SET NULL children) | Planned (v0.3+) |
| FR-20 | UC-18 | UC, CD | `quizzes`, `quiz_questions`, `question_options` (read only) | Planned (v0.4+) |

---

## 9. Current State and Data Limitations

- The frontend tracks selected subject, topic, generated sample modules, loading state, and status feedback in React state.
- Module objectives come from JSONPlaceholder post bodies. The returned content is sample placeholder data, not verified curriculum content or AI-generated lesson plans.
- Generation requires network access to `https://jsonplaceholder.typicode.com/posts`.
- State is in memory and resets on page refresh.
- The frontend's subject list (Science, Mathematics, Language Arts, Social Studies, Art) is hard-coded and differs from the `subjects` seed data. Aligning them is part of connecting the API.
- The persistent data model is specified in [database-schema.md](./database-schema.md) and implemented in `prisma/schema.prisma` for PostgreSQL 16. It has 14 tables covering users, subjects, class groups, curriculum objectives, lesson plans and their modules, scheduled class lessons, quizzes and flashcard decks. `prisma/seed.sql` loads fictional sample data. The frontend is not connected to this database yet.

---

## 10. Acceptance Checklist

Prototype (Implemented scope):

- [ ] The app builds with `npm run build`.
- [ ] An empty or whitespace-only topic is rejected before the request.
- [ ] A valid topic can generate up to six modules when the sample service is available.
- [ ] Generated modules show all required fields.
- [ ] Request failure clears modules and displays an accessible error status.
- [ ] The page has no horizontal overflow at 1280px and 375px viewport widths.

Deliverable 3 documentation:

- [ ] Every FR appears in at least one use case, and every use case appears in the traceability matrix.
- [ ] Class-diagram attributes and cardinalities match `prisma/schema.prisma`.
- [ ] LessonPlan states match `lesson_plans_status_chk`.
- [ ] REST endpoints are identical in Section 7.1, the activity diagram and the sequence diagrams.
- [ ] All Mermaid blocks render on GitHub.
