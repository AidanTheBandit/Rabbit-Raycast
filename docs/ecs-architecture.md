# ECS Architecture

The Entity-Component-System (ECS) architecture is the core of Rabbit-Raycast's modular design, inspired by modern game engines like Unity and Godot.

## 🧱 Core Concepts

### Entity
An **Entity** is a unique object in your game world. It represents something that exists (player, enemy, bullet, etc.) but contains no logic or data itself.

```javascript
// Create a player entity
const player = new Entity('Player');

// Add components to give it behavior and properties
player.addComponent(new TransformComponent({ x: 100, y: 100 }));
player.addComponent(new SpriteComponent(playerTexture));
player.addComponent(new PhysicsComponent({ mass: 1.0 }));
```

### Component
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

### System
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

## 🏗️ Architecture Benefits

### Modularity
- **Separation of Concerns**: Data, logic, and behavior are cleanly separated
- **Easy Extension**: Add new functionality without modifying existing code
- **Reusable Components**: Components can be mixed and matched freely

### Performance
- **Data-Oriented Design**: Efficient memory layout and cache-friendly access
- **Parallel Processing**: Systems can be processed in parallel
- **Minimal Coupling**: Changes to one system don't affect others

### Maintainability
- **Clear Dependencies**: Easy to see what components a system requires
- **Testable Code**: Individual systems and components can be tested in isolation
- **Scalable Architecture**: Easy to add new features without breaking existing code

## 📊 How It Works

### Entity Management
```javascript
// Create entity manager
const entityManager = new EntityManager();

// Create entities
const player = entityManager.createEntity('Player');
const enemy = entityManager.createEntity('Enemy');

// Add components
player.addComponent(new TransformComponent({ x: 0, y: 0 }));
player.addComponent(new HealthComponent(100));

// Query entities
const players = entityManager.getEntitiesWithComponents('TransformComponent', 'HealthComponent');
```

### System Processing
```javascript
// Create system manager
const systemManager = new SystemManager();

// Add systems
systemManager.addSystem(new HealthSystem());
systemManager.addSystem(new PhysicsSystem());
systemManager.addSystem(new RenderSystem());

// Process all systems
systemManager.update(deltaTime);
```

### Component Communication
```javascript
// Components can communicate through the entity
class WeaponComponent extends Component {
  fire() {
    // Get physics component from same entity
    const physics = this.entity.getComponent('PhysicsComponent');
    if (physics) {
      physics.applyImpulse({ x: this.recoil, y: 0 });
    }

    // Emit event for other systems to handle
    this.entity.emit('weapon_fired', { damage: this.damage });
  }
}
```

## 🎯 Component Types

### Core Components

#### TransformComponent
Handles position, rotation, and scale transformations.

```javascript
const transform = new TransformComponent({ x: 100, y: 200 }, Math.PI/4, { x: 2, y: 2 });
entity.addComponent(transform);

// Move entity
transform.translate(10, 0);

// Rotate entity
transform.rotate(Math.PI/2);

// Scale entity
transform.scaleBy(1.5, 1.5);
```

#### SpriteComponent
Handles 2D sprite rendering and animation.

```javascript
const sprite = new SpriteComponent();
sprite.texture = texture;
sprite.width = 32;
sprite.height = 32;
sprite.frameWidth = 32;
sprite.frameHeight = 32;

// Add animation
sprite.addAnimation('walk', [0, 1, 2, 3], 0.1);
sprite.playAnimation('walk');
```

#### PhysicsComponent
Handles collision detection and physics simulation.

```javascript
const physics = new PhysicsComponent({
  mass: 1.0,
  velocity: { x: 0, y: 0 },
  collider: { type: 'circle', radius: 16 }
});

// Apply forces
physics.applyForce({ x: 10, y: 0 }, 100); // Force for 100ms
physics.applyImpulse({ x: 0, y: -5 }); // Instant impulse
```

#### AudioComponent
Handles spatial audio and sound effects.

```javascript
const audio = new AudioComponent({
  volume: 0.8,
  spatial: true,
  maxDistance: 100
});

// Load and play sound
await audio.loadSound('jump', '/audio/jump.wav');
audio.play();
```

### Custom Components

Create custom components by extending the base Component class:

```javascript
class InventoryComponent extends Component {
  constructor() {
    super('InventoryComponent');
    this.items = new Map();
    this.maxItems = 10;
  }

  addItem(item, quantity = 1) {
    const current = this.items.get(item.id) || 0;
    this.items.set(item.id, current + quantity);
    this.entity.emit('item_added', { item, quantity });
  }

  removeItem(itemId, quantity = 1) {
    const current = this.items.get(itemId) || 0;
    if (current >= quantity) {
      this.items.set(itemId, current - quantity);
      this.entity.emit('item_removed', { itemId, quantity });
      return true;
    }
    return false;
  }
}
```

## ⚙️ System Examples

### Movement System
```javascript
class MovementSystem extends System {
  constructor() {
    super('MovementSystem');
    this.setRequiredComponents('TransformComponent', 'VelocityComponent');
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');
    const velocity = entity.getComponent('VelocityComponent');

    // Apply velocity to position
    transform.translate(
      velocity.x * deltaTime,
      velocity.y * deltaTime
    );

    // Apply friction
    velocity.x *= (1 - velocity.friction);
    velocity.y *= (1 - velocity.friction);
  }
}
```

### AI System
```javascript
class AISystem extends System {
  constructor() {
    super('AISystem');
    this.setRequiredComponents('TransformComponent', 'AIComponent');
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');
    const ai = entity.getComponent('AIComponent');

    // Simple seek behavior
    if (ai.target) {
      const dx = ai.target.x - transform.position.x;
      const dy = ai.target.y - transform.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > ai.stopDistance) {
        const moveX = (dx / distance) * ai.speed * deltaTime;
        const moveY = (dy / distance) * ai.speed * deltaTime;
        transform.translate(moveX, moveY);
      }
    }
  }
}
```

### Render System
```javascript
class RenderSystem extends System {
  constructor(renderer) {
    super('RenderSystem');
    this.renderer = renderer;
    this.setRequiredComponents('TransformComponent', 'SpriteComponent');
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');
    const sprite = entity.getComponent('SpriteComponent');

    // Update sprite animation
    sprite.update(deltaTime);

    // Render sprite at transform position
    this.renderer.drawSprite(
      sprite.texture,
      transform.position.x,
      transform.position.y,
      sprite.width * transform.scale.x,
      sprite.height * transform.scale.y,
      transform.rotation
    );
  }
}
```

## 🔄 System Lifecycle

### Initialization
```javascript
class GameSystem extends System {
  init() {
    // Called when system is added to engine
    console.log('GameSystem initialized');
  }

  onEntityAdded(entity) {
    // Called when an entity matching this system's components is added
    console.log('Entity added to GameSystem:', entity.name);
  }

  onEntityRemoved(entity) {
    // Called when an entity is removed from this system
    console.log('Entity removed from GameSystem:', entity.name);
  }
}
```

### Update Loop
```javascript
class PhysicsSystem extends System {
  update(deltaTime) {
    // Called every frame before processing entities
    this.updatePhysicsWorld(deltaTime);
  }

  processEntity(entity, deltaTime) {
    // Called for each matching entity
    this.simulatePhysics(entity, deltaTime);
  }

  lateUpdate(deltaTime) {
    // Called after all entities are processed
    this.resolveCollisions();
  }
}
```

## 📡 Communication Patterns

### Events and Signals
```javascript
// Component emits signal
class PlayerComponent extends Component {
  jump() {
    this.entity.emit('player_jumped', { height: 10 });
  }
}

// System listens for signal
class AudioSystem extends System {
  init() {
    this.engine.on('player_jumped', (data) => {
      this.playSound('jump', data.height);
    });
  }
}
```

### Component Queries
```javascript
class TargetingSystem extends System {
  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');

    // Find nearby enemies
    const enemies = this.entityManager.getEntitiesWithComponents(
      'TransformComponent',
      'EnemyComponent'
    );

    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent('TransformComponent');
      const distance = transform.distanceTo(enemyTransform);

      if (distance < 100) {
        // Target found
        entity.emit('target_acquired', enemy);
        break;
      }
    }
  }
}
```

## 🏃 Performance Optimization

### Object Pooling
```javascript
class BulletSystem extends System {
  constructor() {
    super('BulletSystem');
    this.bulletPool = new ObjectPool(
      () => new Entity('Bullet'),
      (entity) => this.resetBullet(entity),
      50
    );
  }

  createBullet(position, velocity) {
    const bullet = this.bulletPool.get();
    bullet.getComponent('TransformComponent').position = position;
    bullet.getComponent('PhysicsComponent').velocity = velocity;
    return bullet;
  }

  destroyBullet(bullet) {
    this.bulletPool.release(bullet);
  }
}
```

### Spatial Partitioning
```javascript
class SpatialSystem extends System {
  constructor() {
    super('SpatialSystem');
    this.spatialGrid = new SpatialGrid(64); // 64x64 cells
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');

    // Update entity position in spatial grid
    this.spatialGrid.updateEntity(entity, transform.position);

    // Query nearby entities efficiently
    const nearby = this.spatialGrid.getNearbyEntities(transform.position, 100);
  }
}
```

## 🧪 Testing ECS Code

### Unit Testing Components
```javascript
describe('HealthComponent', () => {
  test('should reduce health when taking damage', () => {
    const entity = new Entity('TestEntity');
    const health = new HealthComponent(100);
    entity.addComponent(health);

    health.takeDamage(25);

    expect(health.currentHealth).toBe(75);
  });

  test('should emit died signal when health reaches zero', () => {
    const entity = new Entity('TestEntity');
    const health = new HealthComponent(50);
    entity.addComponent(health);

    const mockCallback = jest.fn();
    entity.connect('died', mockCallback);

    health.takeDamage(50);

    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Integration Testing Systems
```javascript
describe('MovementSystem', () => {
  test('should update entity position based on velocity', () => {
    const entity = new Entity('MovingEntity');
    entity.addComponent(new TransformComponent({ x: 0, y: 0 }));
    entity.addComponent(new VelocityComponent({ x: 10, y: 5 }));

    const system = new MovementSystem();
    system.addEntity(entity);

    system.update(1.0); // 1 second

    const transform = entity.getComponent('TransformComponent');
    expect(transform.position.x).toBe(10);
    expect(transform.position.y).toBe(5);
  });
});
```

## 🎯 Best Practices

### Component Design
- **Single Responsibility**: Each component should have one clear purpose
- **Data Only**: Keep logic in systems, data in components
- **Serializable**: Design components to be easily saved/loaded
- **Minimal Dependencies**: Avoid tight coupling between components

### System Design
- **Clear Requirements**: Explicitly define required components
- **Efficient Queries**: Use spatial queries for performance
- **State Management**: Handle system state changes gracefully
- **Error Handling**: Gracefully handle missing components or invalid data

### Entity Management
- **Meaningful Names**: Use descriptive names for entities
- **Component Groups**: Group related components logically
- **Lifecycle Management**: Properly clean up when entities are destroyed
- **Performance Monitoring**: Track entity count and system performance

The ECS architecture provides a powerful foundation for building complex, maintainable games with excellent performance characteristics.
