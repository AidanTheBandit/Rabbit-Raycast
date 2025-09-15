# Examples Guide

Practical examples and code snippets for common Rabbit-Raycast use cases.

## 🎮 Basic Game Setup

### Simple Game Template

```javascript
import { Engine, Scene, Entity, TransformComponent, SpriteComponent } from '../core/index.js';

class GameScene extends Scene {
  constructor(engine) {
    super(engine, 'GameScene');
  }

  async onEnter() {
    // Create player entity
    const player = new Entity('Player');
    player.addComponent(new TransformComponent({ x: 400, y: 300 }));
    player.addComponent(new SpriteComponent(playerTexture));
    this.addEntity(player);

    // Create some enemies
    for (let i = 0; i < 5; i++) {
      const enemy = new Entity(`Enemy${i}`);
      enemy.addComponent(new TransformComponent({
        x: Math.random() * 800,
        y: Math.random() * 600
      }));
      enemy.addComponent(new SpriteComponent(enemyTexture));
      this.addEntity(enemy);
    }
  }

  onUpdate(deltaTime) {
    // Game logic here
  }
}

// Initialize game
const canvas = document.getElementById('game-canvas');
const engine = new Engine(canvas, {
  targetFPS: 60,
  debug: true
});

// Register and load scene
engine.sceneManager.registerScene('GameScene', GameScene);
await engine.sceneManager.loadScene('GameScene');

// Start the game
engine.start();
```

## 🎯 Entity-Component-System Examples

### Player Character with Movement

```javascript
class PlayerController extends Component {
  constructor() {
    super('PlayerController');
    this.speed = 200;
    this.input = null;
  }

  onAttach(entity) {
    this.input = entity.scene.engine.input;
  }

  update(deltaTime) {
    const transform = this.entity.getComponent('TransformComponent');
    if (!transform) return;

    const movement = this.input.getMovementVector();

    // Apply movement
    transform.translate(
      movement.x * this.speed * deltaTime,
      movement.y * this.speed * deltaTime
    );

    // Keep player in bounds
    transform.position.x = Math.max(0, Math.min(800, transform.position.x));
    transform.position.y = Math.max(0, Math.min(600, transform.position.y));
  }
}

// Usage
const player = new Entity('Player');
player.addComponent(new TransformComponent({ x: 400, y: 300 }));
player.addComponent(new SpriteComponent(playerTexture));
player.addComponent(new PlayerController());
scene.addEntity(player);
```

### Enemy AI System

```javascript
class EnemyAI extends Component {
  constructor() {
    super('EnemyAI');
    this.target = null;
    this.speed = 100;
    this.detectionRange = 200;
    this.attackRange = 50;
  }

  update(deltaTime) {
    if (!this.target) {
      this.findTarget();
      return;
    }

    const transform = this.entity.getComponent('TransformComponent');
    const targetTransform = this.target.getComponent('TransformComponent');

    const distance = transform.distanceTo(targetTransform);

    if (distance <= this.attackRange) {
      // Attack!
      this.attack();
    } else if (distance <= this.detectionRange) {
      // Move towards target
      this.moveTowards(targetTransform.position, deltaTime);
    } else {
      // Lost target
      this.target = null;
    }
  }

  findTarget() {
    // Find closest player
    const players = this.entity.scene.getEntitiesWithTag('player');
    if (players.length > 0) {
      this.target = players[0];
    }
  }

  moveTowards(targetPos, deltaTime) {
    const transform = this.entity.getComponent('TransformComponent');
    const direction = {
      x: targetPos.x - transform.position.x,
      y: targetPos.y - transform.position.y
    };

    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0) {
      direction.x /= length;
      direction.y /= length;

      transform.translate(
        direction.x * this.speed * deltaTime,
        direction.y * this.speed * deltaTime
      );
    }
  }

  attack() {
    // Implement attack logic
    console.log('Enemy attacks!');
  }
}
```

### Health System

```javascript
class HealthComponent extends Component {
  constructor(maxHealth = 100) {
    super('HealthComponent');
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.invincible = false;
    this.invincibilityTime = 0;
  }

  takeDamage(amount) {
    if (this.invincible) return;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.invincible = true;
    this.invincibilityTime = 1.0; // 1 second invincibility

    if (this.currentHealth <= 0) {
      this.die();
    } else {
      this.entity.emit('damaged', amount);
    }
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.entity.emit('healed', amount);
  }

  update(deltaTime) {
    if (this.invincible) {
      this.invincibilityTime -= deltaTime;
      if (this.invincibilityTime <= 0) {
        this.invincible = false;
      }
    }
  }

  die() {
    this.entity.emit('died');
    // Handle death logic
  }

  getHealthPercentage() {
    return this.currentHealth / this.maxHealth;
  }
}

class HealthSystem extends System {
  constructor() {
    super('HealthSystem');
    this.setRequiredComponents('HealthComponent');
  }

  processEntity(entity, deltaTime) {
    const health = entity.getComponent('HealthComponent');
    health.update(deltaTime);
  }
}
```

## 🎨 Animation Examples

### Sprite Animation Controller

```javascript
class AnimationController extends Component {
  constructor() {
    super('AnimationController');
    this.sprite = null;
    this.currentState = 'idle';
    this.states = new Map();
  }

  onAttach(entity) {
    this.sprite = entity.getComponent('SpriteComponent');
    this.setupAnimations();
  }

  setupAnimations() {
    // Define animation states
    this.addState('idle', {
      frames: [0, 1, 2, 3],
      frameRate: 0.2,
      loop: true
    });

    this.addState('walk', {
      frames: [4, 5, 6, 7],
      frameRate: 0.15,
      loop: true
    });

    this.addState('run', {
      frames: [8, 9, 10, 11],
      frameRate: 0.1,
      loop: true
    });

    this.addState('jump', {
      frames: [12, 13],
      frameRate: 0.2,
      loop: false
    });

    this.addState('attack', {
      frames: [14, 15, 16],
      frameRate: 0.1,
      loop: false,
      onComplete: () => this.setState('idle')
    });
  }

  addState(name, config) {
    this.states.set(name, config);
  }

  setState(name) {
    if (this.currentState === name) return;

    const state = this.states.get(name);
    if (!state) return;

    this.currentState = name;
    this.sprite.addAnimation(name, state.frames, state.frameRate);
    this.sprite.playAnimation(name, state.loop);

    if (state.onComplete) {
      // Set up completion callback
      setTimeout(state.onComplete, (state.frames.length / state.frameRate) * 1000);
    }
  }

  update(deltaTime) {
    // Update animation state based on entity state
    this.updateAnimationState();
  }

  updateAnimationState() {
    const physics = this.entity.getComponent('PhysicsComponent');

    if (!physics) return;

    const velocity = physics.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    if (speed > 200) {
      this.setState('run');
    } else if (speed > 50) {
      this.setState('walk');
    } else {
      this.setState('idle');
    }
  }
}
```

### Tween Animation Sequences

```javascript
class AnimationManager {
  constructor(entity) {
    this.entity = entity;
    this.tweenManager = entity.scene.engine.tweenManager;
  }

  playJumpAnimation() {
    const transform = this.entity.getComponent('TransformComponent');
    const sprite = this.entity.getComponent('SpriteComponent');

    // Jump up animation
    const jumpUp = this.tweenManager.create(transform, 0.3, Easing.quadOut);
    jumpUp.to('position.y', transform.position.y - 100);
    jumpUp.to('scale.y', 1.2);

    // Squash animation
    const squash = this.tweenManager.create(transform, 0.1, Easing.linear);
    squash.to('scale.y', 0.8);
    squash.to('scale.x', 1.3);

    // Fall down animation
    const fallDown = this.tweenManager.create(transform, 0.4, Easing.quadIn);
    fallDown.to('position.y', transform.position.y);
    fallDown.to('scale.y', 1.0);
    fallDown.to('scale.x', 1.0);

    // Chain animations
    jumpUp.chain(squash).chain(fallDown);
    jumpUp.start();
  }

  playDamageAnimation() {
    const sprite = this.entity.getComponent('SpriteComponent');

    // Flash red
    const flash = this.tweenManager.create(sprite, 0.1, Easing.linear);
    flash.to('color', '#ff0000');

    // Return to normal
    const normal = this.tweenManager.create(sprite, 0.1, Easing.linear);
    normal.to('color', '#ffffff');

    // Shake effect
    const shake = this.tweenManager.create(this.entity.transform, 0.5, Easing.sineInOut);
    shake.to('position.x', this.entity.transform.position.x + 10);
    shake.setLoop(true, 5);

    flash.chain(normal);
    flash.parallel(shake);
    flash.start();
  }

  playCollectAnimation(targetPosition) {
    const transform = this.entity.getComponent('TransformComponent');

    // Move to target
    const move = this.tweenManager.create(transform, 0.8, Easing.cubicIn);
    move.to('position.x', targetPosition.x);
    move.to('position.y', targetPosition.y);

    // Scale down
    const scale = this.tweenManager.create(transform, 0.8, Easing.cubicIn);
    scale.to('scale.x', 0);
    scale.to('scale.y', 0);

    // Fade out
    const fade = this.tweenManager.create(this.entity.getComponent('SpriteComponent'), 0.8, Easing.linear);
    fade.to('alpha', 0);

    move.parallel(scale).parallel(fade);
    move.on('complete', () => {
      this.entity.destroy();
    });
    move.start();
  }
}
```

## ⚡ Physics Examples

### Platformer Physics

```javascript
class PlatformerPhysics extends Component {
  constructor() {
    super('PlatformerPhysics');
    this.groundAcceleration = 2000;
    this.airAcceleration = 1000;
    this.maxGroundSpeed = 300;
    this.maxAirSpeed = 200;
    this.jumpForce = 600;
    this.gravity = 2000;
    this.friction = 0.8;
    this.airResistance = 0.95;
  }

  update(deltaTime) {
    const physics = this.entity.getComponent('PhysicsComponent');
    const input = this.entity.scene.engine.input;

    if (!physics) return;

    const onGround = this.isOnGround();

    // Horizontal movement
    const moveInput = input.getActionValue('move_right') - input.getActionValue('move_left');

    if (onGround) {
      // Ground movement
      physics.addAcceleration(moveInput * this.groundAcceleration, 0);

      // Apply friction
      physics.velocity.x *= this.friction;

      // Limit ground speed
      physics.velocity.x = Math.max(-this.maxGroundSpeed,
        Math.min(this.maxGroundSpeed, physics.velocity.x));
    } else {
      // Air movement
      physics.addAcceleration(moveInput * this.airAcceleration, 0);

      // Apply air resistance
      physics.velocity.x *= this.airResistance;

      // Limit air speed
      physics.velocity.x = Math.max(-this.maxAirSpeed,
        Math.min(this.maxAirSpeed, physics.velocity.x));
    }

    // Jumping
    if (onGround && input.isActionJustActivated('jump')) {
      physics.applyImpulse({ x: 0, y: -this.jumpForce });
    }

    // Apply gravity
    physics.addAcceleration(0, this.gravity);
  }

  isOnGround() {
    const physics = this.entity.getComponent('PhysicsComponent');
    const transform = this.entity.getComponent('TransformComponent');

    // Simple ground check - cast ray downward
    const rayStart = {
      x: transform.position.x,
      y: transform.position.y + 16
    };

    const rayDirection = { x: 0, y: 1 };
    const hit = this.entity.scene.engine.physics.raycast(rayStart, rayDirection, 20);

    return hit !== null;
  }
}
```

### Collision Response

```javascript
class CollisionHandler extends Component {
  constructor() {
    super('CollisionHandler');
  }

  onAttach(entity) {
    entity.on('collision_enter', this.onCollisionEnter.bind(this));
    entity.on('collision_stay', this.onCollisionStay.bind(this));
    entity.on('collision_exit', this.onCollisionExit.bind(this));
  }

  onCollisionEnter(collision) {
    const other = collision.other;

    if (other.hasTag('enemy')) {
      this.handleEnemyCollision(other);
    } else if (other.hasTag('collectible')) {
      this.handleCollectibleCollision(other);
    } else if (other.hasTag('platform')) {
      this.handlePlatformCollision(other);
    }
  }

  onCollisionStay(collision) {
    // Handle continuous collision (e.g., standing on platform)
  }

  onCollisionExit(collision) {
    // Handle collision end
  }

  handleEnemyCollision(enemy) {
    const health = this.entity.getComponent('HealthComponent');
    if (health) {
      health.takeDamage(10);
    }

    // Knockback
    const physics = this.entity.getComponent('PhysicsComponent');
    const enemyPos = enemy.getComponent('TransformComponent').position;
    const myPos = this.entity.getComponent('TransformComponent').position;

    const knockbackDir = {
      x: myPos.x - enemyPos.x,
      y: myPos.y - enemyPos.y
    };

    const length = Math.sqrt(knockbackDir.x * knockbackDir.x + knockbackDir.y * knockbackDir.y);
    if (length > 0) {
      knockbackDir.x /= length;
      knockbackDir.y /= length;
      physics.applyImpulse({
        x: knockbackDir.x * 200,
        y: knockbackDir.y * 200
      });
    }
  }

  handleCollectibleCollision(collectible) {
    // Add to inventory
    const collectibleData = collectible.getComponent('CollectibleComponent');
    this.entity.scene.engine.inventory.addItem(collectibleData.itemType);

    // Play sound
    this.entity.scene.engine.audio.playSound('collect');

    // Remove collectible
    collectible.destroy();
  }

  handlePlatformCollision(platform) {
    // Handle platform-specific logic
    const platformType = platform.getComponent('PlatformComponent').type;

    switch (platformType) {
      case 'moving':
        // Move with platform
        break;
      case 'breaking':
        // Start break timer
        break;
      case 'bouncy':
        // Bounce off
        break;
    }
  }
}
```

## 🎵 Audio Examples

### Dynamic Audio System

```javascript
class AudioManager {
  constructor(engine) {
    this.engine = engine;
    this.layers = new Map();
    this.setupAudioLayers();
  }

  setupAudioLayers() {
    // Ambient layer
    this.createLayer('ambient', ['ambient_forest', 'ambient_cave', 'ambient_city']);

    // Music layer
    this.createLayer('music', ['music_explore', 'music_combat', 'music_boss']);

    // SFX layer
    this.createLayer('sfx', ['sfx_footsteps', 'sfx_jump', 'sfx_attack']);
  }

  createLayer(name, sounds) {
    this.layers.set(name, {
      sounds: sounds,
      currentSound: null,
      volume: 1.0,
      crossfadeTime: 2000
    });
  }

  update(gameState) {
    // Update ambient based on location
    this.updateAmbientLayer(gameState.location);

    // Update music based on situation
    this.updateMusicLayer(gameState.inCombat, gameState.bossFight);

    // Update SFX based on actions
    this.updateSFXLayer(gameState.playerActions);
  }

  updateAmbientLayer(location) {
    const layer = this.layers.get('ambient');
    let targetSound;

    switch (location) {
      case 'forest':
        targetSound = 'ambient_forest';
        break;
      case 'cave':
        targetSound = 'ambient_cave';
        break;
      case 'city':
        targetSound = 'ambient_city';
        break;
    }

    if (targetSound && layer.currentSound !== targetSound) {
      this.crossfadeToSound(layer, targetSound);
    }
  }

  updateMusicLayer(inCombat, bossFight) {
    const layer = this.layers.get('music');
    let targetSound;

    if (bossFight) {
      targetSound = 'music_boss';
    } else if (inCombat) {
      targetSound = 'music_combat';
    } else {
      targetSound = 'music_explore';
    }

    if (targetSound && layer.currentSound !== targetSound) {
      this.crossfadeToSound(layer, targetSound);
    }
  }

  updateSFXLayer(actions) {
    // Play action-specific sounds
    for (const action of actions) {
      switch (action.type) {
        case 'jump':
          this.engine.audio.playSound('sfx_jump');
          break;
        case 'attack':
          this.engine.audio.playSound('sfx_attack');
          break;
        case 'footstep':
          this.engine.audio.playSound('sfx_footsteps');
          break;
      }
    }
  }

  crossfadeToSound(layer, newSound) {
    const oldSound = layer.currentSound;

    // Start new sound at 0 volume
    this.engine.audio.playSound(newSound, {
      volume: 0,
      loop: true
    });

    // Fade in new sound
    this.engine.audio.fadeIn(newSound, layer.crossfadeTime);

    // Fade out old sound
    if (oldSound) {
      this.engine.audio.fadeOut(oldSound, layer.crossfadeTime);
    }

    layer.currentSound = newSound;
  }
}
```

### Spatial Audio

```javascript
class SpatialAudioSystem extends System {
  constructor() {
    super('SpatialAudioSystem');
    this.setRequiredComponents('TransformComponent', 'AudioComponent');
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');
    const audio = entity.getComponent('AudioComponent');

    // Update spatial audio position
    if (audio.spatial) {
      audio.updateSpatialPosition(transform.position);
    }
  }
}

// Usage
const soundEntity = new Entity('AmbientSound');
soundEntity.addComponent(new TransformComponent({ x: 400, y: 300 }));
soundEntity.addComponent(new AudioComponent({
  sound: 'ambient_waterfall',
  volume: 0.5,
  spatial: true,
  minDistance: 50,
  maxDistance: 300,
  loop: true
}));
scene.addEntity(soundEntity);
```

## 🎮 Input Examples

### Virtual Joystick

```javascript
class VirtualJoystick extends Component {
  constructor(options = {}) {
    super('VirtualJoystick');
    this.radius = options.radius || 50;
    this.innerRadius = options.innerRadius || 20;
    this.position = { x: 0, y: 0 };
    this.stickPosition = { x: 0, y: 0 };
    this.active = false;
    this.touchId = null;
  }

  onAttach(entity) {
    this.canvas = entity.scene.engine.canvas;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  onTouchStart(event) {
    if (this.active) return;

    const touch = event.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Check if touch is within joystick area
    const dx = touchX - this.position.x;
    const dy = touchY - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.radius) {
      this.active = true;
      this.touchId = touch.identifier;
      this.updateStickPosition(touchX, touchY);
    }
  }

  onTouchMove(event) {
    if (!this.active) return;

    for (const touch of event.changedTouches) {
      if (touch.identifier === this.touchId) {
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        this.updateStickPosition(touchX, touchY);
        break;
      }
    }
  }

  onTouchEnd(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.active = false;
        this.touchId = null;
        this.stickPosition = { x: 0, y: 0 };
        break;
      }
    }
  }

  updateStickPosition(touchX, touchY) {
    const dx = touchX - this.position.x;
    const dy = touchY - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.radius) {
      this.stickPosition.x = dx;
      this.stickPosition.y = dy;
    } else {
      // Clamp to circle edge
      this.stickPosition.x = (dx / distance) * this.radius;
      this.stickPosition.y = (dy / distance) * this.radius;
    }
  }

  getDirection() {
    const length = Math.sqrt(
      this.stickPosition.x * this.stickPosition.x +
      this.stickPosition.y * this.stickPosition.y
    );

    if (length === 0) return { x: 0, y: 0 };

    return {
      x: this.stickPosition.x / this.radius,
      y: this.stickPosition.y / this.radius
    };
  }

  render(ctx) {
    ctx.save();

    // Draw outer circle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle (stick)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
      this.position.x + this.stickPosition.x,
      this.position.y + this.stickPosition.y,
      this.innerRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}
```

### Input Mapping

```javascript
class InputMapper {
  constructor(engine) {
    this.engine = engine;
    this.mappings = new Map();
    this.setupDefaultMappings();
  }

  setupDefaultMappings() {
    // Keyboard mappings
    this.mapAction('move_up', ['KeyW', 'ArrowUp']);
    this.mapAction('move_down', ['KeyS', 'ArrowDown']);
    this.mapAction('move_left', ['KeyA', 'ArrowLeft']);
    this.mapAction('move_right', ['KeyD', 'ArrowRight']);
    this.mapAction('jump', 'Space');
    this.mapAction('attack', 'KeyJ');
    this.mapAction('pause', 'Escape');

    // Gamepad mappings
    this.mapGamepadAction('move_horizontal', 0); // Left stick X
    this.mapGamepadAction('move_vertical', 1);   // Left stick Y
    this.mapGamepadAction('jump', 0, 'button');  // A button
    this.mapGamepadAction('attack', 2, 'button'); // X button
  }

  mapAction(action, keys) {
    this.mappings.set(action, {
      type: 'keyboard',
      keys: Array.isArray(keys) ? keys : [keys]
    });
  }

  mapGamepadAction(action, input, inputType = 'axis') {
    this.mappings.set(action, {
      type: 'gamepad',
      input: input,
      inputType: inputType
    });
  }

  isActionActive(action) {
    const mapping = this.mappings.get(action);
    if (!mapping) return false;

    switch (mapping.type) {
      case 'keyboard':
        return mapping.keys.some(key => this.engine.input.isPressed(key));

      case 'gamepad':
        if (mapping.inputType === 'axis') {
          return Math.abs(this.engine.input.getGamepadAxis(0, mapping.input)) > 0.1;
        } else {
          return this.engine.input.isGamepadButtonPressed(0, mapping.input);
        }

      default:
        return false;
    }
  }

  getActionValue(action) {
    const mapping = this.mappings.get(action);
    if (!mapping) return 0;

    switch (mapping.type) {
      case 'keyboard':
        return this.isActionActive(action) ? 1 : 0;

      case 'gamepad':
        if (mapping.inputType === 'axis') {
          return this.engine.input.getGamepadAxis(0, mapping.input);
        } else {
          return this.engine.input.isGamepadButtonPressed(0, mapping.input) ? 1 : 0;
        }

      default:
        return 0;
    }
  }

  getMovementVector() {
    return {
      x: this.getActionValue('move_right') - this.getActionValue('move_left'),
      y: this.getActionValue('move_down') - this.getActionValue('move_up')
    };
  }
}
```

## 🎨 UI Examples

### HUD System

```javascript
class HUDSystem extends System {
  constructor() {
    super('HUDSystem');
    this.elements = new Map();
  }

  addElement(name, element) {
    this.elements.set(name, element);
  }

  update(deltaTime) {
    // Update HUD elements
    for (const element of this.elements.values()) {
      element.update(deltaTime);
    }
  }

  render(ctx) {
    // Render HUD elements
    for (const element of this.elements.values()) {
      element.render(ctx);
    }
  }
}

class HealthBar extends Component {
  constructor(maxHealth = 100) {
    super('HealthBar');
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.width = 200;
    this.height = 20;
    this.position = { x: 20, y: 20 };
  }

  setHealth(health) {
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, health));
  }

  render(ctx) {
    ctx.save();

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Health bar
    const healthPercent = this.currentHealth / this.maxHealth;
    const healthWidth = this.width * healthPercent;

    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(this.position.x, this.position.y, healthWidth, this.height);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${this.currentHealth}/${this.maxHealth}`,
      this.position.x + this.width / 2,
      this.position.y + this.height / 2 + 5
    );

    ctx.restore();
  }
}

class ScoreDisplay extends Component {
  constructor() {
    super('ScoreDisplay');
    this.score = 0;
    this.position = { x: 20, y: 50 };
  }

  setScore(score) {
    this.score = score;
  }

  render(ctx) {
    ctx.save();

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, this.position.x, this.position.y);

    ctx.restore();
  }
}
```

### Menu System

```javascript
class MenuSystem {
  constructor(engine) {
    this.engine = engine;
    this.menus = new Map();
    this.currentMenu = null;
    this.input = engine.input;
  }

  createMenu(name, options) {
    const menu = new Menu(name, options);
    this.menus.set(name, menu);
    return menu;
  }

  showMenu(name) {
    const menu = this.menus.get(name);
    if (menu) {
      this.currentMenu = menu;
      menu.show();
    }
  }

  hideMenu() {
    if (this.currentMenu) {
      this.currentMenu.hide();
      this.currentMenu = null;
    }
  }

  update(deltaTime) {
    if (this.currentMenu) {
      this.currentMenu.update(deltaTime);
    }
  }

  render(ctx) {
    if (this.currentMenu) {
      this.currentMenu.render(ctx);
    }
  }
}

class Menu {
  constructor(name, options = {}) {
    this.name = name;
    this.items = [];
    this.selectedIndex = 0;
    this.visible = false;
    this.position = options.position || { x: 400, y: 300 };
    this.spacing = options.spacing || 40;
    this.fontSize = options.fontSize || 24;
  }

  addItem(text, callback) {
    this.items.push({ text, callback });
  }

  show() {
    this.visible = true;
    this.selectedIndex = 0;
  }

  hide() {
    this.visible = false;
  }

  update(deltaTime) {
    if (!this.visible) return;

    // Handle input
    if (this.input.isActionJustActivated('move_up')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    }

    if (this.input.isActionJustActivated('move_down')) {
      this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1);
    }

    if (this.input.isActionJustActivated('jump')) {
      const selectedItem = this.items[this.selectedIndex];
      if (selectedItem && selectedItem.callback) {
        selectedItem.callback();
      }
    }
  }

  render(ctx) {
    if (!this.visible) return;

    ctx.save();

    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = 'center';

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const y = this.position.y + i * this.spacing;

      if (i === this.selectedIndex) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`> ${item.text} <`, this.position.x, y);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.text, this.position.x, y);
      }
    }

    ctx.restore();
  }
}
```

These examples demonstrate common patterns and use cases for Rabbit-Raycast. Each example can be adapted and extended for specific game requirements.
