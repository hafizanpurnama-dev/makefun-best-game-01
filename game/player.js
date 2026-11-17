// player.js — Player ship for VOID RUNNER
// Handles movement, shooting, invincibility, and power-ups.

import { sfxShoot, sfxPlayerHit, sfxPowerUp } from './audio.js';

const WIDTH = 1024;
const HEIGHT = 768;
const PLAYER_SPEED = 420;
const SHOOT_COOLDOWN = 0.12;
const INVINCIBILITY_TIME = 2.0;
const MAX_LIVES = 3;

export class Player {
  constructor() {
    this.x = WIDTH / 2;
    this.y = HEIGHT - 100;
    this.width = 32;
    this.height = 36;
    this.speed = PLAYER_SPEED;
    this.lives = MAX_LIVES;
    this.invincible = 0;
    this.shootTimer = 0;
    this.powerLevel = 1; // 1-3: single, double, triple shot
    this.powerTimer = 0;
    this.engineGlow = 0;
    this.tilt = 0;
  }

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT - 100;
    this.lives = MAX_LIVES;
    this.invincible = 2.0; // Start invincible
    this.shootTimer = 0;
    this.powerLevel = 1;
    this.powerTimer = 0;
    this.tilt = 0;
    this.engineGlow = 0;
  }

  update(dt, input) {
    // Movement
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const targetTilt = dx * 15; // Tilt based on horizontal movement
    this.tilt += (targetTilt - this.tilt) * Math.min(dt * 8, 1);

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    // Clamp to screen
    this.x = Math.max(this.width / 2, Math.min(WIDTH - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(HEIGHT - this.height / 2, this.y));

    // Engine glow
    this.engineGlow = 0.5 + Math.sin(Date.now() * 0.02) * 0.3 + (dy < 0 ? 0.2 : 0);

    // Shooting
    this.shootTimer -= dt;
    if (input.shoot && this.shootTimer <= 0) {
      this.shootTimer = SHOOT_COOLDOWN;
      return this._getBullets();
    }

    // Invincibility
    if (this.invincible > 0) this.invincible -= dt;

    // Power timer
    if (this.powerTimer > 0) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0 && this.powerLevel > 1) {
        this.powerLevel--;
      }
    }

    return null;
  }

  _getBullets() {
    sfxShoot();
    const bullets = [];
    const bx = this.x;
    const by = this.y - this.height / 2;
    const spread = this.powerLevel > 1 ? 12 : 0;

    if (this.powerLevel >= 1) {
      bullets.push({ x: bx, y: by, vx: 0, vy: -700, damage: 1 });
    }
    if (this.powerLevel >= 2) {
      bullets.push({ x: bx - spread, y: by + 6, vx: 0, vy: -700, damage: 1 });
      bullets.push({ x: bx + spread, y: by + 6, vx: 0, vy: -700, damage: 1 });
    }
    if (this.powerLevel >= 3) {
      bullets.push({ x: bx - spread * 2, y: by + 10, vx: -30, vy: -650, damage: 1 });
      bullets.push({ x: bx + spread * 2, y: by + 10, vx: 30, vy: -650, damage: 1 });
    }
    return bullets;
  }

  hit() {
    if (this.invincible > 0) return false;
    this.lives--;
    this.invincible = INVINCIBILITY_TIME;
    this.powerLevel = Math.max(1, this.powerLevel - 1);
    sfxPlayerHit();
    return true;
  }

  powerUp() {
    if (this.powerLevel < 3) {
      this.powerLevel++;
    }
    this.powerTimer = 15; // 15 seconds of power
    sfxPowerUp();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt * Math.PI / 180);

    // Invincibility flicker
    const blinkOff = this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0;
    if (blinkOff) {
      ctx.globalAlpha = 0.3;
    }

    // Engine glow
    const glowSize = 12 + this.engineGlow * 8;
    const glowGrad = ctx.createRadialGradient(0, this.height / 2 + 4, 0, 0, this.height / 2, glowSize);
    glowGrad.addColorStop(0, 'rgba(0, 200, 255, 0.9)');
    glowGrad.addColorStop(0.5, 'rgba(0, 150, 255, 0.4)');
    glowGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, this.height / 2, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Ship body — sleek arrow shape
    ctx.fillStyle = '#00ccff';
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    // Nose
    ctx.moveTo(0, -this.height / 2);
    // Right wing
    ctx.lineTo(this.width / 2, this.height / 2 - 8);
    // Right bottom
    ctx.lineTo(this.width / 4, this.height / 2 - 4);
    // Engine notch
    ctx.lineTo(this.width / 6, this.height / 4);
    ctx.lineTo(-this.width / 6, this.height / 4);
    // Left bottom
    ctx.lineTo(-this.width / 4, this.height / 2 - 4);
    // Left wing
    ctx.lineTo(-this.width / 2, this.height / 2 - 8);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#66eeff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2 + 4);
    ctx.lineTo(this.width / 4, this.height / 2 - 14);
    ctx.lineTo(-this.width / 4, this.height / 2 - 14);
    ctx.closePath();
    ctx.fill();

    // Power level indicators
    if (this.powerLevel > 1) {
      for (let i = 0; i < this.powerLevel - 1; i++) {
        ctx.fillStyle = '#ff66ff';
        ctx.shadowColor = '#ff66ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc((i - (this.powerLevel - 2) / 2) * 14, this.height / 2 + 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}