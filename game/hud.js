// hud.js — Heads-up display for VOID RUNNER
// Shows score, lives, level, wave progress, power level.

export class HUD {
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.powerLevel = 1;
    this.waveProgress = 0;
    this.flashMsg = '';
    this.flashTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.powerLevel = 1;
    this.waveProgress = 0;
    this.flashMsg = '';
    this.flashTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  flash(message, duration = 1.5) {
    this.flashMsg = message;
    this.flashTimer = duration;
  }

  addScore(points, x, y) {
    this.score += points;
    this.comboCount++;
    this.comboTimer = 1.5;
  }

  update(dt) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
  }

  draw(ctx, width) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.9;

    // Top bar background
    const barH = 36;
    const grad = ctx.createLinearGradient(0, 0, 0, barH);
    grad.addColorStop(0, 'rgba(0, 10, 30, 0.85)');
    grad.addColorStop(1, 'rgba(0, 10, 30, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, barH + 20);

    // Score (left)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${String(this.score).padStart(8, '0')}`, 16, 24);

    // Lives (center-left)
    ctx.fillStyle = '#00ccff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    let livesStr = '❤'.repeat(this.lives) + '♡'.repeat(Math.max(0, 3 - this.lives));
    ctx.fillText(`LIVES  ${livesStr}`, 300, 24);

    // Level (center)
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${this.level}`, width / 2, 24);

    // Power level (center-right)
    if (this.powerLevel > 1) {
      ctx.fillStyle = '#ff66ff';
      ctx.textAlign = 'right';
      ctx.fillText(`PWR:${'◆'.repeat(this.powerLevel)}`, width - 240, 24);
    }

    // Combo display
    if (this.comboCount >= 5) {
      const alpha = Math.min(1, this.comboTimer);
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`x${this.comboCount} COMBO`, width - 16, 24);
    }

    // Flash message (center screen)
    if (this.flashTimer > 0) {
      ctx.globalAlpha = Math.min(1, this.flashTimer * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.fillText(this.flashMsg, width / 2, 300);
      ctx.shadowBlur = 0;
    }

    // Wave progress bar (bottom of HUD)
    if (this.waveProgress > 0) {
      const barW = 200;
      const barX = width / 2 - barW / 2;
      const barY = 42;
      ctx.fillStyle = 'rgba(0, 20, 50, 0.6)';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(barX, barY, barW * this.waveProgress, 4);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}