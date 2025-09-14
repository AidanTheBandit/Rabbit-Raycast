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
}
