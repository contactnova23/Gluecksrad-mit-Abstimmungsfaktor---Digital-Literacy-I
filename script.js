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
    errorElement.textContent = 'Bitte gib eine Abstimmungsfrage ein.';
    questionInput.focus();
    return null;
  }

  if (answers.length < 2) {
    errorElement.textContent = 'Bitte gib mindestens zwei Antwortmöglichkeiten ein.';
    const firstEmptyAnswer = Array.from(answersContainer.querySelectorAll('.answer-input'))
      .find((input) => !input.value.trim());
    firstEmptyAnswer?.focus();
    return null;
  }

  const normalizedAnswers = answers.map((answer) => answer.toLowerCase());
  if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
    errorElement.textContent = 'Bitte verwende jede Antwortmöglichkeit nur einmal.';
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
  if (existingCeremony) {
    existingCeremony.remove();
  }

  const oldConfetti = document.querySelector('.confetti-layer');
  if (oldConfetti) {
    oldConfetti.remove();
  }

  const layer = document.createElement('div');
  layer.className = 'winner-ceremony-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', `Das Los fällt auf: ${currentWinnerOption}`);

  const glow = document.createElement('div');
  glow.className = 'winner-ceremony-glow';
  glow.setAttribute('aria-hidden', 'true');

  const rays = document.createElement('div');
  rays.className = 'winner-ceremony-rays';
  rays.setAttribute('aria-hidden', 'true');

  const ceremony = document.createElement('section');
  ceremony.className = 'winner-ceremony';

  const ornamentTop = document.createElement('div');
  ornamentTop.className = 'winner-ornament winner-ornament-top';
  ornamentTop.textContent = '✦  ⚜  ✦';
  ornamentTop.setAttribute('aria-hidden', 'true');

  const crest = document.createElement('div');
  crest.className = 'winner-crest';
  crest.textContent = '♛';
  crest.setAttribute('aria-hidden', 'true');

  const kicker = document.createElement('p');
  kicker.className = 'winner-ceremony-kicker';
  kicker.textContent = 'Der Glückshafen hat entschieden';

  const title = document.createElement('p');
  title.className = 'winner-ceremony-title';
  title.textContent = 'Das Los fällt auf';

  const name = document.createElement('p');
  name.className = 'winner-ceremony-name';
  name.textContent = currentWinnerOption;

  const divider = document.createElement('div');
  divider.className = 'winner-ceremony-divider';
  divider.setAttribute('aria-hidden', 'true');

  const message = document.createElement('p');
  message.className = 'winner-ceremony-message';
  message.textContent = 'Die gewichtete Ziehung ist abgeschlossen.';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'winner-ceremony-close';
  closeButton.textContent = 'Ergebnis ansehen';

  const ornamentBottom = document.createElement('div');
  ornamentBottom.className = 'winner-ornament winner-ornament-bottom';
  ornamentBottom.textContent = '❦';
  ornamentBottom.setAttribute('aria-hidden', 'true');

  ceremony.append(
    ornamentTop,
    crest,
    kicker,
    title,
    name,
    divider,
    message,
    closeButton,
    ornamentBottom,
  );

  const particleColors = ['#f7e2a1', '#d6ad59', '#fff4ce', '#8aa66d', '#8b4b43'];
  const particleLayer = document.createElement('div');
  particleLayer.className = 'winner-ceremony-particles';
  particleLayer.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 34; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'winner-ceremony-particle';
    particle.style.left = `${4 + Math.random() * 92}%`;
    particle.style.setProperty('--particle-delay', `${Math.random() * 0.65}s`);
    particle.style.setProperty('--particle-duration', `${2.2 + Math.random() * 1.5}s`);
    particle.style.setProperty('--particle-drift', `${-65 + Math.random() * 130}px`);
    particle.style.setProperty('--particle-size', `${4 + Math.random() * 6}px`);
    particle.style.backgroundColor = particleColors[index % particleColors.length];
    particleLayer.appendChild(particle);
  }

  layer.append(glow, rays, particleLayer, ceremony);
  document.body.appendChild(layer);

  document.body.classList.add('winner-ceremony-open');

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      closeCeremony();
    }
  };

  const closeCeremony = () => {
    if (!layer.isConnected) {
      return;
    }

    document.removeEventListener('keydown', handleEscape);
    document.body.classList.remove('winner-ceremony-open');
    layer.classList.add('is-leaving');
    window.setTimeout(() => {
      layer.remove();
      newVotingBtnResults?.focus();
    }, 460);
  };

  closeButton.addEventListener('click', closeCeremony, { once: true });
  document.addEventListener('keydown', handleEscape);
  window.setTimeout(() => {
    if (layer.isConnected) {
      closeButton.focus();
    }
  }, 1150);
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
  window.setTimeout(() => experienceStartBtn.focus(), 120);
}

function showSetupHome() {
  setupSection.hidden = false;
  hideSetupPanels();
  entryChoice.hidden = false;
  createError.textContent = '';
  setupError.textContent = '';
  joinError.textContent = '';
  window.setTimeout(() => showCreateBtn.focus(), 120);
}

function showCreatePanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  createPanel.hidden = false;
  createError.textContent = '';
  setupError.textContent = '';
  window.setTimeout(() => questionInput.focus(), 120);
}

function showModePanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  modePanel.hidden = false;
  setupError.textContent = '';
  updateModeCards();

  const selectedMode = document.querySelector('input[name="voting-mode"]:checked');
  window.setTimeout(() => (selectedMode || roomModeToggle).focus(), 120);
}

function showJoinPanel() {
  setupSection.hidden = false;
  hideSetupPanels();
  joinPanel.hidden = false;
  joinError.textContent = '';
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
  onlineStatus.hidden = true;
  onlineStatus.textContent = '';
  voteBtn.hidden = false;
  nextPersonBtn.hidden = true;

  if (roomMode) {
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  voteInfo.textContent = 'Die abstimmende Person kann jetzt ihre Auswahl treffen. Die Stimme bleibt geheim.';

  endVotingBtn.textContent = 'Moderator: Wahl schließen';
  endVotingBtn.classList.add('moderator-action');

  newVotingBtnVote.hidden = true;
} else {
  endVotingBtn.textContent = 'Wahl schließen';
  endVotingBtn.classList.remove('moderator-action');

  newVotingBtnVote.hidden = false;
  }

  if (onlineMode) {
  onlineStatus.hidden = false;
  onlineStatus.textContent = isOnlineModerator
    ? (currentRoomCode
      ? `Online-Raum: ${currentRoomCode} • ${currentVoteCount} ${currentVoteCount === 1 ? 'Stimme' : 'Stimmen'} bisher abgegeben`
      : 'Online-Abstimmung ist aktiv.')
    : (currentRoomCode
      ? `Online-Raum: ${currentRoomCode} • Deine Stimme bleibt bis zum Ende geheim.`
      : 'Online-Abstimmung ist aktiv.');

  if (isOnlineModerator) {
    endVotingBtn.hidden = false;
    endVotingBtn.textContent = 'Moderator: Wahl schließen';
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
  const palette = [
    '#804337',
    '#6f7d3d',
    '#8d6a37',
    '#546e79',
    '#785277',
    '#a55f36',
    '#4e6a55',
    '#934851',
  ];
  let startAngle = 0;

  summary.forEach((item, index) => {
    const size = totalVotes > 0 ? (item.votes / totalVotes) * 360 : 360 / summary.length;
    const endAngle = startAngle + size;
    const color = palette[index % palette.length];
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
  voteInfo.textContent = 'Die Ergebnisse bleiben bis zum Ende verborgen.';
  voterNameInput.closest('.field').hidden = false;
voteSelect.closest('.field').hidden = false;

endVotingBtn.hidden = false;
endVotingBtn.textContent = 'Wahl schließen';
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
  wheel.style.transform = 'rotate(0deg)';
  wheel.style.transition = 'transform 0.8s ease-out';
  spinBtn.disabled = false;
  stopBtn.disabled = true;
  clearSavedState();
}

async function refreshOnlineState() {
  if (!onlineMode || !currentPollId) {
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
          : 'Online-Abstimmung ist aktiv.')
        : (currentRoomCode
          ? `Online-Raum: ${currentRoomCode} • Deine Stimme bleibt bis zum Ende geheim.`
          : 'Online-Abstimmung ist aktiv.');
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
      winnerDisplay.textContent = 'Glücksrad kann jetzt gedreht werden.';
    }
  } catch (error) {
    console.error('Fehler beim Laden des gespeicherten Zustands:', error);
  }
}

experienceStartBtn.addEventListener('click', showSetupHome);
backToWelcomeBtn.addEventListener('click', showWelcome);
showCreateBtn.addEventListener('click', showCreatePanel);
showJoinBtn.addEventListener('click', showJoinPanel);
backFromCreateBtn.addEventListener('click', showSetupHome);
backToCreateBtn.addEventListener('click', showCreatePanel);
backFromJoinBtn.addEventListener('click', showSetupHome);

addAnswerBtn.addEventListener('click', () => {
  createAnswerRow('');
});

continueToModeBtn.addEventListener('click', () => {
  const setupData = validateSetupDetails(createError);
  if (!setupData) {
    return;
  }

  showModePanel();
});

roomModeToggle.addEventListener('change', updateModeCards);
onlineModeToggle.addEventListener('change', updateModeCards);

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
    setupError.textContent = 'Bitte wähle Raum-Modus oder Online-Modus aus.';
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
    if (!window.supabase) {
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
      voteConfirmation.textContent = `Die Online-Runde ist eröffnet. Raumcode: ${currentRoomCode}`;
      saveState();
      await refreshOnlineState();
      startOnlineRefreshLoop();
      showVoteScreen(question);
      return;
    } catch (error) {
      setupError.textContent = 'Fehler beim Eröffnen der Online-Runde.';
      console.error(error);
      return;
    }
  }

  saveState();
  showVoteScreen(question);
});

voteBtn.addEventListener('click', async () => {
  voteBtn.textContent = 'Stimme abgeben';
  
  const name = voterNameInput.value.trim();
  const selectedOption = voteSelect.value;

  if (!selectedOption) {
    voteConfirmation.textContent = 'Bitte wähle eine Antwort aus.';
    return;
  }

  if (onlineMode) {
    if (!currentPollId || isVotingClosed) {
      voteConfirmation.textContent = 'Diese Online-Runde ist bereits geschlossen.';
      return;
    }

    if (localStorage.getItem(`gluecksrad-vote-${currentPollId}`)) {
      voteConfirmation.textContent = 'Du hast schon einmal für diesen Raum abgestimmt.';
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
          voteConfirmation.textContent = 'Du hast bereits für diesen Raum abgestimmt.';
          return;
        }
        throw error;
      }

      localStorage.setItem(`gluecksrad-vote-${currentPollId}`, currentBrowserVoteKey);

await refreshOnlineState();

voteConfirmation.textContent = `✓ Stimme gespeichert! Deine Auswahl „${selectedOption}“ wurde gezählt.`;
animateFeedback(voteConfirmation);

saveState();
return;

    } catch (error) {
      voteConfirmation.textContent = 'Die Stimme konnte nicht gespeichert werden.';
      console.error(error);
      return;
    }
  }

  votes.push({ name: name || 'Anonym', option: selectedOption });

  if (roomMode) {
    voteConfirmation.textContent = '✓ Stimme gespeichert! Die nächste Person kann jetzt abstimmen.';

    roomStatus.hidden = true;
    roomStatus.textContent = '';

    voteInfo.textContent = 'Die nächste Person kann jetzt abstimmen. Die Stimme bleibt geheim.';

    voterNameInput.closest('.field').hidden = false;
    voteSelect.closest('.field').hidden = false;

    voteBtn.hidden = false;
    voteBtn.textContent = 'Stimme abgeben';

    nextPersonBtn.hidden = true;
  } else {
    voteConfirmation.textContent = name
      ? `✓ Stimme gespeichert! Vielen Dank, ${name}.`
      : '✓ Stimme gespeichert! Vielen Dank.';
  }

  animateFeedback(voteConfirmation);

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

  voteInfo.textContent = 'Die nächste Person kann jetzt abstimmen. Die Stimme bleibt geheim.';
  roomStatus.hidden = true;
  roomStatus.textContent = '';

  voterNameInput.focus();
});

endVotingBtn.addEventListener('click', async () => {
if (onlineMode && !isOnlineModerator) {
  voteConfirmation.textContent = 'Nur die leitende Person kann die Online-Runde schließen.';
  return;
}
  
  if (roomMode || onlineMode) {
    const shouldEnd = window.confirm('Möchtest du die Wahl wirklich schließen?');
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
      voteConfirmation.textContent = 'Die Wahl konnte nicht geschlossen werden.';
      return;
    }
  }

  const summary = computeSummary();
  buildResultsList(summary);
  buildWheel(summary);
  currentPhase = 'results';
  currentWinnerOption = '';
  saveState();
  showResultsScreen();
  winnerDisplay.textContent = 'Glücksrad kann jetzt gedreht werden.';
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
  winnerDisplay.textContent = '🎡 Das Rad dreht sich. Klicke auf „Glücksrad stoppen“.';

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
    winnerDisplay.textContent = 'Es konnte kein Losgewinner ermittelt werden.';
    return;
  }

  const desiredAngle = calculateStopRotation(summary, winnerIndex) % 360;
  const delta = (desiredAngle - visibleAngle + 360) % 360;
  targetRotation = visibleAngle + 360 * 3 + delta;

  winnerDisplay.textContent = '✨ Das Glücksrad entscheidet …';

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
  celebrateWinner();
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
    joinError.textContent = 'Bitte gib einen Raumcode ein.';
    return;
  }

  if (!window.supabase) {
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
    showVoteScreen(currentQuestion);
    voteConfirmation.textContent = 'Du bist dem Online-Raum beigetreten. Du kannst jetzt abstimmen.';
  } catch (error) {
    joinError.textContent = 'Beitritt nicht möglich. Bitte prüfe den Raumcode und versuche es erneut.';
    console.error('Fehler beim Beitritt zur Online-Abstimmung:', error);
  }
});

createAnswerRow('');
createAnswerRow('');
updateRemoveButtons();
updateModeCards();
showWelcome();
restoreSavedState();
