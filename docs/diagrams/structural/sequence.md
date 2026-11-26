# Sequence Diagrams

Sequence diagrams show the order of messages between objects for one scenario. This document has two:

1. **SEQ-1: Teacher saves a generated lesson plan** (`POST /api/lesson-plans`), with every failure branch.
2. **SEQ-2: Teacher logs in** (`POST /api/auth/login`), with lockout.

**Status: Planned (v0.3+).** No API, gateway or authentication exists yet. The only Implemented parts are the client-side topic check (FR-02, FR-03) and the live status region (FR-05, FR-06), which these diagrams reuse. Endpoints and status codes match the SRS API table ([specifications.md §7.1](../../specifications.md#71-planned-rest-api-surface-v03)) and the [activity diagram](../behavioral/activity.md).

## SEQ-1: Teacher saves a generated lesson plan

Precondition: the teacher has generated modules on screen (UC-01) and holds an access token (UC-05).

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant UI as React UI
    participant GW as API Gateway
    participant Auth as AuthMiddleware
    participant Svc as LessonPlanService
    participant DB as PostgreSQL

    Teacher->>UI: Press "Save plan"
    activate UI
    UI->>UI: Validate topic client-side (trim, 1 to 80 chars)
    UI-->>Teacher: Live region "Saving lesson plan..."
    UI->>GW: POST /api/lesson-plans<br/>Authorization: Bearer access JWT<br/>{subjectId, topic, gradeLevel, durationMinutes, modules[], objectiveIds[]}
    activate GW
    GW->>Auth: handle(request)
    activate Auth
    Auth->>Auth: verify JWT signature and expiry (15 min)

    alt token missing, invalid or expired
        Auth-->>GW: reject
        GW-->>UI: 401 Unauthorized
        opt refresh token still valid (under 7 days)
            UI->>GW: POST /api/auth/refresh
            GW-->>UI: 200 OK {accessToken, refreshToken}
            UI->>GW: retry POST /api/lesson-plans (once)
        end
        UI-->>Teacher: Live region "Your session has expired. Please log in." (if refresh failed)
    else token valid
        Auth-->>GW: AuthContext {userId, role}
        deactivate Auth
        GW->>Svc: create(context, input)
        activate Svc
        Svc->>Svc: validate input (topic not blank, length up to 80, modules at least 1)

        alt blank topic or topic longer than 80 chars or no modules
            Svc-->>GW: ValidationError
            GW-->>UI: 400 Bad Request {field: "topic", message}
            UI-->>Teacher: Live region "Topic must be 1 to 80 characters." and focus topic field
        else input valid
            Svc->>DB: BEGIN
            activate DB
            Svc->>DB: INSERT INTO lesson_plans (status = DRAFT)
            Svc->>DB: INSERT INTO lesson_plan_modules (positions 1..N)
            Svc->>DB: INSERT INTO lesson_plan_objectives

            alt CHECK violation (SQLSTATE 23514) or UNIQUE violation (23505)
                DB-->>Svc: error, e.g. lesson_plans_duration_chk
                Svc->>DB: ROLLBACK
                Svc-->>GW: ConstraintError
                GW-->>UI: 422 Unprocessable Entity (CHECK) or 409 Conflict (duplicate position)
                UI-->>Teacher: Live region "Duration must be 10 to 180 minutes." and keep modules for correction
            else database unavailable or timeout
                DB--xSvc: connection error
                Svc-->>GW: ServiceUnavailableError
                GW-->>UI: 503 Service Unavailable, Retry-After: 2
                opt teacher presses "Try again"
                    UI->>GW: POST /api/lesson-plans (same body)
                end
                UI-->>Teacher: Live region "Could not save right now. Your plan is kept on this page."
            else all inserts succeed
                Svc->>DB: COMMIT
                DB-->>Svc: ok, plan id
                deactivate DB
                Svc-->>GW: LessonPlan {id, status: DRAFT}
                deactivate Svc
                GW-->>UI: 201 Created<br/>Location: /api/lesson-plans/{id}
                UI-->>Teacher: Live region "Lesson plan saved as draft."
            end
        end
    end
    deactivate GW
    deactivate UI
```

### Branch summary

| Branch | HTTP status | Cause | Live-region message | Rows persisted |
| --- | --- | --- | --- | --- |
| Token invalid | `401` | Missing or expired access token, and the refresh failed | "Your session has expired. Please log in." | 0 |
| Validation | `400` | Blank topic, topic > 80 characters, 0 modules (FR-02, FR-03, FR-10) | "Topic must be 1 to 80 characters." | 0 |
| Constraint | `422` / `409` | CHECK (`lesson_plans_duration_chk`, `lesson_plans_topic_not_blank_chk` …) or UNIQUE (`lesson_plan_modules_lesson_plan_id_position_key`) | Specific field message | 0 (ROLLBACK) |
| Infrastructure | `503` | Database down or timeout | "Could not save right now. Your plan is kept on this page." | 0 |
| Success | `201` | none | "Lesson plan saved as draft." | 1 plan + N modules + M objective links |

## SEQ-2: Teacher logs in

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant UI as React UI
    participant GW as API Gateway
    participant AuthSvc as AuthService
    participant DB as PostgreSQL

    Teacher->>UI: Enter email and password, press "Log in"
    activate UI
    UI->>GW: POST /api/auth/login {email, password}
    activate GW
    GW->>AuthSvc: login(email, password)
    activate AuthSvc
    AuthSvc->>DB: SELECT user by email
    activate DB
    DB-->>AuthSvc: user row (or none)
    deactivate DB

    alt account locked (failed_attempts at least 5 within 15 min)
        AuthSvc-->>GW: LockedError
        GW-->>UI: 423 Locked
        UI-->>Teacher: Live region "Too many attempts. Try again in 15 minutes."
    else wrong email or password
        AuthSvc->>DB: UPDATE users SET failed_login_attempts += 1
        AuthSvc-->>GW: InvalidCredentials
        GW-->>UI: 401 Unauthorized
        UI-->>Teacher: Live region "Email or password is incorrect."
    else user inactive (is_active = false)
        AuthSvc-->>GW: Forbidden
        GW-->>UI: 403 Forbidden
        UI-->>Teacher: Live region "This account is disabled."
    else credentials valid
        AuthSvc->>AuthSvc: bcrypt.compare (cost 12)
        AuthSvc->>DB: reset failed_login_attempts, INSERT refresh token
        AuthSvc-->>GW: TokenPair
        deactivate AuthSvc
        GW-->>UI: 200 OK {accessToken (15 min), refreshToken (7 d)}
        UI-->>Teacher: Live region "Signed in." and show My plans
    end
    deactivate GW
    deactivate UI
```

## Notes / Traceability

| Message / branch | FR / NFR | Status |
| --- | --- | --- |
| Client-side topic check (SEQ-1 step 2) | FR-02, FR-03 | Implemented (in the generator form today) |
| Live-region updates in every branch | FR-05, FR-06, NFR-AC1 | Implemented (live region), Planned (new messages) |
| `POST /api/lesson-plans` → `201` | FR-10, UC-07 | Planned (v0.3+) |
| `401` + `opt` refresh | FR-09, NFR-S2, UC-05/UC-06 | Planned (v0.3+) |
| `400` validation | FR-02, FR-03, FR-10 | Planned (v0.3+) |
| `422` / `409` + ROLLBACK | FR-10, NFR-D1, NFR-D2, DM-04 | Planned (v0.3+). The CHECK and UNIQUE constraints themselves are Implemented. |
| `503` + `opt` retry | NFR-A1, NFR-P1 | Planned (v0.3+) |
| SEQ-2 `POST /api/auth/login`, `423` lockout | FR-08, NFR-S1, NFR-S5, UC-05 | Planned (v0.3+). Needs the `failed_login_attempts` / `locked_until` / refresh-token migration. |

- Participants match the [class diagram](./class-diagram.md): `AuthMiddleware`, `AuthService` and `LessonPlanService` are the same classes. The API Gateway is the HTTP layer that hosts `AuthMiddleware`. `LessonPlanRepository` is folded into the `LessonPlanService` → PostgreSQL messages to keep SEQ-1 readable.
- PostgreSQL error codes: `23514` check_violation, `23505` unique_violation, `23503` foreign_key_violation (the last one is used by delete, FR-19).
