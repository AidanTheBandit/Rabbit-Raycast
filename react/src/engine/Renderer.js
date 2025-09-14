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
    this.renderScene();
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

  renderScene() {
    // Collect all renderable objects with their distances
    const renderQueue = [];

    // Add walls to render queue
    for (let x = 0; x < this.game.rayCount; x++) {
      const rayAngle = this.game.player.angle - this.game.fov / 2 + (x / this.game.rayCount) * this.game.fov;
      const distance = this.game.castRay(rayAngle);

      renderQueue.push({
        type: 'wall',
        x: x,
        distance: distance,
        rayAngle: rayAngle
      });
    }

    // Add enemies to render queue
    this.game.enemies.forEach((enemy, index) => {
      const dx = enemy.x - this.game.player.x;
      const dy = enemy.y - this.game.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate angle relative to player
      const angle = Math.atan2(dy, dx) - this.game.player.angle;

      // Normalize angle to -PI to PI
      let normalizedAngle = angle;
      while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
      while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

      // Check if enemy is in field of view
      if (Math.abs(normalizedAngle) < this.game.fov / 2) {
        // Check line of sight (not behind walls)
        const rayDistance = this.game.castRay(Math.atan2(dy, dx));
        if (rayDistance >= distance) {
          renderQueue.push({
            type: 'enemy',
            enemy: enemy,
            distance: distance,
            angle: normalizedAngle,
            index: index
          });
        }
      }
    });

    // Sort by distance (closest first for proper depth - render far to near)
    renderQueue.sort((a, b) => b.distance - a.distance);

    // Render in depth order
    renderQueue.forEach(item => {
      if (item.type === 'wall') {
        this.renderWallColumn(item.x, item.distance, item.rayAngle);
      } else if (item.type === 'enemy') {
        this.renderEnemySprite(item.enemy, item.distance, item.angle);
      }
    });
  }

  renderWallColumn(x, distance, rayAngle) {
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

  renderEnemySprite(enemy, distance, angle) {
    // Calculate screen position
    const screenX = (angle / (this.game.fov / 2)) * (this.game.width / 2) + this.game.width / 2;
    const wallHeight = (this.game.height / 2) / distance;
    const enemyHeight = wallHeight * enemy.size;
    const enemyTop = (this.game.height / 2) - enemyHeight / 2;
    const enemyBottom = (this.game.height / 2) + enemyHeight / 2;

    // Draw enemy sprite
    const color = enemy.state === 'chasing' ? GAME_CONSTANTS.ENEMY_COLOR_CHASING : GAME_CONSTANTS.ENEMY_COLOR_IDLE;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      screenX - enemyHeight / 4,
      enemyTop,
      enemyHeight / 2,
      enemyHeight
    );

    // Draw health bar
    const barWidth = enemyHeight / 2;
    const barHeight = 4;
    const healthPercent = enemy.health / GAME_CONSTANTS.ENEMY_HEALTH;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth, barHeight);

    this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    this.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth * healthPercent, barHeight);
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
