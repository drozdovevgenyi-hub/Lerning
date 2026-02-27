const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

const colors = ['#000000', '#5cf2ff', '#ff6ac1', '#ffd166', '#b967ff', '#7efc86', '#f25f5c', '#67a8ff'];
const SHAPES = [
  [],
  [[1, 1, 1, 1]],
  [[2, 2], [2, 2]],
  [[0, 3, 0], [3, 3, 3]],
  [[4, 0, 0], [4, 4, 4]],
  [[0, 0, 5], [5, 5, 5]],
  [[6, 6, 0], [0, 6, 6]],
  [[0, 7, 7], [7, 7, 0]],
];

let board, piece, score, lines, level, over, timer, lastDrop;

function reset() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  score = 0;
  lines = 0;
  level = 1;
  over = false;
  piece = spawn();
  lastDrop = 0;
  updateHud();
}

function spawn() {
  const id = Math.floor(Math.random() * 7) + 1;
  const shape = SHAPES[id].map(row => [...row]);
  return { id, shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
}

function rotate(shape) {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function collide(p = piece, dx = 0, dy = 0, testShape = p.shape) {
  for (let y = 0; y < testShape.length; y++) {
    for (let x = 0; x < testShape[y].length; x++) {
      if (!testShape[y][x]) continue;
      const nx = p.x + x + dx;
      const ny = p.y + y + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return true;
    }
  }
  return false;
}

function merge() {
  piece.shape.forEach((row, y) => row.forEach((val, x) => {
    if (val && piece.y + y >= 0) board[piece.y + y][piece.x + x] = val;
  }));
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared] * level;
    level = Math.min(12, Math.floor(lines / 10) + 1);
    updateHud();
  }
}

function lockPiece() {
  merge();
  clearLines();
  piece = spawn();
  if (collide()) over = true;
}

function drawBlock(x, y, color) {
  const px = x * BLOCK;
  const py = y * BLOCK;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.26)';
  ctx.fillRect(px + 4, py + 4, BLOCK - 18, BLOCK - 18);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((v, x) => v && drawBlock(x, y, colors[v])));
  piece.shape.forEach((row, y) => row.forEach((v, x) => v && drawBlock(piece.x + x, piece.y + y, colors[v])));

  if (over) {
    ctx.fillStyle = 'rgba(3, 4, 20, 0.75)';
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px Manrope';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена', canvas.width / 2, canvas.height / 2 + 8);
  }
}

function updateHud() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function tick(timestamp = 0) {
  if (over) return draw();
  const speed = Math.max(90, 720 - (level - 1) * 60);
  if (timestamp - lastDrop > speed) {
    if (!collide(piece, 0, 1)) piece.y++;
    else lockPiece();
    lastDrop = timestamp;
  }
  draw();
  timer = requestAnimationFrame(tick);
}

function move(dx) {
  if (!collide(piece, dx, 0)) piece.x += dx;
}

function drop() {
  if (!collide(piece, 0, 1)) {
    piece.y++;
    score += 1;
    updateHud();
  }
}

function hardRotate() {
  const rotated = rotate(piece.shape);
  if (!collide(piece, 0, 0, rotated)) piece.shape = rotated;
}

document.addEventListener('keydown', (e) => {
  if (over) return;
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
  if (e.key === 'ArrowDown') drop();
  if (e.key === 'ArrowUp' || e.key === ' ') hardRotate();
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

canvas.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return hardRotate();
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
  else if (dy > 0) drop();
});

document.querySelectorAll('.touch-controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (over) return;
    const action = btn.dataset.action;
    if (action === 'left') move(-1);
    if (action === 'right') move(1);
    if (action === 'rotate') hardRotate();
    if (action === 'down') drop();
  });
});

startBtn.addEventListener('click', () => {
  cancelAnimationFrame(timer);
  reset();
  tick();
});

reset();
draw();
