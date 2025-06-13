const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
  x: 400,
  y: 300,
  size: 20,
  speed: 3,
  health: 100,
  points: 0,
  inventory: ["gun"],
  weapon: "gun"
};

const weaponData = {
  gun: { speed: 7, damage: 10 },
  rocket: { speed: 4, damage: 30 },
  bomb: { speed: 2, damage: 40 },
  mine: { damage: 50 }
};

let keys = {};
let bullets = [];
let bots = [];
let mines = [];
let explosions = [];
let lastShotTime = 0;
const shootCooldown = 300;

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  // Place mine with 'm'
  if (e.key.toLowerCase() === 'm') placeMine();

  // Place bomb with 'b'
  if (e.key.toLowerCase() === 'b') placeBomb();
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Shoot on mouse click
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  shootTowards(mouseX, mouseY);
});

function shootTowards(targetX, targetY) {
  const now = Date.now();
  if (now - lastShotTime < shootCooldown) return;

  const w = weaponData[player.weapon];
  const startX = player.x + player.size / 2;
  const startY = player.y + player.size / 2;
  let dx = targetX - startX;
  let dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;
  dx = (dx / dist) * w.speed;
  dy = (dy / dist) * w.speed;

  bullets.push({
    x: startX,
    y: startY,
    dx,
    dy,
    size: 5,
    color: "yellow",
    damage: w.damage
  });

  lastShotTime = now;
}

function placeMine() {
  if (!player.inventory.includes("mine")) return;
  mines.push({ x: player.x + player.size / 2 - 5, y: player.y + player.size / 2 - 5, damage: weaponData.mine.damage });
}

function placeBomb() {
  if (!player.inventory.includes("bomb")) return;
  explosions.push({ x: player.x + player.size / 2, y: player.y + player.size / 2, radius: 60, time: 30 });
  // Sound can be added here if desired
}

function spawnBot() {
  bots.push({
    x: Math.random() * (canvas.width - 20),
    y: Math.random() * (canvas.height - 20),
    size: 20,
    health: 30
  });
}

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.size || 10, obj.size || 10);
}

function drawPlayer() {
  drawRect(player, "lime");
}

function drawBots() {
  bots.forEach(bot => drawRect(bot, "red"));
}

function drawBullets() {
  bullets.forEach(b => drawRect(b, b.color));
}

function drawMines() {
  mines.forEach(m => drawRect({ x: m.x, y: m.y, size: 10 }, "orange"));
}

function drawExplosions() {
  explosions.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 165, 0, 0.4)";
    ctx.fill();
  });
}

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Keep player inside canvas
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

function botAI() {
  bots.forEach(bot => {
    if (bot.x < player.x) bot.x += 1;
    if (bot.x > player.x) bot.x -= 1;
    if (bot.y < player.y) bot.y += 1;
    if (bot.y > player.y) bot.y -= 1;

    if (Math.abs(bot.x - player.x) < 20 && Math.abs(bot.y - player.y) < 20) {
      player.health -= 0.5;
    }
  });
}

function updateBullets() {
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });
  bullets = bullets.filter(b => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);
}

function checkHits() {
  for (let b of bullets) {
    for (let bot of bots) {
      if (
        b.x < bot.x + bot.size &&
        b.x + b.size > bot.x &&
        b.y < bot.y + bot.size &&
        b.y + b.size > bot.y
      ) {
        bot.health -= b.damage;
        b.hit = true;
      }
    }
  }

  for (let mine of mines) {
    bots.forEach(bot => {
      if (Math.abs(bot.x - mine.x) < 10 && Math.abs(bot.y - mine.y) < 10) {
        bot.health -= mine.damage;
        explosions.push({ x: mine.x, y: mine.y, radius: 30, time: 30 });
        mine.hit = true;
      }
    });
  }

  for (let e of explosions) {
    bots.forEach(bot => {
      if (Math.hypot(bot.x - e.x, bot.y - e.y) < e.radius) {
        bot.health -= 2;
      }
    });
  }

  bullets = bullets.filter(b => !b.hit);
  mines = mines.filter(m => !m.hit);
  explosions.forEach(e => e.time--);
  explosions = explosions.filter(e => e.time > 0);

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
    alert("You died! Respawning...");
    player.health = 100;
    player.x = 400;
    player.y = 300;
  }
}

function updateShopUI() {
  const shopItems = {
    rocket: 50,
    mine: 30,
    bomb: 40
  };

  const container = document.getElementById("shop-items");
  container.innerHTML = "";

  for (let item in shopItems) {
    const owned = player.inventory.includes(item);
    const btn = document.createElement("button");
    btn.textContent = `${item} (${shopItems[item]} pts)`;
    btn.disabled = owned;
    btn.onclick = () => buy(item, shopItems[item]);
    container.appendChild(btn);
  }
}

function openShop() {
  updateShopUI();
  document.getElementById("shop").style.display = "block";
}

function closeShop() {
  document.getElementById("shop").style.display = "none";
}

function buy(item, cost) {
  if (player.points >= cost) {
    player.points -= cost;
    player.inventory.push(item);
    alert(`Bought: ${item}`);
    saveGame();
    closeShop();
  } else {
    alert("Not enough points!");
  }
}

function saveGame() {
  localStorage.setItem("battleSave", JSON.stringify({
    points: player.points,
    inventory: player.inventory
  }));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem("battleSave"));
  if (data) {
    player.points = data.points;
    player.inventory = data.inventory;
  }
}

// Event listeners for shop buttons
document.getElementById("open-shop-btn").addEventListener("click", openShop);
document.getElementById("close-shop-btn").addEventListener("click", closeShop);

setInterval(spawnBot, 3000);
loadGame();

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  movePlayer();
  botAI();
  updateBullets();
  checkHits();

  drawPlayer();
  drawBots();
  drawBullets();
  drawMines();
  drawExplosions();
  updateHUD();

  requestAnimationFrame(gameLoop);
}

gameLoop();
