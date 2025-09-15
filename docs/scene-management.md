# Scene Management

Guide to managing scenes, transitions, and game flow in Rabbit-Raycast.

## 🎬 Scene Basics

### What is a Scene?

A **Scene** in Rabbit-Raycast represents a distinct game state or level. Scenes manage:

- **Entities**: Game objects active in the scene
- **Systems**: Logic that operates on entities
- **Assets**: Resources loaded for the scene
- **UI**: User interface elements
- **Camera**: Viewport and camera settings

### Basic Scene Structure

```javascript
import { Scene } from '../core/SceneManager.js';
import { Node } from '../ecs/NodeTree.js';

export class MyScene extends Scene {
  constructor(engine) {
    super(engine, 'My Scene');
    this.player = null;
    this.enemies = new Set();
  }

  async onEnter() {
    console.log('Entering My Scene');

    // Load scene assets
    await this.loadAssets();

    // Create scene objects
    this.createPlayer();
    this.createEnemies();
    this.setupCamera();

    // Set up input handlers
    this.setupInput();
  }

  onUpdate(deltaTime) {
    // Update game logic
    this.updateEnemies(deltaTime);
    this.checkCollisions();
    this.updateUI();
  }

  onRender(renderer) {
    // Custom rendering if needed
    this.renderHUD(renderer);
  }

  async onExit() {
    console.log('Exiting My Scene');

    // Clean up scene objects
    this.cleanup();
  }
}
```

## 🌳 Scene Hierarchy

### Node-Based Scene Tree

Rabbit-Raycast uses a hierarchical scene tree similar to Godot:

```javascript
class GameScene extends Scene {
  async onEnter() {
    // Create root nodes
    this.world = new Node('World');
    this.ui = new Node('UI');
    this.effects = new Node('Effects');

    this.addChild(this.world);
    this.addChild(this.ui);
    this.addChild(this.effects);

    // Create world objects
    this.createTerrain();
    this.createPlayer();
    this.createEnemies();

    // Create UI
    this.createHUD();
    this.createMenus();

    // Create effects
    this.createParticleSystems();
  }

  createTerrain() {
    const terrain = new Node('Terrain');
    terrain.addComponent(new SpriteComponent(terrainTexture));

    // Add terrain to world
    this.world.addChild(terrain);
  }

  createPlayer() {
    const player = new Node('Player');
    player.addComponent(new TransformComponent({ x: 100, y: 100 }));
    player.addComponent(new SpriteComponent(playerTexture));
    player.addComponent(new PhysicsComponent());

    this.world.addChild(player);
    this.player = player;
  }

  createHUD() {
    const hud = new Node('HUD');
    hud.addComponent(new TransformComponent({ x: 10, y: 10 }));

    // Health bar
    const healthBar = new Node('HealthBar');
    healthBar.addComponent(new SpriteComponent(healthBarTexture));
    hud.addChild(healthBar);

    this.ui.addChild(hud);
  }
}
```

### Scene Tree Benefits

- **Organization**: Logical grouping of related objects
- **Transform Inheritance**: Child transforms relative to parents
- **Visibility Control**: Hide/show entire branches
- **Efficient Updates**: Process only active branches
- **Serialization**: Easy to save/load scene state

## 🎭 Scene Manager

### Basic Scene Loading

```javascript
class Game {
  constructor() {
    this.sceneManager = new SceneManager(this);
    this.registerScenes();
  }

  registerScenes() {
    this.sceneManager.registerScene('MainMenu', MainMenuScene);
    this.sceneManager.registerScene('GameLevel', GameLevelScene);
    this.sceneManager.registerScene('GameOver', GameOverScene);
  }

  async start() {
    // Load initial scene
    await this.sceneManager.loadScene('MainMenu');
  }

  async startGame() {
    await this.sceneManager.loadScene('GameLevel');
  }

  async gameOver() {
    await this.sceneManager.loadScene('GameOver');
  }
}
```

### Scene Transitions

```javascript
class SceneManager {
  constructor(engine) {
    this.engine = engine;
    this.scenes = new Map();
    this.currentScene = null;
    this.transitioning = false;
  }

  async loadScene(name, transition = null) {
    if (this.transitioning) return;

    const sceneClass = this.scenes.get(name);
    if (!sceneClass) {
      throw new Error(`Scene '${name}' not registered`);
    }

    this.transitioning = true;

    try {
      // Start transition out
      if (this.currentScene && transition) {
        await this.playTransition(transition, 'out');
      }

      // Unload current scene
      if (this.currentScene) {
        await this.currentScene.onExit();
      }

      // Create and load new scene
      this.currentScene = new sceneClass(this.engine);
      await this.currentScene.onEnter();

      // Start transition in
      if (transition) {
        await this.playTransition(transition, 'in');
      }

    } finally {
      this.transitioning = false;
    }
  }

  async playTransition(transition, direction) {
    const { type, duration = 500 } = transition;

    switch (type) {
      case 'fade':
        await this.fadeTransition(duration, direction);
        break;
      case 'slide':
        await this.slideTransition(duration, direction);
        break;
      case 'wipe':
        await this.wipeTransition(duration, direction);
        break;
    }
  }

  async fadeTransition(duration, direction) {
    const overlay = this.createTransitionOverlay();

    if (direction === 'out') {
      // Fade to black
      await this.tweenManager.create(overlay, duration, Easing.linear)
        .from('alpha', 0)
        .to('alpha', 1)
        .start();
    } else {
      // Fade from black
      await this.tweenManager.create(overlay, duration, Easing.linear)
        .from('alpha', 1)
        .to('alpha', 0)
        .start();
    }

    this.removeTransitionOverlay(overlay);
  }

  async slideTransition(duration, direction) {
    const slideDirection = direction === 'out' ? -1 : 1;
    const viewport = this.engine.renderer.getViewport();

    await this.tweenManager.create(this.currentScene, duration, Easing.cubicOut)
      .from('position.x', slideDirection * viewport.width)
      .to('position.x', 0)
      .start();
  }
}
```

## 🎮 Scene Types

### Menu Scenes

```javascript
class MainMenuScene extends Scene {
  async onEnter() {
    // Create menu UI
    this.createTitle();
    this.createMenuButtons();
    this.createBackground();

    // Set up menu music
    this.engine.audio.playMusic('menuMusic');
  }

  createTitle() {
    const title = new Node('Title');
    title.addComponent(new TransformComponent({
      x: this.engine.canvas.width / 2,
      y: 100
    }));

    const titleText = title.addComponent(new TextComponent());
    titleText.text = 'Rabbit-Raycast';
    titleText.fontSize = 48;
    titleText.color = '#ffffff';

    this.addChild(title);
  }

  createMenuButtons() {
    const buttonY = 200;
    const buttonSpacing = 60;

    // Start Game button
    this.createButton('Start Game', buttonY, () => {
      this.engine.loadScene('GameLevel');
    });

    // Options button
    this.createButton('Options', buttonY + buttonSpacing, () => {
      this.engine.loadScene('OptionsMenu');
    });

    // Quit button
    this.createButton('Quit', buttonY + buttonSpacing * 2, () => {
      window.close();
    });
  }

  createButton(text, y, onClick) {
    const button = new Node(`Button_${text}`);
    button.addComponent(new TransformComponent({
      x: this.engine.canvas.width / 2,
      y: y
    }));

    const buttonSprite = button.addComponent(new ButtonComponent());
    buttonSprite.text = text;
    buttonSprite.onClick = onClick;

    this.addChild(button);
    return button;
  }

  onUpdate(deltaTime) {
    // Handle menu input
    if (this.engine.input.isKeyJustPressed('Enter')) {
      this.startGame();
    }
  }
}
```

### Game Level Scenes

```javascript
class GameLevelScene extends Scene {
  constructor(engine, levelData) {
    super(engine, `Level ${levelData.id}`);
    this.levelData = levelData;
    this.score = 0;
    this.lives = 3;
  }

  async onEnter() {
    // Load level assets
    await this.loadLevelAssets();

    // Create level geometry
    this.createTerrain();
    this.createPlatforms();
    this.createCollectibles();

    // Create player
    this.createPlayer();

    // Set up camera
    this.setupCamera();

    // Start level music
    this.engine.audio.playMusic('levelMusic');

    // Initialize HUD
    this.createHUD();
  }

  async loadLevelAssets() {
    const assets = [
      { key: 'terrain', url: `/assets/levels/${this.levelData.id}/terrain.png`, type: 'image' },
      { key: 'player', url: '/assets/player.png', type: 'image' },
      { key: 'collectible', url: '/assets/collectible.png', type: 'image' }
    ];

    await this.engine.assetManager.loadAssets(assets);
  }

  createTerrain() {
    const terrain = new Node('Terrain');
    terrain.addComponent(new SpriteComponent(
      this.engine.assetManager.getAsset('terrain')
    ));

    this.addChild(terrain);
  }

  createPlayer() {
    const player = new Node('Player');
    player.addComponent(new TransformComponent(this.levelData.playerStart));
    player.addComponent(new SpriteComponent(
      this.engine.assetManager.getAsset('player')
    ));
    player.addComponent(new PhysicsComponent());
    player.addComponent(new PlayerController());

    this.addChild(player);
    this.player = player;
  }

  createCollectibles() {
    for (const collectibleData of this.levelData.collectibles) {
      const collectible = new Node('Collectible');
      collectible.addComponent(new TransformComponent(collectibleData.position));
      collectible.addComponent(new SpriteComponent(
        this.engine.assetManager.getAsset('collectible')
      ));
      collectible.addComponent(new CollectibleComponent(collectibleData));

      this.addChild(collectible);
      this.collectibles.add(collectible);
    }
  }

  createHUD() {
    const hud = new Node('HUD');

    // Score display
    const scoreText = new Node('ScoreText');
    scoreText.addComponent(new TextComponent());
    scoreText.getComponent('TextComponent').text = `Score: ${this.score}`;
    hud.addChild(scoreText);

    // Lives display
    const livesText = new Node('LivesText');
    livesText.addComponent(new TextComponent());
    livesText.getComponent('TextComponent').text = `Lives: ${this.lives}`;
    hud.addChild(livesText);

    this.addChild(hud);
    this.hud = hud;
  }

  onUpdate(deltaTime) {
    // Update game logic
    this.updateCollectibles();
    this.checkWinCondition();
    this.updateHUD();
  }

  updateCollectibles() {
    for (const collectible of this.collectibles) {
      if (this.checkCollision(this.player, collectible)) {
        this.collectItem(collectible);
      }
    }
  }

  collectItem(collectible) {
    this.score += collectible.getComponent('CollectibleComponent').value;
    this.collectibles.delete(collectible);
    collectible.destroy();

    // Play collection sound
    this.engine.audio.playSound('collect');

    // Check win condition
    if (this.collectibles.size === 0) {
      this.levelComplete();
    }
  }

  levelComplete() {
    // Save progress
    this.saveProgress();

    // Show completion screen
    this.showLevelCompleteScreen();
  }

  async onExit() {
    // Save game state
    this.saveGameState();

    // Clean up level-specific objects
    this.cleanup();
  }
}
```

### Loading Scenes

```javascript
class LoadingScene extends Scene {
  constructor(engine, nextScene, assets) {
    super(engine, 'Loading');
    this.nextScene = nextScene;
    this.assets = assets;
    this.progress = 0;
  }

  async onEnter() {
    // Create loading UI
    this.createLoadingBar();
    this.createLoadingText();

    // Start loading assets
    this.startLoading();
  }

  createLoadingBar() {
    const loadingBar = new Node('LoadingBar');
    loadingBar.addComponent(new TransformComponent({
      x: this.engine.canvas.width / 2,
      y: this.engine.canvas.height / 2
    }));

    const progressBar = loadingBar.addComponent(new ProgressBarComponent());
    progressBar.width = 300;
    progressBar.height = 20;

    this.addChild(loadingBar);
    this.loadingBar = loadingBar;
  }

  createLoadingText() {
    const loadingText = new Node('LoadingText');
    loadingText.addComponent(new TransformComponent({
      x: this.engine.canvas.width / 2,
      y: this.engine.canvas.height / 2 + 40
    }));

    const textComponent = loadingText.addComponent(new TextComponent());
    textComponent.text = 'Loading...';
    textComponent.fontSize = 16;

    this.addChild(loadingText);
    this.loadingText = loadingText;
  }

  async startLoading() {
    try {
      // Load assets with progress tracking
      await this.engine.assetManager.loadAssetsWithProgress(
        this.assets,
        (progress) => {
          this.progress = progress;
          this.updateLoadingDisplay();
        }
      );

      // Loading complete
      await this.engine.sceneManager.loadScene(this.nextScene);

    } catch (error) {
      console.error('Loading failed:', error);
      this.showErrorMessage();
    }
  }

  updateLoadingDisplay() {
    if (this.loadingBar) {
      this.loadingBar.getComponent('ProgressBarComponent').progress = this.progress;
    }

    if (this.loadingText) {
      this.loadingText.getComponent('TextComponent').text =
        `Loading... ${Math.round(this.progress * 100)}%`;
    }
  }

  showErrorMessage() {
    if (this.loadingText) {
      this.loadingText.getComponent('TextComponent').text = 'Loading Failed!';
      this.loadingText.getComponent('TextComponent').color = '#ff0000';
    }
  }
}
```

## 🎯 Advanced Scene Features

### Scene Prefabs

```javascript
class ScenePrefab {
  constructor(template) {
    this.template = template;
  }

  instantiate(scene, position = { x: 0, y: 0 }) {
    const instance = new Node(this.template.name);

    // Apply position offset
    instance.addComponent(new TransformComponent(position));

    // Instantiate components
    for (const componentData of this.template.components) {
      const component = this.createComponent(componentData);
      instance.addComponent(component);
    }

    // Instantiate children
    for (const childData of this.template.children) {
      const child = this.instantiateChild(childData, scene);
      instance.addChild(child);
    }

    return instance;
  }

  createComponent(componentData) {
    const ComponentClass = this.getComponentClass(componentData.type);
    const component = new ComponentClass();

    // Apply component properties
    Object.assign(component, componentData.properties);

    return component;
  }

  instantiateChild(childData, scene) {
    const childPrefab = new ScenePrefab(childData);
    return childPrefab.instantiate(scene, childData.position);
  }

  getComponentClass(type) {
    const componentClasses = {
      'TransformComponent': TransformComponent,
      'SpriteComponent': SpriteComponent,
      'PhysicsComponent': PhysicsComponent
    };

    return componentClasses[type];
  }
}

// Usage
const enemyPrefab = new ScenePrefab({
  name: 'Enemy',
  components: [
    {
      type: 'TransformComponent',
      properties: { x: 0, y: 0 }
    },
    {
      type: 'SpriteComponent',
      properties: { texture: enemyTexture }
    },
    {
      type: 'PhysicsComponent',
      properties: { mass: 1.0 }
    }
  ]
});

// Create enemy instances
const enemy1 = enemyPrefab.instantiate(scene, { x: 100, y: 100 });
const enemy2 = enemyPrefab.instantiate(scene, { x: 200, y: 150 });
```

### Scene Serialization

```javascript
class SceneSerializer {
  static serialize(scene) {
    const data = {
      name: scene.name,
      entities: []
    };

    // Serialize all entities
    for (const entity of scene.entities) {
      data.entities.push(this.serializeEntity(entity));
    }

    return JSON.stringify(data);
  }

  static serializeEntity(entity) {
    const entityData = {
      name: entity.name,
      components: []
    };

    // Serialize components
    for (const component of entity.getComponents()) {
      entityData.components.push({
        type: component.getType(),
        properties: this.serializeComponent(component)
      });
    }

    // Serialize children
    if (entity.children && entity.children.length > 0) {
      entityData.children = entity.children.map(child =>
        this.serializeEntity(child)
      );
    }

    return entityData;
  }

  static serializeComponent(component) {
    const properties = {};

    // Get serializable properties
    for (const [key, value] of Object.entries(component)) {
      if (this.isSerializable(value)) {
        properties[key] = value;
      }
    }

    return properties;
  }

  static isSerializable(value) {
    // Check if value can be serialized
    return typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean' ||
           Array.isArray(value) ||
           (typeof value === 'object' && value !== null && !value._entity);
  }

  static deserialize(jsonData, scene) {
    const data = JSON.parse(jsonData);

    // Create scene
    const newScene = new Scene(scene.engine, data.name);

    // Deserialize entities
    for (const entityData of data.entities) {
      const entity = this.deserializeEntity(entityData, newScene);
      newScene.addEntity(entity);
    }

    return newScene;
  }

  static deserializeEntity(entityData, scene) {
    const entity = new Node(entityData.name);

    // Deserialize components
    for (const componentData of entityData.components) {
      const component = this.createComponent(componentData);
      entity.addComponent(component);
    }

    // Deserialize children
    if (entityData.children) {
      for (const childData of entityData.children) {
        const child = this.deserializeEntity(childData, scene);
        entity.addChild(child);
      }
    }

    return entity;
  }

  static createComponent(componentData) {
    const ComponentClass = this.getComponentClass(componentData.type);
    const component = new ComponentClass();

    // Apply properties
    Object.assign(component, componentData.properties);

    return component;
  }

  static getComponentClass(type) {
    // Component class registry
    return componentRegistry[type];
  }
}
```

### Scene Pooling

```javascript
class ScenePool {
  constructor() {
    this.pools = new Map();
  }

  createPool(sceneClass, size = 5) {
    const poolName = sceneClass.name;
    const pool = [];

    for (let i = 0; i < size; i++) {
      const scene = new sceneClass(null);
      pool.push(scene);
    }

    this.pools.set(poolName, pool);
    return pool;
  }

  getScene(sceneClass) {
    const poolName = sceneClass.name;
    let pool = this.pools.get(poolName);

    if (!pool || pool.length === 0) {
      pool = this.createPool(sceneClass, 1);
    }

    const scene = pool.pop();
    scene.reset(); // Reset scene state
    return scene;
  }

  releaseScene(scene) {
    const poolName = scene.constructor.name;
    const pool = this.pools.get(poolName);

    if (pool) {
      scene.cleanup(); // Clean up scene
      pool.push(scene);
    }
  }
}
```

## 🎨 Scene Effects

### Post-Processing Effects

```javascript
class PostProcessingScene extends Scene {
  constructor(engine) {
    super(engine);
    this.effects = [];
    this.renderTexture = null;
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  onRender(renderer) {
    // Render scene to texture
    this.renderToTexture(renderer);

    // Apply post-processing effects
    let currentTexture = this.renderTexture;

    for (const effect of this.effects) {
      currentTexture = effect.apply(currentTexture, renderer);
    }

    // Render final result to screen
    renderer.drawTexture(currentTexture, 0, 0);
  }

  renderToTexture(renderer) {
    if (!this.renderTexture) {
      this.renderTexture = renderer.createRenderTexture(
        this.engine.canvas.width,
        this.engine.canvas.height
      );
    }

    renderer.setRenderTarget(this.renderTexture);
    renderer.clear();

    // Render scene normally
    super.onRender(renderer);

    renderer.setRenderTarget(null);
  }
}

// Example effects
class BlurEffect {
  apply(texture, renderer) {
    // Apply blur shader
    return renderer.applyShader(texture, 'blur');
  }
}

class ColorGradingEffect {
  constructor(lut) {
    this.lut = lut;
  }

  apply(texture, renderer) {
    // Apply color grading
    return renderer.applyColorGrading(texture, this.lut);
  }
}
```

### Scene Lighting

```javascript
class LightingScene extends Scene {
  constructor(engine) {
    super(engine);
    this.lights = new Set();
    this.lightTexture = null;
  }

  addLight(light) {
    this.lights.add(light);
  }

  onRender(renderer) {
    // Render normal scene
    super.onRender(renderer);

    // Render lighting
    this.renderLighting(renderer);
  }

  renderLighting(renderer) {
    // Create light texture
    if (!this.lightTexture) {
      this.lightTexture = renderer.createRenderTexture(
        this.engine.canvas.width,
        this.engine.canvas.height
      );
    }

    renderer.setRenderTarget(this.lightTexture);
    renderer.clear('#000000'); // Clear to black

    // Render light sources
    for (const light of this.lights) {
      this.renderLight(light, renderer);
    }

    renderer.setRenderTarget(null);

    // Composite lighting with scene
    renderer.setBlendMode('multiply');
    renderer.drawTexture(this.lightTexture, 0, 0);
    renderer.setBlendMode('normal');
  }

  renderLight(light, renderer) {
    const gradient = renderer.createRadialGradient(
      light.x, light.y, 0,
      light.x, light.y, light.radius
    );

    gradient.addColorStop(0, light.color);
    gradient.addColorStop(1, 'transparent');

    renderer.drawCircle(light.x, light.y, light.radius, gradient);
  }
}
```

This scene management system provides powerful tools for organizing your game into logical, manageable pieces with smooth transitions and efficient resource management.
