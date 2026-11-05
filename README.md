Name_project: Teacher_Assistant(working title)
Student: Shattyk Rahmetolla, Assel Sergazy
# 👩‍🏫 Teacher Assistant

**Teacher Assistant** is an all-in-one educational web platform designed to reduce teacher workload by providing automated short-term lesson planning (ҚМЖ), presentation tools, worksheet generators, and interactive learning games (Quizzes, Flashcards, Matching games).

### 🎯 Key Features
- **Lesson Plan Builder (ҚМЖ):** Automated short-term lesson plan generation with custom descriptors.
- **Presentation Builder:** Interactive, ready-to-use classroom presentation slides.
- **Assignment & Quiz Engine:** Differentiated worksheets and multi-choice quizzes.
- **Edu-Games Suite:** Gamified review tools including Flashcards, Quiz Arena, and Pair Matching.

### 📍 Жобаның қазіргі күйі (v0.2.0)

| Кезең | Күйі |
| --- | --- |
| Deliverable 1: React + Vite frontend (ҚМЖ генераторының прототипі) | ✅ Дайын |
| **Deliverable 2: ERD, реляциялық схема және архитектуралық негіздеме** | ✅ **Дайын, осы релиз** |
| Backend API және frontend-ті дерекқорға қосу | ⏳ Келесі кезең |
| Презентация, жұмыс парағы, оқушы аккаунттары | 🗓 Жоспарда |

**v0.2.0 нұсқасында не жасалды:**
- 14 кестеден тұратын PostgreSQL 16 схемасы: мұғалімдер, пәндер, сыныптар, оқу мақсаттары, ҚМЖ және оның кезеңдері, сабақ кестесі, викториналар, флэш-карталар ([prisma/schema.prisma](./prisma/schema.prisma)).
- Crow's Foot нотациясындағы ERD: [docs/erd.pdf](./docs/erd.pdf).
- Әр бағанның типі мен шектеулері, байланыстар, 3NF, CASCADE/RESTRICT/SET NULL ережелері, индекстер және SQL пен NoSQL салыстыруы: [docs/database-schema.md](./docs/database-schema.md).
- CHECK шектеулері бар SQL миграциясы және сынақ деректері (`prisma/migrations/`, `prisma/seed.sql`).
- Алғашқы 3 кестелік ERD нормализацияланып, жаңа схемаға ауыстырылды. Ескі нұсқа [docs/legacy/](./docs/legacy/) папкасында сақталған.

**Шектеу:** frontend әлі дерекқорға қосылмаған, сондықтан генерацияланған жоспарлар тек браузер жадында тұрады.

### Frontend development

The current lesson-plan generator frontend uses React and Vite. From the project root, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. See [development.md](./development.md) for the frontend structure and verification steps.

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

The frontend is not connected to the database yet. Lesson plans generated in the browser are still kept in memory only.

### Repository map

| Path | Purpose |
| --- | --- |
| `frontend/` | React + Vite lesson-plan generator (`app.jsx`, `index.html`, `styles.css`) |
| `docs/erd.pdf`, `docs/erd.png`, `docs/erd.svg` | Crow's Foot ERD |
| `docs/database-schema.md` | Entity tables, relationships, 3NF and indexing justification |
| `docs/legacy/erd-v0.1.jpg` | First ERD draft, kept for the normalization write-up |
| `prisma/schema.prisma` | Executable Prisma schema |
| `prisma/migrations/` | SQL migration including CHECK constraints |
| `prisma/seed.sql` | Fictional sample data |
| `specifications.md`, `development.md` | Product requirements and developer guide |
