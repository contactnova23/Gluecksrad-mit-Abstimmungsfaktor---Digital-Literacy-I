(() => {
  const toggle = document.getElementById('sound-toggle');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const STORAGE_KEY = 'glueckshafen-ambient-sound';

  let enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
  let context = null;
  let masterGain = null;
  let ambientBus = null;
  let effectsBus = null;
  let windGain = null;
  let crowdGain = null;
  let clothGain = null;
  let eventTimer = 0;
  let wheelTimer = 0;
  let currentStage = 'welcome';
  let isUnlocked = false;
  let unlockCuePlayed = false;

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute(
      'aria-label',
      enabled ? 'Marktgeräusche ausschalten' : 'Marktgeräusche einschalten'
    );
  }

  function createNoiseBuffer(seconds = 3) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;

    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      brown = brown * 0.982 + white * 0.018;
      data[index] = Math.max(-1, Math.min(1, brown * 3.7));
    }

    return buffer;
  }

  function createNoiseLayer(buffer, filterType, frequency, q, level) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = buffer;
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    gain.gain.value = level;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ambientBus);
    source.start();

    return gain;
  }

  function buildAudioGraph() {
    if (!AudioContextClass || context) return;

    context = new AudioContextClass({ latencyHint: 'interactive' });
    masterGain = context.createGain();
    ambientBus = context.createGain();
    effectsBus = context.createGain();
    const compressor = context.createDynamicsCompressor();

    masterGain.gain.value = 0.0001;
    ambientBus.gain.value = 1;
    effectsBus.gain.value = 1.18;

    compressor.threshold.value = -20;
    compressor.knee.value = 20;
    compressor.ratio.value = 5.8;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.20;

    ambientBus.connect(masterGain);
    effectsBus.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(context.destination);

    const noise = createNoiseBuffer();
    windGain = createNoiseLayer(noise, 'lowpass', 720, 0.24, 0.112);
    crowdGain = createNoiseLayer(noise, 'bandpass', 860, 0.68, 0.098);
    clothGain = createNoiseLayer(noise, 'highpass', 1450, 0.36, 0.030);

    const crowdLfo = context.createOscillator();
    const crowdLfoGain = context.createGain();
    crowdLfo.type = 'sine';
    crowdLfo.frequency.value = 0.082;
    crowdLfoGain.gain.value = 0.032;
    crowdLfo.connect(crowdLfoGain);
    crowdLfoGain.connect(crowdGain.gain);
    crowdLfo.start();

    const windLfo = context.createOscillator();
    const windLfoGain = context.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.052;
    windLfoGain.gain.value = 0.024;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);
    windLfo.start();

    const clothLfo = context.createOscillator();
    const clothLfoGain = context.createGain();
    clothLfo.type = 'sine';
    clothLfo.frequency.value = 0.17;
    clothLfoGain.gain.value = 0.012;
    clothLfo.connect(clothLfoGain);
    clothLfoGain.connect(clothGain.gain);
    clothLfo.start();

    applyStageMix(true);
  }

  function rampParam(param, value, duration = 0.55) {
    if (!context || !param) return;
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(Math.max(0.0001, param.value), now);
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), now + duration);
  }

  function getStageMix(stage) {
    const mixes = {
      welcome: { master: 1.14, wind: 0.118, crowd: 0.068, cloth: 0.024 },
      'market-entry': { master: 1.18, wind: 0.104, crowd: 0.144, cloth: 0.034 },
      'scribe-stall': { master: 1.12, wind: 0.092, crowd: 0.112, cloth: 0.030 },
      assembly: { master: 1.20, wind: 0.094, crowd: 0.156, cloth: 0.036 },
      'town-caller': { master: 1.16, wind: 0.098, crowd: 0.128, cloth: 0.030 },
      voting: { master: 1.10, wind: 0.084, crowd: 0.094, cloth: 0.024 },
      results: { master: 1.18, wind: 0.092, crowd: 0.138, cloth: 0.030 },
      'wheel-spin': { master: 1.22, wind: 0.102, crowd: 0.170, cloth: 0.040 },
      'wheel-stop': { master: 1.18, wind: 0.090, crowd: 0.120, cloth: 0.028 },
      winner: { master: 1.24, wind: 0.086, crowd: 0.182, cloth: 0.036 },
    };
    return mixes[stage] || mixes.welcome;
  }

  function applyStageMix(immediate = false) {
    if (!context || !masterGain) return;
    const mix = getStageMix(currentStage);
    const duration = immediate ? 0.02 : 0.62;

    rampParam(masterGain.gain, enabled && !document.hidden ? mix.master : 0.0001, duration);
    rampParam(windGain?.gain, mix.wind, duration);
    rampParam(crowdGain?.gain, mix.crowd, duration);
    rampParam(clothGain?.gain, mix.cloth, duration);
  }

  async function unlockAudio() {
    if (!enabled || !AudioContextClass) return;
    buildAudioGraph();

    if (context?.state === 'suspended') {
      try {
        await context.resume();
      } catch (error) {
        console.warn('Die prozedurale Klangkulisse konnte nicht gestartet werden.', error);
        return;
      }
    }

    isUnlocked = true;
    applyStageMix();
    scheduleAmbientEvent();

    if (!unlockCuePlayed) {
      unlockCuePlayed = true;
      window.setTimeout(() => playStageChime(0.48), 120);
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
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 1.18), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(effectsBus);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.06);
  }

  function playNoiseHit(duration, peak, frequency = 900, type = 'lowpass') {
    if (!context || !enabled || document.hidden) return;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const now = context.currentTime;

    source.buffer = createNoiseBuffer(Math.max(0.12, duration + 0.04));
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.5;
    gain.gain.setValueAtTime(Math.max(0.0002, peak * 1.16), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsBus);
    source.start(now);
    source.stop(now + duration + 0.05);
  }

  function playBell(strength = 1) {
    playTone(622, 1.55, 0.120 * strength, 'sine');
    playTone(932, 1.22, 0.070 * strength, 'sine', 0.018);
    playTone(1244, 0.92, 0.036 * strength, 'sine', 0.032);
  }

  function playStageChime(strength = 1) {
    playTone(523.25, 0.44, 0.074 * strength, 'triangle');
    playTone(659.25, 0.52, 0.064 * strength, 'triangle', 0.075);
    playTone(783.99, 0.64, 0.050 * strength, 'sine', 0.145);
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
    playNoiseHit(0.16, 0.115, 540, 'lowpass');
    playTone(145, 0.22, 0.110, 'triangle');
    playTone(740, 0.48, 0.050, 'sine', 0.09);
    playTone(988, 0.42, 0.036, 'sine', 0.15);
  }

  function playQuill() {
    playNoiseHit(0.18, 0.045, 1850, 'highpass');
    playTone(880, 0.16, 0.018, 'sine', 0.07);
  }

  function playDistantCall() {
    const base = 205 + Math.random() * 36;
    playTone(base, 0.34, 0.030, 'triangle');
    playTone(base * 1.17, 0.31, 0.024, 'triangle', 0.17);
  }

  function playBird() {
    const base = 1280 + Math.random() * 260;
    playTone(base, 0.12, 0.021, 'sine');
    playTone(base * 1.14, 0.11, 0.018, 'sine', 0.10);
    playTone(base * 0.94, 0.14, 0.015, 'sine', 0.21);
  }

  function scheduleAmbientEvent() {
    window.clearTimeout(eventTimer);
    if (!isUnlocked || !enabled || document.hidden) return;

    const delay = 3200 + Math.random() * 3600;
    eventTimer = window.setTimeout(() => {
      const random = Math.random();
      if (random < 0.20) {
        playBell(0.52);
      } else if (random < 0.52) {
        playWoodClick(0.56);
        window.setTimeout(() => playWoodClick(0.42), 180 + Math.random() * 220);
      } else if (random < 0.78) {
        playDistantCall();
      } else {
        playBird();
      }
      scheduleAmbientEvent();
    }, delay);
  }

  function stopWheelTicks() {
    window.clearTimeout(wheelTimer);
    wheelTimer = 0;
  }

  function scheduleWheelTick() {
    stopWheelTicks();
    if (!isUnlocked || !enabled || document.hidden || currentStage !== 'wheel-spin') return;

    playWoodClick(0.88);
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
      playWoodClick(1.18);
      window.setTimeout(() => playWoodClick(0.96), 145);
      window.setTimeout(() => playWoodClick(0.76), 315);
    }

    if (currentStage === 'winner') {
      playBell(1.18);
      window.setTimeout(() => playBell(0.82), 390);
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

    if (kind === 'stage-advance' || kind === 'step') playStageChime(0.72);
    if (kind === 'answer-added' || kind === 'add') playQuill();
    if (kind === 'mode-selected' || kind === 'mode') playStageChime(0.46);
    if (kind === 'vote-recorded' || kind === 'vote') playSealStamp();
    if (kind === 'wheel-start') playStageChime(0.55);
    if (kind === 'reveal') playBell(0.50);
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
      playStageChime(0.76);
    } else {
      stopWheelTicks();
      window.clearTimeout(eventTimer);
      applyStageMix();
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (!context) return;

    if (document.hidden) {
      stopWheelTicks();
      window.clearTimeout(eventTimer);
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
      scheduleAmbientEvent();
      if (currentStage === 'wheel-spin') scheduleWheelTick();
    }
  });

  updateToggle();
})();
