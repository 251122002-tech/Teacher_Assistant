# Product Specifications

## 1. Document Control

- **Project:** Teacher Assistant
- **Current scope:** Teacher accounts and a lesson-plan generator prototype
- **Status:** Prototype
- **Primary artifact:** React web interface backed by a small Node.js API and SQLite database

## 2. Product Goal

Teacher Assistant aims to reduce teacher workload with educational planning and classroom tools. The current prototype demonstrates a lesson-plan generation workflow in Kazakh, Russian, and English; it does not yet provide a production curriculum-generation service.

## 3. Core Workflow

1. The user opens the app. A language switcher at the top offers Қазақ тілі, Русский язык, and English; choosing one translates the whole interface immediately.
2. A signed-out teacher sees only the account page (step 1) and either creates an account (first name, last name, email, password) or signs in with email and password.
3. After signing in, the teacher moves to the lesson-planner page (step 2). The subject list offers the default subjects plus "Other", which shows a text field for a custom subject. A previously saved subject is preselected.
4. The teacher selects a grade (1-11), enters a topic, and presses the generate button below the fields.
5. The API builds a six-stage lesson plan in the selected language and remembers the subject on the account.
6. The interface announces success or a request error. Switching the language after generation rebuilds the plan in the new language.

## 4. Functional Requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-01 | Display the lesson-plan generator. | The planner page shows the subject selector, grade selector, topic field, a submit control placed below the fields, status region, and generated-plan area. |
| FR-02 | Validate the topic. | A blank or whitespace-only topic does not start a request, shows a field-level error under the topic field, announces it in the status region, and moves focus to the topic field. |
| FR-03 | Limit topic length. | The topic field enforces a maximum length of 80 characters on the client and server. |
| FR-04 | Generate a lesson plan. | `POST /api/lesson-plans` returns six lesson stages (warm-up, new material, guided practice, group work, assessment, reflection; 45 minutes in total). Each stage shows a title, subject, topic, target grade, learning objectives, duration, and key activities. |
| FR-05 | Report request status. | The interface announces loading and successful generation through the status region. |
| FR-06 | Handle request failures. | A failed request clears stale generated stages and announces an error. |
| FR-07 | Validate the grade. | Grades 1 to 11 are offered. Submitting without a grade does not start a request, shows a field-level error under the grade selector, announces it, and moves focus to the selector. The error clears once a valid grade is chosen. |
| FR-08 | Create a teacher account. | Registration asks only for first name and last name (1-50 characters), a valid email (up to 120 characters, case-insensitive, unique), and a password of 8-128 characters. It does not ask for a subject. Invalid fields show field-level errors on the client and are rejected by the server with the same rules. A duplicate email shows an error on the email field. A successful registration signs the teacher in and records the join date in `tblDate`. |
| FR-09 | Sign in and sign out. | Signing in requires a registered email and the matching password; a wrong combination shows a general error without revealing which part was wrong. Sign-in lasts 7 days through an HttpOnly session cookie and survives page reloads. Sign Out ends the session on the server. |
| FR-10 | Remember the subject taught. | New accounts start with no subject, so the planner shows "Select subject". Choosing a default subject saves it to `tblUser.Subject` immediately. Generating a plan saves the subject it used, including a custom one. A saved custom subject appears as "Other" with its text filled in. |
| FR-11 | Validate subjects. | A subject is required to generate a plan. A custom subject is 2-50 characters, starts with a letter or digit, and may contain letters from any language, digits, spaces, and `. , ' & ( ) -`. Invalid subjects show a field-level error and block generation. |
| FR-12 | Separate account and planner pages. | Signed-out visitors see only the account page. After registration or sign-in the planner page opens. Sign Out returns to the account page. |
| FR-13 | Switch the site language. | The header offers Қазақ тілі, Русский язык, and English as buttons; the active one is marked with `aria-pressed`, a filled style, and an underline. Choosing a language immediately translates all labels, options, field errors, status messages, and page titles, sets `<html lang>`, and is remembered in the browser (`localStorage`). Without a saved choice, the browser language is used when supported, otherwise Kazakh. |
| FR-14 | Generate plans in the chosen language. | The plan request includes the language, and every stage's text, subject name, grade label, and duration are written in that language. The teacher's topic and custom subject stay as typed. Changing the language while a plan is shown rebuilds it in the new language. |

## 5. Non-Functional Requirements

### Accessibility

- Use semantic landmarks and native form controls.
- Associate visible labels with every account and planner control, and link field errors with `aria-describedby`.
- Keep controls keyboard reachable with visible focus states.
- Announce dynamic status using a live region.

### Responsive behavior

- Keep the page usable from 320px wide through desktop widths.
- Stack the form fields on narrow screens.
- Avoid horizontal page scrolling at mobile widths.

### Maintainability

- React components own UI rendering and in-memory state.
- Validation rules live in `shared/validation.js` and lesson-plan templates in `shared/lessonTemplates.js`; both are used by the frontend and the API server.
- Interface text lives in `frontend/translations.js`. The server returns error codes, and the frontend shows them in the chosen language.
- The API uses only Node.js built-ins (`node:http`, `node:sqlite`, `node:crypto`); no extra npm dependencies.
- CSS owns presentation; `frontend/index.html` provides the mount document.
- Use Vite for development and production builds.
- Keep the frontend free of inline styles and preserve the current visual language.

## 6. Current State and Data Limitations

- Accounts are stored in SQLite at `data/teacher-assistant.db` (ignored by git). Tables follow the project ERD: `tblUser` (UserID, FName, LName, Subject, plus Email and PasswordHash added for sign-in), `tblDate` (UserID, Year, Month, Day: the date the account was created), and `tblClass` (UserID, ClassID, ClassName: created to match the ERD but not used yet). `tblSession` (Token, UserID, ExpiresAt) is an addition that keeps teachers signed in.
- Passwords are stored as salted scrypt hashes, never as plain text.
- The frontend tracks the language, signed-in user, subject, grade, topic, field errors, generated stages, loading state, and status feedback in React state.
- Lesson plans are filled from fixed templates in each language. They are a structured starting point, not verified curriculum content or AI-generated lesson plans.
- Generated lesson plans are in memory and reset on page refresh; only the account and its subject are saved.

## 7. Acceptance Checklist

- [ ] The app builds with `npm run build`.
- [ ] An empty or whitespace-only topic is rejected before the request.
- [ ] A missing grade is rejected before the request with a field-level error.
- [ ] Registration rejects invalid fields and duplicate emails with field-level errors.
- [ ] A registered teacher can sign out and sign back in.
- [ ] Registration does not ask for a subject.
- [ ] A changed subject is still selected after a page reload or a new sign-in.
- [ ] Choosing "Other" shows a text field; a valid custom subject is saved and shown on reload, and an invalid one shows an error.
- [ ] Signed-out visitors cannot see the planner.
- [ ] Grades 1 to 11 are offered.
- [ ] A valid subject, grade, and topic generate six stages with all required fields.
- [ ] Switching between Қазақ тілі, Русский язык, and English translates the interface and the generated plan immediately, and the choice is kept after reload.
- [ ] Request failure clears modules and displays an accessible error status.
- [ ] The page has no horizontal overflow at 1280px and 375px viewport widths.
