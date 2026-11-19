# CRC Cards

CRC (Class, Responsibilities, Collaborators) cards list what each class knows and does, and which classes it needs. They are the bridge between the use cases and the [class diagram](./class-diagram.md).

**Design rule: Single Responsibility Principle (SRP).** Each card states the *one reason to change* for its class. If a class had two independent reasons to change, it was split, and the split is noted on the card.

**Status.** Domain classes correspond to Prisma models in `prisma/schema.prisma`, so their **data** is Implemented (schema verified). Their **behaviour** (methods) and every service class are Planned (v0.3+), because no backend exists yet. The one exception is generation logic, which exists today inside `frontend/app.jsx`.

## Domain classes

### User

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **User** | Know identity (email, first/last name), role (`TEACHER` / `ADMIN`) and active flag. Answer "is this user an admin?". Deactivate itself instead of being deleted. | LessonPlan, ClassGroup, Quiz, FlashcardDeck, Subject (via TeacherSubject) |

*Single responsibility:* represent a person's identity and role. *Split:* password checking and token handling moved to **AuthService** / **TokenService**, so a change in login policy does not touch the User entity. Status: data Implemented (`users`), methods Planned (v0.3+).

### Subject

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **Subject** | Know its stable code (`MATH`) and display name. Be the classification key for plans and objectives. | LearningObjective, LessonPlan, User (via TeacherSubject) |

*Single responsibility:* reference data for a school subject. Status: data Implemented (`subjects`).

### LearningObjective

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LearningObjective** | Know its curriculum code (e.g. `5.1.2.1`), grade and wording. Tell whether it belongs to a given subject. | Subject, LessonPlan (via LessonPlanObjective) |

*Single responsibility:* represent one curriculum objective. Status: data Implemented (`learning_objectives`), methods Planned (v0.3+).

### LessonPlan

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LessonPlan** | Know topic, grade, duration, status and author. Own its ordered modules and objective links. Enforce its own state transitions (`publish`, `unpublish`, `archive`, `restore`) and their guards. Answer `canPublish()` and `isTaught()`. | LessonPlanModule, LearningObjective, Subject, User, ClassLesson, LessonPlanStatus |

*Single responsibility:* keep one lesson plan internally consistent (the LessonPlan state machine). *Split:* persistence moved to **LessonPlanRepository** and the cross-entity workflow to **LessonPlanService**, so a database change or a new API flow does not change the entity's rules. Status: data Implemented (`lesson_plans`), methods Planned (v0.3+).

### LessonPlanModule

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LessonPlanModule** | Know its position, title, activity and duration within one plan. | LessonPlan |

*Single responsibility:* one stage of a lesson. Status: data Implemented (`lesson_plan_modules`). In the prototype, modules exist only as in-memory card objects (Implemented in `app.jsx`).

### ClassGroup

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **ClassGroup** | Know its name (`7A`), grade, academic year, student count and owning teacher. Hold the dated lessons scheduled for it. | User, ClassLesson, LessonPlan (via ClassLesson) |

*Single responsibility:* represent a teacher's class in one academic year. Status: data Implemented (`class_groups`), methods Planned (v0.3+).

### Quiz

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **Quiz** | Know title, optional time limit, author and optional source plan. Own its ordered questions. Validate that it can be played (`isPlayable()`: at least 1 question, each with a correct option). | QuizQuestion, User, LessonPlan |

*Single responsibility:* a playable set of questions. Status: data Implemented (`quizzes`), methods Planned (v0.3+).

### QuizQuestion

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **QuizQuestion** | Know prompt, type, points and position. Own its options. Validate its own answer rules: ≥ 2 options and ≥ 1 correct option, with exactly 2 options for `TRUE_FALSE`. | Quiz, QuestionOption, QuestionType |

*Single responsibility:* one question and its answer rules. *Split:* the per-question rule lives here, not in Quiz, so adding a question type changes only this class. Status: data Implemented (`quiz_questions`, `question_options`), methods Planned (v0.3+).

### FlashcardDeck

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **FlashcardDeck** | Know title, author and optional source plan. Own its ordered flashcards. | Flashcard, User, LessonPlan |

*Single responsibility:* a reviewable set of flashcards. Status: data Implemented (`flashcard_decks`, `flashcards`), methods Planned (v0.3+).

## Service and infrastructure classes

### ApiClient (frontend)

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **ApiClient** | Send HTTP requests to `/api/*`. Attach `Authorization: Bearer <access token>`. On `401`, call `POST /api/auth/refresh` once and retry. Convert non-2xx responses into typed errors (status + message) for the UI. | TokenStore (browser), React components, API Gateway |

*Single responsibility:* HTTP transport between the browser and the API. *Split:* today `loadDashboardData` in `app.jsx` fetches, maps and updates UI state in one function. In v0.3 transport moves to ApiClient and mapping moves to LessonPlanGenerator, and the component only renders and announces status. Status: Planned (v0.3+). The `fetch` call to JSONPlaceholder is Implemented inline.

### AuthMiddleware (API gateway)

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **AuthMiddleware** | For every protected route: read the Bearer token, ask TokenService to verify it, attach `AuthContext` (userId, role) to the request, or reply `401`. Reply `403` when the route needs `ADMIN`. | TokenService, AuthContext |

*Single responsibility:* request-level access control. Status: Planned (v0.3+).

### AuthService

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **AuthService** | Register users (unique email, bcrypt cost ≥ 12). Verify credentials on login. Count failed attempts and lock after 5 within 15 min. Refuse inactive users. Log out by revoking the refresh token. | UserRepository, PasswordHasher, TokenService |

*Single responsibility:* credential and account-access policy. *Split:* token creation and verification moved to **TokenService**, because JWT format, keys and TTLs change for different reasons (cryptography and infrastructure) than login rules (product policy). Status: Planned (v0.3+).

### TokenService

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **TokenService** | Issue a 15-minute access JWT and a 7-day refresh token. Verify signature and expiry. Rotate and revoke refresh tokens. | RefreshTokenStore (planned `refresh_tokens` table) |

*Single responsibility:* token lifecycle. Status: Planned (v0.3+).

### LessonPlanService

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LessonPlanService** | Orchestrate the lesson-plan use cases: generate (via LessonPlanGenerator), create, update, change status, link objectives, list by author, delete. Check ownership (caller = author, or ADMIN for archive). Map domain errors to HTTP codes (400, 403, 409, 422). | LessonPlanGenerator, LessonPlanRepository, LessonPlan, AuthContext |

*Single responsibility:* application workflow for lesson plans. It holds no SQL and no state-transition rules of its own. Status: Planned (v0.3+).

### LessonPlanGenerator

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LessonPlanGenerator** | Turn (subject, topic) into at most 6 draft modules with title, target grade, objectives text, duration and activity. Enforce the 6-module limit and timing defaults. | ContentServiceClient, LessonPlanModule |

*Single responsibility:* the mapping from raw content to lesson-plan modules. *Split:* calling the external service moved to **ContentServiceClient**, so switching from JSONPlaceholder to a real AI provider does not change the mapping rules. Status: logic Implemented inline in `app.jsx` (`sourcePosts.slice(0, 6).map(...)`). The class is Planned (v0.3+).

### ContentServiceClient

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **ContentServiceClient** | Call the external content / AI service with a 10 s timeout. Return raw items, or throw `ServiceUnavailableError`. | External content / AI service |

*Single responsibility:* the vendor protocol of the external service. Status: Planned (v0.3+). The direct `fetch` to JSONPlaceholder is Implemented.

### LessonPlanRepository

| Class | Responsibilities | Collaborators |
| --- | --- | --- |
| **LessonPlanRepository** | Load and save LessonPlan aggregates through Prisma. Insert a plan with its modules and objective links in **one transaction**. Page plans by author (newest first, 20 per page). Translate PostgreSQL errors (`23514` CHECK, `23505` UNIQUE, `23503` FK) into domain errors. | PrismaClient, PostgreSQL |

*Single responsibility:* persistence of lesson plans. Status: Planned (v0.3+). The schema it relies on is Implemented.

## SRP splits at a glance

| Original candidate | Split into | Separate reasons to change |
| --- | --- | --- |
| `App.loadDashboardData` (today) | React component + ApiClient + LessonPlanGenerator + ContentServiceClient | UI and accessibility / HTTP and auth / mapping rules / vendor API |
| "AuthManager" | AuthService + TokenService (+ AuthMiddleware) | login policy / token cryptography / per-request access |
| "LessonPlanManager" | LessonPlan (entity rules) + LessonPlanService (workflow) + LessonPlanRepository (SQL) | business rules / API use cases / database |
| Quiz validating every question | Quiz + QuizQuestion | quiz-level rules / question-type rules |

## Notes / Traceability

| Class | Use cases | FRs |
| --- | --- | --- |
| User, AuthService, TokenService, AuthMiddleware | UC-04, UC-05, UC-06, UC-16 | FR-07, FR-08, FR-09, FR-18 |
| LessonPlan, LessonPlanModule, LessonPlanService, LessonPlanRepository | UC-07, UC-08, UC-09, UC-10, UC-17 | FR-10, FR-11, FR-12, FR-13, FR-19 |
| LessonPlanGenerator, ContentServiceClient, ApiClient | UC-01, UC-02, UC-03 | FR-01 to FR-06 |
| LearningObjective, Subject | UC-11 | FR-14 |
| ClassGroup | UC-12 | FR-15 |
| Quiz, QuizQuestion | UC-13, UC-14, UC-18 | FR-16, FR-20 |
| FlashcardDeck | UC-15 | FR-17 |
