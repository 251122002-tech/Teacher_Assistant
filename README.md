Name_project: Teacher_Assistant(working title)
Student: Shattyk Rahmetolla, Assel Sergazy
# 👩‍🏫 Teacher Assistant

**Teacher Assistant** is an all-in-one educational web platform designed to reduce teacher workload by providing automated short-term lesson planning (ҚМЖ), presentation tools, worksheet generators, and interactive learning games (Quizzes, Flashcards, Matching games).

### 🎯 Key Features
- **Lesson Plan Builder (ҚМЖ):** Automated short-term lesson plan generation with custom descriptors.
- **Presentation Builder:** Interactive, ready-to-use classroom presentation slides.
- **Assignment & Quiz Engine:** Differentiated worksheets and multi-choice quizzes.
- **Edu-Games Suite:** Gamified review tools including Flashcards, Quiz Arena, and Pair Matching.

### Frontend development

The current app has teacher accounts (sign up, sign in, saved subject), a lesson-plan generator, and a Kazakh / Russian / English interface that also sets the language of the generated plan. The frontend uses React and Vite; the account API is a small Node.js server with a SQLite database (Node.js 22.13+). From the project root:

```sh
npm install
npm run dev:api   # terminal 1: account API
npm run dev       # terminal 2: frontend at http://localhost:5173
```

Create a production build with `npm run build`. See [development.md](./development.md) for the project structure and verification steps.
