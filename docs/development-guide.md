# Development Guide

Comprehensive guide for developing with Rabbit-Raycast's modular game engine.

## 🛠️ Development Environment Setup

### Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (18+ required)
node --version

# Check npm version
npm --version

# Install dependencies
npm install

# For React development
cd react && npm install
```

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### IDE Setup

#### VS Code Recommendations

**Essential Extensions:**
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

**Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

## 🏗️ Project Structure

### Adding New Features

#### 1. Create Component

```javascript
// src/engine/ecs/MyComponent.js
import { Component } from './ECS.js';

export class MyComponent extends Component {
  constructor(options = {}) {
    super('MyComponent');
    this.value = options.value || 0;
  }

  update(deltaTime) {
    // Component logic
  }
}
```

#### 2. Create System (if needed)

```javascript
// src/engine/ecs/MySystem.js
import { System } from './ECS.js';

export class MySystem extends System {
  constructor() {
    super('MySystem');
    this.setRequiredComponents('MyComponent');
  }

  processEntity(entity, deltaTime) {
    const component = entity.getComponent('MyComponent');
    // System logic
  }
}
```

#### 3. Register with Engine

```javascript
// src/engine/core/Engine.js
import { MySystem } from '../ecs/MySystem.js';

// In Engine constructor
this.addSystem(new MySystem());
```

### Adding New Scenes

```javascript
// src/engine/scenes/MyScene.js
import { Scene } from '../core/SceneManager.js';

export class MyScene extends Scene {
  constructor(engine) {
    super(engine, 'My Scene');
  }

  async onEnter() {
    // Scene initialization
  }

  onUpdate(deltaTime) {
    // Scene update logic
  }

  onRender(renderer) {
    // Scene rendering
  }

  onExit() {
    // Scene cleanup
  }
}
```

## 🎮 Game Development Workflow

### 1. Planning Phase

- Define game requirements and scope
- Design entity-component relationships
- Plan scene structure and flow
- Identify performance requirements

### 2. Prototype Phase

```javascript
// Quick prototype setup
const player = new Entity('Player');
player.addComponent(new TransformComponent({ x: 100, y: 100 }));
player.addComponent(new SpriteComponent(texture));

// Test basic functionality
scene.addEntity(player);
```

### 3. Implementation Phase

- Implement core systems
- Create game entities and components
- Build scene management
- Add input handling
- Implement game logic

### 4. Optimization Phase

- Profile performance
- Optimize rendering
- Implement object pooling
- Add level-of-detail systems
- Optimize physics calculations

## 🧪 Testing Strategy

### Unit Testing

```javascript
// __tests__/components/HealthComponent.test.js
import { HealthComponent } from '../../src/engine/ecs/HealthComponent.js';

describe('HealthComponent', () => {
  test('should reduce health when taking damage', () => {
    const health = new HealthComponent(100);
    health.takeDamage(25);
    expect(health.currentHealth).toBe(75);
  });

  test('should not go below zero health', () => {
    const health = new HealthComponent(50);
    health.takeDamage(100);
    expect(health.currentHealth).toBe(0);
  });
});
```

### Integration Testing

```javascript
// __tests__/systems/MovementSystem.test.js
describe('MovementSystem', () => {
  test('should update entity position based on velocity', () => {
    const entity = new Entity('TestEntity');
    entity.addComponent(new TransformComponent({ x: 0, y: 0 }));
    entity.addComponent(new VelocityComponent({ x: 10, y: 5 }));

    const system = new MovementSystem();
    system.addEntity(entity);
    system.update(1.0);

    const transform = entity.getComponent('TransformComponent');
    expect(transform.position.x).toBe(10);
    expect(transform.position.y).toBe(5);
  });
});
```

### Performance Testing

```javascript
// __tests__/performance/EntityCreation.test.js
describe('Entity Creation Performance', () => {
  test('should create 1000 entities quickly', () => {
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      const entity = new Entity(`Entity${i}`);
      entity.addComponent(new TransformComponent());
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should take less than 100ms
  });
});
```

## 🔧 Debugging Techniques

### Console Debugging

```javascript
// Debug entity state
console.log('Entity stats:', entity.getStats());

// Debug system performance
console.log('System stats:', system.getStats());

// Debug rendering
console.log('Renderer stats:', renderer.getStats());
```

### Visual Debugging

```javascript
// Draw debug information
renderDebugInfo(ctx) {
  // Draw entity bounds
  ctx.strokeStyle = 'red';
  ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);

  // Draw velocity vectors
  ctx.strokeStyle = 'blue';
  ctx.beginPath();
  ctx.moveTo(entity.x, entity.y);
  ctx.lineTo(entity.x + entity.vx * 10, entity.y + entity.vy * 10);
  ctx.stroke();

  // Draw collision shapes
  ctx.strokeStyle = 'green';
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.collisionRadius, 0, Math.PI * 2);
  ctx.stroke();
}
```

### Performance Profiling

```javascript
// Profile system update time
const startTime = performance.now();
system.update(deltaTime);
const updateTime = performance.now() - startTime;

if (updateTime > 16.67) { // More than one frame at 60fps
  console.warn(`System ${system.name} took ${updateTime}ms`);
}
```

## 🚀 Performance Optimization

### Memory Optimization

```javascript
// Use object pooling
const bulletPool = new ObjectPool(
  () => new Entity('Bullet'),
  (entity) => entity.reset(),
  100
);

// Reuse objects instead of creating new ones
const bullet = bulletPool.get();
// ... use bullet ...
bulletPool.release(bullet);
```

### Rendering Optimization

```javascript
// Batch sprite rendering
const spriteBatch = new SpriteBatch();

// Add sprites to batch
spriteBatch.addSprite(sprite1, transform1);
spriteBatch.addSprite(sprite2, transform2);

// Render entire batch at once
spriteBatch.render(ctx);
```

### Physics Optimization

```javascript
// Use spatial partitioning
const spatialGrid = new SpatialGrid(64);

// Update entity positions in grid
spatialGrid.updateEntity(entity, entity.position);

// Query nearby entities efficiently
const nearby = spatialGrid.getNearbyEntities(position, 100);
```

## 📦 Asset Management

### Loading Assets

```javascript
// Load single asset
await assetManager.loadAsset('playerTexture', '/assets/player.png', 'image');

// Load multiple assets
const assets = [
  { key: 'background', url: '/assets/bg.png', type: 'image' },
  { key: 'music', url: '/assets/bgm.mp3', type: 'audio' }
];

await assetManager.loadAssets(assets);

// Use loaded assets
const texture = assetManager.getAsset('playerTexture');
```

### Asset Optimization

```javascript
// Preload critical assets
await assetManager.preloadCriticalAssets();

// Lazy load non-critical assets
assetManager.loadAsset('level2', '/assets/level2.png', 'image')
  .then(() => console.log('Level 2 loaded'));

// Asset compression and optimization
const compressedTexture = await assetManager.compressTexture(texture);
```

## 🎵 Audio Development

### Basic Audio

```javascript
// Load and play sound effect
await audioSystem.loadSound('jump', '/audio/jump.wav');
audioSystem.playSound('jump');

// Play background music
await audioSystem.loadMusic('bgm', '/audio/background.mp3');
audioSystem.playMusic('bgm', { loop: true, volume: 0.5 });
```

### Spatial Audio

```javascript
// Create 3D audio source
const audioSource = new AudioComponent({
  spatial: true,
  maxDistance: 100,
  rolloffFactor: 1.0
});

entity.addComponent(audioSource);
await audioSource.loadSound('footsteps', '/audio/footsteps.wav');
audioSource.play();
```

## 🎨 Visual Effects

### Particle Systems

```javascript
// Create particle emitter
const emitter = new ParticleEmitterComponent({
  particleCount: 50,
  emissionRate: 10,
  lifetime: 2.0,
  startColor: '#ffffff',
  endColor: '#000000'
});

entity.addComponent(emitter);
emitter.play();
```

### Tweening Animations

```javascript
// Create smooth animation
const tween = tweenManager.create(entity.transform, 1000, Easing.bounceOut);
tween.to('position.y', 300);
tween.to('scale.x', 1.5);
tween.to('scale.y', 1.5);
tween.start();

// Chain animations
tween.chain(
  tweenManager.create(entity.transform, 500, Easing.linear)
    .to('position.x', 200)
);
```

## 🔄 Version Control

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-enemy-type

# Make changes
# ... development work ...

# Commit changes
git add .
git commit -m "Add new enemy type with AI behavior"

# Push branch
git push origin feature/new-enemy-type

# Create pull request
# ... create PR on GitHub ...

# Merge after review
git checkout main
git pull origin main
git branch -d feature/new-enemy-type
```

### Commit Conventions

```bash
# Feature commits
git commit -m "feat: add enemy AI system"

# Bug fixes
git commit -m "fix: resolve collision detection bug"

# Documentation
git commit -m "docs: update API reference"

# Performance improvements
git commit -m "perf: optimize sprite rendering"

# Refactoring
git commit -m "refactor: simplify entity management"
```

## 🚀 Deployment

### Build Process

```bash
# Build for production
npm run build

# Build with specific configuration
NODE_ENV=production npm run build

# Analyze bundle size
npm run build -- --analyze
```

### Deployment Options

#### GitHub Pages
```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
npm run deploy
```

#### Netlify/Vercel
```javascript
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "react/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Self-Hosted
```bash
# Build static files
npm run build

# Serve with any static server
npx serve -s build -l 3000
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Performance Issues:**
```javascript
// Enable performance monitoring
engine.debug = true;
console.log(engine.getStats());
```

**Asset Loading Issues:**
```javascript
// Check asset paths
console.log(assetManager.getAsset('missingAsset')); // null

// Verify asset loading
assetManager.loadAsset('test', '/assets/test.png', 'image')
  .then(() => console.log('Asset loaded'))
  .catch(error => console.error('Asset failed:', error));
```

### Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/console errors
   - System information

## 📈 Performance Monitoring

### FPS Monitoring

```javascript
class FPSMonitor {
  constructor() {
    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 0;
  }

  update() {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }
  }

  getFPS() {
    return this.fps;
  }
}
```

### Memory Monitoring

```javascript
// Monitor memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
  });
}
```

This development guide provides the foundation for building games with Rabbit-Raycast. The modular architecture makes it easy to extend and customize for specific game requirements.
