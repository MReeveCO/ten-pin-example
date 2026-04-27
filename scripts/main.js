let doneClicked = false;
let ballInRound = 1;

document.querySelectorAll('.pin').forEach(pin => {
  pin.addEventListener('click', () => {
    if (pin.classList.contains('gone')) return;
    if (!doneClicked && pin.classList.contains('knocked')) return;
    pin.classList.toggle('knocked');
    document.getElementById('score-area').textContent = 'Click pins to knock them down';
  });
});

document.getElementById('done-btn').addEventListener('click', () => {
  const knockedPins = document.querySelectorAll('.pin.knocked');
  const total = knockedPins.length + document.querySelectorAll('.pin.gone').length;

  const isStrike = ballInRound === 1 && total === 10;
  const isSpare  = ballInRound === 2 && total === 10;
  const isRoundComplete = isStrike || ballInRound === 2;

  const message =
    total === 0    ? 'No pins knocked down.'
    : isStrike     ? 'STRIKE! All 10 pins knocked down!'
    : isSpare      ? 'SPARE! All 10 pins knocked down!'
    : `${total} pin${total === 1 ? '' : 's'} knocked down.`;

  document.getElementById('score-area').textContent =
    isRoundComplete ? `Round complete: ${message}` : message;

  if (isRoundComplete) {
    document.getElementById('done-btn').style.display = 'none';
  }

  knockedPins.forEach(p => {
    p.classList.remove('knocked');
    p.classList.add('gone');
  });

  doneClicked = true;
  ballInRound = isRoundComplete ? 1 : 2;
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.querySelectorAll('.pin').forEach(p => {
    p.classList.remove('knocked', 'gone');
  });
  doneClicked = false;
  ballInRound = 1;
  document.getElementById('done-btn').style.display = '';
  document.getElementById('score-area').textContent = 'Click pins to knock them down';
});
