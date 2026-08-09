const setupSection = document.getElementById('setup-section');
const voteSection = document.getElementById('vote-section');
const resultsSection = document.getElementById('results-section');

const questionInput = document.getElementById('question-input');
const answersContainer = document.getElementById('answers-container');
const addAnswerBtn = document.getElementById('add-answer-btn');
const startBtn = document.getElementById('start-btn');
const setupError = document.getElementById('setup-error');
const roomModeToggle = document.getElementById('room-mode-toggle');
const onlineModeToggle = document.getElementById('online-mode-toggle');
const joinRoomCodeInput = document.getElementById('join-room-code-input');
const joinOnlineBtn = document.getElementById('join-online-btn');
const joinError = document.getElementById('join-error');

const welcomePanel = document.getElementById('welcome-panel');
const entryChoice = document.getElementById('entry-choice');
const createPanel = document.getElementById('create-panel');
const modePanel = document.getElementById('mode-panel');
const joinPanel = document.getElementById('join-panel');
const experienceStartBtn = document.getElementById('experience-start-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
const showCreateBtn = document.getElementById('show-create-btn');
const showJoinBtn = document.getElementById('show-join-btn');
const backFromCreateBtn = document.getElementById('back-from-create-btn');
const backToCreateBtn = document.getElementById('back-to-create-btn');
const backFromJoinBtn = document.getElementById('back-from-join-btn');
const continueToModeBtn = document.getElementById('continue-to-mode-btn');
const createError = document.getElementById('create-error');


const questionDisplay = document.getElementById('question-display');
const voteInfo = document.getElementById('vote-info');
const roomStatus = document.getElementById('room-status');
const onlineStatus = document.getElementById('online-status');
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
const journeySteps = Array.from(document.querySelectorAll('.journey-step'));
const gameFxLayer = document.getElementById('game-fx-layer');
const reducedGameMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const STORAGE_KEY = 'gluecksrad-room-voting-state';

let options = [];
let votes = [];
let currentRotation = 0;
let targetRotation = 0;
let wheelIsSpinning = false;
let roomMode = false;
let onlineMode = false;
let currentPhase = 'setup';
let currentQuestion = '';
let currentPollId = null;
let currentRoomCode = '';
let currentVoteCount = 0;
let isVotingClosed = false;
let currentBrowserVoteKey = '';
let onlineRefreshTimer = null;
let currentWinnerOption = '';
let isOnlineModerator = false;
let wheelSpinAnimation = null;


function emitAtmosphere(stage, detail = {}) {
  document.dispatchEvent(new CustomEvent('glueckshafen:stage', {
    detail: { stage, ...detail },
  }));
}

function setQuestStep(step) {
  const maxStep = Math.max(1, journeySteps.length - 1);
  const normalizedStep = Math.max(0, Math.min(maxStep, Number(step) || 0));
  const progress = (normalizedStep / maxStep) * 83.2;

  document.documentElement.style.setProperty('--quest-progress', `${progress.toFixed(2)}%`);
  document.body.dataset.questStep = String(normalizedStep);
  document.body.classList.remove('quest-complete');

  journeySteps.forEach((item, index) => {
    item.classList.toggle('is-complete', index < normalizedStep);
    item.classList.toggle('is-active', index === normalizedStep);
    if (index === normalizedStep) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function completeQuest() {
  document.documentElement.style.setProperty('--quest-progress', '83.2%');
  document.body.classList.add('quest-complete');
  journeySteps.forEach((item, index) => {
    item.classList.add('is-complete');
    item.classList.toggle('is-active', index === journeySteps.length - 1);
    if (index === journeySteps.length - 1) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function getFxPoint(anchor) {
  if (anchor instanceof Element) {
    const rect = anchor.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function spawnGameBurst(kind, anchor) {
  if (!gameFxLayer || reducedGameMotion) return;

  const point = getFxPoint(anchor);
  const burst = document.createElement('span');
  const colors = ['#f1d98d', '#8fb9a3', '#7fa8bf', '#e19b84', '#b3a4cf'];
  const count = kind === 'winner' ? 18 : kind === 'vote' ? 14 : 10;

  burst.className = `game-burst game-burst--${kind}`;
  burst.style.setProperty('--fx-x', `${point.x}px`);
  burst.style.setProperty('--fx-y', `${point.y}px`);

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'game-particle';
    particle.style.setProperty('--particle-angle', `${(360 / count) * index + Math.random() * 12}deg`);
    particle.style.setProperty('--particle-distance', `${54 + Math.random() * (kind === 'winner' ? 96 : 54)}px`);
    particle.style.setProperty('--particle-size', `${5 + Math.random() * 6}px`);
    particle.style.setProperty('--particle-delay', `${Math.random() * 0.12}s`);
    particle.style.setProperty('--particle-color', colors[index % colors.length]);
    burst.appendChild(particle);
  }

  gameFxLayer.appendChild(burst);

  if (kind === 'vote') {
    const seal = document.createElement('span');
    seal.className = 'game-seal';
    seal.textContent = '✓';
    seal.style.setProperty('--fx-x', `${point.x}px`);
    seal.style.setProperty('--fx-y', `${point.y}px`);
    gameFxLayer.appendChild(seal);
    window.setTimeout(() => seal.remove(), 1100);
  }

  window.setTimeout(() => burst.remove(), 1250);
}

function gameFeedback(type, anchor, visualType = type) {
  document.dispatchEvent(new CustomEvent('glueckshafen:feedback', {
    detail: { type },
  }));

  if (anchor instanceof Element) {
    anchor.classList.remove('is-game-pulsing');
    void anchor.offsetWidth;
    anchor.classList.add('is-game-pulsing');
    window.setTimeout(() => anchor.classList.remove('is-game-pulsing'), 620);
  }

  if (visualType) spawnGameBurst(visualType, anchor);
}

function setWheelGameState(state = '') {
  document.body.classList.remove('is-wheel-spinning', 'is-wheel-settling', 'is-winner');
  if (state) document.body.classList.add(state);
}

function hasOnlineBackend() {
  return Boolean(
    window.supabase
    && typeof supabaseClient !== 'undefined'
    && supabaseClient
  );
}

function getSetupData() {
  return {
    question: questionInput.value.trim(),
    answers: Array.from(answersContainer.querySelectorAll('.answer-input'))
      .map((input) => input.value.trim())
      .filter(Boolean),
  };
}

function validateSetupDetails(errorElement) {
  const { question, answers } = getSetupData();
  errorElement.textContent = '';

  if (!question) {
    errorElement.textContent = 'Bitte verkündet zuerst eine Frage.';
    questionInput.focus();
    return null;
  }

  if (answers.length < 2) {
    errorElement.textContent = 'Bitte stellt mindestens zwei Antworten zur Wahl.';
    const firstEmptyAnswer = Array.from(answersContainer.querySelectorAll('.answer-input'))
      .find((input) => !input.value.trim());
    firstEmptyAnswer?.focus();
    return null;
  }

  const normalizedAnswers = answers.map((answer) => answer.toLowerCase());
  if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
    errorElement.textContent = 'Bitte führt jede Antwort nur einmal auf.';
    return null;
  }

  return { question, answers };
}

function updateModeCards() {
  document.querySelectorAll('.mode-option').forEach((label) => {
    const input = label.querySelector('input[type="radio"]');
    label.classList.toggle('is-selected', Boolean(input?.checked));
  });
}

function animateFeedback(element) {
  element.classList.remove('feedback-pop');
  void element.offsetWidth;
  element.classList.add('feedback-pop');

  window.setTimeout(() => {
    element.classList.remove('feedback-pop');
  }, 650);
}

function celebrateWinner() {
  const existingCeremony = document.querySelector('.winner-ceremony-layer');
  if (existingCeremony) existingCeremony.remove();

  const oldConfetti = document.querySelector('.confetti-layer');
  if (oldConfetti) oldConfetti.remove();

  const layer = document.createElement('div');
  layer.className = 'winner-ceremony-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'winner-proclamation-title');
  layer.setAttribute('aria-describedby', 'winner-proclamation-note');

  const ceremony = document.createElement('section');
  ceremony.className = 'winner-ceremony winner-proclamation';

  const seal = document.createElement('div');
  seal.className = 'winner-proclamation-seal';
  seal.setAttribute('aria-hidden', 'true');
  seal.textContent = '✦';

  const kicker = document.createElement('p');
  kicker.className = 'winner-ceremony-kicker';
  kicker.textContent = 'Der Glückshafen hat entschieden';

  const title = document.createElement('h2');
  title.id = 'winner-proclamation-title';
  title.className = 'winner-ceremony-title';
  title.textContent = 'Das Los fällt auf';

  const name = document.createElement('p');
  name.className = 'winner-ceremony-name';
  name.textContent = currentWinnerOption;

  const divider = document.createElement('div');
  divider.className = 'winner-ceremony-divider';
  divider.setAttribute('aria-hidden', 'true');

  const message = document.createElement('p');
  message.id = 'winner-proclamation-note';
  message.className = 'winner-ceremony-message';
  message.textContent = 'Eure Stimmen bestimmten, wie viel Raum jede Antwort auf dem Rad erhielt. Welches Feld schließlich zum Stehen kam, entschied der Zufall.';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'winner-ceremony-close';
  closeButton.textContent = 'Zurück zum Rad des Glücks';

  const flourish = document.createElement('div');
  flourish.className = 'winner-proclamation-flourish';
  flourish.setAttribute('aria-hidden', 'true');
  flourish.textContent = '❦';

  ceremony.append(seal, kicker, title, name, divider, message, closeButton, flourish);

  const particleLayer = document.createElement('div');
  particleLayer.className = 'winner-ceremony-particles';
  particleLayer.setAttribute('aria-hidden', 'true');

  const particleColors = ['#d8bf7a', '#adc8b4', '#d5e8ea', '#e5c2b5'];
  for (let index = 0; index < 14; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'winner-ceremony-particle';
    particle.style.left = `${8 + Math.random() * 84}%`;
    particle.style.setProperty('--particle-delay', `${Math.random() * 0.55}s`);
    particle.style.setProperty('--particle-duration', `${2.7 + Math.random() * 1.5}s`);
    particle.style.setProperty('--particle-drift', `${-42 + Math.random() * 84}px`);
    particle.style.setProperty('--particle-size', `${3 + Math.random() * 4}px`);
    particle.style.backgroundColor = particleColors[index % particleColors.length];
    particleLayer.appendChild(particle);
  }

  layer.append(particleLayer, ceremony);
  document.body.appendChild(layer);
  document.body.classList.add('winner-ceremony-open');

  const closeCeremony = () => {
    if (!layer.isConnected) return;
    document.removeEventListener('keydown', handleEscape);
    document.body.classList.remove('winner-ceremony-open');
    layer.classList.add('is-leaving');
    window.setTimeout(() => {
      layer.remove();
      newVotingBtnResults?.focus();
    }, 360);
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') closeCeremony();
  };

  closeButton.addEventListener('click', closeCeremony, { once: true });
  document.addEventListener('keydown', handleEscape);
  window.setTimeout(() => {
    if (layer.isConnected) closeButton.focus();
  }, 620);
}
function hideSetupPanels() {
  welcomePanel.hidden = true;
  entryChoice.hidden = true;
  createPanel.hidden = true;
  modePanel.hidden = true;
  joinPanel.hidden = true;
  voteSection.hidden = true;
  resultsSection.hidden = true;
}

function showWelcome() {
  setupSection.hidden = false;
  hideSetupPanels();
  welcomePanel.hidden = false;
  createError.textContent = '';
  setupError.textContent = '';
  joinError.textContent = '';
  setQuestStep(0);
  setWheelGameState();
  emitAtmosphere('welcome');
  window.setTimeout(() => experienceStartBtn.focus(), 120);
}

function showSetupHome() {
  setupSection.hidden = false;
  hideSetupPanels();
  entryChoice.hidden = false;
  createError.textContent = '';
  setupError.textContent = '';
  joinError.textContent = '';
  setQuestStep(1);
  emitAtmosphere('market-entry');
  window.setTimeout(() => showCreateBtn.focus(), 120);
}

function showCreatePanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  createPanel.hidden = false;
  createError.textContent = '';
  setupError.textContent = '';
  setQuestStep(2);
  emitAtmosphere('scribe-stall');
  window.setTimeout(() => questionInput.focus(), 120);
}

function showModePanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  modePanel.hidden = false;
  setupError.textContent = '';
  updateModeCards();
  setQuestStep(3);
  emitAtmosphere('assembly');

  const selectedMode = document.querySelector('input[name="voting-mode"]:checked');
  window.setTimeout(() => (selectedMode || roomModeToggle).focus(), 120);
}

function showJoinPanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  joinPanel.hidden = false;
  joinError.textContent = '';
  setQuestStep(2);
  emitAtmosphere('town-caller');
  window.setTimeout(() => joinRoomCodeInput.focus(), 120);
}

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function ensureAnonymousUser() {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabaseClient.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.user;
}

function createAnswerRow(value = '') {
  const row = document.createElement('div');
  row.className = 'answer-row';

  const input = document.createElement('input');
  input.className = 'answer-input';
  input.type = 'text';
  input.placeholder = `Antwort ${answersContainer.querySelectorAll('.answer-input').length + 1}`;
  input.value = value;

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-answer-btn';
  removeButton.textContent = 'Streichen';

  removeButton.addEventListener('click', () => {
    const rows = answersContainer.querySelectorAll('.answer-row');
    if (rows.length > 2) {
      row.remove();
      updateRemoveButtons();
    } else {
      setupError.textContent = 'Mindestens zwei Antworten müssen zur Wahl stehen.';
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
  voteInfo.textContent = 'Die Stimmen bleiben bis zum Ende verborgen.';
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  onlineStatus.hidden = true;
  onlineStatus.textContent = '';
  voteBtn.hidden = false;
  nextPersonBtn.hidden = true;
  setQuestStep(4);
  emitAtmosphere('voting');

  if (roomMode) {
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  voteInfo.textContent = 'Die nächste Person darf vortreten. Ihre Stimme bleibt geheim.';

  endVotingBtn.textContent = 'Ausrufende Person: Abstimmung schließen';
  endVotingBtn.classList.add('moderator-action');

  newVotingBtnVote.hidden = true;
} else {
  endVotingBtn.textContent = 'Abstimmung schließen';
  endVotingBtn.classList.remove('moderator-action');

  newVotingBtnVote.hidden = false;
  }

  if (onlineMode) {
  onlineStatus.hidden = false;
  onlineStatus.textContent = isOnlineModerator
    ? (currentRoomCode
      ? `Online-Raum: ${currentRoomCode} • ${currentVoteCount} ${currentVoteCount === 1 ? 'Stimme' : 'Stimmen'} bisher abgegeben`
      : 'Die Abstimmung über die Ferne ist eröffnet.')
    : (currentRoomCode
      ? `Online-Raum: ${currentRoomCode} • Deine Stimme bleibt bis zum Ende geheim.`
      : 'Die Abstimmung über die Ferne ist eröffnet.');

  if (isOnlineModerator) {
    endVotingBtn.hidden = false;
    endVotingBtn.textContent = 'Ausrufende Person: Abstimmung schließen';
    endVotingBtn.classList.add('moderator-action');
  } else {
    endVotingBtn.hidden = true;
  }
}

}  
function startOnlineRefreshLoop() {
  if (onlineRefreshTimer) {
    window.clearInterval(onlineRefreshTimer);
  }

  onlineRefreshTimer = window.setInterval(() => {
    if (onlineMode && currentPhase === 'vote' && currentPollId) {
      refreshOnlineState();
    }
  }, 3000);
}

function stopOnlineRefreshLoop() {
  if (onlineRefreshTimer) {
    window.clearInterval(onlineRefreshTimer);
    onlineRefreshTimer = null;
  }
}

function showResultsScreen() {
  setupSection.hidden = true;
  voteSection.hidden = true;
  resultsSection.hidden = false;
  setQuestStep(5);
  emitAtmosphere('results');
}

const WHEEL_PALETTE = [
  '#e19b84',
  '#8fb9a3',
  '#e3c16f',
  '#7fa8bf',
  '#b3a4cf',
  '#e2aa72',
  '#86b4b3',
  '#d892a4',
];

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildResultsList(summary) {
  resultsList.innerHTML = '';
  summary.forEach((item, index) => {
    const color = WHEEL_PALETTE[index % WHEEL_PALETTE.length];
    const listItem = document.createElement('li');
    listItem.classList.add('result-option-key');
    listItem.style.setProperty('--option-color', color);
    listItem.style.setProperty('--option-tint', hexToRgba(color, 0.20));

    const marker = document.createElement('span');
    marker.className = 'result-option-marker';
    marker.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'result-option-label';
    label.textContent = `${item.option}: ${item.votes} Stimmen (${item.percent}%)`;

    listItem.append(marker, label);
    resultsList.appendChild(listItem);
  });
}

function buildWheel(summary) {
  const totalVotes = summary.reduce((sum, item) => sum + item.votes, 0);
  const gradientParts = [];
  let startAngle = 0;

  summary.forEach((item, index) => {
    const size = totalVotes > 0 ? (item.votes / totalVotes) * 360 : 360 / summary.length;
    const endAngle = startAngle + size;
    const color = WHEEL_PALETTE[index % WHEEL_PALETTE.length];
    gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    startAngle = endAngle;
  });

  wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
}

function getWinner(summary) {
  const highestVotes = Math.max(...summary.map((item) => item.votes));
  return summary.find((item) => item.votes === highestVotes);
}

function getWeightedWinner(summary) {
  const totalVotes = summary.reduce((sum, item) => sum + item.votes, 0);

  if (totalVotes === 0) {
    const randomIndex = Math.floor(Math.random() * summary.length);
    return summary[randomIndex] || null;
  }

  const randomValue = Math.random() * totalVotes;
  let runningTotal = 0;

  for (const item of summary) {
    runningTotal += item.votes;
    if (randomValue < runningTotal) {
      return item;
    }
  }

  return summary[summary.length - 1] || null;
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
  let angle = 0;
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
    onlineMode,
    isOnlineModerator,
    currentRotation,
    targetRotation,
    currentPollId,
    currentRoomCode,
    currentVoteCount,
    isVotingClosed,
    currentBrowserVoteKey,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

function resetApp() {
  if (wheelSpinAnimation) {
    wheelSpinAnimation.cancel();
    wheelSpinAnimation = null;
  }
  stopOnlineRefreshLoop();
  questionInput.value = '';
  answersContainer.innerHTML = '';
  createAnswerRow('');
  createAnswerRow('');
  roomModeToggle.checked = false;
  onlineModeToggle.checked = false;
  joinRoomCodeInput.value = '';
  setupError.textContent = '';
  joinError.textContent = '';
  voteConfirmation.textContent = '';
  winnerDisplay.textContent = '';
  winnerDisplay.classList.remove('winner-announced');
  setupSection.hidden = false;
  showWelcome();
  voteSection.hidden = true;
  resultsSection.hidden = true;
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  onlineStatus.hidden = true;
  onlineStatus.textContent = '';
  voteInfo.textContent = 'Die Stimmen bleiben bis zum Ende verborgen.';
  voterNameInput.closest('.field').hidden = false;
voteSelect.closest('.field').hidden = false;

endVotingBtn.hidden = false;
endVotingBtn.textContent = 'Abstimmung schließen';
endVotingBtn.classList.remove('moderator-action');

newVotingBtnVote.hidden = false;
  options = [];
  votes = [];
  currentRotation = 0;
  targetRotation = 0;
  wheelIsSpinning = false;
  roomMode = false;
  onlineMode = false;
  isOnlineModerator = false;
  currentPhase = 'setup';
  currentQuestion = '';
  currentPollId = null;
  currentRoomCode = '';
  currentVoteCount = 0;
  isVotingClosed = false;
  currentBrowserVoteKey = '';
  currentWinnerOption = '';
  setWheelGameState();
  setQuestStep(0);
  wheel.style.transform = 'rotate(0deg)';
  wheel.style.transition = 'transform 0.8s ease-out';
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  clearSavedState();
}

async function refreshOnlineState() {
  if (!onlineMode || !currentPollId || !hasOnlineBackend()) {
    return;
  }

  try {
    await ensureAnonymousUser();

    const { data: pollData, error: pollError } = await supabaseClient
      .from('polls')
      .select('id, question, options, room_code, is_closed')
      .eq('id', currentPollId)
      .single();

    if (pollError) {
      throw pollError;
    }

    if (pollData) {
      currentQuestion = pollData.question || currentQuestion;
      options = pollData.options || options;
      currentRoomCode = pollData.room_code || currentRoomCode;
      isVotingClosed = Boolean(pollData.is_closed);
    }

    if (isOnlineModerator) {
      const { data: voteData, error: voteError } = await supabaseClient
        .from('votes')
        .select('option, voter_name')
        .eq('poll_id', currentPollId);

      if (voteError) {
        throw voteError;
      }

      votes = (voteData || []).map((vote) => ({ name: vote.voter_name, option: vote.option }));
      currentVoteCount = votes.length;
    } else {
      votes = [];
    }

    saveState();

    if (currentPhase === 'vote' && onlineMode) {
      onlineStatus.hidden = false;
      onlineStatus.textContent = isOnlineModerator
        ? (currentRoomCode
          ? `Online-Raum: ${currentRoomCode} • ${currentVoteCount} ${currentVoteCount === 1 ? 'Stimme' : 'Stimmen'} bisher abgegeben`
          : 'Die Abstimmung über die Ferne ist eröffnet.')
        : (currentRoomCode
          ? `Online-Raum: ${currentRoomCode} • Deine Stimme bleibt bis zum Ende geheim.`
          : 'Die Abstimmung über die Ferne ist eröffnet.');
    }
  } catch (error) {
    console.error('Fehler beim Laden der Online-Stimmen:', error);
  }
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
    onlineMode = Boolean(parsedState.onlineMode);

    // Alte gespeicherte Sitzungen aus dem entfernten Einfachen Modus nicht wiederherstellen.
    if (currentPhase !== 'setup' && !roomMode && !onlineMode) {
      clearSavedState();
      return;
    }

    isOnlineModerator = Boolean(parsedState.isOnlineModerator);
    currentRotation = parsedState.currentRotation || 0;
    targetRotation = parsedState.targetRotation || 0;
    currentPollId = parsedState.currentPollId || null;
    currentRoomCode = parsedState.currentRoomCode || '';
    currentVoteCount = parsedState.currentVoteCount || 0;
    isVotingClosed = Boolean(parsedState.isVotingClosed);
    currentBrowserVoteKey = parsedState.currentBrowserVoteKey || '';
    roomModeToggle.checked = roomMode;
    onlineModeToggle.checked = onlineMode;

    if (currentPhase === 'vote') {
      fillVoteOptions();
      showVoteScreen(currentQuestion);
      if (onlineMode && currentPollId) {
        startOnlineRefreshLoop();
      }
    } else if (currentPhase === 'results') {
      const summary = computeSummary();
      buildResultsList(summary);
      buildWheel(summary);
      showResultsScreen();
      winnerDisplay.textContent = 'Der Glückshafen ist bereit. Das Rad kann in Gang gesetzt werden.';
    }
  } catch (error) {
    console.error('Fehler beim Laden des gespeicherten Zustands:', error);
  }
}

experienceStartBtn.addEventListener('click', () => {
  gameFeedback('step', experienceStartBtn, 'step');
  showSetupHome();
});
backToWelcomeBtn.addEventListener('click', showWelcome);
showCreateBtn.addEventListener('click', () => {
  gameFeedback('step', showCreateBtn, 'step');
  showCreatePanel();
});
showJoinBtn.addEventListener('click', () => {
  gameFeedback('step', showJoinBtn, 'step');
  showJoinPanel();
});
backFromCreateBtn.addEventListener('click', showSetupHome);
backToCreateBtn.addEventListener('click', showCreatePanel);
backFromJoinBtn.addEventListener('click', showSetupHome);

addAnswerBtn.addEventListener('click', () => {
  createAnswerRow('');
  const addedRow = answersContainer.lastElementChild;
  if (addedRow) {
    addedRow.classList.add('is-game-added');
    window.setTimeout(() => addedRow.classList.remove('is-game-added'), 620);
  }
  gameFeedback('add', addAnswerBtn, 'add');
});

continueToModeBtn.addEventListener('click', () => {
  const setupData = validateSetupDetails(createError);
  if (!setupData) {
    return;
  }

  gameFeedback('step', continueToModeBtn, 'step');
  showModePanel();
});

roomModeToggle.addEventListener('change', updateModeCards);
onlineModeToggle.addEventListener('change', updateModeCards);

[roomModeToggle, onlineModeToggle].forEach((input) => {
  input.addEventListener('change', () => {
    gameFeedback('mode', input.closest('.mode-option'), 'mode');
  });
});

startBtn.addEventListener('click', async () => {
  setupError.textContent = '';

  const setupData = validateSetupDetails(setupError);
  if (!setupData) {
    const validationMessage = setupError.textContent;
    showCreatePanel();
    createError.textContent = validationMessage;
    return;
  }

  if (!roomModeToggle.checked && !onlineModeToggle.checked) {
    setupError.textContent = 'Bitte wählt den Saal oder die Teilnahme über die Ferne.';
    return;
  }

  const { question, answers } = setupData;
  roomMode = roomModeToggle.checked;
  onlineMode = onlineModeToggle.checked;

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
  winnerDisplay.classList.remove('winner-announced');
  fillVoteOptions();
  currentPhase = 'vote';

  if (onlineMode) {
    if (!hasOnlineBackend()) {
      setupError.textContent = 'Supabase ist nicht verfügbar. Bitte prüfe die Konfiguration.';
      return;
    }
  isOnlineModerator = true;
    try {
      await ensureAnonymousUser();
      currentRoomCode = generateRoomCode();
      const { data, error } = await supabaseClient.from('polls').insert({
        question,
        options: answers,
        room_code: currentRoomCode,
        is_closed: false,
      }).select().single();

      if (error) {
        throw error;
      }

      currentPollId = data.id;
      currentVoteCount = 0;
      isVotingClosed = false;
      currentBrowserVoteKey = `${currentPollId}-${Math.random().toString(36).slice(2, 10)}`;
      voteConfirmation.textContent = `Der Glückshafen ist eröffnet. Raumcode: ${currentRoomCode}`;
      saveState();
      await refreshOnlineState();
      startOnlineRefreshLoop();
      gameFeedback('step', startBtn, 'step');
      showVoteScreen(question);
      return;
    } catch (error) {
      setupError.textContent = 'Der Glückshafen über die Ferne konnte nicht eröffnet werden.';
      console.error(error);
      return;
    }
  }

  saveState();
  gameFeedback('step', startBtn, 'step');
  showVoteScreen(question);
});

voteBtn.addEventListener('click', async () => {
  voteBtn.textContent = 'Stimme abgeben';
  
  const name = voterNameInput.value.trim();
  const selectedOption = voteSelect.value;

  if (!selectedOption) {
    voteConfirmation.textContent = 'Bitte wählt eine Antwort aus.';
    return;
  }

  if (onlineMode) {
    if (!currentPollId || isVotingClosed) {
      voteConfirmation.textContent = 'Diese Runde ist bereits geschlossen.';
      return;
    }

    if (localStorage.getItem(`gluecksrad-vote-${currentPollId}`)) {
      voteConfirmation.textContent = 'Für diesen Raum wurde auf diesem Gerät bereits eine Stimme abgegeben.';
      return;
    }

    try {
      await ensureAnonymousUser();

      const { error } = await supabaseClient.from('votes').insert({
        poll_id: currentPollId,
        option: selectedOption,
        voter_name: name || 'Anonym',
        browser_key: currentBrowserVoteKey,
      });

      if (error) {
        if (error.code === '23505') {
          voteConfirmation.textContent = 'Für diesen Raum wurde bereits eine Stimme abgegeben.';
          return;
        }
        throw error;
      }

      localStorage.setItem(`gluecksrad-vote-${currentPollId}`, currentBrowserVoteKey);

await refreshOnlineState();

voteConfirmation.textContent = `✓ Eure Stimme ist vermerkt: „${selectedOption}“.`;
animateFeedback(voteConfirmation);
gameFeedback('vote', voteBtn, 'vote');

saveState();
return;

    } catch (error) {
      voteConfirmation.textContent = 'Die Stimme konnte nicht vermerkt werden.';
      console.error(error);
      return;
    }
  }

  votes.push({ name: name || 'Anonym', option: selectedOption });

  if (roomMode) {
    voteConfirmation.textContent = '✓ Die Stimme ist vermerkt. Die nächste Person darf vortreten.';

    roomStatus.hidden = true;
    roomStatus.textContent = '';

    voteInfo.textContent = 'Die nächste Person darf vortreten. Die Stimme bleibt geheim.';

    voterNameInput.closest('.field').hidden = false;
    voteSelect.closest('.field').hidden = false;

    voteBtn.hidden = false;
    voteBtn.textContent = 'Stimme abgeben';

    nextPersonBtn.hidden = true;
  } else {
    voteConfirmation.textContent = name
      ? `✓ Eure Stimme ist vermerkt. Habt Dank, ${name}.`
      : '✓ Eure Stimme ist vermerkt. Habt Dank.';
  }

  animateFeedback(voteConfirmation);
  gameFeedback('vote', voteBtn, 'vote');

  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;
  saveState();
});

nextPersonBtn.addEventListener('click', () => {
  voteConfirmation.textContent = '';

  voterNameInput.closest('.field').hidden = false;
  voteSelect.closest('.field').hidden = false;

  voterNameInput.value = '';
  voteSelect.selectedIndex = 0;

  voteBtn.hidden = false;
  voteBtn.textContent = 'Stimme abgeben';

  nextPersonBtn.hidden = true;

  voteInfo.textContent = 'Die nächste Person darf vortreten. Die Stimme bleibt geheim.';
  roomStatus.hidden = true;
  roomStatus.textContent = '';

  voterNameInput.focus();
});

endVotingBtn.addEventListener('click', async () => {
if (onlineMode && !isOnlineModerator) {
  voteConfirmation.textContent = 'Nur die ausrufende Person kann diese Runde schließen.';
  return;
}
  
  if (roomMode || onlineMode) {
    const shouldEnd = window.confirm('Soll die Abstimmung wirklich geschlossen werden?');
    if (!shouldEnd) {
      return;
    }
  }

  if (onlineMode && currentPollId) {
    try {
      const { error } = await supabaseClient.from('polls').update({ is_closed: true }).eq('id', currentPollId);
      if (error) {
        throw error;
      }
      isVotingClosed = true;
      await refreshOnlineState();
    } catch (error) {
      console.error(error);
      voteConfirmation.textContent = 'Die Abstimmung konnte nicht geschlossen werden.';
      return;
    }
  }

  const summary = computeSummary();
  buildResultsList(summary);
  buildWheel(summary);
  currentPhase = 'results';
  currentWinnerOption = '';
  saveState();
  gameFeedback('reveal', endVotingBtn, 'reveal');
  showResultsScreen();
  winnerDisplay.textContent = 'Der Glückshafen ist bereit. Das Rad kann in Gang gesetzt werden.';
});

function getCurrentWheelAngle() {
  const transform = window.getComputedStyle(wheel).transform;

  if (!transform || transform === 'none') {
    return 0;
  }

  const matrix = new DOMMatrixReadOnly(transform);
  let angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

  if (angle < 0) {
    angle += 360;
  }

  return angle;
}

spinBtn.addEventListener('click', () => {
  if (wheelIsSpinning) {
    return;
  }

  winnerDisplay.classList.remove('winner-announced');
  winnerDisplay.textContent = '🎡 Das Rad läuft. Haltet es an, wenn das Los fallen soll.';
  setWheelGameState('is-wheel-spinning');
  gameFeedback('wheel-start', spinBtn, 'wheel-start');
  emitAtmosphere('wheel-spin');

  wheelSpinAnimation = wheel.animate(
    [
      { transform: `rotate(${currentRotation}deg)` },
      { transform: `rotate(${currentRotation + 3600}deg)` },
    ],
    {
      duration: 10000,
      iterations: Infinity,
      easing: 'linear',
    }
  );

  wheelIsSpinning = true;
  spinBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  if (!wheelIsSpinning) {
    return;
  }

  const visibleAngle = getCurrentWheelAngle();
  setWheelGameState('is-wheel-settling');
  gameFeedback('tap', stopBtn, null);
  emitAtmosphere('wheel-stop');

  if (wheelSpinAnimation) {
    wheelSpinAnimation.cancel();
    wheelSpinAnimation = null;
  }

  wheel.style.transition = 'none';
  wheel.style.transform = `rotate(${visibleAngle}deg)`;
  void wheel.offsetHeight;

  const summary = computeSummary();
  const weightedWinner = getWeightedWinner(summary);
  currentWinnerOption = weightedWinner ? weightedWinner.option : '';
  const winnerIndex = summary.findIndex((item) => item.option === currentWinnerOption);

  if (winnerIndex < 0) {
    wheelIsSpinning = false;
    spinBtn.disabled = false;
    stopBtn.disabled = true;
    winnerDisplay.textContent = 'Das Los konnte nicht ermittelt werden.';
    return;
  }

  const desiredAngle = calculateStopRotation(summary, winnerIndex) % 360;
  const delta = (desiredAngle - visibleAngle + 360) % 360;
  targetRotation = visibleAngle + 360 * 3 + delta;

  winnerDisplay.textContent = '✨ Der Glückshafen entscheidet …';

  wheel.style.transition = 'transform 2.5s ease-out';
  wheel.style.transform = `rotate(${targetRotation}deg)`;
  currentRotation = targetRotation;
  stopBtn.disabled = true;
});

wheel.addEventListener('transitionend', () => {
  if (!wheelIsSpinning || !currentWinnerOption) {
    return;
  }

  wheelIsSpinning = false;
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  winnerDisplay.textContent = `Das Los fällt auf: ${currentWinnerOption}`;
  winnerDisplay.classList.add('winner-announced');
  setWheelGameState('is-winner');
  completeQuest();
  gameFeedback('winner', wheel, 'winner');
  celebrateWinner();
  emitAtmosphere('winner', { winner: currentWinnerOption });
  saveState();
});

newVotingBtnVote.addEventListener('click', () => {
  resetApp();
});

newVotingBtnResults.addEventListener('click', () => {
  resetApp();
});

joinOnlineBtn.addEventListener('click', async () => {
  joinError.textContent = '';
  const roomCode = joinRoomCodeInput.value.trim().toUpperCase();

  if (!roomCode) {
    joinError.textContent = 'Bitte gebt einen Raumcode ein.';
    return;
  }

  if (!hasOnlineBackend()) {
    joinError.textContent = 'Supabase ist nicht verfügbar. Bitte prüfe die Konfiguration.';
    return;
  }

  try {
    try {
      await ensureAnonymousUser();
    } catch (authError) {
      console.warn('Anonyme Anmeldung beim Beitritt war nicht möglich. Es wird trotzdem versucht, den Raum zu laden.', authError);
    }

    const { data, error } = await supabaseClient
      .from('polls')
      .select('id, question, options, room_code, is_closed')
      .eq('room_code', roomCode)
      .eq('is_closed', false)
      .single();

    if (error) {
      throw error;
    }

    options = data.options || [];
    currentPollId = data.id;
    currentRoomCode = data.room_code;
    currentQuestion = data.question;
    currentVoteCount = 0;
    isVotingClosed = false;
    onlineMode = true;
    roomMode = false;
    isOnlineModerator = false;
    currentBrowserVoteKey = `${data.id}-${Math.random().toString(36).slice(2, 10)}`;
    const storedVoteKey = localStorage.getItem(`gluecksrad-vote-${data.id}`);
    if (storedVoteKey) {
      currentBrowserVoteKey = storedVoteKey;
    }
    fillVoteOptions();
    currentPhase = 'vote';
    saveState();
    await refreshOnlineState();
    startOnlineRefreshLoop();
    gameFeedback('step', joinOnlineBtn, 'step');
    showVoteScreen(currentQuestion);
    voteConfirmation.textContent = 'Ihr seid der Runde beigetreten und könnt nun Eure Stimme abgeben.';
  } catch (error) {
    joinError.textContent = 'Der Beitritt gelang nicht. Bitte prüft den Raumcode und versucht es erneut.';
    console.error('Fehler beim Beitritt zur Online-Abstimmung:', error);
  }
});

document.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('button:not(:disabled)');
  if (!button || button.id === 'sound-toggle') return;

  gameFeedback('tap', button, null);
  if (reducedGameMotion || !gameFxLayer) return;

  const ripple = document.createElement('span');
  ripple.className = 'game-ripple';
  ripple.style.left = `${event.clientX}px`;
  ripple.style.top = `${event.clientY}px`;
  gameFxLayer.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 700);
}, { passive: true });

createAnswerRow('');
createAnswerRow('');
updateRemoveButtons();
updateModeCards();
showWelcome();
restoreSavedState();
