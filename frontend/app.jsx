import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const lessonPlansEndpoint = 'https://jsonplaceholder.typicode.com/posts';

function LessonPlanCard({ plan, subject, topic }) {
  const details = [
    ['Target grade', plan.targetGrade],
    ['Learning objectives', plan.objectives],
    ['Duration', plan.duration],
    ['Key activities', plan.activities]
  ];

  return (
    <article className="lesson-card">
      <h3>{plan.title}</h3>
      <p className="lesson-subject">{subject} | {topic}</p>
      <dl className="lesson-details">
        {details.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <dt className="detail-label">{label}</dt>
            <dd className="detail-value">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function App() {
  const [subject, setSubject] = useState('Science');
  const [topic, setTopic] = useState('');
  const [plans, setPlans] = useState([]);
  const [generatedContext, setGeneratedContext] = useState({ subject: '', topic: '' });
  const [hasGenerated, setHasGenerated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Choose a subject and topic to begin.');
  const [isLoading, setIsLoading] = useState(false);
  const topicInputRef = useRef(null);
  const recordCount = hasGenerated
    ? `${plans.length} ${plans.length === 1 ? 'module' : 'modules'}`
    : 'No plans generated';

  async function loadDashboardData(event) {
    event.preventDefault();
    if (isLoading) return;

    const selectedTopic = topic.trim();
    if (!selectedTopic) {
      setStatusMessage('Enter a topic before generating a lesson plan.');
      topicInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setStatusMessage('Building lesson plan modules...');

    try {
      const response = await fetch(lessonPlansEndpoint);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      const sourcePosts = await response.json();
      const generatedPlans = sourcePosts.slice(0, 6).map((post, index) => ({
        id: post.id,
        title: `${selectedTopic}: ${post.title}`,
        targetGrade: `Grade ${5 + (index % 4)}`,
        objectives: post.body,
        duration: `${35 + (index % 3) * 10} minutes`,
        activities: `Explore, discuss, and apply ${subject.toLowerCase()} concepts through a guided activity.`
      }));

      setPlans(generatedPlans);
      setGeneratedContext({ subject, topic: selectedTopic });
      setHasGenerated(true);
      setStatusMessage(`Generated ${generatedPlans.length} lesson plan modules for ${selectedTopic}.`);
    } catch (error) {
      setPlans([]);
      setHasGenerated(false);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatusMessage(`Unable to generate the lesson plan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="page-shell header-content">
          <a className="brand" href="/" aria-label="Teacher Assistant home">
            <span className="brand-mark" aria-hidden="true">TA</span>
            <span>Teacher Assistant</span>
          </a>
          <button className="button button-primary" type="submit" form="plan-form" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Lesson Plan'}
          </button>
        </div>
      </header>

      <main className="page-shell page-content">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Plan with purpose</p>
          <h1 id="page-title">Build a lesson worth remembering.</h1>
          <p className="hero-copy">Choose a subject and topic to create a practical starting point for your next class.</p>
        </section>

        <section className="planner" aria-labelledby="planner-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lesson planning studio</p>
              <h2 id="planner-title">Generate a module</h2>
            </div>
            <p className="record-count">{recordCount}</p>
          </div>

          <form className="plan-form" id="plan-form" onSubmit={loadDashboardData}>
            <div className="field-group">
              <label htmlFor="subject-select">Subject</label>
              <select
                id="subject-select"
                name="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Language Arts">Language Arts</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Art">Art</option>
              </select>
            </div>
            <div className="field-group field-group-wide">
              <label htmlFor="topic-input">Topic</label>
              <input
                ref={topicInputRef}
                id="topic-input"
                name="topic"
                type="text"
                maxLength={80}
                placeholder="e.g. The water cycle"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
              />
            </div>
          </form>

          <div className="status-message" role="status" aria-live="polite">{statusMessage}</div>
          <div className="card-grid" aria-live="polite" aria-label="Generated lesson plans">
            {plans.map((plan) => (
              <LessonPlanCard
                key={plan.id}
                plan={plan}
                subject={generatedContext.subject}
                topic={generatedContext.topic}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
