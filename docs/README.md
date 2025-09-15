# Rabbit-Raycast Documentation

Welcome to the comprehensive documentation for Rabbit-Raycast, a modular 3D raycasting game engine built with modern web technologies.

## 📚 Documentation Overview

This documentation covers all aspects of the Rabbit-Raycast engine, from basic setup to advanced features.

### 📖 Quick Start
- **[Getting Started](./getting-started.md)** - Installation and basic setup
- **[Project Structure](./project-structure.md)** - Understanding the codebase
- **[Basic Concepts](./basic-concepts.md)** - Core engine concepts

### 🏗️ Architecture
- **[ECS Architecture](./ecs-architecture.md)** - Entity-Component-System design
- **[Scene Management](./scene-management.md)** - Scene hierarchy and management
- **[Rendering Pipeline](./rendering-pipeline.md)** - How rendering works
- **[Physics System](./physics-system.md)** - Collision detection and physics

### 🎮 Game Development
- **[Creating Entities](./creating-entities.md)** - How to create game objects
- **[Components Guide](./components-guide.md)** - Available components
- **[Animation System](./animation-system.md)** - Tweening and animations
- **[Audio System](./audio-system.md)** - Sound and music
- **[Input Handling](./input-handling.md)** - User input management

### 🔧 Advanced Features
- **[Object Pooling](./object-pooling.md)** - Memory optimization
- **[Signals & Events](./signals-events.md)** - Event-driven programming
- **[Timer System](./timer-system.md)** - Time-based events
- **[Node Tree](./node-tree.md)** - Scene hierarchy management

### 🚀 Development
- **[Development Guide](./development-guide.md)** - Development workflow
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Performance Optimization](./performance-optimization.md)** - Optimization techniques
- **[Testing](./testing.md)** - Testing strategies

### 📦 Deployment
- **[Building](./building.md)** - Build process
- **[Deployment](./deployment.md)** - Deployment options
- **[Configuration](./configuration.md)** - Configuration options

### 🤝 Contributing
- **[Contributing](./contributing.md)** - How to contribute
- **[Code Style](./code-style.md)** - Coding standards
- **[Git Workflow](./git-workflow.md)** - Git workflow

### 📋 Project Info
- **[Changelog](./CHANGELOG.md)** - Version history
- **[License](./LICENSE.md)** - License information
- **[Roadmap](./roadmap.md)** - Future plans

## 🎯 Key Features

- **Modular ECS Architecture** - Inspired by Godot's design
- **3D Raycasting Engine** - Classic Doom-style 3D rendering
- **2D Sprite Support** - Hybrid 2D/3D rendering
- **Advanced Physics** - Collision detection and rigid body physics
- **Spatial Audio** - 3D positional audio system
- **Animation System** - Tweening with multiple easing functions
- **Event System** - Signals for decoupled communication
- **Memory Optimization** - Object pooling and efficient resource management
- **Cross-Platform** - Web-based with mobile support

## 🏃 Quick Example

```javascript
// Create a player entity
const player = new Node('Player');
player.addComponent(new TransformComponent({ x: 100, y: 100 }));
player.addComponent(new SpriteComponent(playerTexture));
player.addComponent(new PhysicsComponent({ mass: 1.0 }));

// Add to scene
scene.addChild(player);

// Animate the player
const tween = tweenManager.create(player.transform, 1000, Easing.bounceOut);
tween.to('position.y', 200).start();

// Handle input
inputSystem.on('keydown', (event) => {
  if (event.key === 'Space') {
    player.physics.applyImpulse({ x: 0, y: -10 });
  }
});
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AidanTheBandit/Rabbit-Raycast/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AidanTheBandit/Rabbit-Raycast/discussions)
- **Documentation**: This docs folder

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.

---

*Last updated: September 15, 2025*
