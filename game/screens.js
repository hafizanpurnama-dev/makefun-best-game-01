// screens.js — Title and game-over screens for VOID RUNNER

import { sfxMenuSelect } from './audio.js';

const WIDTH = 1024;
const HEIGHT = 768;

export class TitleScreen {
  constructor() {
    this.time = 0;
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 30 + 10,
      });
    }
  }

  update(dt) {
    this.time += dt;
    for (const s of this.stars) {
      s.y -= s.speed * dt;
      if (s.y < -5) { s.y = HEIGHT + 5; s.x = Math.random() * WIDTH; }
    }
  }

  draw(ctx) {
    // Background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    for (const s of this.stars) {
      const alpha = 0.3 + Math.sin(s.y * 0.05 + this.time) * 0.3;
      ctx.fillStyle = `rgba(150, 200, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < HEIGHT; y += 3) ctx.fillRect(0, y, WIDTH, 1);

    // Title
    const titleY = 200 + Math.sin(this.time * 2) * 5;
    ctx.textAlign = 'center';

    // Glow layers
    for (let i = 3; i >= 0; i--) {
      ctx.fillStyle = i === 0 ? '#00ddff' : '#0066aa';
      ctx.font = `bold ${68 - i * 2}px monospace`;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 20 + i * 8;
      ctx.fillText('VOID RUNNER', WIDTH / 2, titleY + i * 1.5);
    }
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#6688aa';
    ctx.font = '16px monospace';
    ctx.fillText('SURVIVE THE NEON ABYSS', WIDTH / 2, titleY + 40);

    // Instructions
    const instructY = 420;
    ctx.fillStyle = '#8899bb';
    ctx.font = '14px monospace';
    ctx.fillText('ARROW KEYS / WASD — MOVE', WIDTH / 2, instructY);
    ctx.fillText('SPACE / Z — FIRE', WIDTH / 2, instructY + 24);
    ctx.fillText('M — MUTE', WIDTH / 2, instructY + 48);

    // Start prompt
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.5;
    ctx.fillStyle = `rgba(0, 220, 255, ${0.5 + pulse * 0.5})`;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PRESS ENTER OR CLICK TO START', WIDTH / 2, 540);

    // Credits
    ctx.fillStyle = '#334466';
    ctx.font = '11px monospace';
    ctx.fillText('A GAME BY NOUS RESEARCH', WIDTH / 2, HEIGHT - 30);
  }
}

export class GameOverScreen {
  constructor() {
    this.time = 0;
    this.finalScore = 0;
    this.finalLevel = 0;
    this.isNewHighScore = false;
    this.highScore = 0;
  }

  show(score, level, highScore) {
    this.time = 0;
    this.finalScore = score;
    this.finalLevel = level;
    this.highScore = Math.max(highScore, score);
    this.isNewHighScore = score >= this.highScore && score > 0;
  }

  update(dt) {
    this.time += dt;
  }

  draw(ctx) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Game Over text
    const yBase = 200;
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff2244';
    ctx.font = 'bold 52px monospace';
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', WIDTH / 2, yBase);
    ctx.shadowBlur = 0;

    // Stats box
    const boxX = WIDTH / 2 - 160;
    const boxY = yBase + 40;
    ctx.strokeStyle = '#334466';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, 320, 160);
    ctx.fillStyle = 'rgba(0, 10, 30, 0.8)';
    ctx.fillRect(boxX, boxY, 320, 160);

    ctx.fillStyle = '#8899aa';
    ctx.font = '15px monospace';
    ctx.fillText(`FINAL SCORE`, WIDTH / 2, boxY + 28);
    ctx.fillStyle = '#00ccff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`${this.finalScore.toLocaleString()}`, WIDTH / 2, boxY + 60);

    ctx.fillStyle = '#8899aa';
    ctx.font = '14px monospace';
    ctx.fillText(`WAVE REACHED: ${this.finalLevel}`, WIDTH / 2, boxY + 90);
    ctx.fillText(`HIGH SCORE: ${this.highScore.toLocaleString()}`, WIDTH / 2, boxY + 112);

    if (this.isNewHighScore && this.time > 1) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('★ NEW HIGH SCORE ★', WIDTH / 2, boxY + 140);
    }

    // Restart prompt
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.5;
    ctx.fillStyle = `rgba(0, 220, 255, ${0.5 + pulse * 0.5})`;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRESS ENTER OR CLICK TO RESTART', WIDTH / 2, 540);
  }
}