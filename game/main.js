// main.js — VOID RUNNER game loop, initialization, and screen management

import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { ParticleSystem } from './particles.js';
import { HUD } from './hud.js';
import { TitleScreen, GameOverScreen } from './screens.js';
import { initAudio, resumeAudio, toggleMute, sfxWaveStart, sfxMenuSelect } from './audio.js';

const W = 1024;
const H = 768;
const STATE_TITLE = 0;
const STATE_PLAYING = 1;
const STATE_OVER = 2;

class Game {
  constructor() {
    this.c = document.getElementById('game');
    this.ctx = this.c.getContext('2d');
    this.c.width = W;
    this.c.height = H;
    this.input = { left: false, right: false, up: false, down: false, shoot: false };
    this.particles = new ParticleSystem();
    this.player = new Player();
    this.enemies = new EnemyManager();
    this.hud = new HUD();
    this.title = new TitleScreen();
    this.gameOver = new GameOverScreen();
    this.state = STATE_TITLE;
    this.bullets = [];
    this.highScore = 0;
    this.level = 1;
    this.t = 0;
    this.powerUp = null;
    this._wavePending = false;
    this._waveCooldown = 0;
  }

  boot() {
    initAudio();
    const keys = {};
    addEventListener('keydown', e => {
      keys[e.code] = true;
      this._sync(keys);
      if (e.code === 'KeyM') toggleMute();
      e.preventDefault();
    });
    addEventListener('keyup', e => { keys[e.code] = false; this._sync(keys); });
    this.c.addEventListener('click', () => {
      resumeAudio();
      if (this.state === STATE_TITLE) this._play();
      else if (this.state === STATE_OVER) this._title();
    });
    this._tick(performance.now());
  }

  _sync(keys) {
    this.input.left = keys['ArrowLeft'] || keys['KeyA'];
    this.input.right = keys['ArrowRight'] || keys['KeyD'];
    this.input.up = keys['ArrowUp'] || keys['KeyW'];
    this.input.down = keys['ArrowDown'] || keys['KeyS'];
    this.input.shoot = keys['Space'] || keys['KeyZ'] || keys['KeyJ'];
    if (keys['Enter']) {
      resumeAudio();
      if (this.state === STATE_TITLE) this._play();
      else if (this.state === STATE_OVER) this._title();
    }
  }

  _play() {
    sfxMenuSelect();
    this.state = STATE_PLAYING;
    this.level = 1;
    this.bullets = [];
    this.player.reset();
    this.enemies.reset();
    this.hud.reset();
    this.powerUp = null;
    this._wave();
  }

  _title() {
    sfxMenuSelect();
    this.state = STATE_TITLE;
    this.title = new TitleScreen();
  }

  _wave() {
    this.hud.level = this.level;
    this.hud.flash('WAVE ' + this.level, 2);
    sfxWaveStart();
    this.enemies.startWave(this.level);
  }

  _tick(now) {
    const dt = Math.min((now - this.t) / 1000, 0.05);
    this.t = now;
    this._update(dt);
    this._draw();
    requestAnimationFrame(t => this._tick(t));
  }

  _update(dt) {
    this.particles.update(dt);
    if (this.state === STATE_TITLE) { this.title.update(dt); return; }
    if (this.state === STATE_OVER) { this.gameOver.update(dt); return; }

    const p = this.player;
    const bullets = p.update(dt, this.input);
    if (bullets) this.bullets.push(...bullets);

    this.enemies.update(dt, this.particles, p.x, p.y);
    if (!this.enemies.waveActive && this.enemies.currentWave >= this.enemies.waves.length && !this._wavePending) {
      this._wavePending = true;
      this.level++;
      setTimeout(() => { this._wavePending = false; this._wave(); }, 1200);
    }

    for (const b of this.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    this.bullets = this.bullets.filter(b => b.y > -20 && b.y < H + 20);

    // Player bullets vs enemies
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ei = 0; ei < this.enemies.enemies.length; ei++) {
        const e = this.enemies.enemies[ei];
        if (!e.alive) continue;
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx * dx + dy * dy < e.halfW * e.halfW + 36) {
          this.bullets.splice(bi, 1);
          const pts = this.enemies.hitEnemy(ei, b.damage, this.particles);
          if (pts > 0) {
            this.hud.addScore(pts, e.x, e.y);
            if (Math.random() < 0.05 && !this.powerUp) this._dropPower(e.x, e.y);
          }
          break;
        }
      }
    }

    // Enemy bullets vs player
    if (p.invincible <= 0) {
      for (let bi = this.enemies.bullets.length - 1; bi >= 0; bi--) {
        const b = this.enemies.bullets[bi];
        const dx = b.x - p.x, dy = b.y - p.y;
        if (dx * dx + dy * dy < 324) {
          this.enemies.bullets.splice(bi, 1);
          this.particles.emit(p.x, p.y, 30, { r: 255, g: 100, b: 50 }, 300, 0.5, 4);
          this.particles.shake(10, 0.25);
          if (p.hit()) { this.hud.lives = p.lives; if (p.lives <= 0) return this._die(); }
          break;
        }
      }
      for (const e of this.enemies.enemies) {
        if (!e.alive) continue;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy < e.halfW * e.halfW + 256) {
          this.particles.emit(p.x, p.y, 25, { r: 255, g: 100, b: 50 }, 300, 0.5, 4);
          this.particles.shake(10, 0.25);
          this.enemies.hitEnemy(this.enemies.enemies.indexOf(e), 99, this.particles);
          if (p.hit()) { this.hud.lives = p.lives; if (p.lives <= 0) return this._die(); }
        }
      }
    }

    // Power-up
    if (this.powerUp) {
      this.powerUp.y += 90 * dt;
      this.powerUp.pulse += dt * 6;
      if (this.powerUp.y > H + 40) { this.powerUp = null; }
      else {
        const dx = this.powerUp.x - p.x, dy = this.powerUp.y - p.y;
        if (dx * dx + dy * dy < 900) {
          p.powerUp();
          this.particles.emit(p.x, p.y, 15, { r: 255, g: 100, b: 255 }, 150, 0.5, 3);
          this.powerUp = null;
        }
      }
    }

    this.hud.lives = p.lives;
    this.hud.powerLevel = p.powerLevel;
    this.hud.update(dt);
  }

  _dropPower(x, y) {
    if (this.player.powerLevel >= 3) return;
    this.powerUp = { x, y: y - 10, pulse: 0 };
  }

  _die() {
    this.state = STATE_OVER;
    this.highScore = Math.max(this.highScore, this.hud.score);
    this.gameOver.show(this.hud.score, this.level, this.highScore);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    if (this.state === STATE_TITLE) { this.title.draw(ctx); return; }

    // Background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#000818');
    g.addColorStop(0.5, '#000c24');
    g.addColorStop(1, '#000510');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 50, 100, 0.06)';
    ctx.lineWidth = 1;
    const off = (this.t * 0.02) % 60;
    for (let x = off; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = off; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    this.particles.draw(ctx);

    if (this.state === STATE_OVER) {
      this.enemies.draw(ctx);
      this.player.draw(ctx);
      this.gameOver.draw(ctx);
      return;
    }

    this.enemies.draw(ctx);

    // Player bullets
    for (const b of this.bullets) {
      ctx.fillStyle = '#00eeff';
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.beginPath(); ctx.arc(b.x, b.y + 6, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    this.player.draw(ctx);

    // Power-up
    if (this.powerUp) {
      const pu = this.powerUp;
      const sz = 10 + Math.sin(pu.pulse) * 4;
      ctx.fillStyle = '#ff44ff';
      ctx.shadowColor = '#ff22ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 2 / 5 * i - Math.PI / 2;
        ctx.lineTo(pu.x + Math.cos(a) * sz, pu.y + Math.sin(a) * sz);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('P', pu.x, pu.y + 3);
    }
    ctx.shadowBlur = 0;

    this.hud.draw(ctx, W);
  }
}

new Game().boot();