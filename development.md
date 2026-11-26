# Development Guide

## 1. Local Setup

The frontend uses React and Vite. The API is a Node.js server (Node.js 22.9 or newer for `--env-file-if-exists`; tested with Node.js 26) that talks to PostgreSQL through Prisma.

1. Start PostgreSQL 16 or newer. On macOS, [Postgres.app](https://postgresapp.com/) works without configuration (tested with PostgreSQL 19); on first connection, allow the terminal in the Postgres.app permission dialog. Docker also works (see `README.md`).
2. Create the database, for example `createdb teacher_assistant` (Postgres.app puts `createdb` in `/Applications/Postgres.app/Contents/Versions/latest/bin`).
3. Copy `.env.example` to `.env`, set `DATABASE_URL` (with Postgres.app: `postgresql://<your macOS user>@localhost:5432/teacher_assistant?schema=public`) and set `JWT_SECRET` to at least 32 random characters.
4. Install dependencies, apply migrations and seed data, then start both servers:

```sh
npm install
npm run db:generate   # Prisma client (also needed after every schema change)
npm run db:migrate    # applies prisma/migrations, including the v0.3 auth migration
npm run db:seed       # optional fictional sample data
npm run dev:api       # terminal 1: API on http://127.0.0.1:3001 (reads .env)
npm run dev           # terminal 2: frontend on http://localhost:5173
```

Open the local URL printed by Vite. Vite forwards `/api/*` requests to the API server (see `vite.config.js`). Set `API_PORT` to move the API, and `COOKIE_SECURE=true` when serving over HTTPS. Create a production build with `npm run build`, or serve the build locally with `npm run preview`. The seed users have placeholder password hashes, so create a new account to sign in.

## 2. Development Principles

- Use React components for interface structure and state, CSS for presentation, and HTML for the mount document.
- Prefer native HTML semantics over custom interaction patterns.
- Validate user input before modifying application state.
- Keep state changes in small, named functions.
- Render generated lesson-plan cards from React state rather than manually patching the DOM.
- Preserve keyboard access, visible focus, and live feedback with every UI change.
- Use ASCII by default and keep comments limited to non-obvious state or DOM interactions.

## 3. Implementation Map

### `vite.config.js`

Sets `frontend/` as the Vite root and proxies `/api/*` to the local API server. The key is `/api/` with a trailing slash so frontend files such as `/apiClient.js` are not proxied.

### `shared/validation.js`

Grade list, custom-subject rules, subject input (`{ id }` or `{ name }`), and registration/sign-in/lesson-request validation used by both the frontend and the server. Validators return error codes, not text. Passwords are limited to 72 bytes because bcrypt ignores the rest.

### `shared/lessonTemplates.js`

Supported languages (`kk`, `ru`, `en`), translated names for the seed subjects keyed by `subjects.code`, and the six lesson-stage templates used to build a plan.

### `server/` (API, split along the CRC cards)

| File | Role |
| --- | --- |
| `index.js` | API gateway: routes, `requireUser` (AuthMiddleware: Bearer JWT → active user), the auth rate limit, and error responses `{ error, fieldErrors }` with codes. |
| `authService.js` | AuthService: register (bcrypt cost 12), login with lockout (5 failures in 15 min → `423` for 15 min), `403` for inactive users, refresh, logout. |
| `tokenService.js` | TokenService: HS256 access JWT (15 min) signed with `JWT_SECRET`; refresh tokens (7 days) stored as SHA-256 hashes in `refresh_tokens`, rotated on every use; reusing a rotated token revokes all of the user's tokens. |
| `subjectService.js` | Curriculum subject list, custom subjects (`CUSTOM_` codes), and the teacher's current subject (latest `teacher_subjects.assigned_at`). |
| `rateLimiter.js` | In-memory fixed window: 100 requests per minute per client address on `/api/auth/*` (`429`). |
| `http.js`, `prisma.js` | JSON/cookie helpers and the shared Prisma client. |

Routes: `POST /api/auth/register` (`201`), `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` (`204`), `GET /api/me`, `GET /api/subjects`, `PUT /api/me/subject`, `POST /api/lesson-plans/generate`. The refresh token is only ever in an HttpOnly, `SameSite=Strict` cookie with `Path=/api/auth`; the access token is returned in the JSON body.

### `frontend/index.html`

Defines the page metadata and the React mount point; it loads the JSX entry through Vite.

### `frontend/styles.css`

Defines design tokens, typography, educational color contrast, responsive card-grid layout, form states, focus states, and the mobile breakpoint at 560px.

### `frontend/app.jsx`

Mounts the React application. `App` owns the language (shared through `LanguageContext`), restores the session with `POST /api/auth/refresh`, and shows either `AuthPage` (step 1: create account / sign in) or `PlannerPage` (step 2). `LanguageSwitcher` in the header changes the language. `SubjectPicker` offers the subjects from `GET /api/subjects` plus "Other", which reveals a text field. The planner saves default subjects immediately, validates subject, grade, and topic, requests the plan from the API, and rebuilds it when the language changes. Status messages are stored as `{ key, params }` so they re-render in the current language.

### `frontend/apiClient.js`

ApiClient: keeps the access token in memory only, attaches it as `Authorization: Bearer`, and on a `401` runs one shared refresh and retries the request once. If the refresh fails, it reports an expired session and the app returns to the sign-in page.

### `frontend/translations.js`

All interface text in Kazakh, Russian, and English, including field-error text for each error code. Every language must have the same keys.

### `prisma/schema.prisma` and `prisma/migrations/`

The executable PostgreSQL 16 schema. The init migration was generated with `prisma migrate diff --from-empty`, and the CHECK constraints were appended by hand because Prisma cannot express them. If you change the schema, create a new migration and add any new CHECK constraints to it manually. Keep `docs/database-schema.md` and the ERD in sync.

### `prisma/seed.sql`

Fictional sample data for every table. The ten teachers, classes and dates are carried over from the v0.1 SQLite seed; their password hashes are placeholders, so they cannot sign in. Run it with `npm run db:seed` after `npm run db:migrate`. It is safe to run more than once (`ON CONFLICT DO NOTHING`).

### `docs/`

`database-schema.md` is the Deliverable 2 report. `erd.svg` is the diagram source, and `erd.png` and `erd.pdf` are exports of it.

`specifications.md` is the software requirements specification (Deliverable 3). `diagrams/behavioral/` and `diagrams/structural/` hold the UML diagrams as Mermaid code blocks inside Markdown, which GitHub renders directly. To check that every diagram parses locally, run the Mermaid CLI on a file. It needs a Chromium-based browser and is not a project dependency:

```sh
npx -y @mermaid-js/mermaid-cli -i docs/diagrams/structural/sequence.md -o out/sequence.md
```

## 4. Verification Commands

Build the frontend after changes:

```sh
npm run build
```

Start both servers for interactive browser checks:

```sh
npm run dev:api
npm run dev
```

Validate the database schema (no database connection needed):

```sh
npm run db:validate
```

Apply the schema and sample data to a PostgreSQL 16 database configured in `.env` (see README, "Database setup"):

```sh
npm run db:migrate
npm run db:seed
```

## 5. Manual Test Pass

1. Load the page at a desktop width while signed out and confirm only the account page appears.
2. Switch between Қазақ тілі, Русский язык, and English and confirm all text changes immediately.
3. Submit the empty registration form and confirm every field shows an error in the current language and focus moves to the first one. Confirm there is no subject field.
4. Create an account and confirm the planner opens with "Select subject". Pick a default subject and reload: it should stay selected. Choose "Other", type a subject, generate a plan, and reload: the custom subject should be kept.
5. Sign out, try a wrong password, then sign in and confirm the saved subject is still selected.
6. Submit with an empty topic and confirm the helpful message appears and focus returns to the topic input.
7. Enter a topic without choosing a grade, submit, and confirm the grade error appears under the grade selector and focus moves to it.
8. Select a grade, enter a topic, and generate the lesson plan with the button below the fields.
9. Confirm six stage cards show the selected grade as the target grade, plus learning objectives, duration, and key activities. Switch the language and confirm the plan is rebuilt in it.
10. Confirm the status message and stage count update.
11. Repeat the pass at a narrow mobile width.
12. Navigate through the controls with the keyboard and confirm visible focus.

## 6. Change Workflow

Before editing:

1. Read `my_project.cursorrules` and the relevant source file.
2. State the behavior being changed and the smallest affected surface.
3. Update the relevant documentation if behavior or acceptance criteria change.

After editing:

1. Run the narrowest relevant check first.
2. Re-test the changed workflow at wide and narrow widths when layout or interaction changed.
3. Review the diff for unrelated changes.
4. Record any known limitation in the relevant documentation.

## 7. Known Limitations

- Generated plans are held in memory and are cleared on page refresh. Only accounts and their subject are saved.
- There is no password reset, email verification, or account deletion yet.
- A custom subject typed in the planner is saved only when a lesson plan is generated; leaving the page before that keeps the previous subject. Custom subjects become rows in the shared `subjects` table.
- The auth rate limit is kept in memory, so it resets on restart and is not shared between API processes. Behind the Vite proxy every browser has the proxy's address, so the limit is effectively global in development.
- The API server is for local development; production hosting (HTTPS with `COOKIE_SECURE=true`, serving the built frontend, trusted proxy headers) is not set up.
- The ERD images and class diagram do not show the v0.3 auth columns and `refresh_tokens` yet (see `docs/database-schema.md`).
- Lesson plans come from fixed templates, not from an AI model; only the topic, subject, and grade change between plans.
- Errors for malformed API requests (`invalidJson`, `notFound`, and similar) fall back to a generic translated message.
- The API uses `users`, `refresh_tokens`, `subjects` and `teacher_subjects`. Saving lesson plans (`lesson_plans` and below) is not built yet.
- There are no automated browser tests in the current project. The Vite production build is the automated frontend verification.

## 8. Extension Guidance

Future features should introduce only the smallest abstraction needed. If persistence is added, define its data contract and failure behavior first, then test loading, saving, and corrupted data states. If the project gains dependencies or a build step, update `README.md`, this guide, and the agent instructions together.
