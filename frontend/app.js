const fetchButton = document.querySelector('#fetch-btn');
const planForm = document.querySelector('#plan-form');
const subjectSelect = document.querySelector('#subject-select');
const topicInput = document.querySelector('#topic-input');
const statusMessage = document.querySelector('#status-message');
const cardGrid = document.querySelector('#card-grid');
const recordCount = document.querySelector('#record-count');

const lessonPlansEndpoint = 'https://jsonplaceholder.typicode.com/posts';

function createDetailRow(label, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';

  const labelElement = document.createElement('dt');
  labelElement.className = 'detail-label';
  labelElement.textContent = label;

  const valueElement = document.createElement('dd');
  valueElement.className = 'detail-value';
  valueElement.textContent = value;

  row.append(labelElement, valueElement);
  return row;
}

function createLessonPlanCard(plan, subject, topic) {
  const card = document.createElement('article');
  card.className = 'lesson-card';

  const name = document.createElement('h3');
  name.textContent = plan.title;

  const subjectLabel = document.createElement('p');
  subjectLabel.className = 'lesson-subject';
  subjectLabel.textContent = `${subject} | ${topic}`;

  const details = document.createElement('dl');
  details.className = 'lesson-details';
  details.append(
    createDetailRow('Target grade', plan.targetGrade),
    createDetailRow('Learning objectives', plan.objectives),
    createDetailRow('Duration', plan.duration),
    createDetailRow('Key activities', plan.activities)
  );

  card.append(name, subjectLabel, details);
  return card;
}

function renderLessonPlans(plans, subject, topic) {
  cardGrid.replaceChildren();
  plans.forEach((plan) => cardGrid.append(createLessonPlanCard(plan, subject, topic)));
  recordCount.textContent = `${plans.length} ${plans.length === 1 ? 'module' : 'modules'}`;
}

async function loadDashboardData() {
  const subject = subjectSelect.value;
  const topic = topicInput.value.trim();
  if (!topic) {
    statusMessage.textContent = 'Enter a topic before generating a lesson plan.';
    topicInput.focus();
    return;
  }

  fetchButton.disabled = true;
  fetchButton.textContent = 'Generating...';
  statusMessage.textContent = 'Building lesson plan modules...';

  try {
    const response = await fetch(lessonPlansEndpoint);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    const sourcePosts = await response.json();
    const plans = sourcePosts.slice(0, 6).map((post, index) => ({
      title: `${topic}: ${post.title}`,
      targetGrade: `Grade ${5 + (index % 4)}`,
      objectives: post.body,
      duration: `${35 + (index % 3) * 10} minutes`,
      activities: `Explore, discuss, and apply ${subject.toLowerCase()} concepts through a guided activity.`
    }));
    renderLessonPlans(plans, subject, topic);
    statusMessage.textContent = `Generated ${plans.length} lesson plan modules for ${topic}.`;
  } catch (error) {
    cardGrid.replaceChildren();
    recordCount.textContent = 'No plans generated';
    statusMessage.textContent = `Unable to generate the lesson plan. ${error.message}`;
  } finally {
    fetchButton.disabled = false;
    fetchButton.textContent = 'Generate Lesson Plan';
  }
}

planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadDashboardData();
});
