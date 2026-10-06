# Development Guide

## 1. Local Setup

The frontend uses React and Vite and requires Node.js and npm.

From the project root, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`, or serve the build locally with `npm run preview`.

## 2. Development Principles

- Use React components for interface structure and state, CSS for presentation, and HTML for the mount document.
- Prefer native HTML semantics over custom interaction patterns.
- Validate user input before modifying application state.
- Keep state changes in small, named functions.
- Render generated lesson-plan cards from React state rather than manually patching the DOM.
- Preserve keyboard access, visible focus, and live feedback with every UI change.
- Use ASCII by default and keep comments limited to non-obvious state or DOM interactions.

## 3. Implementation Map

### `frontend/index.html`

Defines the page metadata and the React mount point; it loads the JSX entry through Vite.

### `frontend/styles.css`

Defines design tokens, typography, educational color contrast, responsive card-grid layout, form states, focus states, and the mobile breakpoint at 560px.

### `frontend/app.jsx`

Mounts the React application. The app owns subject/topic form state, validates the topic, fetches source content, maps it into lesson-plan modules, and renders cards and status updates.

## 4. Verification Commands

Build the frontend after changes:

```sh
npm run build
```

Start the development server for interactive browser checks:

```sh
npm run dev
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

- Generated plans are held in memory and are cleared on page refresh.
- Lesson-plan source content is fetched from JSONPlaceholder, so generation requires network access.
- There is no backend, authentication, or cross-device synchronization.
- There are no automated browser tests in the current project. The Vite production build is the automated frontend verification.
- The UI text is currently English while the project documentation can be extended for localization later.

## 8. Extension Guidance

Future features should introduce only the smallest abstraction needed. If persistence is added, define its data contract and failure behavior first, then test loading, saving, and corrupted data states. If the project gains dependencies or a build step, update `README.md`, this guide, and the agent instructions together.
