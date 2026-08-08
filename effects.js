(() => {
  const root = document.documentElement;
  const particleLayer = document.getElementById('vr-particles');

  if (!particleLayer) return;

  // Separate visual-only particle field.
  const colors = ['#f5c874', '#b9d98a', '#d6c6ff', '#fff4d7', '#ffc0cb'];
  const particleCount = window.matchMedia('(max-width: 700px)').matches ? 18 : 30;

  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'vr-particle';

    const size = 2 + Math.random() * 4;
    const left = 6 + Math.random() * 88;
    const top = 48 + Math.random() * 46;
    const duration = 7 + Math.random() * 8;
    const delay = -(Math.random() * duration);
    const drift = -45 + Math.random() * 90;
    const color = colors[i % colors.length];

    particle.style.left = `${left}%`;
    particle.style.top = `${top}%`;
    particle.style.setProperty('--size', `${size}px`);
    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--delay', `${delay}s`);
    particle.style.setProperty('--drift', `${drift}px`);
    particle.style.setProperty('--particle-color', color);

    particleLayer.appendChild(particle);
  }

  // Smooth mouse/touch parallax. This only updates CSS custom properties.
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const setTarget = (clientX, clientY) => {
    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;

    targetX = Math.max(-1, Math.min(1, x)) * 18;
    targetY = Math.max(-1, Math.min(1, y)) * 12;
  };

  window.addEventListener('pointermove', (event) => {
    setTarget(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  // Mobile tilt if the browser provides orientation events without asking permission.
  window.addEventListener('deviceorientation', (event) => {
    if (typeof event.gamma !== 'number' || typeof event.beta !== 'number') return;

    const gamma = Math.max(-25, Math.min(25, event.gamma)) / 25;
    const beta = Math.max(-25, Math.min(25, event.beta - 35)) / 25;

    targetX = gamma * 13;
    targetY = beta * 8;
  }, { passive: true });

  const animate = () => {
    currentX += (targetX - currentX) * 0.055;
    currentY += (targetY - currentY) * 0.055;

    root.style.setProperty('--vr-look-x', `${currentX.toFixed(2)}px`);
    root.style.setProperty('--vr-look-y', `${currentY.toFixed(2)}px`);
    root.style.setProperty('--vr-look-x-soft', `${(currentX * 0.62).toFixed(2)}px`);
    root.style.setProperty('--vr-look-y-soft', `${(currentY * 0.62).toFixed(2)}px`);

    requestAnimationFrame(animate);
  };

  animate();
})();