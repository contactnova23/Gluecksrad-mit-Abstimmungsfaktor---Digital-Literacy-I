const setupSection = document.getElementById('setup-section');
const voteSection = document.getElementById('vote-section');
const resultsSection = document.getElementById('results-section');

const questionInput = document.getElementById('question-input');
const answersContainer = document.getElementById('answers-container');
const addAnswerBtn = document.getElementById('add-answer-btn');
const startBtn = document.getElementById('start-btn');
const setupError = document.getElementById('setup-error');
const roomModeToggle = document.getElementById('room-mode-toggle');

const questionDisplay = document.getElementById('question-display');
const voteInfo = document.getElementById('vote-info');
const roomStatus = document.getElementById('room-status');
const voterNameInput = document.getElementById('voter-name');
const voteSelect = document.getElementById('vote-select');
const voteBtn = document.getElementById('vote-btn');
const nextPersonBtn = document.getElementById('next-person-btn');
const voteConfirmation = document.getElementById('vote-confirmation');
const endVotingBtn = document.getElementById('end-voting-btn');

const resultsList = document.getElementById('results-list');
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const stopBtn = document.getElementById('stop-btn');
const winnerDisplay = document.getElementById('winner-display');
const newVotingBtnVote = document.getElementById('new-voting-btn-vote');
const newVotingBtnResults = document.getElementById('new-voting-btn-results');

const STORAGE_KEY = 'gluecksrad-room-voting-state';

let options = [];
let votes = [];
let currentRotation = 0;
let targetRotation = 0;
let wheelIsSpinning = false;
let roomMode = false;
let currentPhase = 'setup';
let currentQuestion = '';

function createAnswerRow(value = '') {
  const row = document.createElement('div');
  row.className = 'answer-row';

  const input = document.createElement('input');
  input.className = 'answer-input';
  input.type = 'text';
  input.placeholder = 'Antwortmöglichkeit';
  input.value = value;

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-answer-btn';
  removeButton.textContent = 'Entfernen';

  removeButton.addEventListener('click', () => {
    const rows = answersContainer.querySelectorAll('.answer-row');
    if (rows.length > 2) {
      row.remove();
      updateRemoveButtons();
    } else {
      setupError.textContent = 'Mindestens zwei Antwortmöglichkeiten sind nötig.';
    }
  });

  row.appendChild(input);
  row.appendChild(removeButton);
  answersContainer.appendChild(row);
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = answersContainer.querySelectorAll('.answer-row');
  rows.forEach((row) => {
    const button = row.querySelector('.remove-answer-btn');
    button.disabled = rows.length <= 2;
  });
}

function fillVoteOptions() {
  voteSelect.innerHTML = '';
  options.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    voteSelect.appendChild(optionElement);
  });
}

function showVoteScreen(question) {
  currentQuestion = question;
  setupSection.hidden = true;
  voteSection.hidden = false;
  resultsSection.hidden = true;
  questionDisplay.textContent = question;
  voteConfirmation.textContent = '';
  voteInfo.textContent = 'Die Ergebnisse bleiben bis zum Ende verborgen.';
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  voteBtn.hidden = false;
  nextPersonBtn.hidden = true;
  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;

  if (roomMode) {
    roomStatus.hidden = false;
    roomStatus.textContent = `${votes.length} ${votes.length === 1 ? 'Stimme wurde' : 'Stimmen wurden'} bisher abgegeben.`;
  }
}

function showResultsScreen() {
  voteSection.hidden = true;
  resultsSection.hidden = false;
}

function buildResultsList(summary) {
  resultsList.innerHTML = '';
  summary.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${item.option}: ${item.votes} Stimmen (${item.percent}%)`;
    resultsList.appendChild(listItem);
  });
}

function buildWheel(summary) {
  const totalVotes = summary.reduce((sum, item) => sum + item.votes, 0);
  const gradientParts = [];
  let startAngle = -90;

  summary.forEach((item, index) => {
    const size = totalVotes > 0 ? (item.votes / totalVotes) * 360 : 360 / summary.length;
    const endAngle = startAngle + size;
    const color = `hsl(${index * 55} 70% 55%)`;
    gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    startAngle = endAngle;
  });

  wheel.style.background = `conic-gradient(from -90deg, ${gradientParts.join(', ')})`;
}

function getWinner(summary) {
  const highestVotes = Math.max(...summary.map((item) => item.votes));
  return summary.find((item) => item.votes === highestVotes);
}

function computeSummary() {
  return options.map((option) => {
    const voteCount = votes.filter((vote) => vote.option === option).length;
    const totalVotes = votes.length;
    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return {
      option,
      votes: voteCount,
      percent,
    };
  });
}

function calculateStopRotation(summary, winnerIndex) {
  let angle = -90;
  const totalVotes = summary.reduce((sum, item) => sum + item.votes, 0);

  for (let index = 0; index < summary.length; index += 1) {
    const size = totalVotes > 0 ? (summary[index].votes / totalVotes) * 360 : 360 / summary.length;
    if (index === winnerIndex) {
      const segmentCenter = angle + size / 2;
      return 360 * 6 + (360 - segmentCenter);
    }
    angle += size;
  }

  return 360 * 6;
}

function saveState() {
  const payload = {
    phase: currentPhase,
    question: currentQuestion,
    options,
    votes,
    roomMode,
    currentRotation,
    targetRotation,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

function resetApp() {
  questionInput.value = '';
  answersContainer.innerHTML = '';
  createAnswerRow('');
  createAnswerRow('');
  roomModeToggle.checked = false;
  setupError.textContent = '';
  voteConfirmation.textContent = '';
  winnerDisplay.textContent = '';
  setupSection.hidden = false;
  voteSection.hidden = true;
  resultsSection.hidden = true;
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  voteInfo.textContent = 'Die Ergebnisse bleiben bis zum Ende verborgen.';
  options = [];
  votes = [];
  currentRotation = 0;
  targetRotation = 0;
  wheelIsSpinning = false;
  roomMode = false;
  currentPhase = 'setup';
  currentQuestion = '';
  wheel.style.transform = 'rotate(0deg)';
  wheel.style.transition = 'transform 0.8s ease-out';
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  clearSavedState();
}

function restoreSavedState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    return;
  }

  try {
    const parsedState = JSON.parse(savedState);
    if (!parsedState) {
      return;
    }

    currentPhase = parsedState.phase || 'setup';
    currentQuestion = parsedState.question || '';
    options = parsedState.options || [];
    votes = parsedState.votes || [];
    roomMode = Boolean(parsedState.roomMode);
    currentRotation = parsedState.currentRotation || 0;
    targetRotation = parsedState.targetRotation || 0;
    roomModeToggle.checked = roomMode;

    if (currentPhase === 'vote') {
      fillVoteOptions();
      showVoteScreen(currentQuestion);
    } else if (currentPhase === 'results') {
      const summary = computeSummary();
      buildResultsList(summary);
      buildWheel(summary);
      showResultsScreen();
      const winner = getWinner(summary);
      winnerDisplay.textContent = winner ? `Gewinner: ${winner.option}` : 'Noch keine Stimmen vorhanden.';
    }
  } catch (error) {
    console.error('Fehler beim Laden des gespeicherten Zustands:', error);
  }
}

addAnswerBtn.addEventListener('click', () => {
  createAnswerRow('');
});

startBtn.addEventListener('click', () => {
  setupError.textContent = '';
  const question = questionInput.value.trim();
  const answers = Array.from(answersContainer.querySelectorAll('.answer-input'))
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (!question) {
    setupError.textContent = 'Bitte gib eine Frage ein.';
    return;
  }

  if (answers.length < 2) {
    setupError.textContent = 'Bitte gib mindestens zwei Antwortmöglichkeiten ein.';
    return;
  }

  options = answers;
  votes = [];
  roomMode = roomModeToggle.checked;
  currentRotation = 0;
  targetRotation = 0;
  wheelIsSpinning = false;
  wheel.style.transform = 'rotate(0deg)';
  wheel.style.transition = 'transform 0.8s ease-out';
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  winnerDisplay.textContent = '';
  fillVoteOptions();
  currentPhase = 'vote';
  saveState();
  showVoteScreen(question);
});

voteBtn.addEventListener('click', () => {
  const name = voterNameInput.value.trim();
  const selectedOption = voteSelect.value;

  if (!name) {
    voteConfirmation.textContent = 'Bitte gib zuerst deinen Namen ein.';
    return;
  }

  if (!selectedOption) {
    voteConfirmation.textContent = 'Bitte wähle eine Antwort aus.';
    return;
  }

  votes.push({ name, option: selectedOption });

  if (roomMode) {
    voteConfirmation.textContent = 'Deine Stimme wurde gespeichert. Bitte gib das Gerät an die nächste Person weiter.';
    roomStatus.hidden = false;
    roomStatus.textContent = `${votes.length} ${votes.length === 1 ? 'Stimme wurde' : 'Stimmen wurden'} bisher abgegeben.`;
    voteBtn.hidden = true;
    nextPersonBtn.hidden = false;
  } else {
    voteConfirmation.textContent = `Vielen Dank, ${name}. Deine Stimme wurde gezählt.`;
  }

  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;
  saveState();
});

nextPersonBtn.addEventListener('click', () => {
  voteConfirmation.textContent = '';
  voteBtn.hidden = false;
  nextPersonBtn.hidden = true;
  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;
  voterNameInput.focus();
});

endVotingBtn.addEventListener('click', () => {
  if (roomMode) {
    const shouldEnd = window.confirm('Möchtest du die Abstimmung wirklich beenden?');
    if (!shouldEnd) {
      return;
    }
  }

  const summary = computeSummary();
  buildResultsList(summary);
  buildWheel(summary);
  currentPhase = 'results';
  saveState();
  showResultsScreen();

  const winner = getWinner(summary);
  winnerDisplay.textContent = winner ? `Gewinner: ${winner.option}` : 'Noch keine Stimmen vorhanden.';
});

spinBtn.addEventListener('click', () => {
  if (wheelIsSpinning) {
    return;
  }

  const summary = computeSummary();
  const winnerIndex = summary.findIndex((item) => item.option === getWinner(summary)?.option);
  const extraRotation = calculateStopRotation(summary, winnerIndex);
  targetRotation = currentRotation + extraRotation;

  wheel.style.transition = 'transform 3s ease-out';
  wheel.style.transform = `rotate(${targetRotation}deg)`;
  currentRotation = targetRotation;
  wheelIsSpinning = true;
  spinBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  if (!wheelIsSpinning) {
    return;
  }

  wheel.style.transition = 'transform 0.4s ease-out';
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  wheelIsSpinning = false;
  spinBtn.disabled = false;
  stopBtn.disabled = true;

  const summary = computeSummary();
  const winner = getWinner(summary);
  winnerDisplay.textContent = winner ? `Gewinner: ${winner.option}` : 'Noch keine Stimmen vorhanden.';
});

newVotingBtnVote.addEventListener('click', () => {
  resetApp();
});

newVotingBtnResults.addEventListener('click', () => {
  resetApp();
});

createAnswerRow('');
createAnswerRow('');
updateRemoveButtons();
restoreSavedState();
