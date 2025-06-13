const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthDisplay = document.getElementById("health");
const pointsDisplay = document.getElementById("points");
const openShopBtn = document.getElementById("open-shop-btn");
const shop = document.getElementById("shop");
const closeShopBtn = document.getElementById("close-shop-btn");
const shopItemsDiv = document.getElementById("shop-items");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let keys = {};
let mouse = { x: 0, y: 0, clicked: false };

class Player {
  constructor() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    this.radius = 15;
    this.speed = 3;
    this.health = 100;
    this.points = 0;
    this.respawnTime = 3000; // ms
    this.isDead = false;
    this.respawnTimer = null;
    this.damage = 10; // base damage
    this.color = "lightblue";
    this.weapon = "starter gun";
  }

  move() {
    if (this.isDead) return;
    if (keys["w"] && this.y - this.radius > 0) this.y -= this.speed;
    if (keys["s"] && this.y + this.radius < HEIGHT) this.y += this.speed;
    if (keys["a"] && this.x - this.radius > 0) this.x -= this.speed;
    if (keys["d"] && this.x + this.radius < WIDTH) this.x += this.speed;
  }

  draw() {
    if (this.isDead) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
    healthDisplay.textContent = this.health;
  }

  die() {
    this.isDead = true;
    // Remove player visually by not drawing
    setTimeout(() => this.respawn(), this.respawnTime);
  }

  respawn() {
    this.health = 100;
    this.isDead = false;
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    healthDisplay.textContent = this.health;
  }
}

class Bullet {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 7;
    this.damage = damage;
    this.color = "yellow";

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.velX = (dx / dist) * this.speed;
    this.velY = (dy / dist) * this.speed;
    this.isDead = false;
  }

  update() {
    if (this.isDead) return;
    this.x += this.velX;
    this.y += this.velY;

    // Remove bullet if out of bounds
    if (
      this.x < 0 ||
      this.x > WIDTH ||
      this.y < 0 ||
      this.y > HEIGHT
    ) {
      this.isDead = true;
    }
  }

  draw() {
    if (this.isDead) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Bot {
  constructor() {
    this.radius = 15;
    this.x = Math.random() * (WIDTH - this.radius * 2) + this.radius;
    this.y = Math.random() * (HEIGHT - this.radius * 2) + this.radius;
    this.speed = 1.5;
    this.health = 30;
    this.color = "red";
    this.isDead = false;
  }

  moveToward(player) {
    if (this.isDead) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    if (this.isDead) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      player.points += 10;
      pointsDisplay.textContent = player.points;
    }
  }
}

const player = new Player();
const bots = [];
const bullets = [];

const shopItems = [
  { name: "Starter Gun", cost: 0, damage: 10 },
  { name: "Rocket Launcher", cost: 30, damage: 30 },
  { name: "Landmine", cost: 20, damage: 50 },
  { name: "Bomb", cost: 40, damage: 70 },
];

function spawnBots(count = 5) {
  for (let i = 0; i < count; i++) {
    bots.push(new Bot());
  }
}

function handleInput() {
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("mousedown", () => {
    mouse.clicked = true;
  });

  canvas.addEventListener("mouseup", () => {
    mouse.clicked = false;
  });

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

function shoot() {
  if (!player.isDead && mouse.clicked) {
    if (!canShoot) return;
    bullets.push(new Bullet(player.x, player.y, mouse.x, mouse.y, player.damage));
    canShoot = false;
    setTimeout(() => (canShoot = true), shootCooldown);
  }
}

let canShoot = true;
const shootCooldown = 300; // ms between shots

function update() {
  player.move();

  // Move bots
  bots.forEach((bot) => bot.moveToward(player));

  // Update bullets
  bullets.forEach((bullet) => bullet.update());

  // Collision: bullets vs bots
  bullets.forEach((bullet) => {
    if (bullet.isDead) return;
    bots.forEach((bot) => {
      if (bot.isDead) return;
      const dx = bullet.x - bot.x;
      const dy = bullet.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bullet.radius + bot.radius) {
        bot.takeDamage(bullet.damage);
        bullet.isDead = true;
      }
    });
  });

  // Remove dead bullets and bots
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].isDead) bullets.splice(i, 1);
  }
  for (let i = bots.length - 1; i >= 0; i--) {
    if (bots[i].isDead) bots.splice(i, 1);
  }

  // Collision: bots vs player
  bots.forEach((bot) => {
    if (bot.isDead || player.isDead) return;
    const dx = bot.x - player.x;
    const dy = bot.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bot.radius + player.radius) {
      player.takeDamage(1);
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  player.draw();

  bots.forEach((bot) => bot.draw());

  bullets.forEach((bullet) => bullet.draw());
}

function gameLoop() {
  if (!player.isDead) {
    shoot();
  }
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// SHOP

function openShop() {
  shop.style.display = "block";
  renderShopItems();
}

function closeShop() {
  shop.style.display = "none";
}

function renderShopItems() {
  shopItemsDiv.innerHTML = "";
  shopItems.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${item.name} - ${item.cost} points`;
    btn.disabled = player.points < item.cost;
    btn.onclick = () => buyItem(i);
    shopItemsDiv.appendChild(btn);
  });
}

function buyItem(index) {
  const item = shopItems[index];
  if (player.points >= item.cost) {
    player.points -= item.cost;
    pointsDisplay.textContent = player.points;
    player.damage = item.damage;
    player.weapon = item.name;
    alert(`You bought ${item.name}!`);
    closeShop();
  } else {
    alert("Not enough points!");
  }
}

// INIT

spawnBots(5);
handleInput();

openShopBtn.onclick = openShop;
closeShopBtn.onclick = closeShop;

gameLoop();
