(() => {
  const root = document.documentElement;
  const card = document.querySelector('.card');

  if (!card) return;

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  window.addEventListener('pointermove', (event) => {
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    tx = nx * 1.2;
    ty = ny * -0.9;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
  });

  function tick(time) {
    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;

    root.style.setProperty('--ui-tilt-y', `${cx.toFixed(2)}deg`);
    root.style.setProperty('--ui-tilt-x', `${cy.toFixed(2)}deg`);
    root.style.setProperty('--ui-float-y', `${(Math.sin(time * 0.00055) * 1.5).toFixed(2)}px`);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();