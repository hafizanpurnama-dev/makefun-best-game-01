// particles.js — Particle system for VOID RUNNER
// Handles explosions, trails, screen shake, and ambient particles.

const PARTICLES_MAX = 800;

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 0; this.size = 0;
    this.r = 0; this.g = 0; this.b = 0; this.alpha = 0;
    this.active = false;
  }
  init(x, y, vx, vy, life, size, r, g, b, alpha = 1) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life; this.size = size;
    this.r = r; this.g = g; this.b = b; this.alpha = alpha;
    this.active = true;
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }
}

export class ParticleSystem {
  constructor() {
    this.pool = [];
    for (let i = 0; i < PARTICLES_MAX; i++) {
      this.pool.push(new Particle());
    }
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.ambientParticles = [];
    this._initAmbient();
  }

  _initAmbient() {
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * 1024, y: Math.random() * 768,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 30 + 10,
        alpha: Math.random() * 0.5 + 0.1,
        hue: [200, 280, 320, 180, 30][Math.floor(Math.random() * 5)],
      });
    }
  }

  _getParticle() {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    // Recycle oldest
    let oldest = this.pool[0];
    for (const p of this.pool) {
      if (p.life < oldest.life) oldest = p;
    }
    oldest.reset();
    return oldest;
  }

  emit(x, y, count, color, speed = 200, life = 0.5, size = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const p = this._getParticle();
      p.init(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, life, size * (0.5 + Math.random()), color.r, color.g, color.b);
    }
  }

  emitDirected(x, y, count, angle, spread, color, speed = 300, life = 0.3, size = 2) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const p = this._getParticle();
      p.init(x, y, Math.cos(a) * spd, Math.sin(a) * spd, life, size, color.r, color.g, color.b);
    }
  }

  emitTrail(x, y, color, size = 2) {
    const p = this._getParticle();
    p.init(x, y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 0.2 + Math.random() * 0.3, size, color.r, color.g, color.b, 0.6);
  }

  shake(intensity = 8, duration = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(dt) {
    // Update particles
    for (const p of this.pool) {
      p.update(dt);
    }
    // Update shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const decay = this.shakeDuration > 0 ? this.shakeDuration / (this.shakeDuration + dt) : 0;
      this.shakeIntensity *= decay;
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      if (this.shakeDuration <= 0) {
        this.shakeX = 0; this.shakeY = 0; this.shakeIntensity = 0;
      }
    }
    // Update ambient
    for (const ap of this.ambientParticles) {
      ap.y -= ap.speed * dt;
      if (ap.y < -10) { ap.y = 778; ap.x = Math.random() * 1024; }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Draw ambient particles
    for (const ap of this.ambientParticles) {
      ctx.globalAlpha = ap.alpha;
      ctx.fillStyle = `hsl(${ap.hue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw active particles
    for (const p of this.pool) {
      if (!p.active) continue;
      const progress = p.life / p.maxLife;
      ctx.globalAlpha = progress * p.alpha;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.shadowColor = `rgb(${p.r},${p.g},${p.b})`;
      ctx.shadowBlur = p.size * 2 * progress;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}