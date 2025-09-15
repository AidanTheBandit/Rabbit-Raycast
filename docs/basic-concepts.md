# Basic Concepts

Fundamental concepts and principles of Rabbit-Raycast's modular game engine.

## 🎯 Core Architecture

### Entity-Component-System (ECS)

Rabbit-Raycast uses an ECS architecture inspired by modern game engines like Unity and Godot. This design pattern provides excellent modularity and performance.

#### Entity
An **Entity** is a unique object in your game world. It represents something that exists but contains no logic or data itself.

```javascript
// Create a player entity
const player = new Entity('Player');

// Add components to give it behavior and properties
player.addComponent(new TransformComponent({ x: 100, y: 100 }));
player.addComponent(new SpriteComponent(playerTexture));
player.addComponent(new PhysicsComponent({ mass: 1.0 }));
```

#### Component
A **Component** is a data container that defines specific properties and behaviors. Components are attached to entities to give them functionality.

```javascript
class HealthComponent extends Component {
  constructor(maxHealth = 100) {
    super('HealthComponent');
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  takeDamage(amount) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    if (this.currentHealth <= 0) {
      this.entity.emit('died');
    }
  }
}
```

#### System
A **System** contains the logic that operates on entities with specific components. Systems process all entities that match their required components.

```javascript
class HealthSystem extends System {
  constructor() {
    super('HealthSystem');
    this.setRequiredComponents('HealthComponent', 'TransformComponent');
  }

  processEntity(entity, deltaTime) {
    const health = entity.getComponent('HealthComponent');
    const transform = entity.getComponent('TransformComponent');

    // Regenerate health over time
    if (health.currentHealth < health.maxHealth) {
      health.currentHealth = Math.min(
        health.maxHealth,
        health.currentHealth + 10 * deltaTime
      );
    }
  }
}
```

## 🎮 Game Loop

### Update Loop

The game loop is the heart of your game, running continuously to update game state and render frames.

```javascript
class GameEngine {
  constructor() {
    this.lastTime = 0;
    this.targetFPS = 60;
    this.targetFrameTime = 1000 / this.targetFPS;
  }

  start() {
    this.gameLoop(0);
  }

  gameLoop(currentTime) {
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update game logic
    this.update(deltaTime);

    // Render frame
    this.render();

    // Schedule next frame
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(deltaTime) {
    // Update all systems
    for (const system of this.systems) {
      system.update(deltaTime);
    }

    // Update all entities
    for (const entity of this.entities) {
      entity.update(deltaTime);
    }
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all entities
    for (const entity of this.entities) {
      entity.render(this.ctx);
    }
  }
}
```

### Fixed vs Variable Timestep

#### Variable Timestep (Default)
Updates based on actual time passed between frames. Simple but can cause inconsistent behavior.

```javascript
update(deltaTime) {
  // Movement based on actual time
  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;
}
```

#### Fixed Timestep
Updates at a consistent rate regardless of frame rate. More predictable but requires interpolation.

```javascript
class FixedTimestepEngine {
  constructor() {
    this.fixedDeltaTime = 1 / 60; // 60 FPS
    this.accumulator = 0;
  }

  update(deltaTime) {
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // Interpolate for smooth rendering
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.render(alpha);
  }

  fixedUpdate(deltaTime) {
    // Physics and game logic updates
    this.updatePhysics(deltaTime);
    this.updateAI(deltaTime);
  }

  render(alpha) {
    // Render with interpolation
    for (const entity of this.entities) {
      entity.render(this.ctx, alpha);
    }
  }
}
```

## 📐 Coordinate System

### Screen vs World Coordinates

#### Screen Coordinates
- Origin (0,0) is top-left of screen
- X increases to the right
- Y increases downward
- Used for UI elements and mouse input

```javascript
// Convert screen to world coordinates
screenToWorld(screenX, screenY) {
  return {
    x: screenX - this.camera.x,
    y: screenY - this.camera.y
  };
}
```

#### World Coordinates
- Origin (0,0) can be anywhere (usually level center)
- X increases to the right
- Y increases upward (mathematical convention)
- Used for game objects and physics

```javascript
// Convert world to screen coordinates
worldToScreen(worldX, worldY) {
  return {
    x: worldX + this.camera.x,
    y: this.canvas.height - (worldY + this.camera.y)
  };
}
```

### Camera System

```javascript
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.rotation = 0;
    this.followTarget = null;
    this.followSpeed = 5;
  }

  update(deltaTime) {
    if (this.followTarget) {
      // Smooth camera follow
      const targetX = this.followTarget.x - this.canvas.width / 2;
      const targetY = this.followTarget.y - this.canvas.height / 2;

      this.x += (targetX - this.x) * this.followSpeed * deltaTime;
      this.y += (targetY - this.y) * this.followSpeed * deltaTime;
    }
  }

  transformContext(ctx) {
    ctx.save();

    // Apply camera transformation
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.rotate(this.rotation);
    ctx.translate(-this.x, -this.y);

    return ctx;
  }

  screenToWorld(screenX, screenY) {
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - this.canvas.width / 2) / this.zoom + this.x;
    const worldY = (this.canvas.height / 2 - screenY) / this.zoom + this.y;
    return { x: worldX, y: worldY };
  }

  worldToScreen(worldX, worldY) {
    // Convert world coordinates to screen coordinates
    const screenX = (worldX - this.x) * this.zoom + this.canvas.width / 2;
    const screenY = (this.y - worldY) * this.zoom + this.canvas.height / 2;
    return { x: screenX, y: screenY };
  }
}
```

## 🎨 Rendering Concepts

### Canvas Rendering Context

```javascript
class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new Camera();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  beginFrame() {
    this.clear();
    this.ctx.save();
    this.camera.transformContext(this.ctx);
  }

  endFrame() {
    this.ctx.restore();
  }

  drawSprite(texture, x, y, width, height, rotation = 0) {
    this.ctx.save();

    // Move to sprite position
    this.ctx.translate(x, y);

    // Apply rotation
    if (rotation !== 0) {
      this.ctx.rotate(rotation);
    }

    // Draw sprite
    this.ctx.drawImage(texture, -width/2, -height/2, width, height);

    this.ctx.restore();
  }

  drawText(text, x, y, options = {}) {
    const {
      font = '16px Arial',
      color = '#ffffff',
      align = 'left',
      baseline = 'top'
    } = options;

    this.ctx.save();

    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  drawRect(x, y, width, height, color = '#ffffff', filled = true) {
    this.ctx.save();

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x, y, width, height);
    }

    this.ctx.restore();
  }

  drawCircle(x, y, radius, color = '#ffffff', filled = true) {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
```

### Sprite Rendering

```javascript
class Sprite {
  constructor(texture, options = {}) {
    this.texture = texture;
    this.width = options.width || texture.width;
    this.height = options.height || texture.height;
    this.pivotX = options.pivotX || 0.5; // 0-1
    this.pivotY = options.pivotY || 0.5; // 0-1
    this.color = options.color || '#ffffff';
    this.alpha = options.alpha || 1.0;
    this.visible = options.visible !== false;
  }

  render(ctx, x, y, rotation = 0, scaleX = 1, scaleY = 1) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();

    // Move to position
    ctx.translate(x, y);

    // Apply rotation
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    // Apply scale
    ctx.scale(scaleX, scaleY);

    // Apply color and alpha
    ctx.globalAlpha = this.alpha;
    ctx.globalCompositeOperation = 'source-over';

    // Calculate draw position based on pivot
    const drawX = -this.width * this.pivotX;
    const drawY = -this.height * this.pivotY;

    // Draw sprite
    ctx.drawImage(
      this.texture,
      drawX, drawY,
      this.width, this.height
    );

    ctx.restore();
  }

  getBounds(x, y, rotation = 0, scaleX = 1, scaleY = 1) {
    // Calculate axis-aligned bounding box
    const halfWidth = (this.width * Math.abs(scaleX)) / 2;
    const halfHeight = (this.height * Math.abs(scaleY)) / 2;

    return {
      x: x - halfWidth,
      y: y - halfHeight,
      width: halfWidth * 2,
      height: halfHeight * 2
    };
  }
}
```

## ⚡ Input Handling

### Input Manager

```javascript
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Map();
    this.mouse = {
      x: 0, y: 0,
      buttons: new Set(),
      wheel: 0
    };
    this.gamepads = new Map();

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
      this.keys.set(event.code, {
        pressed: true,
        justPressed: !this.keys.get(event.code)?.pressed
      });
    });

    window.addEventListener('keyup', (event) => {
      if (this.keys.has(event.code)) {
        this.keys.get(event.code).pressed = false;
      }
    });

    // Mouse events
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (event) => {
      this.mouse.buttons.add(event.button);
    });

    this.canvas.addEventListener('mouseup', (event) => {
      this.mouse.buttons.delete(event.button);
    });

    this.canvas.addEventListener('wheel', (event) => {
      this.mouse.wheel = event.deltaY;
    });

    // Gamepad events
    window.addEventListener('gamepadconnected', (event) => {
      this.gamepads.set(event.gamepad.index, event.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      this.gamepads.delete(event.gamepad.index);
    });
  }

  update() {
    // Reset justPressed flags
    for (const [key, state] of this.keys) {
      state.justPressed = false;
    }

    // Update gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.gamepads.set(i, gamepads[i]);
      }
    }

    // Reset mouse wheel
    this.mouse.wheel = 0;
  }

  isKeyPressed(key) {
    return this.keys.get(key)?.pressed || false;
  }

  isKeyJustPressed(key) {
    return this.keys.get(key)?.justPressed || false;
  }

  isMouseButtonPressed(button) {
    return this.mouse.buttons.has(button);
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  getMouseWheel() {
    return this.mouse.wheel;
  }

  getGamepadButton(gamepadIndex, buttonIndex) {
    const gamepad = this.gamepads.get(gamepadIndex);
    return gamepad?.buttons[buttonIndex] || { pressed: false, value: 0 };
  }

  getGamepadAxis(gamepadIndex, axisIndex) {
    const gamepad = this.gamepads.get(gamepadIndex);
    return gamepad?.axes[axisIndex] || 0;
  }
}
```

### Input Mapping

```javascript
class InputMapper {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.mappings = new Map();
  }

  mapAction(action, keys = [], mouseButtons = [], gamepadButtons = []) {
    this.mappings.set(action, {
      keys: new Set(keys),
      mouseButtons: new Set(mouseButtons),
      gamepadButtons: new Set(gamepadButtons)
    });
  }

  isActionPressed(action) {
    const mapping = this.mappings.get(action);
    if (!mapping) return false;

    // Check keyboard
    for (const key of mapping.keys) {
      if (this.inputManager.isKeyPressed(key)) {
        return true;
      }
    }

    // Check mouse
    for (const button of mapping.mouseButtons) {
      if (this.inputManager.isMouseButtonPressed(button)) {
        return true;
      }
    }

    // Check gamepad
    for (const button of mapping.gamepadButtons) {
      const [gamepadIndex, buttonIndex] = button.split(':').map(Number);
      const gamepadButton = this.inputManager.getGamepadButton(gamepadIndex, buttonIndex);
      if (gamepadButton.pressed) {
        return true;
      }
    }

    return false;
  }

  getActionStrength(action) {
    const mapping = this.mappings.get(action);
    if (!mapping) return 0;

    // Check gamepad axes (for analog input)
    for (const button of mapping.gamepadButtons) {
      if (button.includes('axis')) {
        const [gamepadIndex, axisIndex] = button.split(':').map(Number);
        const axisValue = this.inputManager.getGamepadAxis(gamepadIndex, axisIndex);
        if (Math.abs(axisValue) > 0.1) { // Deadzone
          return axisValue;
        }
      }
    }

    // Digital input (pressed = 1, not pressed = 0)
    return this.isActionPressed(action) ? 1 : 0;
  }
}

// Usage
const inputMapper = new InputMapper(inputManager);

// Map movement actions
inputMapper.mapAction('move_left', ['KeyA', 'ArrowLeft'], [], ['0:14']);
inputMapper.mapAction('move_right', ['KeyD', 'ArrowRight'], [], ['0:15']);
inputMapper.mapAction('move_up', ['KeyW', 'ArrowUp'], [], ['0:12']);
inputMapper.mapAction('move_down', ['KeyS', 'ArrowDown'], [], ['0:13']);

// Map analog stick
inputMapper.mapAction('move_horizontal', [], [], ['0:axis0']);
inputMapper.mapAction('move_vertical', [], [], ['0:axis1']);
```

## 🔊 Audio Concepts

### Audio Manager

```javascript
class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = new Map();
    this.music = null;
    this.masterVolume = 1.0;
    this.musicVolume = 1.0;
    this.sfxVolume = 1.0;
  }

  async loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.sounds.set(name, audioBuffer);
  }

  playSound(name, options = {}) {
    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = (options.volume || 1.0) * this.sfxVolume * this.masterVolume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Apply options
    if (options.loop) source.loop = true;
    if (options.playbackRate) source.playbackRate.value = options.playbackRate;

    source.start(0);
    return source;
  }

  playMusic(name, options = {}) {
    // Stop current music
    if (this.music) {
      this.music.stop();
    }

    this.music = this.playSound(name, {
      ...options,
      loop: true,
      volume: (options.volume || 1.0) * this.musicVolume
    });
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      // Update current music volume
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  pause() {
    this.audioContext.suspend();
  }

  resume() {
    this.audioContext.resume();
  }
}
```

## 📦 Asset Management

### Asset Loader

```javascript
class AssetManager {
  constructor() {
    this.assets = new Map();
    this.loading = new Map();
    this.loaded = 0;
    this.total = 0;
  }

  async loadAsset(key, url, type = 'image') {
    if (this.assets.has(key)) return this.assets.get(key);

    this.total++;
    this.loading.set(key, { url, type, promise: null });

    try {
      let asset;

      switch (type) {
        case 'image':
          asset = await this.loadImage(url);
          break;
        case 'audio':
          asset = await this.loadAudio(url);
          break;
        case 'json':
          asset = await this.loadJSON(url);
          break;
        default:
          throw new Error(`Unknown asset type: ${type}`);
      }

      this.assets.set(key, asset);
      this.loaded++;

      return asset;
    } catch (error) {
      console.error(`Failed to load asset ${key}:`, error);
      throw error;
    } finally {
      this.loading.delete(key);
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  async loadAudio(url) {
    const response = await fetch(url);
    return await response.arrayBuffer();
  }

  async loadJSON(url) {
    const response = await fetch(url);
    return await response.json();
  }

  getAsset(key) {
    return this.assets.get(key);
  }

  isLoaded(key) {
    return this.assets.has(key);
  }

  getProgress() {
    return this.total > 0 ? this.loaded / this.total : 1;
  }

  async loadAssets(assets) {
    const promises = assets.map(asset =>
      this.loadAsset(asset.key, asset.url, asset.type)
    );
    return Promise.all(promises);
  }
}
```

## 🎯 Scene Management

### Scene Base Class

```javascript
class Scene {
  constructor(engine, name = 'Scene') {
    this.engine = engine;
    this.name = name;
    this.entities = new Set();
    this.systems = new Set();
    this.initialized = false;
  }

  async load() {
    if (!this.initialized) {
      await this.onLoad();
      this.initialized = true;
    }
  }

  async unload() {
    await this.onUnload();
    this.initialized = false;
  }

  addEntity(entity) {
    this.entities.add(entity);
    entity.scene = this;
  }

  removeEntity(entity) {
    this.entities.delete(entity);
    entity.scene = null;
  }

  addSystem(system) {
    this.systems.add(system);
  }

  removeSystem(system) {
    this.systems.delete(system);
  }

  update(deltaTime) {
    // Update systems
    for (const system of this.systems) {
      system.update(deltaTime);
    }

    // Update entities
    for (const entity of this.entities) {
      entity.update(deltaTime);
    }

    this.onUpdate(deltaTime);
  }

  render() {
    // Render entities
    for (const entity of this.entities) {
      entity.render(this.engine.renderer);
    }

    this.onRender();
  }

  // Override these methods in subclasses
  async onLoad() {}
  async onUnload() {}
  onUpdate(deltaTime) {}
  onRender() {}
}
```

### Scene Manager

```javascript
class SceneManager {
  constructor(engine) {
    this.engine = engine;
    this.scenes = new Map();
    this.currentScene = null;
    this.loadingScene = null;
  }

  registerScene(name, sceneClass) {
    this.scenes.set(name, sceneClass);
  }

  async loadScene(name, transitionData = null) {
    const sceneClass = this.scenes.get(name);
    if (!sceneClass) {
      throw new Error(`Scene '${name}' not registered`);
    }

    // Unload current scene
    if (this.currentScene) {
      await this.currentScene.unload();
    }

    // Create and load new scene
    this.currentScene = new sceneClass(this.engine);
    await this.currentScene.load();

    // Handle transition
    if (transitionData) {
      await this.handleTransition(transitionData);
    }
  }

  async handleTransition(transitionData) {
    // Implement scene transitions (fade, slide, etc.)
    const { type, duration } = transitionData;

    switch (type) {
      case 'fade':
        await this.fadeTransition(duration);
        break;
      case 'slide':
        await this.slideTransition(duration);
        break;
    }
  }

  getCurrentScene() {
    return this.currentScene;
  }

  getScene(name) {
    return this.scenes.get(name);
  }
}
```

These fundamental concepts provide the foundation for building games with Rabbit-Raycast. Understanding these core principles will help you create more efficient and maintainable game code.
