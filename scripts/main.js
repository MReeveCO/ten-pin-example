let game = null;

document.querySelectorAll('.player-count-btn').forEach(btn => {
  btn.addEventListener('click', () => startGame(parseInt(btn.dataset.count)));
});

function startGame(playerCount) {
  game = {
    playerCount,
    currentPlayer: 0,
    currentRound: 0,
    ballInRound: 1,
    doneClicked: false,
    roundComplete: false,
    undoStack: [],
    // ballScores[playerIdx][roundIdx] = array of pin counts per ball
    ballScores: Array.from({ length: playerCount }, () =>
      Array.from({ length: 10 }, () => [])
    ),
  };
  buildScoreboard();
  document.getElementById('setup').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
  updatePlayerInfo();
}

function updateUndoButton() {
  document.getElementById('undo-btn').style.display =
    game && game.undoStack.length > 0 ? '' : 'none';
}

function buildScoreboard() {
  let html = '<table id="score-table"><thead><tr><th></th>';
  for (let r = 1; r <= 10; r++) {
    const cols = r === 10 ? 3 : 2;
    html += `<th colspan="${cols}">${r}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let p = 0; p < game.playerCount; p++) {
    html += `<tr id="player-row-${p}"><td class="player-name">Player ${p + 1}</td>`;
    for (let r = 0; r < 10; r++) {
      const ballCount = r === 9 ? 3 : 2;
      html += `<td class="round-cell" colspan="${ballCount}" id="round-${p}-${r}"><div class="ball-scores">`;
      for (let b = 0; b < ballCount; b++) {
        html += `<span class="ball-score" id="ball-${p}-${r}-${b}"></span>`;
      }
      html += `</div><div class="round-total" id="total-${p}-${r}"></div></td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  document.getElementById('scoreboard').innerHTML = html;
}

function getNextBalls(p, r, n) {
  const result = [];
  for (let round = r + 1; round < 10 && result.length < n; round++) {
    for (const ball of game.ballScores[p][round]) {
      result.push(ball);
      if (result.length === n) break;
    }
  }
  return result.length === n ? result.reduce((sum, b) => sum + b, 0) : null;
}

function getRoundScore(p, r) {
  const balls = game.ballScores[p][r];
  if (r < 9) {
    const isStrike = balls.length === 1 && balls[0] === 10;
    const isSpare  = balls.length === 2 && balls[0] + balls[1] === 10;
    if (isStrike) {
      const bonus = getNextBalls(p, r, 2);
      return bonus !== null ? 10 + bonus : null;
    }
    if (isSpare) {
      const bonus = getNextBalls(p, r, 1);
      return bonus !== null ? 10 + bonus : null;
    }
    return balls.length === 2 ? balls[0] + balls[1] : null;
  }
  // Round 10: sum all balls; 3rd ball earned by strike or spare on balls 1+2
  if (balls.length < 2) return null;
  const ball1Strike = balls[0] === 10;
  const isSpare = !ball1Strike && balls[0] + balls[1] === 10;
  if ((ball1Strike || isSpare) && balls.length < 3) return null;
  return balls.reduce((sum, b) => sum + b, 0);
}

function getCumulativeScore(p, upToRound) {
  let total = 0;
  for (let r = 0; r <= upToRound; r++) {
    const score = getRoundScore(p, r);
    if (score === null) return null;
    total += score;
  }
  return total;
}

function updateScoreboard() {
  for (let p = 0; p < game.playerCount; p++) {
    for (let r = 0; r < 10; r++) {
      const ballCount = r === 9 ? 3 : 2;
      for (let b = 0; b < ballCount; b++) {
        const el = document.getElementById(`ball-${p}-${r}-${b}`);
        if (el) {
          el.textContent = '';
          el.classList.remove('strike-x', 'spare-slash');
          el.style.display = '';
        }
      }
      const totalEl = document.getElementById(`total-${p}-${r}`);
      if (totalEl) totalEl.textContent = '';

      const balls = game.ballScores[p][r];

      if (r === 9) {
        const b1Strike = balls.length > 0 && balls[0] === 10;
        balls.forEach((score, b) => {
          const el = document.getElementById(`ball-${p}-${r}-${b}`);
          if (!el) return;
          if (b === 0) {
            el.textContent = score === 10 ? 'X' : score;
          } else if (b === 1) {
            if (b1Strike) {
              el.textContent = score === 10 ? 'X' : score;
            } else if (balls[0] + score === 10) {
              el.textContent = '/'; el.classList.add('spare-slash');
            } else {
              el.textContent = score;
            }
          } else {
            const b2Strike = b1Strike && balls[1] === 10;
            const spareFrame = !b1Strike && balls[0] + balls[1] === 10;
            if (b2Strike || spareFrame) {
              el.textContent = score === 10 ? 'X' : score;
            } else if (b1Strike && balls[1] + score === 10) {
              el.textContent = '/'; el.classList.add('spare-slash');
            } else {
              el.textContent = score;
            }
          }
        });
      } else {
        const isStrike = balls.length === 1 && balls[0] === 10;
        const isSpare  = balls.length === 2 && balls[0] + balls[1] === 10;
        if (isStrike) {
          const el0 = document.getElementById(`ball-${p}-${r}-0`);
          const el1 = document.getElementById(`ball-${p}-${r}-1`);
          if (el0) { el0.textContent = 'X'; el0.classList.add('strike-x'); }
          if (el1) { el1.style.display = 'none'; }
        } else {
          balls.forEach((score, b) => {
            const el = document.getElementById(`ball-${p}-${r}-${b}`);
            if (!el) return;
            el.textContent = (b === 1 && isSpare) ? '/' : score;
            if (b === 1 && isSpare) el.classList.add('spare-slash');
          });
        }
      }

      const cumulative = getCumulativeScore(p, r);
      if (totalEl) totalEl.textContent = cumulative !== null ? cumulative : '';
    }
  }
}

function updatePlayerInfo() {
  document.getElementById('current-player-info').textContent =
    `Player ${game.currentPlayer + 1} — Round ${game.currentRound + 1}, Ball ${game.ballInRound}`;
}

document.querySelectorAll('.pin').forEach(pin => {
  pin.addEventListener('click', () => {
    if (!game) return;
    if (game.roundComplete) return;
    if (pin.classList.contains('gone')) return;
    if (!game.doneClicked && pin.classList.contains('knocked')) return;
    pin.classList.toggle('knocked');
    document.getElementById('score-area').textContent = 'Click pins to knock them down';
  });
});

document.getElementById('done-btn').addEventListener('click', () => {
  const knockedPins = document.querySelectorAll('.pin.knocked');
  const ballPins = knockedPins.length;
  const total = ballPins + document.querySelectorAll('.pin.gone').length;

  game.undoStack.push({
    gonePinNumbers: [...document.querySelectorAll('.pin.gone')].map(p => p.dataset.pin),
    prevBallInRound: game.ballInRound,
    prevDoneClicked: game.doneClicked,
    prevRoundComplete: game.roundComplete,
    prevScoreArea: document.getElementById('score-area').textContent,
  });

  game.ballScores[game.currentPlayer][game.currentRound].push(ballPins);
  updateScoreboard();

  let isStrike, isSpare, roundComplete, resetPins = false;

  if (game.currentRound < 9) {
    isStrike = game.ballInRound === 1 && total === 10;
    isSpare  = game.ballInRound === 2 && total === 10;
    roundComplete = isStrike || game.ballInRound === 2;
  } else {
    const balls = game.ballScores[game.currentPlayer][9];
    if (game.ballInRound === 1) {
      isStrike = ballPins === 10;
      isSpare = false;
      roundComplete = false;
      resetPins = isStrike;
    } else if (game.ballInRound === 2) {
      const ball1Strike = balls[0] === 10;
      isStrike = ball1Strike && ballPins === 10;
      isSpare = !ball1Strike && total === 10;
      const earnsBall3 = ball1Strike || isSpare;
      roundComplete = !earnsBall3;
      resetPins = earnsBall3 && (isStrike || isSpare);
    } else {
      isStrike = false;
      isSpare = false;
      roundComplete = true;
    }
  }

  const message =
    total === 0    ? 'No pins knocked down.'
    : isStrike     ? 'STRIKE! All 10 pins knocked down!'
    : isSpare      ? 'SPARE! All 10 pins knocked down!'
    : `${total} pin${total === 1 ? '' : 's'} knocked down.`;

  document.getElementById('score-area').textContent =
    roundComplete ? `Round complete: ${message}` : message;

  if (resetPins) {
    document.querySelectorAll('.pin').forEach(p => p.classList.remove('knocked', 'gone'));
  } else {
    knockedPins.forEach(p => {
      p.classList.remove('knocked');
      p.classList.add('gone');
    });
  }

  game.doneClicked = true;

  if (roundComplete) {
    game.roundComplete = true;
    document.getElementById('done-btn').style.display = 'none';
    const isLastPlayer = game.currentPlayer === game.playerCount - 1;
    const isLastRound = game.currentRound === 9;
    if (isLastPlayer && isLastRound) {
      document.getElementById('score-area').textContent = `Game over! ${message}`;
    } else {
      document.getElementById('next-player-btn').style.display = '';
    }
  } else {
    game.ballInRound++;
    updatePlayerInfo();
  }
  updateUndoButton();
});

document.getElementById('undo-btn').addEventListener('click', () => {
  if (!game || game.undoStack.length === 0) return;
  const entry = game.undoStack.pop();

  game.ballScores[game.currentPlayer][game.currentRound].pop();

  document.querySelectorAll('.pin').forEach(p => p.classList.remove('knocked', 'gone'));
  entry.gonePinNumbers.forEach(num => {
    document.querySelector(`[data-pin="${num}"]`)?.classList.add('gone');
  });

  game.ballInRound  = entry.prevBallInRound;
  game.doneClicked  = entry.prevDoneClicked;
  game.roundComplete = entry.prevRoundComplete;

  document.getElementById('score-area').textContent = entry.prevScoreArea;
  document.getElementById('done-btn').style.display = '';
  document.getElementById('next-player-btn').style.display = 'none';

  updateScoreboard();
  updatePlayerInfo();
  updateUndoButton();
});

document.getElementById('next-player-btn').addEventListener('click', () => {
  game.currentPlayer++;
  if (game.currentPlayer >= game.playerCount) {
    game.currentPlayer = 0;
    game.currentRound++;
  }
  game.ballInRound = 1;
  game.doneClicked = false;
  game.roundComplete = false;
  game.undoStack = [];

  document.querySelectorAll('.pin').forEach(p => p.classList.remove('knocked', 'gone'));
  document.getElementById('score-area').textContent = 'Click pins to knock them down';
  document.getElementById('done-btn').style.display = '';
  document.getElementById('next-player-btn').style.display = 'none';
  updatePlayerInfo();
  updateUndoButton();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  game = null;
  document.querySelectorAll('.pin').forEach(p => p.classList.remove('knocked', 'gone'));
  document.getElementById('done-btn').style.display = '';
  document.getElementById('next-player-btn').style.display = 'none';
  document.getElementById('score-area').textContent = 'Click pins to knock them down';
  document.getElementById('game').style.display = 'none';
  document.getElementById('setup').style.display = '';
  updateUndoButton();
});
