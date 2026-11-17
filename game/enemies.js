// enemies.js — Enemy waves and behaviors for VOID RUNNER
// Spawns waves with increasing difficulty and varied enemy patterns.

import { sfxHit, sfxExplosion } from './audio.js';

const WIDTH = 1024;
const HEIGHT = 768;

// Enemy types
const ENEMY_DRONE = {
  width: 24, height: 24, hp: 1, speed: 120, score: 100,
  color: '#ff4466', glowColor: '#ff2244',
  draw(ctx, e) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    // Diamond shape
    ctx.moveTo(e.x, e.y - e.halfH);
    ctx.lineTo(e.x + e.halfW, e.y);
    ctx.lineTo(e.x, e.y + e.halfH);
    ctx.lineTo(e.x - e.halfW, e.y);
    ctx.closePath();
    ctx.fill();
    // Inner dot
    ctx.fillStyle = '#ff8899';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

const ENEMY_WEAVER = {
  width: 20, height: 32, hp: 2, speed: 90, score: 200,
  color: '#ffaa00', glowColor: '#ff8800',
  draw(ctx, e) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    // Elongated hex
    const w2 = e.halfW, h2 = e.halfH;
    ctx.moveTo(e.x, e.y - h2);
    ctx.lineTo(e.x + w2, e.y - h2 / 2);
    ctx.lineTo(e.x + w2, e.y + h2 / 2);
    ctx.lineTo(e.x, e.y + h2);
    ctx.lineTo(e.x - w2, e.y + h2 / 2);
    ctx.lineTo(e.x - w2, e.y - h2 / 2);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#ffdd88';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(e.x, e.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

const ENEMY_TANK = {
  width: 40, height: 40, hp: 5, speed: 50, score: 500,
  color: '#cc44ff', glowColor: '#aa22dd',
  draw(ctx, e) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 14;
    // Hexagon
    const r = e.halfW;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    // Armor ring
    ctx.strokeStyle = '#ee88ff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.stroke();
    // HP indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(e.hp, e.x, e.y + 4);
  }
};

const ENEMY_SCOUT = {
  width: 16, height: 16, hp: 1, speed: 250, score: 150,
  color: '#44ff44', glowColor: '#22cc22',
  draw(ctx, e) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    // Small triangle
    ctx.moveTo(e.x, e.y - e.halfH);
    ctx.lineTo(e.x + e.halfW, e.y + e.halfH);
    ctx.lineTo(e.x - e.halfW, e.y + e.halfH);
    ctx.closePath();
    ctx.fill();
  }
};

const ENEMY_BOSS = {
  width: 60, height: 50, hp: 30, speed: 30, score: 5000,
  color: '#ff2266', glowColor: '#dd0044',
  draw(ctx, e) {
    const pulse = 1 + Math.sin(e.time * 3) * 0.1;
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.glowColor;
    ctx.shadowBlur = 20 * pulse;
    // Shield ring
    ctx.strokeStyle = `rgba(255, 50, 100, ${0.3 + Math.sin(e.time * 4) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.halfW * 1.3 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    // Main body
    ctx.fillStyle = e.color;
    ctx.beginPath();
    const r = e.halfW * 0.9;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.7;
      ctx.lineTo(e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    // HP bar
    ctx.fillStyle = '#220000';
    ctx.shadowBlur = 0;
    const bw = 50, bh = 4;
    ctx.fillRect(e.x - bw / 2, e.y - e.halfH - 14, bw, bh);
    ctx.fillStyle = '#ff3344';
    ctx.fillRect(e.x - bw / 2, e.y - e.halfH - 14, bw * (e.hp / e.maxHp), bh);
  }
};

// Wave definitions
function createWave(level) {
  const waves = [];

  // Wave pattern: groups of enemies
  const numGroups = 2 + Math.floor(level / 3);
  const baseEnemies = 3 + level;

  for (let g = 0; g < numGroups; g++) {
    const type = selectEnemyType(level);
    const count = Math.min(baseEnemies + g * 2, 12);
    const formation = selectFormation(level, g);

    const enemies = [];
    for (let i = 0; i < count; i++) {
      const pos = formation(i, count);
      enemies.push({
        type,
        spawnX: pos.x,
        spawnY: pos.y,
        delay: i * 0.15 + g * 1.2,
        behavior: selectBehavior(level, type),
      });
    }
    waves.push(enemies);
  }

  // Boss every 5 levels
  if (level % 5 === 0) {
    waves.push([{
      type: ENEMY_BOSS,
      spawnX: WIDTH / 2,
      spawnY: -80,
      delay: 0.5,
      behavior: 'boss',
    }]);
  }

  return waves;
}

function selectEnemyType(level) {
  const types = [ENEMY_DRONE];
  if (level >= 2) types.push(ENEMY_SCOUT);
  if (level >= 3) types.push(ENEMY_WEAVER);
  if (level >= 4) types.push(ENEMY_TANK);
  if (level >= 5) types.push(ENEMY_SCOUT, ENEMY_WEAVER); // Extra weight
  return types[Math.floor(Math.random() * types.length)];
}

function selectFormation(level, group) {
  const formations = ['line', 'vShape', 'staggered'];
  if (level >= 3) formations.push('circle');
  if (level >= 5) formations.push('diamond');
  const choice = formations[Math.floor(Math.random() * formations.length)];

  return (i, count) => {
    switch (choice) {
      case 'line':
        return { x: WIDTH * 0.2 + (WIDTH * 0.6 / Math.max(count - 1, 1)) * i, y: -40 - Math.random() * 60 };
      case 'vShape': {
        const mid = Math.floor(count / 2);
        return { x: WIDTH / 2 + (i - mid) * 50, y: -40 - Math.abs(i - mid) * 30 };
      }
      case 'staggered':
        return { x: 100 + (i % 5) * 180 + (Math.floor(i / 5) % 2) * 90, y: -40 - Math.floor(i / 5) * 50 };
      case 'circle': {
        const angle = (Math.PI * 2 / count) * i;
        const r = 80;
        return { x: WIDTH / 2 + Math.cos(angle) * r, y: -80 + Math.sin(angle) * r };
      }
      case 'diamond': {
        const perSide = Math.ceil(count / 4);
        const side = Math.floor(i / perSide);
        const idx = i % perSide;
        const t = idx / (perSide - 1 || 1);
        let x, y;
        if (side === 0) { x = WIDTH / 2 + t * 100; y = -40 - (1 - t) * 60; }
        else if (side === 1) { x = WIDTH / 2 + 100 - t * 100; y = -40 - t * 60; }
        else if (side === 2) { x = WIDTH / 2 - t * 100; y = -40 + t * 60; }
        else { x = WIDTH / 2 - 100 + t * 100; y = -40 + (1 - t) * 60; }
        return { x, y };
      }
      default:
        return { x: WIDTH / 2, y: -40 };
    }
  };
}

function selectBehavior(level, type) {
  const behaviors = ['straight', 'zigzag'];
  if (level >= 3) behaviors.push('sine');
  if (level >= 4 && type === ENEMY_SCOUT) behaviors.push('dive');
  return behaviors[Math.floor(Math.random() * behaviors.length)];
}

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.bullets = [];
    this.waves = [];
    this.currentWave = 0;
    this.waveTimer = 0;
    this.waveActive = false;
    this.level = 1;
    this.spawnQueue = [];
  }

  reset() {
    this.enemies = [];
    this.bullets = [];
    this.waves = [];
    this.currentWave = 0;
    this.waveTimer = 0;
    this.waveActive = false;
    this.level = 1;
    this.spawnQueue = [];
  }

  startWave(level) {
    this.level = level;
    this.waves = createWave(level);
    this.currentWave = 0;
    this.waveTimer = 0;
    this.waveActive = true;
    this.spawnQueue = [];
  }

  wavesRemaining() {
    return this.currentWave < this.waves.length;
  }

  update(dt, particles, playerX, playerY) {
    if (!this.waveActive) return 0;

    let scoreGained = 0;

    // Process spawn queue
    this.waveTimer += dt;
    if (this.currentWave < this.waves.length) {
      const waveGroup = this.waves[this.currentWave];
      for (const spec of waveGroup) {
        if (spec.delay <= this.waveTimer && !spec.spawned) {
          spec.spawned = true;
          const enemy = this._createEnemy(spec);
          this.enemies.push(enemy);
        }
      }
      // Check if all in this wave group are spawned
      if (waveGroup.every(s => s.spawned)) {
        this.currentWave++;
        this.waveTimer = 0;
      }
    }

    // Update enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.time += dt;

      // Behavior
      switch (e.behavior) {
        case 'straight':
          e.y += e.speed * dt;
          break;
        case 'zigzag':
          e.y += e.speed * dt;
          e.x += Math.sin(e.time * 4) * 150 * dt;
          break;
        case 'sine':
          e.y += e.speed * dt * 0.7;
          e.x = e.startX + Math.sin(e.time * 2.5) * 180;
          break;
        case 'dive':
          if (e.phase === 0) {
            e.y += e.speed * 1.5 * dt;
            if (e.y > playerY - 100) e.phase = 1;
          } else {
            e.y -= e.speed * dt;
          }
          break;
        case 'boss': {
          e.y += e.speed * dt;
          if (e.y > 100) e.y = 100;
          e.x = WIDTH / 2 + Math.sin(e.time * 0.5) * 200;
          // Boss shoots
          if (e.shootTimer <= 0) {
            e.shootTimer = 1.0 - this.level * 0.03;
            const angle = Math.atan2(playerY - e.y, playerX - e.x);
            for (let i = -2; i <= 2; i++) {
              this.bullets.push({
                x: e.x, y: e.y + e.halfH, vx: Math.cos(angle + i * 0.2) * 250,
                vy: Math.sin(angle + i * 0.2) * 250,
              });
            }
          }
          e.shootTimer -= dt;
          break;
        }
      }

      // Remove off-screen
      if (e.y > HEIGHT + 100 || e.y < -200 || e.x < -100 || e.x > WIDTH + 100) {
        e.alive = false;
      }
    }

    // Update enemy bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    // Clean up
    this.enemies = this.enemies.filter(e => e.alive);
    this.bullets = this.bullets.filter(b => b.x > -50 && b.x < WIDTH + 50 && b.y > -50 && b.y < HEIGHT + 50);

    // Check wave complete
    if (this.currentWave >= this.waves.length && this.enemies.length === 0) {
      this.waveActive = false;
    }

    return scoreGained;
  }

  _createEnemy(spec) {
    const type = spec.type;
    return {
      x: spec.spawnX,
      y: spec.spawnY,
      startX: spec.spawnX,
      halfW: type.width / 2,
      halfH: type.height / 2,
      hp: type.hp,
      maxHp: type.hp,
      speed: type.speed + this.level * 5,
      score: type.score,
      color: type.color,
      glowColor: type.glowColor,
      draw: type.draw,
      alive: true,
      behavior: spec.behavior,
      time: 0,
      phase: 0,
      shootTimer: 1.5,
    };
  }

  hitEnemy(index, damage, particles) {
    const e = this.enemies[index];
    if (!e || !e.alive) return 0;
    e.hp -= damage;
    sfxHit();

    if (e.hp <= 0) {
      e.alive = false;
      sfxExplosion();
      const color = this._parseColor(e.color);
      particles.emit(e.x, e.y, 20, color, 250, 0.6, 4);
      particles.emit(e.x, e.y, 10, { r: 255, g: 255, b: 200 }, 150, 0.4, 2);
      if (e.maxHp >= 5) particles.shake(12, 0.3);
      else particles.shake(4, 0.15);
      return e.score;
    }
    // Small hit flash
    const color = this._parseColor(e.color);
    particles.emitDirected(e.x, e.y, 3, Math.random() * Math.PI * 2, 1.0, color, 100, 0.15, 2);
    return 0;
  }

  _parseColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  draw(ctx) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      ctx.save();
      e.draw(ctx, e);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw enemy bullets
    for (const b of this.bullets) {
      ctx.fillStyle = '#ff4488';
      ctx.shadowColor = '#ff2266';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}