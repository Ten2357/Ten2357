const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
  x: 400,
  y: 300,
  size: 20,
  color: "lime",
  speed: 3,
  health: 100,
  points: 0,
};

let keys = {};
let bots = [];
let bullets = [];
let inventory = [];

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);
document.addEventListener("keydown", (e) => {
  if (e.key === " ") shoot();
});

function shoot() {
  bullets.push({
    x: player.x,
    y: player.y,
    dx: 5,
    dy: 0,
    size: 5,
    color: "yellow"
  });
}

function spawnBot() {
  bots.push({
    x: Math.random() * 800,
    y: Math.random() * 600,
    size: 20,
    color: "red",
    health: 30
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawBots() {
  for (let bot of bots) {
    ctx.fillStyle = bot.color;
    ctx.fillRect(bot.x, bot.y, bot.size, bot.size);
  }
}

function drawBullets() {
  for (let b of bullets) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.size, b.size);
  }
}

function updateBullets() {
  for (let b of bullets) {
    b.x += b.dx;
    b.y += b.dy;
  }
  // remove offscreen
  bullets = bullets.filter(b => b.x < 800);
}

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
}

function botAI() {
  for (let bot of bots) {
    if (bot.x < player.x) bot.x += 1;
    if (bot.x > player.x) bot.x -= 1;
    if (bot.y < player.y) bot.y += 1;
    if (bot.y > player.y) bot.y -= 1;

    // Collision = damage
    if (Math.abs(bot.x - player.x) < 20 && Math.abs(bot.y - player.y) < 20) {
      player.health -= 0.5;
    }
  }
}

function checkBulletHits() {
  for (let bullet of bullets) {
    for (let bot of bots) {
      if (
        bullet.x < bot.x + bot.size &&
        bullet.x + bullet.size > bot.x &&
        bullet.y < bot.y + bot.size &&
        bullet.y + bullet.size > bot.y
      ) {
        bot.health -= 10;
        bullet.x = 9999; // move bullet out
      }
    }
  }
  // remove dead bots
  bots = bots.filter(bot => {
    if (bot.health <= 0) {
      player.points += 10;
      return false;
    }
    return true;
  });
}

function updateHUD() {
  document.getElementById("health").textContent = Math.floor(player.health);
  document.getElementById("points").textContent = player.points;

  if (player.health <= 0) {
    alert("You Died! Restarting...");
    location.reload();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  updateBullets();
  checkBulletHits();
  botAI();

  drawPlayer();
  drawBots();
  drawBullets();

  updateHUD();

  requestAnimationFrame(gameLoop);
}

function openShop() {
  document.getElementById("shop").classList.remove("hidden");
}

function closeShop() {
  document.getElementById("shop").classList.add("hidden");
}

function buy(item) {
  const cost = { rocket: 50, mine: 30, bomb: 40 }[item];
  if (player.points >= cost) {
    player.points -= cost;
    inventory.push(item);
    alert(`${item} purchased!`);
  } else {
    alert("Not enough points!");
  }
}

setInterval(spawnBot, 3000); // every 3 seconds
gameLoop();
