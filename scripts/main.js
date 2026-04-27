let doneClicked = false;
let doneCount = 0;

document.querySelectorAll('.pin').forEach(pin => {
  pin.addEventListener('click', () => {
    if (pin.classList.contains('gone')) return;
    if (!doneClicked && pin.classList.contains('knocked')) return;
    pin.classList.toggle('knocked');
    document.getElementById('score-area').textContent = 'Click pins to knock them down';
  });
});

document.getElementById('done-btn').addEventListener('click', () => {
  doneCount++;

  const knockedPins = document.querySelectorAll('.pin.knocked');
  const total = knockedPins.length + document.querySelectorAll('.pin.gone').length;

  const isFirstBall = doneCount % 2 === 1;
  const message =
    total === 0 ? 'No pins knocked down.'
    : total === 10 && isFirstBall ? 'STRIKE! All 10 pins knocked down!'
    : total === 10 ? 'SPARE! All 10 pins knocked down!'
    : `${total} pin${total === 1 ? '' : 's'} knocked down.`;

  document.getElementById('score-area').textContent =
    doneCount % 2 === 0 ? `Round complete: ${message}` : message;

  if (doneCount % 2 === 0) {
    document.getElementById('done-btn').style.display = 'none';
  }

  knockedPins.forEach(p => {
    p.classList.remove('knocked');
    p.classList.add('gone');
  });

  doneClicked = true;
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.querySelectorAll('.pin').forEach(p => {
    p.classList.remove('knocked', 'gone');
  });
  doneClicked = false;
  doneCount = 0;
  document.getElementById('done-btn').style.display = '';
  document.getElementById('score-area').textContent = 'Click pins to knock them down';
});
