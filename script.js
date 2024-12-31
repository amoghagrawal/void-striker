const baseQuests = [{
  id: 1,
  description: "Buy your first gun upgrade",
  baseReward: 100,
  completed: false,
  progress: 0,
  goal: 1,
  type: 'gunUpgrade'
}, {
  id: 2,
  description: "Kill normal enemies",
  baseReward: 150,
  completed: false,
  progress: 0,
  goal: 50,
  type: 'killNormal'
}, {
  id: 3,
  description: "Kill gunner enemies",
  baseReward: 200,
  completed: false,
  progress: 0,
  goal: 20,
  type: 'killGunner'
}, {
  id: 4,
  description: "Kill splitter enemies",
  baseReward: 250,
  completed: false,
  progress: 0,
  goal: 10,
  type: 'killSplitter'
}];
const hardQuests = [{
  description: "Kill elite enemies",
  baseReward: 500,
  goal: 15,
  type: 'killElite'
}, {
  description: "Kill celestial enemies",
  baseReward: 1000,
  goal: 5,
  type: 'killCelestial'
}, {
  description: "Kill boss enemies",
  baseReward: 750,
  goal: 3,
  type: 'killBoss'
}, {
  description: "Survive wave 10",
  baseReward: 1500,
  goal: 1,
  type: 'reachWave'
}];
let quests = [...baseQuests.slice(0, 4)];
let completedQuests = [];
let gamePaused = false;
const baseQuestsOriginal = JSON.parse(JSON.stringify(baseQuests));
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let gameStarted = false;
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 5,
  hp: 100,
  chargeTime: 0,
  damageMultiplier: 1,
  extraDamage: 0,
  attackCooldown: 20,
  maxPierce: 3,
  maxHp: 100,
  invulnerable: false
};
let playerInvulnerable = false;
let enemyCooldowns = new Map();
let upgrades = {
  damage: {
    level: 1,
    cost: 100,
    description: "Increase damage"
  },
  attackSpeed: {
    level: 1,
    cost: 150,
    description: "Faster shooting"
  },
  piercing: {
    level: 1,
    cost: 200,
    description: "More pierce"
  },
  health: {
    level: 1,
    cost: 120,
    description: "Max HP up"
  },
  speed: {
    level: 1,
    cost: 100,
    description: "Movement speed"
  }
};
let gunUpgrades = {
  splitShot: {
    purchased: false,
    cost: 300,
    description: "Split Shot"
  },
  splitShotV2: {
    purchased: false,
    cost: 500,
    description: "Split Shot V2"
  },
  supercharge: {
    purchased: false,
    cost: 400,
    description: "Supercharge"
  }
};
let money = 0;
let discountedUpgrade = null;
let projectiles = [];
let enemies = [];
let particles = [];
let wave = 1;
let baseWaveTime = 20;
let waveTime = baseWaveTime;
let waveTimer = waveTime;
let keys = {};
let currentShopPage = 1;
let selectedDifficulty = 'normal';
const difficultySettings = {
  easy: {
    enemyDamageMultiplier: 0.5,
    enemyHealthMultiplier: 0.7,
    waveEnemyMultiplier: 0.8,
    moneyMultiplier: 0.8,
    bossWaveStart: 7
  },
  normal: {
    enemyDamageMultiplier: 1,
    enemyHealthMultiplier: 1,
    waveEnemyMultiplier: 1,
    moneyMultiplier: 1,
    bossWaveStart: 5
  },
  hard: {
    enemyDamageMultiplier: 1.5,
    enemyHealthMultiplier: 1.3,
    waveEnemyMultiplier: 1.2,
    moneyMultiplier: 1.5,
    bossWaveStart: 4
  },
  insane: {
    enemyDamageMultiplier: 2,
    enemyHealthMultiplier: 1.8,
    waveEnemyMultiplier: 1.5,
    moneyMultiplier: 2,
    bossWaveStart: 3
  }
};
let backgroundMusic = document.getElementById('backgroundMusic');
let lastFrameTime = Date.now();
let currentGameMoney = 0;
let firstTimePlaying = localStorage.getItem('firstTimePlaying') !== 'false';
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
function showShop() {
  document.getElementById('backButton').style.display = 'none';
  loadGameState();
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('shopMenu').style.display = 'block';
  document.getElementById('shopMoneyDisplay').textContent = `$${money}`;
  updateShop();
}
function hideShop() {
  document.getElementById('backButton').style.display = 'block';
  document.getElementById('shopMenu').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  document.getElementById('shopMoneyDisplay').textContent = '$0';
}
function switchShopPage(page) {
  currentShopPage = page;
  updateShop();
}
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  let notificationClass = 'notification';
  if (type === 'success') {
    notificationClass += ' purchase-success';
  } else if (type === 'error') {
    notificationClass += ' purchase-failure';
  }
  notification.className = notificationClass;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}
function updateShop() {
  const grid = document.querySelector('.upgrade-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const shopTitle = document.createElement('h2');
  shopTitle.className = 'shop-title';
  shopTitle.textContent = currentShopPage === 1 ? 'UPGRADES' : currentShopPage === 2 ? 'GUN UPGRADES' : 'QUESTS';
  const nav = document.createElement('div');
  nav.className = 'shop-nav';
  nav.innerHTML = `
    <button class="${currentShopPage === 1 ? 'active' : ''}" 
            onclick="switchShopPage(1)">Regular Upgrades</button>
    <button class="${currentShopPage === 2 ? 'active' : ''}" 
            onclick="switchShopPage(2)">Gun Upgrades</button>
    <button class="${currentShopPage === 3 ? 'active' : ''}" 
            onclick="switchShopPage(3)">Quests</button>
  `;
  const container = document.getElementById('shopContainer');
  container.innerHTML = '';
  container.appendChild(nav);
  container.appendChild(shopTitle);
  container.appendChild(grid);
  if (currentShopPage === 1) {
    Object.entries(upgrades).forEach(([key, upgrade]) => {
      const cost = key === discountedUpgrade ? Math.floor(upgrade.cost * 0.7) : upgrade.cost;
      const div = document.createElement('div');
      div.className = 'upgrade-item';
      div.innerHTML = `
        <h3>${upgrade.description}</h3>
        <p>Level: ${upgrade.level}</p>
        <p>Cost: $${cost}</p>
        ${key === discountedUpgrade ? '<p class="discount">30% OFF!</p>' : ''}
      `;
      div.onclick = () => purchaseUpgrade(key);
      grid.appendChild(div);
    });
  } else if (currentShopPage === 2) {
    Object.entries(gunUpgrades).forEach(([key, upgrade]) => {
      if (!upgrade.purchased) {
        const cost = key === discountedUpgrade ? Math.floor(upgrade.cost * 0.7) : upgrade.cost;
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        div.innerHTML = `
          <h3>${upgrade.description}</h3>
          <p>Cost: $${cost}</p>
          ${key === discountedUpgrade ? '<p class="discount">30% OFF!</p>' : ''}
        `;
        div.onclick = () => purchaseGunUpgrade(key);
        grid.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'upgrade-item purchased';
        div.innerHTML = `
          <h3>${upgrade.description}</h3>
          <p>PURCHASED</p>
        `;
        grid.appendChild(div);
      }
    });
  } else if (currentShopPage === 3) {
    quests.forEach(quest => {
      const div = document.createElement('div');
      div.className = `upgrade-item ${quest.completed ? 'purchased' : ''}`;
      div.innerHTML = `
        <h3>${quest.description}</h3>
        <p>Progress: ${quest.progress}/${quest.goal}</p>
        <p>Reward: $${quest.baseReward}</p>
        ${quest.completed ? '<p style="color: #4caf50">COMPLETED!</p>' : ''}
      `;
      grid.appendChild(div);
    });
    if (completedQuests.length > 0) {
      const completedSection = document.createElement('div');
      completedSection.className = 'completed-quests';
      completedSection.innerHTML = `
          <h3>Completed Quests</h3>
          <ul>
            ${completedQuests.map(q => `<li>${q.description}</li>`).join('')}
          </ul>
        `;
      grid.appendChild(completedSection);
    }
  }
}
class Projectile {
  constructor(x, y, velocity, isBeam = false, isEnemyProjectile = false, angleOffset = 0) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.radius = isBeam ? 8 : 5;
    this.isBeam = isBeam;
    this.pierceCount = 0;
    let chargeMult = player.chargeTime / 60;
    chargeMult = Math.min(chargeMult, 1.5);
    this.damage = (isBeam ? 40 : 20) * chargeMult + (player.extraDamage || 0) * (isBeam ? 2 : 1);
    this.hitEnemies = new Set();
    this.particles = [];
    this.isEnemyProjectile = isEnemyProjectile;
    this.angleOffset = angleOffset;
  }
  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    if (Math.random() < 0.3) {
      particles.push(new Particle(this.x, this.y, Math.random() * 2, this.isBeam ? '#7e57c2' : '#4527a0', {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      }));
    }
    if (this.damage > 30 && Math.random() < 0.2) {
      particles.push(new Particle(this.x, this.y, Math.random() * 3, '#7e57c2', {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3
      }));
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (this.isEnemyProjectile) {
      ctx.fillStyle = '#ff0000';
    } else {
      ctx.fillStyle = this.isBeam ? '#7e57c2' : '#4527a0';
    }
    ctx.fill();
    if (this.isBeam) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#7e57c2';
    }
    ctx.closePath();
    ctx.shadowBlur = 0;
  }
}
class Enemy {
  constructor(type = 'normal') {
    this.type = type;
    this.class = null;
    const diffMult = difficultySettings[selectedDifficulty].enemyHealthMultiplier;
    if (type.includes('splitter')) {
      this.radius = 30;
      this.hp = (type.includes('gunner') ? 300 : 200) * diffMult;
      this.speed = type.includes('gunner') ? 2 : 3;
      this.shootCooldown = type.includes('gunner') ? 60 : 0;
    } else if (type === 'necromancer') {
      this.radius = 35;
      this.hp = 300 * diffMult;
      this.speed = 1.5;
      this.shootCooldown = 0;
      this.spawnTimer = 600;
    } else if (type === 'support') {
      this.radius = 25;
      this.hp = 200 * diffMult;
      this.speed = 2;
      this.linkedEnemies = new Set();
      this.beams = [];
    } else if (type.includes('boss')) {
      this.radius = 60;
      this.baseType = type.split('-')[1];
      this.hp = 600 * diffMult;
      this.speed = 2;
      this.isBoss = true;
    } else {
      this.radius = type === 'gunner' ? 25 : 20;
      this.hp = (type === 'gunner' ? 150 : 100) * diffMult;
      this.speed = type === 'gunner' ? 2 : 3;
      this.shootCooldown = type === 'gunner' ? 60 : 0;
    }
    this.currentCooldown = 0;
    this.lastHitTime = 0;
    this.maxHp = this.hp;
    this.regenerates = false;
    this.spreadShot = false;
    const minDistance = Math.max(canvas.width, canvas.height) * 0.3;
    const maxDistance = Math.max(canvas.width, canvas.height) * 0.4;
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    this.x = canvas.width / 2 + Math.cos(angle) * distance;
    this.y = canvas.height / 2 + Math.sin(angle) * distance;
    this.lastMultiKill = null;
    this.multiKillCount = null;
  }
  onDeath() {
    const pulse = document.createElement('div');
    pulse.className = 'pulse-effect';
    pulse.style.left = this.x - 100 + 'px';
    pulse.style.top = this.y - 100 + 'px';
    pulse.style.background = `radial-gradient(circle, ${this.type === 'necromancer' ? '#9c27b0' : '#ff9800'}44 0%, transparent 70%)`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 500);
    if (this.type === 'normal-splitter') {
      for (let i = 0; i < 2; i++) {
        const enemy = new Enemy('normal');
        enemy.x = this.x;
        enemy.y = this.y;
        enemies.push(enemy);
      }
    } else if (this.type === 'gunner-splitter') {
      for (let i = 0; i < 2; i++) {
        const enemy = new Enemy('gunner');
        enemy.x = this.x;
        enemy.y = this.y;
        enemies.push(enemy);
      }
    }
    const deathMoney = Math.floor(Math.random() * 5) + 3;
    money += deathMoney;
    currentGameMoney += deathMoney;
    document.getElementById('moneyDisplay').textContent = `$${money}`;
    document.getElementById('moneyDisplay').style.color = '#ffeb3b';
    setTimeout(() => {
      document.getElementById('moneyDisplay').style.color = '#4caf50';
    }, 100);
    for (let i = 0; i < 15; i++) {
      particles.push(new Particle(this.x, this.y, Math.random() * 4, this.type === 'gunner' ? '#ff4444' : '#ff9800', {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10
      }));
    }
    if (this.type === 'normal') {
      updateQuestProgress('killNormal', 1);
    } else if (this.type === 'gunner') {
      updateQuestProgress('killGunner', 1);
    } else if (this.type.includes('splitter')) {
      updateQuestProgress('killSplitter', 1);
    } else if (this.type === 'necromancer') {
      updateQuestProgress('killNecromancer', 1);
    }
    if (this.class === 'elite') {
      updateQuestProgress('killElite', 1);
    } else if (this.class === 'celestial') {
      updateQuestProgress('killCelestial', 1);
    }
    if (this.type.includes('boss')) {
      updateQuestProgress('killBoss', 1);
    }
    enemies.splice(enemies.indexOf(this), 1);
  }
  update() {
    if (this.type === 'support' && this.linkedEnemies.size < 2) {
      const availableEnemies = enemies.filter(e => e !== this && e.type !== 'support' && !Array.from(this.linkedEnemies).includes(e));
      if (availableEnemies.length > 0) {
        const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        this.linkedEnemies.add(randomEnemy);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 5;
    if (this.type === 'support') {
      this.linkedEnemies.forEach(enemy => {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
      });
    }
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (this.type === 'gunner' || this.type === 'gunner-splitter') {
      const idealRange = 300;
      if (distToPlayer < idealRange - 50) {
        this.x -= Math.cos(angle) * this.speed;
        this.y -= Math.sin(angle) * this.speed;
      } else if (distToPlayer > idealRange + 50) {
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
      }
    } else {
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    }
    if (this.type === 'gunner' || this.type === 'gunner-splitter') {
      if (this.currentCooldown <= 0) {
        this.shoot();
        this.currentCooldown = this.shootCooldown;
      }
      this.currentCooldown--;
    }
    if (this.type === 'necromancer') {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        enemies.push(new Enemy('normal'));
        this.spawnTimer = 600;
      }
    }
    if (this.class === 'celestial') {
      if (this.regenerates && this.hp < this.maxHp) {
        this.hp += 0.1;
      }
      if (this.type === 'support') {
        this.linkedEnemies.forEach(enemy => {
          enemy.damageMultiplier = 0.2;
        });
      }
    }
  }
  shoot() {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    if (this.class === 'celestial' && this.spreadShot) {
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = angle + i * 0.2;
        projectiles.push(new Projectile(this.x, this.y, {
          x: Math.cos(spreadAngle) * 7,
          y: Math.sin(spreadAngle) * 7
        }, false, true));
      }
    } else {
      projectiles.push(new Projectile(this.x, this.y, {
        x: Math.cos(angle) * 7,
        y: Math.sin(angle) * 7
      }, false, true));
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (this.class === 'elite') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.class === 'celestial') {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
    }
    if (this.type.includes('splitter')) {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      gradient.addColorStop(0, this.type.includes('gunner') ? '#ff4444' : '#ff9800');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
    } else if (this.type === 'necromancer') {
      ctx.fillStyle = '#9c27b0';
    } else if (this.type === 'support') {
      ctx.fillStyle = '#33ccff';
    } else if (this.type.includes('boss')) {
      ctx.fillStyle = '#ff0000';
    } else {
      ctx.fillStyle = this.type === 'gunner' ? '#ff4444' : '#ff9800';
    }
    ctx.fill();
    const hpWidth = 40;
    const hpHeight = 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, hpWidth, hpHeight);
    ctx.fillStyle = '#4caf50';
    let maxHp = 100;
    if (this.type.includes('splitter')) maxHp = this.type.includes('gunner') ? 300 : 200;else if (this.type === 'necromancer') maxHp = 300;else if (this.type === 'gunner') maxHp = 150;else if (this.type.includes('boss')) maxHp = 600;
    ctx.fillRect(this.x - hpWidth / 2, this.y - this.radius - 10, this.hp / maxHp * hpWidth, hpHeight);
  }
}
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }
  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.02;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}
function startGame() {
  keys = {};
  let lastMousePos = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.hp = 100;
  if (firstTimePlaying) {
    localStorage.setItem('firstTimePlaying', 'false');
    money = 10;
    saveGameState();
  } else {
    loadGameState();
  }
  wave = 1;
  backgroundMusic.play().catch(error => {
    console.log("Audio playback failed:", error);
  });
  document.getElementById('hud').style.display = 'block';
  document.getElementById('difficultyMenu').style.display = 'none';
  document.getElementById('moneyDisplay').textContent = `$${money}`;
  gameStarted = true;
  currentGameMoney = 0;
  animate();
  spawnWave();
}
function showInstructions() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('instructionsMenu').style.display = 'block';
}
function hideInstructions() {
  document.getElementById('instructionsMenu').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
}
function spawnWave() {
  waveTime = Math.min(40, baseWaveTime + (wave - 1) * 5);
  const settings = difficultySettings[selectedDifficulty];
  const baseEnemyCount = 3 + (wave - 1) * 2;
  const enemyCount = Math.floor(baseEnemyCount * settings.waveEnemyMultiplier);
  for (let i = 0; i < enemyCount; i++) {
    const roll = Math.random();
    let type;
    if (roll < 0.1 && wave > 2) type = 'necromancer';else if (roll < 0.25 && wave > 1) type = Math.random() < 0.5 ? 'normal-splitter' : 'gunner-splitter';else if (roll < 0.3 && wave > 3) type = 'support';else if (roll < 0.35 && wave > settings.bossWaveStart) type = 'boss-normal';else type = Math.random() < 0.3 ? 'gunner' : 'normal';
    enemies.push(new Enemy(type));
  }
  const baseBonus = 30 + (wave - 1) * 15;
  const waveBonus = Math.floor(baseBonus * settings.moneyMultiplier);
  money += waveBonus;
  currentGameMoney += waveBonus;
  saveGameState();
  document.getElementById('moneyDisplay').textContent = `$${money}`;
  waveTimer = waveTime;
  discountedUpgrade = null;
  const transitionDiv = document.createElement('div');
  transitionDiv.className = 'wave-transition';
  transitionDiv.textContent = `Wave ${wave}`;
  document.body.appendChild(transitionDiv);
  setTimeout(() => transitionDiv.remove(), 2000);
}
function showDamage(x, y, amount) {
  const damageText = document.createElement('div');
  damageText.className = 'damageText';
  damageText.style.left = x + 'px';
  damageText.style.top = y + 'px';
  damageText.textContent = `-${Math.round(amount)}`;
  document.body.appendChild(damageText);
  setTimeout(() => damageText.remove(), 1000);
}
function animate() {
  if (!gameStarted || gamePaused) {
    return;
  }
  if (player.hp <= 0) {
    document.getElementById('backButton').style.display = 'none';
  }
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const playerSpeed = keys['shift'] ? player.speed * 0.5 : player.speed;
  if (keys['w']) {
    player.y -= playerSpeed;
  }
  if (keys['s']) {
    player.y += playerSpeed;
  }
  if (keys['a']) {
    player.x -= playerSpeed;
  }
  if (keys['d']) {
    player.x += playerSpeed;
  }
  if (player.x < 0 || player.x > canvas.width || player.y < 0 || player.y > canvas.height) {
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));
  }
  if (keys[' ']) {
    player.chargeTime = Math.min(player.chargeTime + 1, gunUpgrades.supercharge.purchased ? 90 : 60);
  } else if (player.chargeTime > 0) {
    const angle = Math.atan2(lastMousePos.y - player.y, lastMousePos.x - player.x);
    let projectile = new Projectile(player.x, player.y, {
      x: Math.cos(angle) * 10,
      y: Math.sin(angle) * 10
    }, player.chargeTime >= 60);
    projectiles.push(projectile);
    if (gunUpgrades.splitShot.purchased) {
      const angleOffset = 0.2;
      projectiles.push(new Projectile(player.x, player.y, {
        x: Math.cos(angle + angleOffset) * 10,
        y: Math.sin(angle + angleOffset) * 10
      }, player.chargeTime >= 60));
      projectiles.push(new Projectile(player.x, player.y, {
        x: Math.cos(angle - angleOffset) * 10,
        y: Math.sin(angle - angleOffset) * 10
      }, player.chargeTime >= 60));
    }
    if (gunUpgrades.splitShotV2.purchased) {
      const angleOffset = 0.4;
      projectiles.push(new Projectile(player.x, player.y, {
        x: Math.cos(angle + angleOffset) * 10,
        y: Math.sin(angle + angleOffset) * 10
      }, player.chargeTime >= 60));
      projectiles.push(new Projectile(player.x, player.y, {
        x: Math.cos(angle - angleOffset) * 10,
        y: Math.sin(angle - angleOffset) * 10
      }, player.chargeTime >= 60));
    }
    player.chargeTime = 0;
  }
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#3f51b5';
  ctx.fill();
  if (player.chargeTime > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5, 0, player.chargeTime / 60 * Math.PI * 2);
    ctx.strokeStyle = '#7e57c2';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (player.chargeTime >= 60) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#7e57c2';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (gunUpgrades.supercharge.purchased) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#4527a0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
  projectiles.forEach((projectile, index) => {
    projectile.update();
    projectile.draw();
    if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
      projectiles.splice(index, 1);
    }
  });
  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();
    enemy.draw();
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      const canBeHit = !projectile.hitEnemies.has(enemy) && Date.now() - enemy.lastHitTime >= 1000;
      if (dist < enemy.radius + projectile.radius && canBeHit && !projectile.isEnemyProjectile) {
        enemy.lastHitTime = Date.now();
        projectile.hitEnemies.add(enemy);
        const damage = calculateDamage(enemy, projectile.damage);
        enemy.hp -= damage;
        const moneyEarned = Math.ceil(damage / 15);
        money += moneyEarned;
        currentGameMoney += moneyEarned;
        document.getElementById('moneyDisplay').textContent = `$${money}`;
        saveGameState();
        showDamage(enemy.x, enemy.y, damage);
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(enemy.x, enemy.y, Math.random() * 4, enemy.type === 'gunner' ? '#ff4444' : '#ff9800', {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
          }));
        }
        if (enemy.hp <= 0) {
          enemy.onDeath();
        }
      }
    });
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist < enemy.radius + player.radius && !playerInvulnerable) {
      player.hp = Math.max(0, player.hp - 10 * difficultySettings[selectedDifficulty].enemyDamageMultiplier);
      playerInvulnerable = true;
      setTimeout(() => playerInvulnerable = false, 1000);
      if (player.hp <= 0) {
        gameOver(false);
        return;
      }
    }
    projectiles.forEach((projectile, projectileIndex) => {
      if (projectile.isEnemyProjectile) {
        const dist = Math.hypot(projectile.x - player.x, projectile.y - player.y);
        if (dist < player.radius + projectile.radius && !playerInvulnerable) {
          player.hp = Math.max(0, player.hp - 15 * difficultySettings[selectedDifficulty].enemyDamageMultiplier);
          projectiles.splice(projectileIndex, 1);
          playerInvulnerable = true;
          setTimeout(() => playerInvulnerable = false, 1000);
          if (player.hp <= 0) {
            gameOver(false);
            return;
          }
        }
      }
    });
  });
  particles.forEach((particle, index) => {
    particle.update();
    particle.draw();
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    }
  });
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;
  if (waveTimer > 0) {
    waveTimer -= deltaTime;
    if (waveTimer <= 0 || enemies.length === 0) {
      wave++;
      spawnWave();
    }
  }
  document.getElementById('hud').innerHTML = `
    HP: ${Math.ceil(player.hp)}<br>
    Wave: ${wave}<br>
    Time: ${Math.ceil(waveTimer)}
  `;
}
function calculateDamage(enemy, damage) {
  return damage * difficultySettings[selectedDifficulty].enemyDamageMultiplier;
}
function showDifficultySelect() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('difficultyMenu').style.display = 'block';
}
function hideDifficultySelect() {
  document.getElementById('difficultyMenu').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
}
function selectDifficultyAndStart(difficulty) {
  selectedDifficulty = difficulty;
  startGame();
}
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Space') {
    keys[' '] = true;
  } else if (e.key === 'w') {
    keys['w'] = true;
  } else if (e.key === 'a') {
    keys['a'] = true;
  } else if (e.key === 's') {
    keys['s'] = true;
  } else if (e.key === 'd') {
    keys['d'] = true;
  } else if (e.key === 'Shift') {
    keys['shift'] = true;
  }
});
document.addEventListener('keyup', e => {
  if (e.key === ' ' || e.key === 'Space') {
    keys[' '] = false;
  } else if (e.key === 'w') {
    keys['w'] = false;
  } else if (e.key === 'a') {
    keys['a'] = false;
  } else if (e.key === 's') {
    keys['s'] = false;
  } else if (e.key === 'd') {
    keys['d'] = false;
  } else if (e.key === 'Shift') {
    keys['shift'] = false;
  }
});
document.addEventListener('mousemove', e => {
  lastMousePos = {
    x: e.clientX,
    y: e.clientY
  };
});
function purchaseUpgrade(key) {
  if (money >= upgrades[key].cost) {
    money -= upgrades[key].cost;
    upgrades[key].level++;
    upgrades[key].cost += 20;
    if (key === 'damage') {
      player.extraDamage += 5;
    } else if (key === 'attackSpeed') {
      player.attackCooldown -= 2;
    } else if (key === 'piercing') {
      player.maxPierce++;
    } else if (key === 'health') {
      player.maxHp += 20;
      player.hp = Math.min(Math.max(0, player.hp + 20), player.maxHp);
    } else if (key === 'speed') {
      player.speed += 1;
    }
    saveGameState();
    document.getElementById('moneyDisplay').textContent = `$${money}`;
    document.getElementById('shopMoneyDisplay').textContent = `$${money}`;
    updateShop();
    showNotification('Purchase Successful!', 'success');
  } else {
    showNotification('Not enough money!', 'error');
  }
}
function purchaseGunUpgrade(key) {
  if (money >= gunUpgrades[key].cost) {
    money -= gunUpgrades[key].cost;
    gunUpgrades[key].purchased = true;
    gunUpgrades[key].cost += 20;
    saveGameState();
    document.getElementById('moneyDisplay').textContent = `$${money}`;
    document.getElementById('shopMoneyDisplay').textContent = `$${money}`;
    updateShop();
    showNotification('Purchase Successful!', 'success');
  } else {
    showNotification('Not enough money!', 'error');
  }
}
function showEnemyGuide() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('enemyGuideMenu').style.display = 'block';
}
function hideEnemyGuide() {
  document.getElementById('enemyGuideMenu').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
}
function gameOver(victory = false) {
  document.getElementById('backButton').style.display = 'none';
  gameStarted = false;
  const popup = document.createElement('div');
  popup.className = `game-over-popup ${victory ? 'victory' : 'defeat'}`;
  popup.innerHTML = `
    <h2>${victory ? 'VICTORY!' : 'GAME OVER'}</h2>
    <p>Waves Survived: ${wave}</p>
    <p>Money Earned: $${currentGameMoney}</p>
    <button onclick="location.reload()">PLAY AGAIN</button>
  `;
  document.body.appendChild(popup);
  backgroundMusic.pause();
}
function returnToMenu() {
  gameStarted = false;
  enemies = [];
  projectiles = [];
  particles = [];
  player.hp = 100;
  player.chargeTime = 0;
  wave = 1;
  document.getElementById('hud').style.display = 'none';
  document.getElementById('mainMenu').style.display = 'flex';
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  saveGameState();
}
function updateQuestProgress(type, amount) {
  quests.forEach(quest => {
    if (quest.type === type && !quest.completed) {
      quest.progress += amount;
      if (quest.progress >= quest.goal) {
        completeQuest(quest);
      }
    }
  });
}
function completeQuest(quest) {
  quest.completed = true;
  money += quest.baseReward;
  currentGameMoney += quest.baseReward;
  document.getElementById('moneyDisplay').textContent = `$${money}`;
  document.getElementById('shopMoneyDisplay').textContent = `$${money}`;
  completedQuests.push({
    ...quest
  });
  quests = quests.filter(q => !q.completed);
  while (quests.length < 4 && hardQuests.length > 0) {
    const newQuest = {
      ...hardQuests.shift()
    };
    newQuest.id = quests.length + 1;
    newQuest.completed = false;
    newQuest.progress = 0;
    quests.push(newQuest);
  }
  showNotification(`Quest Complete! +$${quest.baseReward}`, 'success');
  saveGameState();
  updateShop();
}
function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify({
    money: money,
    upgrades: upgrades,
    gunUpgrades: gunUpgrades,
    completedQuests: completedQuests,
    quests: quests
  }));
}
function loadGameState() {
  if (firstTimePlaying) {
    money = 10;
    quests = baseQuests.slice(0, 4);
    localStorage.setItem('firstTimePlaying', 'false');
  } else {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const state = JSON.parse(savedState);
      money = state.money || 0;
      upgrades = state.upgrades || upgrades;
      gunUpgrades = state.gunUpgrades || gunUpgrades;
      completedQuests = state.completedQuests || [];
      quests = state.quests || baseQuests.slice(0, 4);
      while (quests.filter(q => !q.completed).length < 4 && hardQuests.length > 0) {
        const newQuest = {
          ...hardQuests.shift()
        };
        newQuest.id = quests.length + 1;
        newQuest.completed = false;
        newQuest.progress = 0;
        quests.push(newQuest);
      }
      document.getElementById('moneyDisplay').textContent = `$${money}`;
    }
  }
}
document.addEventListener('mousedown', e => {
  if (e.button === 0) {
    keys[' '] = true;
  }
});
document.addEventListener('mouseup', e => {
  if (e.button === 0) {
    keys[' '] = false;
  }
});