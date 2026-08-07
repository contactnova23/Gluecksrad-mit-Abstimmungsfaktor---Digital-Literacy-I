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

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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
  onlineStatus.hidden = true;
  onlineStatus.textContent = '';
  voteBtn.hidden = false;
  nextPersonBtn.hidden = true;

  if (roomMode) {
    roomStatus.hidden = false;
    roomStatus.textContent = `${votes.length} ${votes.length === 1 ? 'Stimme wurde' : 'Stimmen wurden'} bisher abgegeben.`;
  }

  if (onlineMode) {
    onlineStatus.hidden = false;
    onlineStatus.textContent = currentRoomCode
      ? `Online-Raum: ${currentRoomCode} • ${currentVoteCount} ${currentVoteCount === 1 ? 'Stimme' : 'Stimmen'} bisher abgegeben`
      : 'Online-Abstimmung ist aktiv.';
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
    if (randomValue <= runningTotal) {
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
    onlineMode,
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
  setupSection.hidden = false;
  voteSection.hidden = true;
  resultsSection.hidden = true;
  roomStatus.hidden = true;
  roomStatus.textContent = '';
  onlineStatus.hidden = true;
  onlineStatus.textContent = '';
  voteInfo.textContent = 'Die Ergebnisse bleiben bis zum Ende verborgen.';
  options = [];
  votes = [];
  currentRotation = 0;
  targetRotation = 0;
  wheelIsSpinning = false;
  roomMode = false;
  onlineMode = false;
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

    const { data: voteData, error: voteError } = await supabaseClient
      .from('votes')
      .select('option, voter_name')
      .eq('poll_id', currentPollId);

    if (voteError) {
      throw voteError;
    }

    votes = (voteData || []).map((vote) => ({ name: vote.voter_name, option: vote.option }));
    currentVoteCount = votes.length;
    saveState();

    if (currentPhase === 'vote' && onlineMode) {
      showVoteScreen(currentQuestion);
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

startBtn.addEventListener('click', async () => {
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
  fillVoteOptions();
  currentPhase = 'vote';

  if (onlineMode) {
    if (!window.supabase) {
      setupError.textContent = 'Supabase ist nicht verfügbar. Bitte prüfe die Konfiguration.';
      return;
    }

    try {
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
      voteConfirmation.textContent = `Online-Abstimmung gestartet. Raumcode: ${currentRoomCode}`;
      saveState();
      await refreshOnlineState();
      startOnlineRefreshLoop();
      showVoteScreen(question);
      return;
    } catch (error) {
      setupError.textContent = 'Fehler beim Starten der Online-Abstimmung.';
      console.error(error);
      return;
    }
  }

  saveState();
  showVoteScreen(question);
});

voteBtn.addEventListener('click', async () => {
  const name = voterNameInput.value.trim();
  const selectedOption = voteSelect.value;

  if (!selectedOption) {
    voteConfirmation.textContent = 'Bitte wähle eine Antwort aus.';
    return;
  }

  if (onlineMode) {
    if (!currentPollId || isVotingClosed) {
      voteConfirmation.textContent = 'Diese Online-Abstimmung ist bereits beendet.';
      return;
    }

    if (localStorage.getItem(`gluecksrad-vote-${currentPollId}`)) {
      voteConfirmation.textContent = 'Du hast schon einmal für diesen Raum abgestimmt.';
      return;
    }

    try {
      const { error } = await supabaseClient.from('votes').insert({
        poll_id: currentPollId,
        option: selectedOption,
        voter_name: name || 'Anonym',
        browser_key: currentBrowserVoteKey,
      });

      if (error) {
        throw error;
      }

      localStorage.setItem(`gluecksrad-vote-${currentPollId}`, currentBrowserVoteKey);
      await refreshOnlineState();
      voteConfirmation.textContent = 'Danke! Deine Stimme wurde in der Online-Abstimmung gespeichert.';
      saveState();
      voteSelect.selectedIndex = 0;
      showVoteScreen(currentQuestion);
      return;
    } catch (error) {
      voteConfirmation.textContent = 'Die Stimme konnte nicht gespeichert werden.';
      console.error(error);
      return;
    }
  }

  votes.push({ name: name || 'Anonym', option: selectedOption });

  if (roomMode) {
    voteConfirmation.textContent = 'Deine Stimme wurde gespeichert. Bitte gib das Gerät an die nächste Person weiter.';
    roomStatus.hidden = false;
    roomStatus.textContent = `${votes.length} ${votes.length === 1 ? 'Stimme wurde' : 'Stimmen wurden'} bisher abgegeben.`;
    voteBtn.hidden = true;
    nextPersonBtn.hidden = false;
  } else {
    voteConfirmation.textContent = name ? `Vielen Dank, ${name}. Deine Stimme wurde gezählt.` : 'Vielen Dank. Deine Stimme wurde gezählt.';
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

endVotingBtn.addEventListener('click', async () => {
  if (roomMode || onlineMode) {
    const shouldEnd = window.confirm('Möchtest du die Abstimmung wirklich beenden?');
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
      voteConfirmation.textContent = 'Die Abstimmung konnte nicht beendet werden.';
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

spinBtn.addEventListener('click', () => {
  if (wheelIsSpinning) {
    return;
  }

  const summary = computeSummary();
  const weightedWinner = getWeightedWinner(summary);
  currentWinnerOption = weightedWinner ? weightedWinner.option : '';
  const winnerIndex = summary.findIndex((item) => item.option === currentWinnerOption);
  const extraRotation = calculateStopRotation(summary, winnerIndex);
  targetRotation = currentRotation + extraRotation;

  wheel.style.transition = 'transform 3s ease-out';
  wheel.style.transform = `rotate(${targetRotation}deg)`;
  currentRotation = targetRotation;
  wheelIsSpinning = true;
  spinBtn.disabled = true;
  stopBtn.disabled = false;
});
wheel.addEventListener('transitionend', () => {
  if (!wheelIsSpinning) {
    return;
  }

  wheelIsSpinning = false;
  spinBtn.disabled = false;
  stopBtn.disabled = true;

  if (currentWinnerOption) {
    winnerDisplay.textContent = `Gewinner: ${currentWinnerOption}`;
  }
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
  const winner = currentWinnerOption ? { option: currentWinnerOption } : getWinner(summary);
  winnerDisplay.textContent = winner ? `Gewinner: ${winner.option}` : 'Noch keine Stimmen vorhanden.';
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
    const { data, error } = await supabaseClient
      .from('polls')
      .select('*')
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
    joinError.textContent = 'Dieser Raumcode wurde nicht gefunden oder die Abstimmung ist bereits beendet.';
    console.error(error);
  }
});

createAnswerRow('');
createAnswerRow('');
updateRemoveButtons();
restoreSavedState();
