(() => {
  const root = document.documentElement;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener('pointermove', (event) => {
    targetX = (event.clientX / window.innerWidth - 0.5) * 1.2;
    targetY = (event.clientY / window.innerHeight - 0.5) * -0.9;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function tick(time) {
    currentX += (targetX - currentX) * 0.045;
    currentY += (targetY - currentY) * 0.045;

    root.style.setProperty('--ui-tilt-y', `${currentX.toFixed(2)}deg`);
    root.style.setProperty('--ui-tilt-x', `${currentY.toFixed(2)}deg`);
    root.style.setProperty('--ui-float-y', `${(Math.sin(time * 0.00055) * 1.25).toFixed(2)}px`);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();