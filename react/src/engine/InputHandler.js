import { GAME_CONSTANTS } from './Constants.js';

export class InputHandler {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.touching = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Hardware events
    this.setupHardwareListeners();

    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.game.handleOrientationChange(), 100);
    });
    window.addEventListener('resize', () => {
      this.game.handleOrientationChange();
    });
  }

  handleKeyDown(event) {
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        event.preventDefault();
        this.game.shoot();
        break;
      case 'ShiftLeft':
        this.keys.strafe = true;
        break;
    }
  }

  handleKeyUp(event) {
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
        this.keys.strafe = false;
        break;
    }
  }

  setupHardwareListeners() {
    // R1 Device hardware events
    window.addEventListener('scrollUp', () => {
      this.game.player.rotate(-GAME_CONSTANTS.TURN_SPEED * 2);
    });

    window.addEventListener('scrollDown', () => {
      this.game.player.rotate(GAME_CONSTANTS.TURN_SPEED * 2);
    });

    window.addEventListener('sideClick', () => {
      this.game.shoot();
    });
  }

  update(deltaTime) {
    const dt = deltaTime / 16.67;

    // Handle movement
    if (this.keys.up || this.touching.up) {
      const dx = Math.cos(this.game.player.angle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      const dy = Math.sin(this.game.player.angle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      this.game.player.move(dx, dy, this.game);
    }

    if (this.keys.down || this.touching.down) {
      const dx = -Math.cos(this.game.player.angle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      const dy = -Math.sin(this.game.player.angle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      this.game.player.move(dx, dy, this.game);
    }

    if (this.keys.left || this.touching.left) {
      this.game.player.rotate(-GAME_CONSTANTS.TURN_SPEED * dt);
    }

    if (this.keys.right || this.touching.right) {
      this.game.player.rotate(GAME_CONSTANTS.TURN_SPEED * dt);
    }

    if (this.keys.strafe || this.touching.strafe) {
      const strafeAngle = this.game.player.angle + Math.PI / 2;
      const dx = Math.cos(strafeAngle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      const dy = Math.sin(strafeAngle) * GAME_CONSTANTS.MOVE_SPEED * dt;
      this.game.player.move(dx, dy, this.game);
    }
  }

  handleTouch(action, isStart) {
    this.touching[action] = isStart;
    if (action === 'shoot' && isStart) {
      this.game.shoot();
    }
  }

  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
