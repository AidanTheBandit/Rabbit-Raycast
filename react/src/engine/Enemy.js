import { GAME_CONSTANTS } from './Constants.js';

export class Enemy {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.health = GAME_CONSTANTS.ENEMY_HEALTH;
    this.speed = GAME_CONSTANTS.ENEMY_SPEED;
    this.angle = Math.random() * Math.PI * 2;
    this.state = 'idle'; // 'idle', 'chasing', 'attacking'
    this.lastAttack = 0;
    this.attackCooldown = GAME_CONSTANTS.ENEMY_ATTACK_COOLDOWN;
    this.size = GAME_CONSTANTS.ENEMY_SIZE;
  }

  update(deltaTime) {
    const dx = this.game.player.x - this.x;
    const dy = this.game.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Line of sight check
    if (this.hasLineOfSight()) {
      this.state = 'chasing';
      // Move towards player
      if (distance > 1) {
        const moveAngle = Math.atan2(dy, dx);
        const newX = this.x + Math.cos(moveAngle) * this.speed * (deltaTime / 16.67);
        const newY = this.y + Math.sin(moveAngle) * this.speed * (deltaTime / 16.67);

        if (this.game.isValidPosition(newX, newY)) {
          this.x = newX;
          this.y = newY;
        }
      } else {
        // Attack player
        this.state = 'attacking';
        if (Date.now() - this.lastAttack > this.attackCooldown) {
          this.attackPlayer();
          this.lastAttack = Date.now();
        }
      }
    } else {
      this.state = 'idle';
      // Random movement when not chasing
      this.angle += (Math.random() - 0.5) * 0.1;
      const newX = this.x + Math.cos(this.angle) * this.speed * 0.5 * (deltaTime / 16.67);
      const newY = this.y + Math.sin(this.angle) * this.speed * 0.5 * (deltaTime / 16.67);

      if (this.game.isValidPosition(newX, newY)) {
        this.x = newX;
        this.y = newY;
      }
    }
  }

  hasLineOfSight() {
    const dx = this.game.player.x - this.x;
    const dy = this.game.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cast ray to check for walls
    const angle = Math.atan2(dy, dx);
    const rayDistance = this.game.castRay(angle);

    return rayDistance >= distance;
  }

  attackPlayer() {
    // Deal damage to player
    this.game.player.takeDamage(GAME_CONSTANTS.ENEMY_ATTACK_DAMAGE);
    if (!this.game.player.isAlive()) {
      this.game.gameState = 'gameOver';
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      // Enemy dies
      this.game.enemies = this.game.enemies.filter(e => e !== this);
      this.game.score += GAME_CONSTANTS.SCORE_PER_ENEMY;

      // Check if level is complete
      if (this.game.enemies.length === 0) {
        this.game.nextLevel();
      }
    }
  }

  render() {
    // Calculate screen position and size
    const dx = this.x - this.game.player.x;
    const dy = this.y - this.game.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.5) return; // Too close to render properly

    // Calculate angle relative to player
    const angle = Math.atan2(dy, dx) - this.game.player.angle;

    // Normalize angle to -PI to PI
    let normalizedAngle = angle;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    // Check if enemy is in field of view
    if (Math.abs(normalizedAngle) > this.game.fov / 2) return;

    // Calculate screen position
    const screenX = (normalizedAngle / (this.game.fov / 2)) * (this.game.width / 2) + this.game.width / 2;
    const wallHeight = (this.game.height / 2) / distance;
    const enemyHeight = wallHeight * this.size;
    const enemyTop = (this.game.height / 2) - enemyHeight / 2;
    const enemyBottom = (this.game.height / 2) + enemyHeight / 2;

    // Draw enemy sprite (simple colored rectangle for now)
    const color = this.state === 'chasing' ? GAME_CONSTANTS.ENEMY_COLOR_CHASING : GAME_CONSTANTS.ENEMY_COLOR_IDLE;
    this.game.ctx.fillStyle = color;
    this.game.ctx.fillRect(
      screenX - enemyHeight / 4,
      enemyTop,
      enemyHeight / 2,
      enemyHeight
    );

    // Draw health bar
    const barWidth = enemyHeight / 2;
    const barHeight = 4;
    const healthPercent = this.health / GAME_CONSTANTS.ENEMY_HEALTH;

    this.game.ctx.fillStyle = '#000';
    this.game.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth, barHeight);

    this.game.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    this.game.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth * healthPercent, barHeight);
  }
}
