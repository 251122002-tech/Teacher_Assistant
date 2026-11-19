# Activity Diagram: Generate and Save a Lesson Plan

This diagram follows one teacher action from start to finish: generate modules for a topic, review them, and save the plan as a `DRAFT`. It has three swimlanes:

- **Client UI:** the React app in the browser.
- **API Gateway:** the planned HTTP entry point that checks the JWT and routes requests.
- **Backend Service & Database:** the planned LessonPlanService, the external content service, and PostgreSQL.

**Implemented vs planned.** Green nodes work today in `frontend/app.jsx`. In the prototype, the browser calls JSONPlaceholder directly, with no gateway or backend. Dashed nodes are **Planned (v0.3+)**. The diagram shows the target flow, in which generation and saving both go through the API.

## Diagram

```mermaid
flowchart TB
    subgraph GW["API Gateway"]
        G1{"Access token valid?<br/>signature ok, age under 15 min"}
        G2["Route to<br/>LessonPlanService.generate"]
        G3["401 Unauthorized"]
        G4{"Access token valid?"}
        G5["Route to<br/>LessonPlanService.create"]
        G6["401 Unauthorized"]
    end

    subgraph BE["Backend Service and Database"]
        B1["Call external content service<br/>timeout 10 s"]
        B2{"External service OK?"}
        B3["Map results to<br/>at most 6 modules"]
        B4["200 OK + modules JSON"]
        B5["503 Service Unavailable"]
        Fork[["fork"]]
        B6["Validate payload<br/>topic 1 to 80 chars, at least 1 module"]
        B7["SELECT objectives, check each<br/>belongs to the plan subject"]
        Join[["join"]]
        B8{"Payload valid?"}
        B9["400 Bad Request or<br/>422 objective mismatch"]
        B10["BEGIN; INSERT lesson_plans DRAFT;<br/>INSERT lesson_plan_modules;<br/>INSERT lesson_plan_objectives"]
        B11{"DB constraints OK?"}
        B12["ROLLBACK<br/>422 CHECK or 409 UNIQUE"]
        B13["COMMIT<br/>201 Created + Location"]
    end

    subgraph UI["Client UI (React)"]
        Start(("Start"))
        U1["Teacher selects subject<br/>and types topic"]
        U2{"Topic valid?<br/>trimmed, 1 to 80 chars"}
        U3["Live region: 'Enter a topic before<br/>generating a lesson plan.'<br/>focus topic field"]
        U4["Live region: 'Building lesson plan<br/>modules...' and disable button"]
        U5["POST /api/lesson-plans/generate<br/>Authorization: Bearer JWT"]
        U6["Render up to 6 module cards<br/>Live region: 'Generated N modules'"]
        U7["Teacher reviews modules,<br/>picks objectives, presses Save"]
        U8["POST /api/lesson-plans<br/>Bearer JWT + JSON body"]
        U9["Live region: 'Lesson plan saved<br/>as draft.' and show in My plans"]
        UE1["Live region: 'Your session has<br/>expired. Please log in.'<br/>show login form"]
        UE2["Clear module cards<br/>Live region: 'Unable to generate<br/>the lesson plan.'"]
        UE3["Live region shows field or<br/>constraint error, keeps modules<br/>for correction"]
        Stop(("End"))
    end

    Start --> U1 --> U2
    U2 -- "no" --> U3 --> U1
    U2 -- "yes" --> U4 --> U5 --> G1
    G1 -- "no" --> G3 --> UE1 --> Stop
    G1 -- "yes" --> G2 --> B1 --> B2
    B2 -- "no" --> B5 --> UE2 --> Stop
    B2 -- "yes" --> B3 --> B4 --> U6 --> U7 --> U8 --> G4
    G4 -- "no" --> G6 --> UE1
    G4 -- "yes" --> G5 --> Fork
    Fork --> B6 --> Join
    Fork --> B7 --> Join
    Join --> B8
    B8 -- "no" --> B9 --> UE3
    B8 -- "yes" --> B10 --> B11
    B11 -- "no" --> B12 --> UE3
    B11 -- "yes" --> B13 --> U9 --> Stop
    UE3 --> U7

    classDef implemented fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef planned fill:#ffffff,stroke:#64748b,stroke-width:1.5px,stroke-dasharray:6 4,color:#1e293b
    classDef error fill:#fee2e2,stroke:#b91c1c,stroke-width:1.5px,stroke-dasharray:6 4,color:#7f1d1d
    classDef errorImplemented fill:#fee2e2,stroke:#b91c1c,stroke-width:2px,color:#7f1d1d
    classDef bar fill:#111827,stroke:#111827,color:#ffffff
    classDef terminal fill:#111827,stroke:#111827,color:#ffffff
    class U1,U2,U3,U4,U6 implemented
    class UE2 errorImplemented
    class U5,U7,U8,U9,G1,G2,G4,G5,B1,B2,B3,B4,B6,B7,B8,B10,B11,B13 planned
    class UE1,UE3,G3,G6,B5,B9,B12 error
    class Fork,Join bar
    class Start,Stop terminal
```

**Legend.** Each yellow subgraph is one swimlane. Mermaid's layout engine chooses the left-to-right order of the lanes from the edges, so on GitHub the Client UI lane usually renders on the right. Green = Implemented. Dashed white = Planned (v0.3+). Red = error branch (solid border Implemented, dashed Planned). Black bars = fork / join. Black circles = start / end.

## How the prototype differs today

| Step in diagram | Prototype behaviour (Implemented) |
| --- | --- |
| U5 → G1 → G2 → B1 | The browser calls `GET https://jsonplaceholder.typicode.com/posts` directly. There is no token and no gateway. |
| B2 "no" → UE2 | A network error or non-2xx response clears the cards and announces "Unable to generate the lesson plan. …" (FR-06). |
| B3 | Mapping to 6 modules runs in the browser (`loadDashboardData` in `app.jsx`). |
| U7 → B13 (save) | Not available. There is no Save button yet. |

## Notes / Traceability

| Diagram element | FR / NFR | Status |
| --- | --- | --- |
| U1 to U3 (topic validation, focus, live region) | FR-01, FR-02, FR-03, NFR-AC1 | Implemented |
| U4, U6 (loading and success announcements) | FR-04, FR-05 | Implemented |
| B2 "no" → UE2 (clear and announce error) | FR-06 | Implemented (prototype path), Planned (`503` from API) |
| G1/G4 → G3/G6 → UE1 (token check, 401, re-login) | FR-08, FR-09, NFR-S2 | Planned (v0.3+) |
| B1 timeout 10 s, B5 `503` | NFR-P2 | Planned (v0.3+) |
| Fork B6 ∥ B7 → Join → B8 (payload and objective checks) | FR-10, FR-14 | Planned (v0.3+) |
| B10 to B13 (single transaction, rollback) | FR-10, NFR-D1, NFR-D2 | Planned (v0.3+) |
| B12 `422` / `409` (CHECK / UNIQUE violation) | FR-10, DM-04 (`lesson_plans_topic_not_blank_chk`, `lesson_plan_modules_lesson_plan_id_position_key`) | Planned (v0.3+) |

- Endpoints `POST /api/lesson-plans/generate` and `POST /api/lesson-plans` match the SRS API table (specifications.md §7.1) and the [sequence diagram](../structural/sequence.md).
- Every error branch ends in the UI live region (`role="status"`), so screen-reader users hear the outcome (NFR-AC1).
- The fork runs two independent checks (payload rules and the objective-subject match) before the join. Both must finish before the decision. In code this would be `Promise.all`.
- Related use cases: UC-01, UC-02, UC-03, UC-05, UC-07, UC-11 ([use-case.md](./use-case.md)).
