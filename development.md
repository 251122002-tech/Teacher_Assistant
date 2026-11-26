# Development Guide

## 1. Local Setup

The frontend uses React and Vite. The account API is a Node.js server that uses the built-in `node:sqlite` module, so it needs Node.js 22.13 or newer (tested with Node.js 26).

From the project root, install dependencies and start the development server:

```sh
npm install
npm run dev:api   # terminal 1: API on http://127.0.0.1:3001
npm run dev       # terminal 2: frontend on http://localhost:5173
```

Open the local URL printed by Vite. Vite forwards `/api` requests to the API server (see `vite.config.js`). The SQLite database is created at `data/teacher-assistant.db` on first start; delete that file to reset all accounts. Set `API_PORT` or `DATABASE_PATH` to override the defaults. Create a production build with `npm run build`, or serve the build locally with `npm run preview`.

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

Sets `frontend/` as the Vite root and proxies `/api` to the local API server.

### `shared/validation.js`

Default subject list, grade list, custom-subject rules, and registration/sign-in/lesson-request validation used by both the frontend and the server. Validators return error codes, not text.

### `shared/lessonTemplates.js`

Supported languages (`kk`, `ru`, `en`), subject names in each language, and the six lesson-stage templates used to build a plan.

### `server/index.js`

The API server: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`, `PUT /api/me/subject`, and `POST /api/lesson-plans` (builds the plan in the requested language and saves the subject). It hashes passwords with scrypt, keeps sessions in an HttpOnly cookie, and returns `{ error, fieldErrors }` with error codes on failures.

### `server/database.js`

Creates the SQLite tables from the ERD (`tblUser`, `tblDate`, `tblClass`) plus `tblSession`, and holds the prepared queries.

### `frontend/index.html`

Defines the page metadata and the React mount point; it loads the JSX entry through Vite.

### `frontend/styles.css`

Defines design tokens, typography, educational color contrast, responsive card-grid layout, form states, focus states, and the mobile breakpoint at 560px.

### `frontend/app.jsx`

Mounts the React application. `App` owns the language (shared through `LanguageContext`), checks the saved session, and shows either `AuthPage` (step 1: create account / sign in) or `PlannerPage` (step 2). `LanguageSwitcher` in the header changes the language. `SubjectPicker` offers the default subjects plus "Other", which reveals a text field. The planner saves default subjects immediately, validates subject, grade, and topic, requests the plan from the API, and rebuilds it when the language changes. Status messages are stored as `{ key, params }` so they re-render in the current language.

### `frontend/translations.js`

All interface text in Kazakh, Russian, and English, including field-error text for each error code. Every language must have the same keys.

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
- There is no password reset, email verification, account deletion, or rate limiting on sign-in attempts yet.
- A custom subject typed in the planner is saved only when a lesson plan is generated; leaving the page before that keeps the previous subject.
- `tblClass` exists to match the ERD but is not used by the app yet.
- The API server is for local development; production hosting (HTTPS, `Secure` cookies, serving the built frontend) is not set up.
- Lesson plans come from fixed templates, not from an AI model; only the topic, subject, and grade change between plans.
- Errors for malformed API requests (`invalidJson`, `notFound`, and similar) fall back to a generic translated message.
- There are no automated browser tests in the current project. The Vite production build is the automated frontend verification.

## 8. Extension Guidance

Future features should introduce only the smallest abstraction needed. If persistence is added, define its data contract and failure behavior first, then test loading, saving, and corrupted data states. If the project gains dependencies or a build step, update `README.md`, this guide, and the agent instructions together.
