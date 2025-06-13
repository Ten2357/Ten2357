// game.js
// Core game engine (full version with all features as discussed)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  health: 100,
  ammo: Infinity,
  score: 0,
  weapon: 'gun',
  shield: false
};

let bullets = [], bots = [], mines = [], bombs = [], explosions = [], cooldown = 0, difficulty = 'easy';
let botLimit = 10, botCount = 0;
let fireInterval;

// Load from storage
if (localStorage.getItem('score')) player.score = parseInt(localStorage.getItem('score'));

document.addEventListener('mousedown', () => {
  fireInterval = setInterval(shoot, 100);
});

document.addEventListener('mouseup', () => {
  clearInterval(fireInterval);
});

canvas.addEventListener('mousemove', e => {
  player.mouseX = e.offsetX;
  player.mouseY = e.offsetY;
});

function shoot() {
  if (player.ammo <= 0 && difficulty !== 'easy') return;
  const angle = Math.atan2(player.mouseY - player.y, player.mouseX - player.x);
  bullets.push({ x: player.x, y: player.y, dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5, type: player.weapon });
  if (difficulty !== 'easy') player.ammo--;
  updateUI();
}

function spawnBot() {
  if (bots.length >= botLimit && difficulty !== 'impossible') return;
  let bot = {
    x: Math.random() * canvas.width,
    y: 0,
    health: 100,
    weapon: 'none',
    fireRate: 1000
  };

  if (difficulty === 'hard' && Math.random() < 0.1) bot.weapon = 'gun';
  if (difficulty === 'veryHard') {
    if (Math.random() < 0.02) bot.weapon = 'rocket';
    else if (Math.random() < 0.10) bot.weapon = 'mine';
    else if (Math.random() < 0.10) bot.weapon = 'bomb';
    else if (Math.random() < 0.15) bot.weapon = 'rapid';
  }
  if (difficulty === 'impossible') {
    let index = bots.length;
    if (index < 5) bot.weapon = 'rocket';
    else if (index < 10) bot.weapon = 'mine';
    else if (index < 15) bot.weapon = 'bomb';
    else bot.weapon = 'rapid';
    botLimit = 25;
  }
  bots.push(bot);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw bullets
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;
    ctx.fillStyle = b.type === 'rocket' ? 'orange' : 'white';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
    bots.forEach((bot, j) => {
      if (Math.abs(bot.x - b.x) < 20 && Math.abs(bot.y - b.y) < 20) {
        bot.health -= b.type === 'rocket' ? 100 : 25;
        if (bot.health <= 0) {
          bots.splice(j, 1);
          player.score++;
          localStorage.setItem('score', player.score);
          updateUI();
        }
        bullets.splice(i, 1);
      }
    });
  });

  // Draw bots
  bots.forEach(bot => {
    bot.y += 1;
    ctx.fillStyle = 'red';
    ctx.fillRect(bot.x, bot.y, 30, 30);
  });

  // Draw player
  ctx.fillStyle = player.shield ? 'cyan' : 'lime';
  ctx.fillRect(player.x - 15, player.y - 15, 30, 30);

  // Mines
  mines.forEach(m => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(m.x - 5, m.y - 5, 10, 10);
    bots.forEach((bot, j) => {
      if (Math.abs(bot.x - m.x) < 15 && Math.abs(bot.y - m.y) < 15) {
        bots.splice(j, 1);
        player.score++;
        localStorage.setItem('score', player.score);
        updateUI();
      }
    });
  });

  requestAnimationFrame(gameLoop);
}

function toggleShop() {
  document.getElementById('shop').classList.toggle('hidden');
}

function closeShop() {
  document.getElementById('shop').classList.add('hidden');
}

function buy(item) {
  if (item === 'rocketLauncher' && player.score >= 10) {
    player.weapon = 'rocket';
    player.score -= 10;
  }
  if (item === 'bomb' && player.score >= 5) bombs.push({});
  if (item === 'mine' && player.score >= 5) mines.push({});
  if (item === 'shield' && player.score >= 15) player.shield = true;
  localStorage.setItem('score', player.score);
  updateUI();
}

function useBomb() {
  if (bombs.length === 0) return;
  bombs.pop();
  bots.forEach((bot, i) => {
    if (Math.abs(bot.x - player.mouseX) < 100 && Math.abs(bot.y - player.mouseY) < 100) {
      bots.splice(i, 1);
      player.score++;
    }
  });
  localStorage.setItem('score', player.score);
  updateUI();
}

function placeMine() {
  if (mines.length === 0) return;
  mines.pop();
  mines.push({ x: player.mouseX, y: player.mouseY });
}

function setDifficulty(diff) {
  difficulty = diff;
  if (diff === 'easy') player.ammo = Infinity;
  if (diff === 'medium') player.ammo = 250;
  if (diff === 'hard') player.ammo = 100;
  if (diff === 'veryHard') player.ammo = 50;
  if (diff === 'impossible') player.ammo = 50;
  bots = [];
  updateUI();
}

function updateUI() {
  document.getElementById('score').textContent = 'Score: ' + player.score;
  document.getElementById('health').textContent = 'Health: ' + player.health;
  document.getElementById('ammo').textContent = 'Ammo: ' + (player.ammo === Infinity ? '∞' : player.ammo);
}

setInterval(spawnBot, 1500);
gameLoop();
