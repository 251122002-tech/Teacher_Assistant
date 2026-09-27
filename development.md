# Development Guide

## 1. Local Setup

The project is a dependency-free static web application. No package installation is required for the current deliverable.

### Open directly

Open `frontend/index.html` in a modern browser.

### Run a local server

From the project directory, run one of the following commands:

```powershell
python -m http.server 8765
```

Or, when Node.js is available:

```powershell
npx serve .
```

Open the URL printed by the server. Serving the directory is preferred when browser security rules prevent local `file:` resources from loading.

## 2. Development Principles

- Keep the three application layers separate: HTML, CSS, and JavaScript.
- Prefer native HTML semantics over custom interaction patterns.
- Validate user input before modifying application state.
- Keep state changes in small, named functions.
- Render the visible task list from state rather than manually patching unrelated elements.
- Preserve keyboard access, visible focus, and live feedback with every UI change.
- Use ASCII by default and keep comments limited to non-obvious state or DOM interactions.

## 3. Implementation Map

### `frontend/index.html`

Defines the Teacher Assistant metadata, subject and topic controls, lesson-plan status region, and generated card container. It loads the stylesheet and deferred JavaScript externally.

### `frontend/styles.css`

Defines design tokens, typography, educational color contrast, responsive card-grid layout, form states, focus states, and the mobile breakpoint at 560px.

### `frontend/app.js`

Owns the lesson-plan request flow. It validates the topic, fetches source content, maps it into lesson-plan modules, renders cards with `createElement()` and `textContent`, and reports loading or error status.

## 4. Verification Commands

Run the narrow syntax check after JavaScript changes:

```powershell
node --check frontend/app.js
```

Check the expected frontend files and links:

```powershell
Get-ChildItem frontend -File
Select-String -Path frontend/index.html -Pattern 'styles.css|app.js'
```

## 5. Manual Test Pass

1. Load the page at a desktop width.
2. Submit with an empty topic and confirm the helpful message appears and focus returns to the topic input.
3. Select a subject, enter a topic, and generate the lesson plan.
4. Confirm the generated cards include target grade, learning objectives, duration, and key activities.
5. Confirm the status message and module count update.
6. Repeat the pass at a narrow mobile width.
7. Navigate through the controls with the keyboard and confirm visible focus.

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

- Tasks are not persisted across page refreshes.
- There is no backend, authentication, or cross-device synchronization.
- There are no automated browser tests in the current project.
- The UI text is currently English while the project documentation can be extended for localization later.

## 8. Extension Guidance

Future features should introduce only the smallest abstraction needed. If persistence is added, define its data contract and failure behavior first, then test loading, saving, and corrupted data states. If the project gains dependencies or a build step, update `README.md`, this guide, and the agent instructions together.
