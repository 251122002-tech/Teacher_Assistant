Name_project: Teacher_Assistant(working title)
Student: Shattyk Rahmetolla, Assel Sergazy
# 👩‍🏫 Teacher Assistant

**Teacher Assistant** is an all-in-one educational web platform designed to reduce teacher workload by providing automated short-term lesson planning (ҚМЖ), presentation tools, worksheet generators, and interactive learning games (Quizzes, Flashcards, Matching games).

### 🎯 Key Features
- **Lesson Plan Builder (ҚМЖ):** Automated short-term lesson plan generation with custom descriptors.
- **Presentation Builder:** Interactive, ready-to-use classroom presentation slides.
- **Assignment & Quiz Engine:** Differentiated worksheets and multi-choice quizzes.
- **Edu-Games Suite:** Gamified review tools including Flashcards, Quiz Arena, and Pair Matching.

### 📍 Жобаның қазіргі күйі (v0.3.0)

| Кезең | Күйі |
| --- | --- |
| Deliverable 1: React + Vite frontend (ҚМЖ генераторының прототипі) | ✅ Дайын |
| Deliverable 2: ERD, реляциялық схема және архитектуралық негіздеме (v0.2.0) | ✅ Дайын |
| **Deliverable 3: SRS and UML (v0.3.0)**: талаптар, персоналар, use case, activity, state machine, CRC, class, sequence диаграммалары | ✅ **Дайын, осы нұсқа** |
| Backend API, аутентификация және frontend-ті дерекқорға қосу | ⏳ Келесі кезең (талаптарда "Planned (v0.3+)" деп белгіленген) |
| Презентация, жұмыс парағы, оқушы аккаунттары | 🗓 Жоспарда |

**v0.3.0 нұсқасында не жасалды (тек құжаттама):**
- [docs/specifications.md](./docs/specifications.md): мәселе мен шешім кеңістігі, 3 персона, MoSCoW басымдығы мен статусы бар FR-01…FR-20, сандық NFR-лар, трассалау матрицасы.
- [docs/diagrams/](./docs/diagrams/): Mermaid форматындағы UML диаграммалары (GitHub-та тікелей көрсетіледі). Әр элемент "Implemented" немесе "Planned (v0.3+)" деп белгіленген.

**v0.2.0 нұсқасында не жасалды:**
- 14 кестеден тұратын PostgreSQL 16 схемасы: мұғалімдер, пәндер, сыныптар, оқу мақсаттары, ҚМЖ және оның кезеңдері, сабақ кестесі, викториналар, флэш-карталар ([prisma/schema.prisma](./prisma/schema.prisma)).
- Crow's Foot нотациясындағы ERD: [docs/erd.pdf](./docs/erd.pdf).
- Әр бағанның типі мен шектеулері, байланыстар, 3NF, CASCADE/RESTRICT/SET NULL ережелері, индекстер және SQL пен NoSQL салыстыруы: [docs/database-schema.md](./docs/database-schema.md).
- CHECK шектеулері бар SQL миграциясы және сынақ деректері (`prisma/migrations/`, `prisma/seed.sql`).
- Алғашқы 3 кестелік ERD нормализацияланып, жаңа схемаға ауыстырылды. Ескі нұсқа [docs/legacy/](./docs/legacy/) папкасында сақталған.

**Шектеу:** frontend әлі дерекқорға қосылмаған, сондықтан генерацияланған жоспарлар тек браузер жадында тұрады.

### Frontend development

The current app has teacher accounts (sign up, sign in, saved subject), a lesson-plan generator, and a Kazakh / Russian / English interface that also sets the language of the generated plan. The frontend uses React and Vite; the account API is a small Node.js server with a SQLite database (Node.js 22.13+). From the project root:

```sh
npm install
npm run dev:api   # terminal 1: account API
npm run dev       # terminal 2: frontend at http://localhost:5173
```

Create a production build with `npm run build`. See [development.md](./development.md) for the project structure and verification steps.

### Database setup

The relational design (Deliverable 2, release `v0.2.0`) targets **PostgreSQL 16** through the **Prisma** ORM. The ERD, entity tables, cardinality rules and design justification are in [docs/database-schema.md](./docs/database-schema.md).

1. Install and start PostgreSQL 16, then create a database. For example, with Docker:

   ```sh
   docker run --name teacher-assistant-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=teacher_assistant -p 5432:5432 -d postgres:16
   ```

2. Copy `.env.example` to `.env` and adjust `DATABASE_URL` if needed.
3. Install dependencies and apply the schema:

   ```sh
   npm install
   npm run db:validate   # check prisma/schema.prisma
   npm run db:migrate    # create tables, indexes, foreign keys and CHECK constraints
   npm run db:seed       # load fictional sample data from prisma/seed.sql
   ```

The running app does not use this PostgreSQL database yet. Teacher accounts are served by the Node.js API in `server/`, which keeps its own SQLite file in `data/` (created on first start). Generated lesson plans are kept in memory only.

### Repository map

| Path | Purpose |
| --- | --- |
| `frontend/` | React + Vite lesson-plan generator (`app.jsx`, `index.html`, `styles.css`, `translations.js` for Kazakh/Russian/English text) |
| `server/` | Node.js account and lesson-plan API (`index.js`) with its SQLite schema (`database.js`) |
| `shared/` | Validation rules and lesson-plan templates used by both the frontend and the API |
| `vite.config.js` | Vite root and `/api` proxy to the local API server |
| `docs/erd.pdf`, `docs/erd.png`, `docs/erd.svg` | Crow's Foot ERD |
| `docs/database-schema.md` | Entity tables, relationships, 3NF and indexing justification |
| `docs/legacy/erd-v0.1.jpg` | First ERD draft, kept for the normalization write-up |
| `prisma/schema.prisma` | Executable Prisma schema |
| `prisma/migrations/` | SQL migration including CHECK constraints |
| `prisma/seed.sql` | Fictional sample data |
| `docs/specifications.md` | Software requirements specification: problem/solution space, personas, FRs, NFRs, traceability |
| `docs/diagrams/behavioral/` | Use case (`use-case.md`), activity (`activity.md`) and state machine (`state-machine.md`) diagrams |
| `docs/diagrams/structural/` | CRC cards (`crc-cards.md`), class diagram (`class-diagram.md`) and sequence diagrams (`sequence.md`) |
| `development.md` | Developer guide |
