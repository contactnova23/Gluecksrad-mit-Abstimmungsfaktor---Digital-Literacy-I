(() => {
  const toggle = document.getElementById('sound-toggle');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const STORAGE_KEY = 'glueckshafen-ambient-sound';

  let enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
  let context = null;
  let masterGain = null;
  let musicBus = null;
  let effectsBus = null;
  let musicTimer = 0;
  let wheelTimer = 0;
  let currentStage = 'welcome';
  let isUnlocked = false;
  let unlockCuePlayed = false;
  let phraseIndex = 0;

  const NOTE = {
    D3: 146.83,
    A3: 220.00,
    C4: 261.63,
    D4: 293.66,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    C5: 523.25,
    D5: 587.33,
  };

  const PHRASES = [
    [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.D4],
    [NOTE.D4, NOTE.G4, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.F4],
    [NOTE.F4, NOTE.G4, NOTE.A4, NOTE.D5, NOTE.C5, NOTE.A4],
    [NOTE.D4, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.C4, NOTE.D4],
  ];

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute(
      'aria-label',
      enabled ? 'Klangkulisse ausschalten' : 'Klangkulisse einschalten'
    );
    toggle.setAttribute('title', 'Musik und Klänge umschalten');
  }

  function buildAudioGraph() {
    if (!AudioContextClass || context) return;

    context = new AudioContextClass({ latencyHint: 'interactive' });
    masterGain = context.createGain();
    musicBus = context.createGain();
    effectsBus = context.createGain();

    const musicFilter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();
    const delay = context.createDelay(0.8);
    const delayFeedback = context.createGain();
    const delayFilter = context.createBiquadFilter();
    const delayReturn = context.createGain();

    masterGain.gain.value = 0.0001;
    musicBus.gain.value = 0.12;
    effectsBus.gain.value = 1.18;

    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 2600;
    musicFilter.Q.value = 0.22;

    delay.delayTime.value = 0.24;
    delayFeedback.gain.value = 0.16;
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2100;
    delayReturn.gain.value = 0.24;

    compressor.threshold.value = -21;
    compressor.knee.value = 18;
    compressor.ratio.value = 4.8;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.22;

    musicBus.connect(musicFilter);
    musicFilter.connect(masterGain);
    musicFilter.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayReturn);
    delayReturn.connect(masterGain);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);

    effectsBus.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(context.destination);

    applyStageMix(true);
  }

  function rampParam(param, value, duration = 0.55) {
    if (!context || !param) return;
    const now = context.currentTime;
    const current = Math.max(0.0001, Number(param.value) || 0.0001);
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), now + duration);
  }

  function getStageMix(stage) {
    const mixes = {
      welcome: { master: 1.14, music: 0.078 },
      'market-entry': { master: 1.18, music: 0.072 },
      'scribe-stall': { master: 1.12, music: 0.064 },
      assembly: { master: 1.20, music: 0.060 },
      'town-caller': { master: 1.16, music: 0.058 },
      voting: { master: 1.10, music: 0.046 },
      results: { master: 1.18, music: 0.058 },
      'wheel-spin': { master: 1.22, music: 0.018 },
      'wheel-stop': { master: 1.18, music: 0.032 },
      winner: { master: 1.24, music: 0.066 },
    };
    return mixes[stage] || mixes.welcome;
  }

  function applyStageMix(immediate = false) {
    if (!context || !masterGain || !musicBus) return;
    const mix = getStageMix(currentStage);
    const duration = immediate ? 0.02 : 0.72;

    rampParam(masterGain.gain, enabled && !document.hidden ? mix.master : 0.0001, duration);
    rampParam(musicBus.gain, enabled && !document.hidden ? mix.music : 0.0001, duration);
  }

  function connectMusicVoice(node) {
    if (!node || !musicBus) return;
    node.connect(musicBus);
  }

  function playPluckedTone(frequency, startOffset = 0, strength = 1, duration = 1.45) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime + startOffset;
    const fundamental = context.createOscillator();
    const harmonic = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const harmonicGain = context.createGain();

    fundamental.type = 'triangle';
    fundamental.frequency.setValueAtTime(frequency, now);
    fundamental.detune.setValueAtTime(-2.5, now);

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * 2, now);
    harmonic.detune.setValueAtTime(3.5, now);
    harmonicGain.gain.value = 0.22;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1850, now);
    filter.frequency.exponentialRampToValueAtTime(780, now + duration);
    filter.Q.value = 0.34;

    const peak = Math.max(0.0002, 0.040 * strength);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(peak * 0.34, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    fundamental.connect(filter);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);
    filter.connect(gain);
    connectMusicVoice(gain);

    fundamental.start(now);
    harmonic.start(now);
    fundamental.stop(now + duration + 0.04);
    harmonic.stop(now + duration + 0.04);
  }

  function playSoftDrone(startOffset = 0, duration = 5.7, strength = 1) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime + startOffset;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const root = context.createOscillator();
    const fifth = context.createOscillator();
    const fifthGain = context.createGain();

    root.type = 'sine';
    root.frequency.value = NOTE.D3;
    fifth.type = 'sine';
    fifth.frequency.value = NOTE.A3;
    fifthGain.gain.value = 0.42;

    filter.type = 'lowpass';
    filter.frequency.value = 620;
    filter.Q.value = 0.18;

    const peak = 0.014 * strength;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.42);
    gain.gain.setValueAtTime(Math.max(0.0002, peak), now + Math.max(0.5, duration - 0.85));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    root.connect(filter);
    fifth.connect(fifthGain);
    fifthGain.connect(filter);
    filter.connect(gain);
    connectMusicVoice(gain);

    root.start(now);
    fifth.start(now);
    root.stop(now + duration + 0.05);
    fifth.stop(now + duration + 0.05);
  }

  function playMusicPhrase() {
    if (!context || !enabled || document.hidden || !isUnlocked) return;

    const sparse = currentStage === 'wheel-spin';
    const phrase = PHRASES[phraseIndex % PHRASES.length];
    phraseIndex += 1;

    if (sparse) {
      playSoftDrone(0, 5.2, 0.42);
      playPluckedTone(NOTE.D4, 0.15, 0.42, 1.8);
      playPluckedTone(NOTE.A4, 3.1, 0.30, 1.6);
      return;
    }

    playSoftDrone(0, 5.8, currentStage === 'voting' ? 0.52 : 0.72);

    const spacing = 0.78;
    phrase.forEach((frequency, index) => {
      const accent = index === 0 || index === phrase.length - 1 ? 0.92 : 0.70;
      playPluckedTone(frequency, 0.18 + index * spacing, accent, 1.36);
    });
  }

  function stopMusic() {
    window.clearTimeout(musicTimer);
    musicTimer = 0;
  }

  function scheduleMusic() {
    stopMusic();
    if (!isUnlocked || !enabled || document.hidden) return;

    playMusicPhrase();
    const delay = currentStage === 'wheel-spin' ? 6100 : 6400;
    musicTimer = window.setTimeout(scheduleMusic, delay);
  }

  async function unlockAudio() {
    if (!enabled || !AudioContextClass) return;
    buildAudioGraph();

    if (context?.state === 'suspended') {
      try {
        await context.resume();
      } catch (error) {
        console.warn('Die Klangkulisse konnte nicht gestartet werden.', error);
        return;
      }
    }

    const wasLocked = !isUnlocked;
    isUnlocked = true;
    applyStageMix();

    if (wasLocked || !musicTimer) {
      scheduleMusic();
    }

    if (!unlockCuePlayed) {
      unlockCuePlayed = true;
      window.setTimeout(() => playStageChime(0.42), 120);
    }
  }

  function playTone(frequency, duration, peak, type = 'sine', startOffset = 0) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime + startOffset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(effectsBus);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.06);
  }

  function createTransientBuffer(duration = 0.12) {
    const length = Math.max(32, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      const envelope = Math.pow(1 - index / length, 3.2);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }

    return buffer;
  }

  function playTransient(duration, peak, frequency = 900, type = 'lowpass') {
    if (!context || !enabled || document.hidden) return;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const now = context.currentTime;

    source.buffer = createTransientBuffer(Math.max(0.08, duration));
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.5;
    gain.gain.setValueAtTime(Math.max(0.0002, peak), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsBus);
    source.start(now);
    source.stop(now + duration + 0.03);
  }

  function playBell(strength = 1) {
    playTone(622, 1.42, 0.090 * strength, 'sine');
    playTone(932, 1.10, 0.052 * strength, 'sine', 0.018);
    playTone(1244, 0.82, 0.027 * strength, 'sine', 0.032);
  }

  function playStageChime(strength = 1) {
    playTone(523.25, 0.40, 0.058 * strength, 'triangle');
    playTone(659.25, 0.48, 0.048 * strength, 'triangle', 0.075);
    playTone(783.99, 0.58, 0.038 * strength, 'sine', 0.145);
  }

  function playWoodClick(strength = 1) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(185 + Math.random() * 45, now);
    oscillator.frequency.exponentialRampToValueAtTime(78, now + 0.082);
    filter.type = 'lowpass';
    filter.frequency.value = 1300;
    gain.gain.setValueAtTime(0.105 * strength, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(effectsBus);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  function playSealStamp() {
    playTransient(0.13, 0.085, 520, 'lowpass');
    playTone(145, 0.20, 0.090, 'triangle');
    playTone(740, 0.44, 0.040, 'sine', 0.09);
    playTone(988, 0.38, 0.028, 'sine', 0.15);
  }

  function playQuill() {
    playTransient(0.11, 0.022, 1900, 'highpass');
    playTone(880, 0.14, 0.014, 'sine', 0.06);
  }

  function stopWheelTicks() {
    window.clearTimeout(wheelTimer);
    wheelTimer = 0;
  }

  function scheduleWheelTick() {
    stopWheelTicks();
    if (!isUnlocked || !enabled || document.hidden || currentStage !== 'wheel-spin') return;

    playWoodClick(0.86);
    wheelTimer = window.setTimeout(scheduleWheelTick, 88 + Math.random() * 18);
  }

  function setStage(stage) {
    currentStage = stage || 'welcome';

    if (currentStage === 'wheel-spin') {
      scheduleWheelTick();
    } else {
      stopWheelTicks();
    }

    if (currentStage === 'wheel-stop') {
      playWoodClick(1.16);
      window.setTimeout(() => playWoodClick(0.94), 145);
      window.setTimeout(() => playWoodClick(0.74), 315);
    }

    if (currentStage === 'winner') {
      playBell(1.10);
      window.setTimeout(() => playBell(0.72), 390);
    }

    applyStageMix();
  }

  document.addEventListener('glueckshafen:stage', (event) => {
    setStage(event.detail?.stage);
    if (enabled) unlockAudio();
  });

  document.addEventListener('glueckshafen:feedback', (event) => {
    const kind = event.detail?.kind || event.detail?.type;
    if (!enabled) return;
    unlockAudio();

    if (kind === 'stage-advance' || kind === 'step') playStageChime(0.68);
    if (kind === 'answer-added' || kind === 'add') playQuill();
    if (kind === 'mode-selected' || kind === 'mode') playStageChime(0.44);
    if (kind === 'vote-recorded' || kind === 'vote') playSealStamp();
    if (kind === 'wheel-start') playStageChime(0.52);
    if (kind === 'reveal') playBell(0.46);
    if (kind === 'tap') playWoodClick(0.16);
  });

  document.addEventListener('pointerdown', () => {
    if (enabled) unlockAudio();
  }, { once: true, capture: true });

  document.addEventListener('keydown', () => {
    if (enabled) unlockAudio();
  }, { once: true, capture: true });

  toggle?.addEventListener('click', async (event) => {
    event.stopPropagation();
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    updateToggle();

    if (enabled) {
      await unlockAudio();
      applyStageMix();
      playStageChime(0.70);
    } else {
      stopWheelTicks();
      stopMusic();
      applyStageMix();
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (!context) return;

    if (document.hidden) {
      stopWheelTicks();
      stopMusic();
      applyStageMix(true);
      try {
        await context.suspend();
      } catch (_) {
        // Manche Browser verwalten den AudioContext selbst.
      }
    } else if (enabled) {
      try {
        await context.resume();
      } catch (_) {
        // Fortsetzen wird beim naechsten Nutzereingriff erneut versucht.
      }
      applyStageMix();
      scheduleMusic();
      if (currentStage === 'wheel-spin') scheduleWheelTick();
    }
  });

  updateToggle();
})();
