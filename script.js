const setupSection = document.getElementById('setup-section');
const voteSection = document.getElementById('vote-section');
const resultsSection = document.getElementById('results-section');

const questionInput = document.getElementById('question-input');
const answersContainer = document.getElementById('answers-container');
const addAnswerBtn = document.getElementById('add-answer-btn');
const startBtn = document.getElementById('start-btn');
const setupError = document.getElementById('setup-error');

const questionDisplay = document.getElementById('question-display');
const voterNameInput = document.getElementById('voter-name');
const voteSelect = document.getElementById('vote-select');
const voteBtn = document.getElementById('vote-btn');
const voteConfirmation = document.getElementById('vote-confirmation');
const endVotingBtn = document.getElementById('end-voting-btn');

const resultsList = document.getElementById('results-list');
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const stopBtn = document.getElementById('stop-btn');
const winnerDisplay = document.getElementById('winner-display');
const newVotingBtn = document.getElementById('new-voting-btn');

let options = [];
let votes = [];
let currentRotation = 0;
let targetRotation = 0;
let wheelIsSpinning = false;

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
  setupSection.hidden = true;
  voteSection.hidden = false;
  resultsSection.hidden = true;
  questionDisplay.textContent = question;
  voteConfirmation.textContent = '';
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
  currentRotation = 0;
  targetRotation = 0;
  wheelIsSpinning = false;
  wheel.style.transform = 'rotate(0deg)';
  wheel.style.transition = 'transform 0.8s ease-out';
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  winnerDisplay.textContent = '';
  fillVoteOptions();
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
  voteConfirmation.textContent = `Vielen Dank, ${name}. Deine Stimme wurde gezählt.`;
  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;
});

endVotingBtn.addEventListener('click', () => {
  const summary = computeSummary();
  buildResultsList(summary);
  buildWheel(summary);
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

newVotingBtn.addEventListener('click', () => {
  questionInput.value = '';
  answersContainer.innerHTML = '';
  createAnswerRow('');
  createAnswerRow('');
  setupError.textContent = '';
  voteConfirmation.textContent = '';
  winnerDisplay.textContent = '';
  setupSection.hidden = false;
  voteSection.hidden = true;
  resultsSection.hidden = true;
});

createAnswerRow('');
createAnswerRow('');
updateRemoveButtons();
