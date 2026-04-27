let knocked = 0;

document.querySelectorAll('.pin').forEach(pin => {
  pin.addEventListener('click', () => {
    pin.classList.toggle('knocked');
    knocked = document.querySelectorAll('.pin.knocked').length;
    document.getElementById('score-area').textContent = `Click pins to knock them down`;
  });
});

document.getElementById('done-btn').addEventListener('click', () => {
  knocked = document.querySelectorAll('.pin.knocked').length;
  document.getElementById('score-area').textContent =
    knocked === 0 ? 'No pins knocked down.'
    : knocked === 10 ? 'STRIKE! All 10 pins knocked down!'
    : `${knocked} pin${knocked === 1 ? '' : 's'} knocked down.`;
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.querySelectorAll('.pin').forEach(p => p.classList.remove('knocked'));
  knocked = 0;
  document.getElementById('score-area').textContent = 'Click pins to knock them down';
});
