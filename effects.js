(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  if (reducedMotion || !finePointer) {
    root.style.setProperty('--ui-tilt-y', '0deg');
    root.style.setProperty('--ui-tilt-x', '0deg');
    root.style.setProperty('--ui-float-y', '0px');
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastFrame = 0;
  let pageVisible = !document.hidden;

  const frameInterval = 1000 / 30;

  window.addEventListener('pointermove', (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 1.05;
    targetY = (event.clientY / window.innerHeight - 0.5) * -0.78;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (!pageVisible) {
      targetX = 0;
      targetY = 0;
    }
  });

  function tick(time) {
    requestAnimationFrame(tick);

    if (!pageVisible || time - lastFrame < frameInterval) return;
    lastFrame = time;

    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;

    root.style.setProperty('--ui-tilt-y', `${currentX.toFixed(2)}deg`);
    root.style.setProperty('--ui-tilt-x', `${currentY.toFixed(2)}deg`);
    root.style.setProperty('--ui-float-y', `${(Math.sin(time * 0.00048) * 0.8).toFixed(2)}px`);
  }

  requestAnimationFrame(tick);
})();
