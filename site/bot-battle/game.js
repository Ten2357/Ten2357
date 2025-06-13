const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const shootSound = new Audio("assets/shoot.wav");
const explodeSound = new Audio("assets/explode.wav");

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
  gun: { speed: 5, damage: 10 },
  rocket: { speed: 3, damage: 30 },
  bomb: { speed: 2, damage: 40 },
  mine: { damage: 50 }
};

let keys = {};
let bots = [];
let bullets = [];
let mines = [];
let explosions = [];

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

document.addEventListener("keydown", (e) => {
  if (e.key === " ") shoot();
  if (e.key === "b") placeBomb();
  if (e.key === "m") placeMine();
});

function shoot() {
  const w = weaponData[player.weapon];
  bullets.push({
    x: player.x + 10,
    y: player.y + 10,
    dx: w.speed,
    size: 5,
    color: "yellow",
    damage: w.damage
  });
  shootSound.currentTime = 0;
  shootSound.play();
}

function placeMine() {
  if (!player.inventory.includes("mine")) return;
  mines.push({ x: player.x + 10, y: player.y + 10, damage: weaponData.mine.damage });
}

function placeBomb() {
  if (!player.inventory.includes("bomb")) return;
  explosions.push({ x: player.x, y: player.y, radius: 60, time: 30 });
  explodeSound.currentTime = 0;
  explodeSound.play();
}

function spawnBot() {
  bots.push({
    x: Math.random() * 800,
    y: Math.random() * 600,
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
}

function botAI() {
  for (let bot of bots) {
    if (bot.x < player.x) bot.x += 1;
    if (bot.x > player.x) bot.x -= 1;
    if (bot.y < player.y) bot.y += 1;
    if (bot.y > player.y) bot.y -= 1;

    if (Math.abs(bot.x - player.x) < 20 && Math.abs(bot.y - player.y) < 20) {
      player.health -= 0.5;
    }
  }
}

function updateBullets() {
  bullets.forEach(b => b.x += b.dx);
  bullets = bullets.filter(b => b.x < 800);
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
        b.x = 9999;
      }
    }
  }

  for (let mine of mines) {
    for (let bot of bots) {
      if (Math.abs(bot.x - mine.x) < 10 && Math.abs(bot.y - mine.y) < 10) {
        bot.health -= mine.damage;
        explosions.push({ x: mine.x, y: mine.y, radius: 30, time: 30 });
        explodeSound.currentTime = 0;
        explodeSound.play();
        mine.hit = true;
      }
    }
  }

  for (let e of explosions) {
    for (let bot of bots) {
      let dist = Math.hypot(bot.x - e.x, bot.y - e.y);
      if (dist < e.radius) {
        bot.health -= 2;
      }
    }
  }

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
    alert("You Died! Game restarting.");
    localStorage.clear();
    location.reload();
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
  document.getElementById("shop").classList.remove("hidden");
}

function closeShop() {
  document.getElementById("shop").classList.add("hidden");
}

function buy(item, cost) {
  if (player.points >= cost) {
    player.points -= cost;
    player.inventory.push(item);
    alert(`Bought: ${item}`);
    saveGame();
    closeShop();
  } else {
    alert("Not enough points");
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

setInterval(spawnBot, 3000);
loadGame();
gameLoop();
