# Product Specifications

## 1. Document Control

- **Project:** Teacher Assistant
- **Current frontend scope:** Lesson-plan generator prototype
- **Status:** Prototype
- **Primary artifact:** React web interface for generating sample lesson-plan modules

## 2. Product Goal

Teacher Assistant aims to reduce teacher workload with educational planning and classroom tools. The current frontend prototype demonstrates a lesson-plan generation workflow; it does not yet provide a production curriculum-generation service.

## 3. Core Workflow

1. The user opens the lesson-plan generator.
2. The user selects a subject and enters a topic.
3. The user submits the form and sees loading feedback.
4. The frontend requests sample post content from JSONPlaceholder and presents up to six entries as lesson-plan modules.
5. The interface announces success or a request error.

## 4. Functional Requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-01 | Display the lesson-plan generator. | The page shows the subject selector, topic field, submit control, status region, and generated-module area. |
| FR-02 | Validate the topic. | A blank or whitespace-only topic does not start a request and receives helpful status feedback. |
| FR-03 | Limit topic length. | The topic field enforces a maximum length of 80 characters. |
| FR-04 | Generate sample modules. | A successful response renders up to six modules with title, subject, target grade, learning objectives, duration, and activity. |
| FR-05 | Report request status. | The interface announces loading and successful generation through the status region. |
| FR-06 | Handle request failures. | A failed request clears stale generated modules and announces an error. |

## 5. Non-Functional Requirements

### Accessibility

- Use semantic landmarks and native form controls.
- Associate visible labels with the subject and topic controls.
- Keep controls keyboard reachable with visible focus states.
- Announce dynamic status using a live region.

### Responsive behavior

- Keep the page usable from 320px wide through desktop widths.
- Stack the form fields on narrow screens.
- Avoid horizontal page scrolling at mobile widths.

### Maintainability

- React components own UI rendering and in-memory state.
- CSS owns presentation; `frontend/index.html` provides the mount document.
- Use Vite for development and production builds.
- Keep the frontend free of inline styles and preserve the current visual language.

## 6. Current State and Data Limitations

- The frontend tracks selected subject, topic, generated sample modules, loading state, and status feedback in React state.
- Module objectives come from JSONPlaceholder post bodies. The returned content is sample placeholder data, not verified curriculum content or AI-generated lesson plans.
- Generation requires network access to `https://jsonplaceholder.typicode.com/posts`.
- State is in memory and resets on page refresh.

## 7. Acceptance Checklist

- [ ] The app builds with `npm run build`.
- [ ] An empty or whitespace-only topic is rejected before the request.
- [ ] A valid topic can generate up to six modules when the sample service is available.
- [ ] Generated modules show all required fields.
- [ ] Request failure clears modules and displays an accessible error status.
- [ ] The page has no horizontal overflow at 1280px and 375px viewport widths.
