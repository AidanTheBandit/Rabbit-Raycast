# Getting Started

Welcome to Rabbit-Raycast! This guide will help you get up and running with the modular 3D raycasting game engine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AidanTheBandit/Rabbit-Raycast.git
cd Rabbit-Raycast
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install React app dependencies
cd react
npm install
cd ..
```

### 3. Start Development Server

```bash
# Start the React development server
cd react
npm run dev
```

The application will be available at `http://localhost:5173` (or similar port).

## 🏗️ Project Structure

After installation, your project should look like this:

```
Rabbit-Raycast/
├── docs/                    # Documentation
├── react/                   # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── engine/         # Game engine
│   │   │   ├── core/       # Core systems
│   │   │   ├── ecs/        # ECS architecture
│   │   │   └── demos/      # Demo scenes
│   │   └── assets/         # Game assets
│   └── package.json
├── apps/                    # Standalone apps
├── build-deploy.sh         # Build script
└── README.md
```

## 🎮 Your First Game

Let's create a simple game to get familiar with the engine.

### 1. Create a Basic Scene

Create a new file `react/src/engine/scenes/MyFirstScene.js`:

```javascript
import { Scene } from '../core/SceneManager.js';
import { Node } from '../ecs/NodeTree.js';
import { TransformComponent } from '../ecs/TransformComponent.js';
import { SpriteComponent } from '../ecs/SpriteComponent.js';

export class MyFirstScene extends Scene {
  constructor(engine) {
    super(engine, 'My First Scene');
  }

  async onEnter() {
    console.log('🎮 Welcome to your first scene!');

    // Create a player entity
    const player = new Node('Player');
    player.addComponent(new TransformComponent({ x: 100, y: 100 }));

    // Add a simple colored rectangle as sprite
    const sprite = player.addComponent(new SpriteComponent());
    sprite.width = 32;
    sprite.height = 32;
    sprite.color = '#ff0000';

    // Add to scene
    this.addEntity(player);

    // Store reference for later use
    this.player = player;
  }

  onUpdate(deltaTime) {
    // Simple movement
    if (this.engine.input.isActionActive('move_forward')) {
      this.player.transform.translate(0, -2);
    }
    if (this.engine.input.isActionActive('move_backward')) {
      this.player.transform.translate(0, 2);
    }
  }

  onRender(renderer) {
    // Custom rendering can go here
  }
}
```

### 2. Register and Load Your Scene

Modify `react/src/RaycastingEngine.jsx` to use your new scene:

```javascript
import { MyFirstScene } from './engine/scenes/MyFirstScene.js';

// ... existing code ...

// Register your scene
engineRef.current.sceneManager.registerScene('MyFirstScene', MyFirstScene);

// Load your scene
await engineRef.current.sceneManager.loadScene('MyFirstScene');
```

### 3. Add Input Controls

Update your scene to handle input:

```javascript
setupInputMappings() {
  this.engine.input.keyMappings.set('move_forward', ['KeyW', 'ArrowUp']);
  this.engine.input.keyMappings.set('move_backward', ['KeyS', 'ArrowDown']);
  this.engine.input.keyMappings.set('move_left', ['KeyA', 'ArrowLeft']);
  this.engine.input.keyMappings.set('move_right', ['KeyD', 'ArrowRight']);
}
```

## 🎨 Adding Visuals

### Using Images

```javascript
// Load a texture
await this.engine.assetManager.loadAsset('playerTexture', '/assets/player.png', 'image');

// Create sprite with texture
const sprite = player.addComponent(new SpriteComponent());
sprite.texture = this.engine.assetManager.getAsset('playerTexture');
sprite.width = 32;
sprite.height = 32;
```

### Adding Animations

```javascript
import { TweenManager, Easing } from '../ecs/Tweening.js';

// Create tween manager
const tweenManager = new TweenManager();

// Animate position
const tween = tweenManager.create(player.transform, 2000, Easing.bounceOut);
tween.to('position.y', 300).start();

// In your update loop
tweenManager.update(deltaTime);
```

## 🔊 Adding Audio

```javascript
import { AudioComponent } from '../ecs/AudioComponent.js';

// Add audio component
const audio = player.addComponent(new AudioComponent());
await audio.loadSound('jumpSound', '/assets/jump.wav');

// Play sound
audio.play();
```

## ⚡ Adding Physics

```javascript
import { PhysicsComponent } from '../ecs/PhysicsComponent.js';

// Add physics
const physics = player.addComponent(new PhysicsComponent({
  mass: 1.0,
  collider: { type: 'circle', radius: 16 }
}));

// Apply forces
physics.applyImpulse({ x: 5, y: -10 });
```

## 🏃 Running Your Game

1. Save your changes
2. The development server should automatically reload
3. Open your browser to `http://localhost:5173`
4. You should see your player entity that you can move with WASD keys

## 🎯 Next Steps

Now that you have a basic game running, explore these topics:

- **[ECS Architecture](./ecs-architecture.md)** - Learn about entities and components
- **[Components Guide](./components-guide.md)** - Discover all available components
- **[Scene Management](./scene-management.md)** - Manage multiple scenes
- **[Animation System](./animation-system.md)** - Create smooth animations
- **[Physics System](./physics-system.md)** - Add realistic physics

## 🐛 Troubleshooting

### Common Issues

**Development server won't start:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Assets not loading:**
- Ensure asset paths are correct
- Check browser console for 404 errors
- Make sure assets are in the `public` folder

**Input not working:**
- Check that input mappings are set up correctly
- Verify event listeners are attached
- Test with browser developer tools

### Getting Help

- Check the [API Reference](./api-reference.md) for detailed documentation
- Look at existing demo scenes in `src/engine/demos/`
- Open an issue on GitHub for bugs or feature requests

## 📚 Further Reading

- **[Basic Concepts](./basic-concepts.md)** - Core engine concepts
- **[Development Guide](./development-guide.md)** - Development workflow
- **[Performance Optimization](./performance-optimization.md)** - Optimization techniques

---

*Happy coding! 🎮*
