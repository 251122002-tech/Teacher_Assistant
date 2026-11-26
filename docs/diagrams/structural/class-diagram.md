# Class Diagram

The class model has two views:

1. **Domain model:** one class per Prisma model (14) and three enumerations. Attribute names are the Prisma field names, with the database column in `snake_case` (see [database-schema.md](../../database-schema.md)). Types map as follows: `String @db.Uuid` → `UUID`, `Int` / `SmallInt` → `int`, `DateTime` (`@db.Timestamptz` / `@db.Date`) → `DateTime`, `Boolean` → `Boolean`, `String` / `Text` / `VarChar` → `String`. A trailing `?` marks an optional (nullable) attribute.
2. **Services and dependencies:** the service, repository and client classes from the [CRC cards](./crc-cards.md) and how they depend on the domain.

Visibility: `-` private, `+` public, `#` protected. Attributes are private and exposed through methods. Value objects (`AuthContext`, `TokenPair`) have public read-only fields.

**Status.** All domain **attributes** are Implemented as the Prisma schema. All **methods** and every class in view 2 are **Planned (v0.3+)**.

## View 1: Domain model

```mermaid
classDiagram
    direction TB

    class UserRole {
        <<enumeration>>
        TEACHER
        ADMIN
    }
    class LessonPlanStatus {
        <<enumeration>>
        DRAFT
        PUBLISHED
        ARCHIVED
    }
    class QuestionType {
        <<enumeration>>
        SINGLE_CHOICE
        MULTIPLE_CHOICE
        TRUE_FALSE
    }

    class User {
        -UUID id
        -String email
        -String passwordHash
        -String firstName
        -String lastName
        -UserRole role
        -Boolean isActive
        -DateTime createdAt
        -DateTime updatedAt
        +fullName() String
        +isAdmin() Boolean
        +deactivate() void
    }
    class Subject {
        -int id
        -String code
        -String name
        +getCode() String
    }
    class TeacherSubject {
        -UUID userId
        -int subjectId
        -DateTime assignedAt
    }
    class ClassGroup {
        -UUID id
        -UUID teacherId
        -String name
        -int gradeLevel
        -String academicYear
        -int studentCount
        -DateTime createdAt
        +schedule(plan: LessonPlan, scheduledOn: DateTime) ClassLesson
    }
    class LearningObjective {
        -UUID id
        -int subjectId
        -String code
        -int gradeLevel
        -String description
        +belongsTo(subjectId: int) Boolean
    }
    class LessonPlan {
        -UUID id
        -UUID authorId
        -int subjectId
        -String topic
        -int gradeLevel
        -int durationMinutes
        -LessonPlanStatus status
        -DateTime createdAt
        -DateTime updatedAt
        +addModule(module: LessonPlanModule) void
        +linkObjectives(objectives: List~LearningObjective~) void
        +canPublish() Boolean
        +isTaught() Boolean
        +publish() void
        +unpublish() void
        +archive(actor: User) void
        +restore() void
    }
    class LessonPlanObjective {
        -UUID lessonPlanId
        -UUID objectiveId
    }
    class LessonPlanModule {
        -UUID id
        -UUID lessonPlanId
        -int position
        -String title
        -String activity
        -int durationMinutes
    }
    class ClassLesson {
        -UUID id
        -UUID lessonPlanId
        -UUID classGroupId
        -DateTime scheduledOn
        -String? notes
        -DateTime createdAt
    }
    class Quiz {
        -UUID id
        -UUID authorId
        -UUID? lessonPlanId
        -String title
        -int? timeLimitSeconds
        -DateTime createdAt
        -DateTime updatedAt
        +addQuestion(question: QuizQuestion) void
        +isPlayable() Boolean
    }
    class QuizQuestion {
        -UUID id
        -UUID quizId
        -int position
        -String prompt
        -QuestionType questionType
        -int points
        +addOption(option: QuestionOption) void
        +hasValidOptions() Boolean
    }
    class QuestionOption {
        -UUID id
        -UUID questionId
        -int position
        -String optionText
        -Boolean isCorrect
    }
    class FlashcardDeck {
        -UUID id
        -UUID authorId
        -UUID? lessonPlanId
        -String title
        -DateTime createdAt
        -DateTime updatedAt
        +addCard(card: Flashcard) void
    }
    class Flashcard {
        -UUID id
        -UUID deckId
        -int position
        -String frontText
        -String backText
    }

    User "1" *-- "0..*" TeacherSubject : teaches
    Subject "1" --> "0..*" TeacherSubject : taught by
    User "1" *-- "0..*" ClassGroup : owns
    Subject "1" --> "0..*" LearningObjective : defines
    User "1" --> "0..*" LessonPlan : authors
    Subject "1" --> "0..*" LessonPlan : classifies
    LessonPlan "1" *-- "1..*" LessonPlanModule : consists of
    LessonPlan "1" *-- "0..*" LessonPlanObjective : targets
    LearningObjective "1" --> "0..*" LessonPlanObjective : targeted by
    LessonPlan "1" --> "0..*" ClassLesson : taught as
    ClassGroup "1" *-- "0..*" ClassLesson : hosts
    User "1" --> "0..*" Quiz : authors
    LessonPlan "0..1" o-- "0..*" Quiz : source of
    Quiz "1" *-- "0..*" QuizQuestion : contains
    QuizQuestion "1" *-- "1..*" QuestionOption : offers
    User "1" --> "0..*" FlashcardDeck : authors
    LessonPlan "0..1" o-- "0..*" FlashcardDeck : source of
    FlashcardDeck "1" *-- "0..*" Flashcard : contains

    User ..> UserRole
    LessonPlan ..> LessonPlanStatus
    QuizQuestion ..> QuestionType
```

## View 2: Services and dependencies

```mermaid
classDiagram
    direction LR

    class ApiClient {
        <<frontend>>
        -String baseUrl
        -TokenStore tokenStore
        +get(path: String, query: Object) Promise~Response~
        +post(path: String, body: Object) Promise~Response~
        +patch(path: String, body: Object) Promise~Response~
        +delete(path: String) Promise~Response~
        -refreshAndRetry(request: Request) Promise~Response~
    }
    class AuthMiddleware {
        <<gateway>>
        -TokenService tokenService
        +handle(request: Request, next: Handler) void
        +requireRole(role: UserRole) Handler
    }
    class AuthService {
        <<service>>
        -UserRepository userRepository
        -PasswordHasher passwordHasher
        -TokenService tokenService
        +register(email: String, password: String, firstName: String, lastName: String) User
        +login(email: String, password: String) TokenPair
        +logout(refreshToken: String) void
        -recordFailedAttempt(user: User) void
    }
    class TokenService {
        <<service>>
        -String signingKey
        -int accessTtlSeconds
        -int refreshTtlSeconds
        +issue(user: User) TokenPair
        +verifyAccess(accessToken: String) AuthContext
        +rotate(refreshToken: String) TokenPair
        +revoke(refreshToken: String) void
    }
    class AuthContext {
        <<value object>>
        +UUID userId
        +UserRole role
    }
    class TokenPair {
        <<value object>>
        +String accessToken
        +String refreshToken
        +DateTime accessExpiresAt
    }
    class LessonPlanService {
        <<service>>
        -LessonPlanRepository repository
        -LessonPlanGenerator generator
        +generate(subjectId: int, topic: String) List~LessonPlanModule~
        +create(context: AuthContext, input: CreateLessonPlanInput) LessonPlan
        +update(context: AuthContext, planId: UUID, input: UpdateLessonPlanInput) LessonPlan
        +changeStatus(context: AuthContext, planId: UUID, event: String) LessonPlan
        +linkObjectives(context: AuthContext, planId: UUID, objectiveIds: List~UUID~) void
        +listMine(context: AuthContext, page: int, status: LessonPlanStatus) List~LessonPlan~
        +delete(context: AuthContext, planId: UUID) void
    }
    class LessonPlanGenerator {
        <<service>>
        -ContentServiceClient contentClient
        -int maxModules
        +generate(subjectName: String, topic: String) List~LessonPlanModule~
        -toModule(item: ContentItem, index: int) LessonPlanModule
    }
    class ContentServiceClient {
        <<client>>
        -String endpoint
        -int timeoutMs
        +fetchContent(subjectName: String, topic: String) List~ContentItem~
    }
    class LessonPlanRepository {
        <<repository>>
        -PrismaClient prisma
        +findById(id: UUID) LessonPlan
        +findByAuthor(authorId: UUID, page: int) List~LessonPlan~
        +saveWithModules(plan: LessonPlan) LessonPlan
        +updateStatus(id: UUID, status: LessonPlanStatus) void
        +delete(id: UUID) void
        #mapDbError(error: Error) DomainError
    }
    class LessonPlan {
        <<entity>>
    }
    class LessonPlanModule {
        <<entity>>
    }
    class User {
        <<entity>>
    }

    ApiClient ..> AuthMiddleware : HTTPS /api/*
    AuthMiddleware ..> TokenService : verifies with
    AuthMiddleware ..> AuthContext : creates
    AuthService ..> TokenService : issues via
    AuthService ..> User : loads
    TokenService ..> TokenPair : creates
    LessonPlanService ..> LessonPlanGenerator : delegates generation
    LessonPlanService ..> LessonPlanRepository : persists via
    LessonPlanService ..> AuthContext : authorises with
    LessonPlanService ..> LessonPlan : applies transitions
    LessonPlanGenerator ..> ContentServiceClient : fetches via
    LessonPlanGenerator ..> LessonPlanModule : creates
    LessonPlanRepository ..> LessonPlan : loads and saves
```

## Notes / Traceability

### Why composition, aggregation or association

The relationship kind follows the foreign key's `ON DELETE` rule in the migration, so the diagram and the database cannot disagree.

| Kind | Mermaid | Used for | FK rule | Reason |
| --- | --- | --- | --- | --- |
| **Composition** (filled diamond) | `*--` | LessonPlan → LessonPlanModule, LessonPlan → LessonPlanObjective, Quiz → QuizQuestion, QuizQuestion → QuestionOption, FlashcardDeck → Flashcard, ClassGroup → ClassLesson, User → ClassGroup, User → TeacherSubject | `ON DELETE CASCADE` | The part cannot exist without the whole and is deleted with it. |
| **Aggregation** (hollow diamond) | `o--` | LessonPlan → Quiz, LessonPlan → FlashcardDeck | `ON DELETE SET NULL`, FK nullable | The plan "has" quizzes and decks, but they outlive it as standalone games. Multiplicity `0..1` on the plan side. |
| **Association** (arrow) | `-->` | User → LessonPlan / Quiz / FlashcardDeck, Subject → LessonPlan / LearningObjective / TeacherSubject, LearningObjective → LessonPlanObjective, LessonPlan → ClassLesson | `ON DELETE RESTRICT` | Independent lifecycles: the referenced object must not be deleted while it is in use. |
| **Dependency** (dashed) | `..>` | Entities → enums, and every service arrow in View 2 | none | Uses the type, but does not own a reference to it. |

### Cardinalities vs Prisma

| Association | Cardinality | Prisma evidence |
| --- | --- | --- |
| User → LessonPlan | `1` to `0..*` | `LessonPlan.authorId String` (required) + `User.lessonPlans LessonPlan[]` |
| LessonPlan → LessonPlanModule | `1` to `1..*` | required `lessonPlanId`. The minimum of 1 is a business rule (FR-10, state-machine guard T1). |
| LessonPlan → Quiz | `0..1` to `0..*` | `Quiz.lessonPlanId String?`, `onDelete: SetNull` |
| QuizQuestion → QuestionOption | `1` to `1..*` | required `questionId`. The "≥ 2 options" business rule is in `hasValidOptions()` (FR-16). |
| LessonPlan ↔ LearningObjective | N:M through `LessonPlanObjective` | `@@id([lessonPlanId, objectiveId])` |
| LessonPlan ↔ ClassGroup | N:M through `ClassLesson` | `@@unique([classGroupId, scheduledOn, lessonPlanId])` |
| User ↔ Subject | N:M through `TeacherSubject` | `@@id([userId, subjectId])` |

### Other notes

- **Enums.** `UserRole`, `LessonPlanStatus` and `QuestionType` are stored as `VARCHAR` with CHECK constraints (`users_role_chk`, `lesson_plans_status_chk`, `quiz_questions_type_chk`), not as PostgreSQL enums. Their values are identical to the enum literals here.
- **State machine.** `LessonPlan.publish()`, `unpublish()`, `archive(actor)` and `restore()` implement transitions T4, T6, T7 and T8 from the [state machine](../behavioral/state-machine.md). `canPublish()` is the T4 guard.
- **Supporting types.** View 2 names some types without drawing them: `Request`, `Response`, `Handler`, `TokenStore`, `PrismaClient`, `ContentItem`, `CreateLessonPlanInput`, `UpdateLessonPlanInput`, `DomainError`, `UserRepository` and `PasswordHasher`. They are framework or DTO types, left out to keep the diagram readable.
- **Planned columns.** Session fields (`failedLoginAttempts`, `lockedUntil`, refresh tokens) are not in the current schema and are therefore not drawn on `User`. They arrive with the v0.3 migration (see the [SRS](../../specifications.md) schema note).
- Traceability: View 1 implements DM-01 to DM-04 in UML form. View 2 covers FR-01 to FR-19 through the use cases listed in [crc-cards.md](./crc-cards.md#notes--traceability).
