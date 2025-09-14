/**
 * Doom Demo Scene
 *
 * A complete Doom-like game demo built using the Advanced 3D Game Engine.
 * Demonstrates raycasting, enemy AI, level progression, and physics integration.
 */

import { Scene } from '../core/SceneManager.js';
import { Player } from '../Player.js';
import { Enemy } from '../Enemy.js';
import { LevelManager } from '../Level.js';
import { GAME_CONSTANTS } from '../Constants.js';

export class DoomDemoScene extends Scene {
  constructor(engine) {
    super(engine, 'Doom Demo');
    this.levelManager = new LevelManager();
    this.player = null;
    this.enemies = [];
    this.currentLevel = 1;
    this.gameState = 'playing'; // 'playing', 'levelComplete', 'gameOver'
    this.score = 0;
    this.gameStats = {
      health: GAME_CONSTANTS.PLAYER_START_HEALTH,
      ammo: GAME_CONSTANTS.PLAYER_START_AMMO,
      level: 1,
      enemies: 0,
      score: 0
    };

    // Initialize map data (will be set by loadLevel)
    this.map = [];
    this.joystickMovement = { x: 0, y: 0, magnitude: 0 };
    this.shootCooldown = 0;

    // Performance optimizations
    this.enemyUpdateCounter = 0;
    this.enemyUpdateFrequency = 2; // Update every other frame

    console.log('DoomDemoScene: Constructor called, levelManager created:', !!this.levelManager);
  }

  async onEnter(transitionData = {}) {
    console.log('🎮 Starting Doom Demo...');

    // Create player first
    this.player = new Player(8.5, 5.5);
    this.addEntity(this.player);

    console.log('DoomDemo: Player created at', this.player.x, this.player.y);

    // Initialize physics world
    this.loadLevel(this.currentLevel);

    // Setup input mappings
    this.setupInputMappings();

    // Setup HUD update callback
    this.engine.gameStateCallback = (stats) => {
      this.gameStats = { ...stats };
    };

    // Set rendering properties
    this.width = 240;
    this.height = 320;
    this.rayCount = 45;
    this.fov = Math.PI / 2.5;
    this.maxDepth = 20;

    console.log('✅ Doom Demo initialized', {
      player: !!this.player,
      map: !!this.map,
      enemies: this.enemies.length,
      dimensions: `${this.width}x${this.height}`,
      playerPos: `${this.player.x}, ${this.player.y}`,
      isActive: this.isActive
    });
  }

  async onExit() {
    console.log('🎮 Exiting Doom Demo...');
    this.cleanup();
  }

  onUpdate(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Update game logic
    this.updateGameLogic(deltaTime);

    // Update enemies with performance optimization
    this.enemyUpdateCounter++;
    if (this.enemyUpdateCounter >= this.enemyUpdateFrequency) {
      this.enemyUpdateCounter = 0;
      this.updateEnemies(deltaTime * this.enemyUpdateFrequency);
    }

    // Check win/lose conditions
    this.checkGameConditions();
  }

  onRender(renderer) {
    // The renderer handles the main 3D scene rendering
    // We just need to render HUD and overlays on top
    this.renderHUD(renderer);
    this.renderGameStateOverlays(renderer);
    console.log('DoomDemo: onRender called', {
      gameState: this.gameState,
      hasPlayer: !!this.player,
      playerHealth: this.player?.health,
      enemies: this.enemies.length
    });
  }

  /**
   * Set joystick movement from touch controls
   */
  setJoystickMovement(movement) {
    this.joystickMovement = movement;
    console.log('DoomDemo: Joystick movement set', movement);
  }

  /**
   * Setup input mappings for the demo
   */
  setupInputMappings() {
    // Movement
    this.engine.input.keyMappings.set('move_forward', ['KeyW', 'ArrowUp']);
    this.engine.input.keyMappings.set('move_backward', ['KeyS', 'ArrowDown']);
    this.engine.input.keyMappings.set('turn_left', ['KeyA', 'ArrowLeft']);
    this.engine.input.keyMappings.set('turn_right', ['KeyD', 'ArrowRight']);
    this.engine.input.keyMappings.set('strafe', ['ShiftLeft']);

    // Actions
    this.engine.input.keyMappings.set('shoot', ['Space']);
    this.engine.input.keyMappings.set('use', ['KeyE']);

    console.log('DoomDemo: Input mappings set up');
  }

  /**
   * Load level data
   */
  loadLevel(levelIndex) {
    const levelData = this.levelManager.getLevel(levelIndex - 1);
    if (!levelData) {
      console.error('DoomDemo: No level data found for index', levelIndex - 1);
      return;
    }

    console.log('DoomDemo: Loading level data', levelData.name, {
      mapWidth: levelData.map[0].length,
      mapHeight: levelData.map.length,
      enemySpawns: levelData.enemySpawns.length
    });

    // Store map data for renderer
    this.map = levelData.map;

    // Set physics world
    this.engine.physics.setWorld({
      map: levelData.map,
      width: levelData.map[0].length,
      height: levelData.map.length
    });

    // Check if player position is valid
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);
    const isValidPosition = this.engine.physics.isValidPosition(this.player.x, this.player.y);

    console.log('DoomDemo: Player position check', {
      playerPos: `${this.player.x}, ${this.player.y}`,
      mapPos: `${playerX}, ${playerY}`,
      mapValue: this.map[playerY] ? this.map[playerY][playerX] : 'undefined',
      isValid: isValidPosition
    });

    // Clear existing enemies
    this.enemies.forEach(enemy => this.removeEntity(enemy));
    this.enemies = [];

    // Spawn enemies
    levelData.enemySpawns.forEach(spawn => {
      const enemy = new Enemy(spawn.x, spawn.y, this);
      this.enemies.push(enemy);
      this.addEntity(enemy);
    });

    this.gameStats.enemies = this.enemies.length;
    this.gameStats.level = levelIndex;

    console.log(`📍 Loaded level: ${levelData.name}`, {
      mapSize: `${levelData.map[0].length}x${levelData.map.length}`,
      enemies: this.enemies.length,
      playerPos: `${this.player.x}, ${this.player.y}`,
      playerValid: isValidPosition
    });
  }

  /**
   * Update enemies with performance optimizations
   */
  updateEnemies(deltaTime) {
    if (!this.player) return;

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Distance culling - don't update enemies too far away
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 25) continue; // Skip enemies more than 25 units away

      enemy.update(deltaTime);

      // Remove dead enemies
      if (enemy.health <= 0) {
        this.enemies.splice(i, 1);
        this.score += GAME_CONSTANTS.SCORE_PER_ENEMY;
        this.player.ammo = Math.min(this.player.ammo + GAME_CONSTANTS.AMMO_DROP, GAME_CONSTANTS.MAX_AMMO);
      }
    }

    this.gameStats.enemies = this.enemies.length;
  }

  /**
   * Update game logic
   */
  updateGameLogic(deltaTime) {
    if (!this.player) {
      return;
    }

    // Update cooldowns
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }

    // Handle player movement
    this.handlePlayerMovement(deltaTime);

    // Handle actions
    const shootActive = this.engine.input.isActionActive('shoot');

    if (shootActive && this.shootCooldown <= 0) {
      this.handleShoot();
      this.shootCooldown = 200; // 200ms cooldown between shots
    }
    if (this.engine.input.isActionActive('use')) {
      // Placeholder for use action (e.g., open door, interact)
    }

    // Check win/lose conditions
    this.checkGameConditions();
  }

  /**
   * Handle player movement
   */
  handlePlayerMovement(deltaTime) {
    if (!this.player) return;

    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED;
    const dt = deltaTime / 16.67;

    // Use joystick movement if available and significant
    if (this.joystickMovement.magnitude > 0.1) {
      // Joystick provides analog movement:
      // x: left/right camera turning, y: forward/backward movement
      const turnAmount = this.joystickMovement.x * turnSpeed * dt;
      const forwardAmount = -this.joystickMovement.y * moveSpeed * dt; // Negative because y is inverted in joystick

      // Handle camera turning (left/right)
      if (Math.abs(turnAmount) > 0.01) {
        this.player.angle += turnAmount;
      }

      // Handle forward/backward movement
      if (Math.abs(forwardAmount) > 0.01) {
        const newX = this.player.x + Math.cos(this.player.angle) * forwardAmount;
        const newY = this.player.y + Math.sin(this.player.angle) * forwardAmount;
        if (this.engine.physics.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        } else {
          // Try to find a nearby valid position to prevent getting stuck
          const validPos = this.engine.physics.findNearestValidPosition(newX, newY, 0.5);
          if (validPos.x !== newX || validPos.y !== newY) {
            this.player.x = validPos.x;
            this.player.y = validPos.y;
          }
        }
      }
    } else {
      // Fallback to digital keyboard input
      // Movement
      if (this.engine.input.isActionActive('move_forward')) {
        const newX = this.player.x + Math.cos(this.player.angle) * moveSpeed * dt;
        const newY = this.player.y + Math.sin(this.player.angle) * moveSpeed * dt;
        if (this.engine.physics.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        } else {
          const validPos = this.engine.physics.findNearestValidPosition(newX, newY, 0.3);
          if (validPos.x !== newX || validPos.y !== newY) {
            this.player.x = validPos.x;
            this.player.y = validPos.y;
          }
        }
      }

      if (this.engine.input.isActionActive('move_backward')) {
        const newX = this.player.x - Math.cos(this.player.angle) * moveSpeed * dt;
        const newY = this.player.y - Math.sin(this.player.angle) * moveSpeed * dt;
        if (this.engine.physics.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        } else {
          const validPos = this.engine.physics.findNearestValidPosition(newX, newY, 0.3);
          if (validPos.x !== newX || validPos.y !== newY) {
            this.player.x = validPos.x;
            this.player.y = validPos.y;
          }
        }
      }

      // Strafing
      if (this.engine.input.isActionActive('strafe')) {
        const strafeAngle = this.player.angle + Math.PI / 2;
        const newX = this.player.x + Math.cos(strafeAngle) * moveSpeed * dt;
        const newY = this.player.y + Math.sin(strafeAngle) * moveSpeed * dt;
        if (this.engine.physics.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        } else {
          const validPos = this.engine.physics.findNearestValidPosition(newX, newY, 0.3);
          if (validPos.x !== newX || validPos.y !== newY) {
            this.player.x = validPos.x;
            this.player.y = validPos.y;
          }
        }
      }
    }

    // Turning (always use digital input for precision)
    if (this.engine.input.isActionActive('turn_left')) {
      this.player.angle -= turnSpeed * dt;
    }

    if (this.engine.input.isActionActive('turn_right')) {
      this.player.angle += turnSpeed * dt;
    }
  }

  /**
   * Handle shooting
   */
  handleShoot() {
    if (!this.player || this.player.ammo <= 0 || this.gameState !== 'playing') {
      return;
    }

    this.player.shoot();

    // Create muzzle flash particles
    this.engine.particles.createMuzzleFlash(
      this.player.x + Math.cos(this.player.angle) * 0.5,
      this.player.y + Math.sin(this.player.angle) * 0.5,
      this.player.angle
    );

    // Also trigger screen muzzle flash for immediate visual feedback
    if (this.engine.renderer && this.engine.renderer.triggerMuzzleFlash) {
      this.engine.renderer.triggerMuzzleFlash();
    }

    // Play shooting sound
    this.engine.audio.playProceduralSound(800, 0.1, 'square', 0.3);

    // Find enemies in shooting range with line of sight
    const visibleEnemies = this.enemies.filter(enemy => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check distance
      if (distance > GAME_CONSTANTS.SHOOT_DISTANCE) return false;

      // Check shooting cone (30 degrees)
      const angleToEnemy = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToEnemy - this.player.angle);
      const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      if (normalizedAngleDiff > Math.PI / 6) return false;

      // Check line of sight
      return this.engine.physics.hasLineOfSight(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
    });

    // Hit closest enemy
    if (visibleEnemies.length > 0) {
      const closestEnemy = visibleEnemies.reduce((closest, enemy) => {
        const distClosest = Math.sqrt(
          (closest.x - this.player.x) ** 2 + (closest.y - this.player.y) ** 2
        );
        const distCurrent = Math.sqrt(
          (enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2
        );
        return distCurrent < distClosest ? enemy : closest;
      });

      closestEnemy.takeDamage(GAME_CONSTANTS.SHOOT_DAMAGE);
      // Create blood particles
      this.engine.particles.createBloodSplatter(closestEnemy.x, closestEnemy.y);
      // Play hit sound
      this.engine.audio.playProceduralSound(200, 0.05, 'sawtooth', 0.2);
    }

    this.gameStats.ammo = this.player.ammo;
  }

  /**
   * Check win/lose conditions
   */
  checkGameConditions() {
    if (!this.player) return;

    // Check if player is dead
    if (this.player.health <= 0) {
      this.gameState = 'gameOver';
      return;
    }

    // Check if level is complete
    if (this.enemies.length === 0 && this.gameState === 'playing') {
      this.nextLevel();
    }
  }

  /**
   * Progress to next level
   */
  nextLevel() {
    if (this.currentLevel < this.levelManager.getTotalLevels()) {
      this.currentLevel++;
      this.gameState = 'levelComplete';

      setTimeout(() => {
        this.gameState = 'playing';
        this.loadLevel(this.currentLevel);
      }, 2000);
    } else {
      this.gameState = 'gameOver'; // Game completed
    }
  }

  /**
   * Render HUD
   */
  renderHUD(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    // Use viewport-based font size for better scaling
    const fontSize = Math.max(14, Math.min(renderer.width, renderer.height) / 25);
    ctx.font = `${fontSize}px monospace`;
    const lineHeight = fontSize + 6;
    let y = 25;

    // Calculate background height
    const bgHeight = y + lineHeight * 5 + 15;

    // HUD background with better scaling
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, renderer.width, bgHeight);

    // HUD text with better positioning
    ctx.fillStyle = '#fff';
    ctx.fillText(`Health: ${this.gameStats.health}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Ammo: ${this.gameStats.ammo}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Level: ${this.gameStats.level}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Enemies: ${this.gameStats.enemies}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Score: ${this.gameStats.score}`, 15, y);

    ctx.restore();
  }

  /**
   * Render game state overlays
   */
  renderGameStateOverlays(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    if (this.gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      ctx.fillStyle = '#fff';
      const fontSize = Math.max(20, Math.min(renderer.width, renderer.height) / 20);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', renderer.width / 2, renderer.height / 2 - 40);
      ctx.fillText(`Level ${this.currentLevel}`, renderer.width / 2, renderer.height / 2 + 10);
    } else if (this.gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      ctx.fillStyle = this.enemies.length === 0 ? '#0f0' : '#f00';
      const fontSize = Math.max(20, Math.min(renderer.width, renderer.height) / 20);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      const message = this.enemies.length === 0 ? 'GAME COMPLETED!' : 'GAME OVER';
      ctx.fillText(message, renderer.width / 2, renderer.height / 2);
    }

    ctx.restore();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.enemies = [];
    this.player = null;
    this.engine.input.cleanup();
  }

  /**
   * Get demo statistics
   */
  getStats() {
    return {
      ...super.getStats(),
      gameState: this.gameState,
      currentLevel: this.currentLevel,
      playerHealth: this.player?.health || 0,
      enemyCount: this.enemies.length,
      score: this.score
    };
  }
}
