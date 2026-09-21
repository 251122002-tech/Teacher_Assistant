# Development Guide

## 1. Local Setup

The project is a dependency-free static web application. No package installation is required for the current deliverable.

### Open directly

Open `index.html` in a modern browser.

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

### `index.html`

Defines the document metadata, header/date area, introductory copy, task form, filter controls, task list, status regions, and footer. It loads the stylesheet and deferred JavaScript externally.

### `styles.css`

Defines design tokens, typography, color contrast, layout, form states, task states, focus states, and the mobile breakpoint at 560px.

### `app.js`

Owns the task array and active filter. It validates input, handles form and task events, filters visible tasks, renders list items, updates counts, and writes status messages.

## 4. Verification Commands

Run the narrow syntax check after JavaScript changes:

```powershell
node --check app.js
```

Check the expected files and links:

```powershell
Get-ChildItem -File
Select-String -Path index.html -Pattern 'styles.css|app.js'
```

## 5. Manual Test Pass

1. Load the page at a desktop width.
2. Submit an empty task and confirm the error appears and focus returns to the input.
3. Submit one- and two-character values and confirm they are rejected.
4. Add two valid tasks and confirm the count updates.
5. Complete one task and confirm the completed count and visual state update.
6. Use All, Active, and Completed filters.
7. Delete one task.
8. Add and complete another task, then use Clear completed.
9. Repeat the pass at a narrow mobile width.
10. Navigate through the controls with the keyboard and confirm visible focus.

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
