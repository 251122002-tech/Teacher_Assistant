# Agent Instructions

## Project Context

Teacher Assistant currently includes a React lesson-plan generator frontend built with Vite. The frontend entry point is `frontend/app.jsx`, the mount document is `frontend/index.html`, and presentation lives in `frontend/styles.css`. Supporting project documentation lives in `README.md`, `specifications.md`, and `development.md`.

## Source of Truth

Before making a change, read:

1. `my_project.cursorrules`
2. The source file that owns the requested behavior
3. `specifications.md` and `development.md` when requirements or workflow are affected

Treat explicit user requests as the task scope. Do not overwrite unrelated user changes.

## Implementation Rules

- Keep React UI and behavior in components, CSS presentation in `frontend/styles.css`, and `frontend/index.html` as the mount document.
- Use semantic HTML5 landmarks and native controls.
- Keep controls keyboard accessible with associated labels, logical order, and visible focus states.
- Validate every form value before changing state.
- Show helpful field-level errors and expose dynamic status through the existing live regions.
- Do not rely on color alone for errors, completion, or success.
- Use descriptive names; do not introduce one-letter variables.
- Prefer small focused functions and the existing React state model.
- Do not add dependencies without a clear requirement.
- Do not add inline `style` attributes.
- Keep comments concise and limited to non-obvious state changes or DOM interactions.
- Preserve the existing visual language unless the user asks for a redesign.

## Documentation Rules

- Update `specifications.md` when a requirement, state shape, validation rule, or acceptance criterion changes.
- Update `development.md` when setup, verification, architecture, or known limitations change.
- Update `README.md` when the project purpose, scope, quick start, or file map changes.
- Keep all documentation consistent with the actual implementation; do not document planned behavior as complete.

## Validation Rules

After every code edit:

1. Run `npm run build` when frontend code was touched.
2. Serve the project locally and check the changed behavior in a browser when interaction or layout was touched.
3. Check both a wide viewport around 1280px and a narrow viewport around 375px for UI changes.
4. Test empty topic validation, successful generation, and request-error feedback when the lesson-plan flow changes.
5. Review changed files for accidental formatting or unrelated modifications.

## Change Boundaries

Do not:

- Add authentication, a database, or persistence unless requested.
- Replace the React and Vite architecture without a documented reason.
- Remove accessibility attributes or live regions to simplify markup.
- Rename public files without updating every reference and documentation link.
- Fix unrelated bugs during a focused task.
- Commit changes or create branches unless explicitly requested.

## Completion Criteria

A change is complete when the requested behavior is implemented, relevant documentation is accurate, focused validation passes, and any remaining limitation is stated clearly to the user.
