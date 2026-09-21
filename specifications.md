# Product Specifications

## 1. Document Control

- **Project:** Daily Focus
- **Course deliverable:** PED 741 - Deliverable 1
- **Version:** 1.0
- **Status:** Baseline specification
- **Primary artifact:** Static daily task board

## 2. Product Goal

Daily Focus helps a user capture and manage a small list of daily tasks with minimal distraction. The first deliverable prioritizes a clear workflow, predictable interaction, accessibility, and a clean separation between structure, presentation, and behavior.

## 3. User and Core Scenario

### Primary user

A person who wants a lightweight, private, single-session list of daily actions without account setup or configuration overhead.

### Core scenario

1. The user opens the page and sees today's date and an empty task state.
2. The user enters a task and submits the form.
3. The task appears in the list and the task count updates.
4. The user marks the task complete, filters the list, or removes it.
5. The interface announces the result and keeps the next action obvious.

## 4. Functional Requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-01 | Display the daily task workspace. | The page shows a heading, task form, filters, task list, status area, and footer. |
| FR-02 | Add a task. | A valid submission creates one active task with the trimmed title. |
| FR-03 | Validate task input. | Empty input and input shorter than three characters are rejected before state changes. |
| FR-04 | Explain validation errors. | The error appears beside the field, the field receives `aria-invalid`, and focus returns to the input. |
| FR-05 | Complete or reopen a task. | A checkbox changes the task's completed state and the rendered style/count update. |
| FR-06 | Filter tasks. | All, Active, and Completed controls show only their corresponding tasks. |
| FR-07 | Delete a task. | The selected task is removed and a status message identifies the action. |
| FR-08 | Clear completed tasks. | All completed tasks are removed; when none exist, the interface reports that no tasks were cleared. |
| FR-09 | Show counts. | The task count and completed count reflect current in-memory state. |
| FR-10 | Announce dynamic changes. | Add, complete, reopen, delete, and clear actions update a live status region. |
| FR-11 | Handle an empty view. | The empty-state message is visible when the active filter has no visible tasks. |
| FR-12 | Display the current date. | The header renders the current weekday, month, and day using the browser locale formatter. |

## 5. Non-Functional Requirements

### Accessibility

- Use semantic landmarks including `header`, `main`, `section`, `form`, and `footer`.
- Associate the task input with a visible `label`.
- Keep controls keyboard reachable in logical document order.
- Provide visible `:focus-visible` styling.
- Use native controls before adding ARIA.
- Use `aria-live`, `role="status"`, and `role="alert"` only for dynamic feedback that needs announcement.
- Never communicate an error or success state with color alone.

### Responsive behavior

- The content must remain readable on narrow screens beginning at 320px.
- The desktop layout must use the available space without becoming difficult to scan.
- At narrow widths, the task input and submit button stack vertically.
- Filters and secondary actions must remain reachable without horizontal scrolling.

### Maintainability

- HTML owns structure, CSS owns presentation, and JavaScript owns behavior/state.
- Use descriptive names and small focused functions.
- Keep the implementation dependency-free for Deliverable 1.
- Avoid unrelated refactors and inline styles/scripts.

### Performance and compatibility

- Load only local project assets.
- Defer the external JavaScript file.
- Use modern browser APIs supported by current evergreen browsers, including `crypto.randomUUID()` and `Intl.DateTimeFormat`.

## 6. State Model

Each task has the following shape:

```text
{
  id: string,
  title: string,
  completed: boolean
}
```

The application state contains:

- `tasks`: the current array of task objects.
- `activeFilter`: `all`, `active`, or `completed`.

State is held in memory only. A page refresh resets the list by design.

## 7. Validation Rules

| Input | Rule | User feedback |
| --- | --- | --- |
| Task title | Must contain non-whitespace text. | `Enter a task before adding it.` |
| Task title | Must contain at least three characters after trimming. | `Use at least 3 characters so the task is clear.` |
| Task title | Maximum length is 80 characters. | Enforced by the HTML `maxlength` attribute. |

Validation runs before `tasks` changes. When the user edits an invalid value, the validation message is recalculated and cleared once the value is valid.

## 8. Acceptance Checklist

- [ ] A valid task can be added.
- [ ] Invalid task input cannot change state.
- [ ] A task can be completed and reopened.
- [ ] Each filter returns the correct subset.
- [ ] Individual deletion works.
- [ ] Clearing completed tasks works.
- [ ] Counts and live status messages update after every state change.
- [ ] Keyboard focus is visible and controls have accessible names.
- [ ] Layout is usable at both 1280px and 375px viewport widths.
- [ ] `node --check app.js` passes.
