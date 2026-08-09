(() => {
  const toggle = document.getElementById('sound-toggle');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const STORAGE_KEY = 'glueckshafen-ambient-sound';

  let enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
  let context = null;
  let masterGain = null;
  let windGain = null;
  let crowdGain = null;
  let eventTimer = 0;
  let wheelTimer = 0;
  let wheelTickDelay = 82;
  let currentStage = 'welcome';
  let isUnlocked = false;

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute(
      'aria-label',
      enabled ? 'Marktgeräusche ausschalten' : 'Marktgeräusche einschalten'
    );
  }

  function createNoiseBuffer(seconds = 2) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = last * 3.4;
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
    gain.connect(masterGain);
    source.start();

    return gain;
  }

  function buildAudioGraph() {
    if (!AudioContextClass || context) return;

    context = new AudioContextClass({ latencyHint: 'playback' });
    masterGain = context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    const noise = createNoiseBuffer();
    windGain = createNoiseLayer(noise, 'lowpass', 520, 0.3, 0.016);
    crowdGain = createNoiseLayer(noise, 'bandpass', 690, 0.55, 0.010);

    const crowdLfo = context.createOscillator();
    const crowdLfoGain = context.createGain();
    crowdLfo.type = 'sine';
    crowdLfo.frequency.value = 0.075;
    crowdLfoGain.gain.value = 0.0045;
    crowdLfo.connect(crowdLfoGain);
    crowdLfoGain.connect(crowdGain.gain);
    crowdLfo.start();

    const windLfo = context.createOscillator();
    const windLfoGain = context.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.045;
    windLfoGain.gain.value = 0.005;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);
    windLfo.start();

    applyStageMix(true);
  }

  function rampParam(param, value, duration = 0.8) {
    if (!context || !param) return;
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(Math.max(0.0001, param.value), now);
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), now + duration);
  }

  function getStageMix(stage) {
    const mixes = {
      welcome: { master: 0.62, wind: 0.017, crowd: 0.006 },
      'market-entry': { master: 0.72, wind: 0.015, crowd: 0.011 },
      'scribe-stall': { master: 0.68, wind: 0.014, crowd: 0.009 },
      assembly: { master: 0.74, wind: 0.013, crowd: 0.013 },
      'town-caller': { master: 0.70, wind: 0.014, crowd: 0.010 },
      voting: { master: 0.66, wind: 0.012, crowd: 0.008 },
      results: { master: 0.76, wind: 0.013, crowd: 0.012 },
      'wheel-spin': { master: 0.80, wind: 0.014, crowd: 0.014 },
      'wheel-stop': { master: 0.76, wind: 0.013, crowd: 0.010 },
      winner: { master: 0.82, wind: 0.012, crowd: 0.016 },
    };
    return mixes[stage] || mixes.welcome;
  }

  function applyStageMix(immediate = false) {
    if (!context || !masterGain) return;
    const mix = getStageMix(currentStage);
    const duration = immediate ? 0.02 : 0.85;

    rampParam(masterGain.gain, enabled && !document.hidden ? mix.master : 0.0001, duration);
    rampParam(windGain?.gain, mix.wind, duration);
    rampParam(crowdGain?.gain, mix.crowd, duration);
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
  }

  function playTone(frequency, duration, peak, type = 'sine', startOffset = 0) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime + startOffset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  function playBell(strength = 1) {
    playTone(622, 1.45, 0.040 * strength, 'sine');
    playTone(932, 1.10, 0.023 * strength, 'sine', 0.015);
    playTone(1244, 0.82, 0.012 * strength, 'sine', 0.025);
  }

  function playWoodClick(strength = 1) {
    if (!context || !enabled || document.hidden) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(152 + Math.random() * 32, now);
    oscillator.frequency.exponentialRampToValueAtTime(72, now + 0.075);
    filter.type = 'lowpass';
    filter.frequency.value = 980;
    gain.gain.setValueAtTime(0.028 * strength, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.11);
  }

  function playDistantCall() {
    if (!context || !enabled || document.hidden) return;
    const base = 190 + Math.random() * 30;
    playTone(base, 0.32, 0.009, 'triangle');
    playTone(base * 1.18, 0.28, 0.007, 'triangle', 0.16);
  }

  function scheduleAmbientEvent() {
    window.clearTimeout(eventTimer);
    if (!isUnlocked || !enabled || document.hidden) return;

    const delay = 8500 + Math.random() * 9000;
    eventTimer = window.setTimeout(() => {
      const random = Math.random();
      if (random < 0.22) {
        playBell(0.42);
      } else if (random < 0.68) {
        playWoodClick(0.55);
        window.setTimeout(() => playWoodClick(0.36), 170 + Math.random() * 210);
      } else {
        playDistantCall();
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

    playWoodClick(0.72);
    wheelTimer = window.setTimeout(scheduleWheelTick, wheelTickDelay);
  }

  function setStage(stage) {
    currentStage = stage || 'welcome';

    if (currentStage === 'wheel-spin') {
      wheelTickDelay = 76;
      scheduleWheelTick();
    } else {
      stopWheelTicks();
    }

    if (currentStage === 'wheel-stop') {
      playWoodClick(0.95);
      window.setTimeout(() => playWoodClick(0.72), 155);
      window.setTimeout(() => playWoodClick(0.52), 345);
    }

    if (currentStage === 'winner') {
      playBell(1);
      window.setTimeout(() => playBell(0.62), 360);
    }

    applyStageMix();
  }

  document.addEventListener('glueckshafen:stage', (event) => {
    setStage(event.detail?.stage);
    if (enabled) unlockAudio();
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
        // Fortsetzen wird beim nächsten Nutzereingriff erneut versucht.
      }
      applyStageMix();
      scheduleAmbientEvent();
      if (currentStage === 'wheel-spin') scheduleWheelTick();
    }
  });

  updateToggle();
})();
