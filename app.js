const arraySizeInput = document.querySelector('#arraySize');
const arraySizeValue = document.querySelector('#arraySizeValue');
const algorithmSelect = document.querySelector('#algorithmSelect');
const generateBtn = document.querySelector('#generateBtn');
const startBtn = document.querySelector('#startBtn');
const stepBtn = document.querySelector('#stepBtn');
const pauseBtn = document.querySelector('#pauseBtn');
const arrayContainer = document.querySelector('#arrayContainer');
const statusMessage = document.querySelector('#statusMessage');

const state = {
  array: [],
  steps: [],
  currentStep: 0,
  playing: false,
  intervalId: null,
  activeIndices: [],
  sortedIndices: []
};

const SPEED_MS = 220;

function setStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.dataset.type = type;
}

function validateSize(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 5 || parsedValue > 40) {
    throw new Error('Array size must be a whole number between 5 and 40.');
  }

  return parsedValue;
}

function updateSizeLabel() {
  const size = validateSize(arraySizeInput.value);
  arraySizeValue.textContent = String(size);
  return size;
}

function randomValue(min = 10, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomArray(size) {
  return Array.from({ length: size }, () => randomValue(10, 100));
}

function renderBars() {
  const maxValue = Math.max(...state.array, 100);
  arrayContainer.innerHTML = '';

  if (!state.array.length) {
    return;
  }

  state.array.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.className = 'bar';

    if (state.activeIndices.includes(index)) {
      bar.classList.add('active');
    }

    if (state.sortedIndices.includes(index)) {
      bar.classList.add('sorted');
    }

    const normalizedHeight = (value / maxValue) * 100;
    bar.style.height = `${normalizedHeight}%`;
    bar.title = `Value: ${value}`;

    const label = document.createElement('span');
    label.className = 'bar-value';
    label.textContent = value;

    bar.appendChild(label);
    arrayContainer.appendChild(bar);
  });
}

function buildBubbleSortSteps(values) {
  const workingArray = [...values];
  const steps = [];
  const sortedIndices = [];

  for (let i = 0; i < workingArray.length; i += 1) {
    for (let j = 0; j < workingArray.length - i - 1; j += 1) {
      steps.push({
        array: [...workingArray],
        activeIndices: [j, j + 1],
        sortedIndices: [...sortedIndices]
      });

      if (workingArray[j] > workingArray[j + 1]) {
        [workingArray[j], workingArray[j + 1]] = [workingArray[j + 1], workingArray[j]];

        steps.push({
          array: [...workingArray],
          activeIndices: [j, j + 1],
          sortedIndices: [...sortedIndices]
        });
      }
    }

    sortedIndices.push(workingArray.length - 1 - i);
    steps.push({
      array: [...workingArray],
      activeIndices: [],
      sortedIndices: [...sortedIndices]
    });
  }

  return steps;
}

function buildSelectionSortSteps(values) {
  const workingArray = [...values];
  const steps = [];

  for (let i = 0; i < workingArray.length - 1; i += 1) {
    let minIndex = i;

    for (let j = i + 1; j < workingArray.length; j += 1) {
      steps.push({
        array: [...workingArray],
        activeIndices: [minIndex, j],
        sortedIndices: Array.from({ length: i }, (_, index) => index)
      });

      if (workingArray[j] < workingArray[minIndex]) {
        minIndex = j;

        steps.push({
          array: [...workingArray],
          activeIndices: [minIndex, j],
          sortedIndices: Array.from({ length: i }, (_, index) => index)
        });
      }
    }

    if (minIndex !== i) {
      [workingArray[i], workingArray[minIndex]] = [workingArray[minIndex], workingArray[i]];
      steps.push({
        array: [...workingArray],
        activeIndices: [i, minIndex],
        sortedIndices: Array.from({ length: i + 1 }, (_, index) => index)
      });
    } else {
      steps.push({
        array: [...workingArray],
        activeIndices: [i],
        sortedIndices: Array.from({ length: i + 1 }, (_, index) => index)
      });
    }
  }

  steps.push({
    array: [...workingArray],
    activeIndices: [],
    sortedIndices: Array.from({ length: workingArray.length }, (_, index) => index)
  });

  return steps;
}

function buildStepsForSelectedAlgorithm(values) {
  const algorithmName = algorithmSelect.value;

  if (algorithmName === 'selection') {
    return buildSelectionSortSteps(values);
  }

  return buildBubbleSortSteps(values);
}

function resetPlaybackState() {
  state.currentStep = 0;
  state.steps = [];
  state.activeIndices = [];
  state.sortedIndices = [];
  state.array = [];

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.playing = false;
}

function generateNumbers() {
  try {
    const size = updateSizeLabel();
    const values = generateRandomArray(size);

    resetPlaybackState();
    state.array = values;
    state.steps = buildStepsForSelectedAlgorithm(values);
    state.currentStep = 0;
    state.activeIndices = [];
    state.sortedIndices = [];

    renderBars();
    setStatus('New array generated. Press Start or Step to begin the visualizer.', 'info');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function applyStep(step) {
  state.array = [...step.array];
  state.activeIndices = [...step.activeIndices];
  state.sortedIndices = [...step.sortedIndices];
  renderBars();
}

function showNextStep() {
  if (!state.steps.length) {
    pausePlayback();
    setStatus('Generate a list before starting the visualization.', 'warning');
    return;
  }

  if (state.currentStep >= state.steps.length) {
    pausePlayback();
    setStatus('Sorting complete. The array is now in order.', 'success');
    return;
  }

  const nextStep = state.steps[state.currentStep];
  state.currentStep += 1;
  applyStep(nextStep);

  if (state.currentStep >= state.steps.length) {
    pausePlayback();
    setStatus('Sorting complete. The array is now in order.', 'success');
  }
}

function startPlayback() {
  try {
    const size = validateSize(arraySizeInput.value);

    if (!state.array.length || state.array.length !== size) {
      state.array = generateRandomArray(size);
    }

    if (!state.steps.length) {
      state.steps = buildStepsForSelectedAlgorithm(state.array);
      state.currentStep = 0;
    }

    if (state.currentStep >= state.steps.length) {
      state.currentStep = 0;
    }

    if (state.playing) {
      return;
    }

    state.playing = true;
    setStatus(`Running ${algorithmSelect.options[algorithmSelect.selectedIndex].text}.`, 'info');

    state.intervalId = window.setInterval(() => {
      showNextStep();
    }, SPEED_MS);
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function pausePlayback() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.playing = false;
}

function performSingleStep() {
  if (!state.steps.length) {
    setStatus('Generate a list before stepping through the algorithm.', 'warning');
    return;
  }

  pausePlayback();

  if (state.currentStep >= state.steps.length) {
    state.currentStep = 0;
  }

  const currentStep = state.steps[state.currentStep];
  state.currentStep += 1;
  applyStep(currentStep);

  if (state.currentStep >= state.steps.length) {
    setStatus('Last step reached. The array is now sorted.', 'success');
  } else {
    setStatus('Executed one step. Press Step again to continue.', 'info');
  }
}

arraySizeInput.addEventListener('input', () => {
  try {
    updateSizeLabel();
    state.array = generateRandomArray(validateSize(arraySizeInput.value));
    state.steps = buildStepsForSelectedAlgorithm(state.array);
    state.currentStep = 0;
    state.activeIndices = [];
    state.sortedIndices = [];
    renderBars();
    setStatus('Array updated. Press Start or Step to visualize sorting.', 'info');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

algorithmSelect.addEventListener('change', () => {
  if (!state.array.length) {
    return;
  }

  pausePlayback();
  state.steps = buildStepsForSelectedAlgorithm(state.array);
  state.currentStep = 0;
  state.activeIndices = [];
  state.sortedIndices = [];
  renderBars();
  setStatus(`Algorithm changed to ${algorithmSelect.options[algorithmSelect.selectedIndex].text}.`, 'info');
});

generateBtn.addEventListener('click', generateNumbers);
startBtn.addEventListener('click', startPlayback);
stepBtn.addEventListener('click', performSingleStep);
pauseBtn.addEventListener('click', () => {
  pausePlayback();
  setStatus('Playback paused.', 'warning');
});

function init() {
  updateSizeLabel();
  state.array = generateRandomArray(validateSize(arraySizeInput.value));
  state.steps = buildStepsForSelectedAlgorithm(state.array);
  renderBars();
  setStatus('Ready to sort.', 'info');
}

init();
