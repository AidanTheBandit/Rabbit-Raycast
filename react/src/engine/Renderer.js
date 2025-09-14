import { GAME_CONSTANTS } from './Constants.js';

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.muzzleFlash = 0;
  }

  render() {
    this.clearCanvas();
    this.renderBackground();
    this.renderWalls();
    this.renderEnemies();
    this.renderMuzzleFlash();
    this.renderGameStateOverlays();
    this.renderCrosshair();
  }

  clearCanvas() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
  }

  renderBackground() {
    // Sky
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height / 2);

    // Ground
    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(0, this.game.height / 2, this.game.width, this.game.height / 2);
  }

  renderWalls() {
    for (let x = 0; x < this.game.rayCount; x++) {
      const rayAngle = this.game.player.angle - this.game.fov / 2 + (x / this.game.rayCount) * this.game.fov;
      const distance = this.game.castRay(rayAngle);
      const wallHeight = (this.game.height / 2) / distance;
      const wallTop = (this.game.height / 2) - wallHeight;
      const wallBottom = (this.game.height / 2) + wallHeight;
      const shade = Math.max(0, 1 - distance / this.game.maxDepth);
      const color = Math.floor(255 * shade);

      this.ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.5)}, 0)`;
      this.ctx.fillRect(
        (x / this.game.rayCount) * this.game.width,
        wallTop,
        this.game.width / this.game.rayCount + 1,
        wallBottom - wallTop
      );
    }
  }

  renderEnemies() {
    this.game.enemies.forEach(enemy => enemy.render());
  }

  renderMuzzleFlash() {
    if (this.muzzleFlash > 0) {
      this.ctx.fillStyle = `rgba(${GAME_CONSTANTS.MUZZLE_FLASH_COLOR[0]}, ${GAME_CONSTANTS.MUZZLE_FLASH_COLOR[1]}, ${GAME_CONSTANTS.MUZZLE_FLASH_COLOR[2]}, ${this.muzzleFlash})`;
      this.ctx.fillRect(0, 0, this.game.width, this.game.height);
      this.muzzleFlash -= 0.1;
    }
  }

  renderGameStateOverlays() {
    if (this.game.gameState === 'levelComplete') {
      this.renderLevelComplete();
    } else if (this.game.gameState === 'gameOver') {
      this.renderGameOver();
    }
  }

  renderLevelComplete() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL COMPLETE!', this.game.width / 2, this.game.height / 2 - 20);
    this.ctx.fillText(`Level ${this.game.currentLevel}`, this.game.width / 2, this.game.height / 2 + 20);
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    this.ctx.fillStyle = '#f00';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.game.width / 2, this.game.height / 2);
  }

  renderCrosshair() {
    this.ctx.strokeStyle = GAME_CONSTANTS.CROSSHAIR_COLOR;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.game.width / 2 - 10, this.game.height / 2);
    this.ctx.lineTo(this.game.width / 2 + 10, this.game.height / 2);
    this.ctx.moveTo(this.game.width / 2, this.game.height / 2 - 10);
    this.ctx.lineTo(this.game.width / 2, this.game.height / 2 + 10);
    this.ctx.stroke();
  }

  triggerMuzzleFlash() {
    this.muzzleFlash = 0.5;
  }
}
