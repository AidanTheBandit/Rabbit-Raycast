# Project Structure

This document outlines the organization and structure of the Rabbit-Raycast project, helping you navigate the codebase effectively.

## 📁 Root Directory Structure

```
Rabbit-Raycast/
├── 📁 docs/                    # 📖 Documentation
├── 📁 react/                   # ⚛️  React frontend application
├── 📁 apps/                    # 📱 Standalone applications
├── 📁 static/                  # 🖼️  Static assets and builds
├── 🔧 build-deploy.sh         # 🚀 Build and deployment script
├── 📋 README.md               # 📚 Main project README
├── 📋 CHANGELOG.md            # 📝 Version history
├── 📋 LICENSE                 # ⚖️  License information
├── 📋 TECHNICAL.md            # 🔧 Technical specifications
└── 📋 API.md                  # 🔌 API documentation
```

## ⚛️ React Application Structure

```
react/
├── 📁 public/                 # 🌐 Static web assets
│   ├── 📄 index.html          # 🏠 Main HTML template
│   ├── 🖼️  vite.svg           # ⚡ Vite logo
│   └── 🔊 (audio files)       # Audio assets
├── 📁 src/                    # 📦 Source code
│   ├── 📁 components/         # ⚛️ React components
│   │   ├── 🖼️  LoadingScreen.jsx
│   │   └── 🎮 VirtualJoystick.jsx
│   ├── 📁 engine/             # 🎯 Game engine core
│   │   ├── 📁 core/           # 🔧 Core engine systems
│   │   ├── 📁 ecs/            # 🏗️ ECS architecture
│   │   └── 📁 demos/          # 🎮 Demo scenes
│   ├── 🎨 App.css             # Styling
│   ├── ⚛️  App.jsx            # Main React component
│   ├── 🎮 RaycastingEngine.jsx # Game engine integration
│   └── ⚛️  main.jsx           # Application entry point
├── 📋 package.json            # 📦 Dependencies and scripts
├── ⚙️  vite.config.js         # ⚡ Vite configuration
└── 🔧 eslint.config.js        # 🧹 Code linting configuration
```

## 🎯 Engine Architecture

### Core Systems (`src/engine/core/`)

```
core/
├── ⚙️  Engine.js              # 🚀 Main engine class
├── 🎭 SceneManager.js         # 🎬 Scene management
├── 🎨 Renderer.js             # 🖼️  Rendering system
├── ⚡ PhysicsSystem.js         # 🏃 Physics simulation
├── 🎵 AudioSystem.js          # 🔊 Audio management
├── 📦 AssetManager.js         # 📚 Asset loading
├── 🎆 ParticleSystem.js       # ✨ Particle effects
├── 🎮 InputSystem.js          # ⌨️ Input handling
└── 📊 Constants.js            # 🔢 Game constants
```

### ECS Architecture (`src/engine/ecs/`)

```
ecs/
├── 🏗️  ECS.js                 # 🧱 Core ECS classes
├── 📐 TransformComponent.js   # 📍 Position/rotation/scale
├── 🖼️  SpriteComponent.js     # 🎨 2D sprite rendering
├── 🔊 AudioComponent.js       # 🎵 Spatial audio
├── ⚡ PhysicsComponent.js     # 🏃 Physics integration
├── 📡 Signals.js              # 📢 Event system
├── 🌳 NodeTree.js             # 🌲 Scene hierarchy
├── 🎨 SpriteRenderer.js       # 🖼️ Sprite rendering system
├── 🔄 ObjectPooling.js        # ♻️ Memory optimization
├── 🎭 Tweening.js             # 🎬 Animation system
└── ⏰ TimerSystem.js          # ⏱️ Time management
```

### Demo Scenes (`src/engine/demos/`)

```
demos/
├── 🎯 DoomDemo.js             # 🏹 Classic raycasting demo
└── (other demo scenes)
```

## 📱 Standalone Applications

```
apps/
├── 📁 app/                    # 🌐 Web application
│   ├── 📄 index.html          # 🏠 HTML template
│   ├── 📦 package.json        # 📦 Dependencies
│   ├── ⚙️  vite.config.js     # ⚡ Build configuration
│   └── 📁 src/                # 📦 Application source
└── 📁 static/                 # 🏗️ Built applications
```

## 📖 Documentation Structure

```
docs/
├── 📋 README.md               # 📚 Documentation index
├── 🚀 getting-started.md      # 🏁 Quick start guide
├── 🏗️  project-structure.md   # 📁 This file
├── 🧱 ecs-architecture.md     # 🏗️ ECS explanation
├── 🎮 creating-entities.md    # 🎯 Entity creation
├── 🧩 components-guide.md     # 🧩 Component reference
├── 🎨 animation-system.md     # 🎬 Tweening guide
├── 🔊 audio-system.md         # 🎵 Audio guide
├── ⌨️  input-handling.md       # 🎮 Input guide
├── ♻️  object-pooling.md       # 🔄 Memory optimization
├── 📡 signals-events.md       # 📢 Event system
├── ⏰ timer-system.md         # ⏱️ Timer guide
├── 🌳 node-tree.md            # 🌲 Scene hierarchy
├── 🖼️  rendering-pipeline.md  # 🎨 Rendering guide
├── ⚡ physics-system.md        # 🏃 Physics guide
├── 🎭 scene-management.md     # 🎬 Scene management
├── 🔧 development-guide.md    # 🛠️ Development workflow
├── 📚 api-reference.md        # 🔌 Complete API docs
├── ⚡ performance-optimization.md # 🚀 Optimization guide
├── 🧪 testing.md              # 🧪 Testing strategies
├── 🏗️  building.md            # 🔨 Build process
├── 🚀 deployment.md           # 🌐 Deployment options
├── ⚙️  configuration.md       # 🔧 Configuration
├── 🤝 contributing.md         # 👥 Contribution guide
├── 💅 code-style.md           # 🎨 Code standards
├── 🌳 git-workflow.md         # 🌿 Git workflow
├── 📝 CHANGELOG.md            # 📋 Version history
├── ⚖️  LICENSE.md             # 📜 License
└── 🗺️  roadmap.md             # 🧭 Future plans
```

## 🔍 Key Files Explained

### Core Engine Files

- **`Engine.js`** - The heart of the engine, manages all systems
- **`SceneManager.js`** - Handles scene loading, transitions, and lifecycle
- **`Renderer.js`** - Manages 3D raycasting and 2D sprite rendering
- **`PhysicsSystem.js`** - Collision detection and physics simulation
- **`InputSystem.js`** - Cross-platform input handling

### ECS System Files

- **`ECS.js`** - Base Entity, Component, and System classes
- **`TransformComponent.js`** - Position, rotation, scale transformations
- **`SpriteComponent.js`** - 2D sprite rendering and animation
- **`PhysicsComponent.js`** - Physics integration and collision
- **`Signals.js`** - Event-driven communication system

### React Integration

- **`RaycastingEngine.jsx`** - Bridges React and the game engine
- **`App.jsx`** - Main React application component
- **`VirtualJoystick.jsx`** - Touch/mobile input component

## 📂 File Naming Conventions

### Components and Classes
- **PascalCase** for class names (`TransformComponent`, `SceneManager`)
- **camelCase** for instances and variables (`transformComponent`, `sceneManager`)

### Files
- **PascalCase** for component files (`SpriteComponent.js`)
- **camelCase** for utility files (`objectPooling.js`)
- **kebab-case** for React components (`virtual-joystick.jsx`)

### Directories
- **lowercase** for general directories (`core`, `ecs`, `docs`)
- **camelCase** for specific feature directories (`sceneManagement`)

## 🔗 Import/Export Patterns

### ES6 Modules
```javascript
// Named exports
export class TransformComponent { ... }
export const Easing = { ... }

// Default exports
export default class Engine { ... }

// Imports
import { TransformComponent } from './TransformComponent.js';
import Engine from './Engine.js';
```

### Relative Imports
```javascript
// Same directory
import { Component } from './ECS.js';

// Parent directory
import { Scene } from '../core/SceneManager.js';

// Sibling directory
import { TweenManager } from '../ecs/Tweening.js';
```

## 🏷️ Code Organization Principles

### Separation of Concerns
- **Engine systems** handle specific functionality (physics, rendering, audio)
- **ECS components** contain data and behavior
- **React components** handle UI and user interaction
- **Utilities** provide common functionality

### Modularity
- Each system/component is self-contained
- Clear interfaces between modules
- Easy to add/remove/replace components

### Performance
- Object pooling for frequently created/destroyed objects
- Efficient data structures (Maps, Sets, TypedArrays)
- Minimal DOM manipulation in game loop

## 🚀 Build and Deployment

### Development
```bash
cd react
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production
```bash
./build-deploy.sh    # Build all applications
```

## 📊 Asset Organization

```
public/
├── 🖼️  textures/           # Sprite textures and tiles
├── 🔊 audio/               # Sound effects and music
├── 📄 levels/              # Level/map data
├── 🎨 fonts/               # Custom fonts
└── 📋 data/                # JSON configuration files
```

## 🔧 Configuration Files

- **`package.json`** - Node.js dependencies and scripts
- **`vite.config.js`** - Vite bundler configuration
- **`eslint.config.js`** - Code linting rules
- **`.gitignore`** - Git ignore patterns

## 🎯 Navigation Tips

### Finding Specific Functionality
1. **Game logic** → `src/engine/core/` or `src/engine/ecs/`
2. **UI components** → `src/components/`
3. **Assets** → `public/` directory
4. **Build configuration** → Root level config files
5. **Documentation** → `docs/` directory

### Understanding Dependencies
- Check `package.json` for external dependencies
- Look at import statements for internal dependencies
- Use the documentation index (`docs/README.md`) for guidance

This structure provides a solid foundation for scalable game development while maintaining clean separation of concerns and modularity.
