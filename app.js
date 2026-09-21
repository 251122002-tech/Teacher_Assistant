const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskError = document.querySelector('#task-error');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const statusMessage = document.querySelector('#status-message');
const taskCount = document.querySelector('#task-count');
const completedCount = document.querySelector('#completed-count');
const todayLabel = document.querySelector('#today-label');
const clearCompletedButton = document.querySelector('#clear-completed');
const filterButtons = document.querySelectorAll('[data-filter]');

let tasks = [];
let activeFilter = 'all';

function formatToday() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function showStatus(message) {
  statusMessage.textContent = message;
}

function validateTask(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return 'Enter a task before adding it.';
  if (trimmedValue.length < 3) return 'Use at least 3 characters so the task is clear.';
  return '';
}

function updateValidation(message = '') {
  taskError.textContent = message;
  taskInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  taskInput.setAttribute('aria-describedby', message ? 'task-hint task-error' : 'task-hint');
}

function visibleTasks() {
  if (activeFilter === 'active') return tasks.filter((task) => !task.completed);
  if (activeFilter === 'completed') return tasks.filter((task) => task.completed);
  return tasks;
}

function renderTasks() {
  const filteredTasks = visibleTasks();
  taskList.replaceChildren();

  filteredTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'task-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.id = `task-${task.id}`;
    checkbox.setAttribute('aria-label', `Mark ${task.title} as ${task.completed ? 'active' : 'completed'}`);

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = task.title;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.deleteId = task.id;
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${task.title}`);

    item.append(checkbox, label, deleteButton);
    taskList.append(item);
  });

  const completedTasks = tasks.filter((task) => task.completed).length;
  const taskWord = tasks.length === 1 ? 'task' : 'tasks';
  taskCount.textContent = `${tasks.length} ${taskWord}`;
  completedCount.textContent = completedTasks;
  emptyState.hidden = filteredTasks.length > 0;
}

function addTask(title) {
  tasks.push({ id: crypto.randomUUID(), title: title.trim(), completed: false });
  renderTasks();
  showStatus(`Added: ${title.trim()}`);
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const validationMessage = validateTask(taskInput.value);
  updateValidation(validationMessage);
  if (validationMessage) {
    taskInput.focus();
    return;
  }

  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

taskInput.addEventListener('input', () => {
  if (taskError.textContent) updateValidation(validateTask(taskInput.value));
});

taskList.addEventListener('change', (event) => {
  if (!event.target.matches('.task-checkbox')) return;
  const taskItem = event.target.closest('.task-item');
  const task = tasks.find((item) => item.id === taskItem.dataset.taskId);
  if (!task) return;

  task.completed = event.target.checked;
  renderTasks();
  showStatus(task.completed ? `Completed: ${task.title}` : `Reopened: ${task.title}`);
});

taskList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');
  if (!deleteButton) return;
  const deletedTask = tasks.find((task) => task.id === deleteButton.dataset.deleteId);
  tasks = tasks.filter((task) => task.id !== deleteButton.dataset.deleteId);
  renderTasks();
  showStatus(`Deleted: ${deletedTask.title}`);
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', () => {
  const completedTasks = tasks.filter((task) => task.completed).length;
  tasks = tasks.filter((task) => !task.completed);
  renderTasks();
  showStatus(completedTasks ? `Cleared ${completedTasks} completed ${completedTasks === 1 ? 'task' : 'tasks'}.` : 'There are no completed tasks to clear.');
});

todayLabel.textContent = formatToday();
updateValidation();
renderTasks();
