# Performance Optimization

Comprehensive guide to optimizing Rabbit-Raycast's performance for smooth gameplay.

## 📊 Performance Monitoring

### Built-in Performance Stats

```javascript
// Enable debug mode
engine.debug = true;

// Get comprehensive stats
const stats = engine.getStats();
console.log('Engine Stats:', stats);

/*
Output:
{
  fps: 60,
  frameTime: 16.67,
  memoryUsage: 1024,
  entities: 150,
  systems: 8,
  drawCalls: 45,
  triangles: 1200
}
*/
```

### Custom Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.samples = [];
  }

  update() {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Calculate FPS
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameTime = deltaTime / this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Keep samples for averaging
      this.samples.push(this.frameTime);
      if (this.samples.length > 60) {
        this.samples.shift();
      }
    }
  }

  getAverageFrameTime() {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b) / this.samples.length;
  }

  getStats() {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      averageFrameTime: this.getAverageFrameTime(),
      memoryUsage: performance.memory ?
        performance.memory.usedJSHeapSize / 1048576 : 0
    };
  }
}
```

## 🚀 Rendering Optimization

### Sprite Batching

```javascript
// Use sprite batching for better performance
class OptimizedSpriteRenderer extends System {
  constructor() {
    super('OptimizedSpriteRenderer');
    this.setRequiredComponents('SpriteComponent', 'TransformComponent');
    this.spriteBatch = new SpriteBatch(1000);
  }

  processEntity(entity, deltaTime) {
    const sprite = entity.getComponent('SpriteComponent');
    const transform = entity.getComponent('TransformComponent');

    // Add to batch instead of immediate rendering
    this.spriteBatch.addSprite(sprite, transform);
  }

  render(renderer) {
    // Render entire batch at once
    this.spriteBatch.render(renderer.ctx);
    this.spriteBatch.clear();
  }
}
```

### Texture Atlasing

```javascript
// Combine multiple sprites into single texture
class TextureAtlas {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sprites = new Map();
    this.currentX = 0;
    this.currentY = 0;
    this.rowHeight = 0;
  }

  addSprite(name, image) {
    // Check if sprite fits in current row
    if (this.currentX + image.width > this.canvas.width) {
      this.currentX = 0;
      this.currentY += this.rowHeight;
      this.rowHeight = 0;
    }

    // Draw sprite to atlas
    this.ctx.drawImage(image, this.currentX, this.currentY);

    // Store sprite info
    this.sprites.set(name, {
      x: this.currentX,
      y: this.currentY,
      width: image.width,
      height: image.height,
      atlas: this.canvas
    });

    // Update position
    this.currentX += image.width;
    this.rowHeight = Math.max(this.rowHeight, image.height);
  }

  getSprite(name) {
    return this.sprites.get(name);
  }
}
```

### Level-of-Detail (LOD)

```javascript
class LODSystem extends System {
  constructor() {
    super('LODSystem');
    this.setRequiredComponents('SpriteComponent', 'TransformComponent');
    this.lodDistances = [100, 200, 500]; // Distance thresholds
  }

  processEntity(entity, deltaTime) {
    const sprite = entity.getComponent('SpriteComponent');
    const transform = entity.getComponent('TransformComponent');

    // Calculate distance to camera
    const distance = this.getDistanceToCamera(transform.position);

    // Set LOD level based on distance
    if (distance < this.lodDistances[0]) {
      sprite.setLOD(0); // High detail
    } else if (distance < this.lodDistances[1]) {
      sprite.setLOD(1); // Medium detail
    } else if (distance < this.lodDistances[2]) {
      sprite.setLOD(2); // Low detail
    } else {
      sprite.setLOD(3); // Very low detail or cull
    }
  }

  getDistanceToCamera(position) {
    // Calculate distance to camera position
    const camera = this.engine.camera.position;
    const dx = position.x - camera.x;
    const dy = position.y - camera.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

## ⚡ Physics Optimization

### Spatial Partitioning

```javascript
class SpatialGrid {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  addEntity(entity, position) {
    const key = this.getCellKey(position.x, position.y);

    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }

    this.grid.get(key).add(entity);
  }

  removeEntity(entity, position) {
    const key = this.getCellKey(position.x, position.y);
    const cell = this.grid.get(key);

    if (cell) {
      cell.delete(entity);
      if (cell.size === 0) {
        this.grid.delete(key);
      }
    }
  }

  getNearbyEntities(position, radius) {
    const nearby = new Set();
    const startX = Math.floor((position.x - radius) / this.cellSize);
    const endX = Math.floor((position.x + radius) / this.cellSize);
    const startY = Math.floor((position.y - radius) / this.cellSize);
    const endY = Math.floor((position.y + radius) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);

        if (cell) {
          for (const entity of cell) {
            const entityPos = entity.getComponent('TransformComponent').position;
            const distance = Math.sqrt(
              Math.pow(entityPos.x - position.x, 2) +
              Math.pow(entityPos.y - position.y, 2)
            );

            if (distance <= radius) {
              nearby.add(entity);
            }
          }
        }
      }
    }

    return nearby;
  }
}
```

### Physics Broad Phase

```javascript
class PhysicsBroadPhase {
  constructor(spatialGrid) {
    this.spatialGrid = spatialGrid;
    this.collisionPairs = new Set();
  }

  update() {
    this.collisionPairs.clear();

    // Check each cell for potential collisions
    for (const [cellKey, entities] of this.spatialGrid.grid) {
      const entityArray = Array.from(entities);

      // Check collisions within cell
      for (let i = 0; i < entityArray.length; i++) {
        for (let j = i + 1; j < entityArray.length; j++) {
          const entityA = entityArray[i];
          const entityB = entityArray[j];

          if (this.shouldCheckCollision(entityA, entityB)) {
            this.collisionPairs.add([entityA, entityB]);
          }
        }
      }
    }
  }

  shouldCheckCollision(entityA, entityB) {
    const physicsA = entityA.getComponent('PhysicsComponent');
    const physicsB = entityB.getComponent('PhysicsComponent');

    // Skip if either entity is static
    if (physicsA.isStatic || physicsB.isStatic) return false;

    // Check collision layers/masks
    return this.checkCollisionLayers(physicsA, physicsB);
  }

  checkCollisionLayers(physicsA, physicsB) {
    // Implement collision layer/mask logic
    return physicsA.collisionMask.includes(physicsB.collisionLayer) &&
           physicsB.collisionMask.includes(physicsA.collisionLayer);
  }

  getCollisionPairs() {
    return this.collisionPairs;
  }
}
```

## 🔄 Memory Optimization

### Object Pooling

```javascript
// Generic object pool
class ObjectPool {
  constructor(createFunc, resetFunc = null, initialSize = 10) {
    this.createFunc = createFunc;
    this.resetFunc = resetFunc || ((obj) => obj);
    this.pool = [];
    this.active = new Set();
    this.maxSize = 1000;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFunc());
    }
  }

  get() {
    let obj;

    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFunc();
    }

    this.active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.resetFunc(obj);

      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
  }

  releaseAll() {
    for (const obj of this.active) {
      this.resetFunc(obj);
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
    this.active.clear();
  }

  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
      utilization: this.active.size / (this.pool.length + this.active.size)
    };
  }
}

// Usage example
const bulletPool = new ObjectPool(
  () => {
    const entity = new Entity('Bullet');
    entity.addComponent(new TransformComponent());
    entity.addComponent(new SpriteComponent());
    entity.addComponent(new PhysicsComponent());
    return entity;
  },
  (entity) => {
    // Reset entity state
    entity.enabled = false;
    entity.getComponent('TransformComponent').reset();
    entity.getComponent('PhysicsComponent').velocity = { x: 0, y: 0 };
  },
  50
);
```

### Component Pooling

```javascript
// Pool components for frequent creation/destruction
class ComponentPoolManager {
  constructor() {
    this.pools = new Map();
  }

  getPool(componentClass) {
    const className = componentClass.name;

    if (!this.pools.has(className)) {
      this.pools.set(className, new ObjectPool(
        () => new componentClass(),
        (component) => component.reset ? component.reset() : null,
        20
      ));
    }

    return this.pools.get(className);
  }

  getComponent(componentClass) {
    return this.getPool(componentClass).get();
  }

  releaseComponent(component) {
    const pool = this.getPool(component.constructor);
    pool.release(component);
  }
}
```

## 🎭 Animation Optimization

### Tween Pooling

```javascript
class TweenPool {
  constructor() {
    this.pool = new ObjectPool(
      () => new Tween(null, 1000),
      (tween) => tween.reset(),
      50
    );
  }

  create(target, duration, easing = Easing.linear) {
    const tween = this.pool.get();
    tween.target = target;
    tween.duration = duration;
    tween.easing = easing;
    return tween;
  }

  release(tween) {
    this.pool.release(tween);
  }
}
```

### Animation Frame Skipping

```javascript
class OptimizedAnimationComponent extends Component {
  constructor() {
    super('OptimizedAnimationComponent');
    this.frameRate = 0.1;
    this.timeAccumulator = 0;
    this.currentFrame = 0;
    this.frames = [];
    this.skipFrames = false;
  }

  update(deltaTime) {
    if (this.skipFrames && deltaTime > 0.033) { // Skip frames when running slow
      this.timeAccumulator += deltaTime;
      const targetFrame = Math.floor(this.timeAccumulator / this.frameRate);

      if (targetFrame > this.currentFrame) {
        this.currentFrame = targetFrame;
        this.updateFrame();
      }
    } else {
      // Normal frame update
      this.timeAccumulator += deltaTime;

      if (this.timeAccumulator >= this.frameRate) {
        this.timeAccumulator -= this.frameRate;
        this.currentFrame++;
        this.updateFrame();
      }
    }
  }

  updateFrame() {
    if (this.currentFrame >= this.frames.length) {
      if (this.loop) {
        this.currentFrame = 0;
      } else {
        this.currentFrame = this.frames.length - 1;
        this.playing = false;
      }
    }

    // Update sprite frame
    if (this.sprite) {
      this.sprite.frame = this.frames[this.currentFrame];
    }
  }
}
```

## 📊 System Optimization

### System Update Ordering

```javascript
// Optimize system update order for cache efficiency
class SystemManager {
  constructor() {
    this.systems = [];
    this.updateOrder = [
      'InputSystem',      // Process input first
      'AISystem',         // AI decisions
      'PhysicsSystem',    // Physics simulation
      'AnimationSystem',  // Update animations
      'RenderSystem'      // Render last
    ];
  }

  addSystem(system) {
    this.systems.push(system);
    this.sortSystems();
  }

  sortSystems() {
    this.systems.sort((a, b) => {
      const indexA = this.updateOrder.indexOf(a.constructor.name);
      const indexB = this.updateOrder.indexOf(b.constructor.name);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }
}
```

### Entity Processing Optimization

```javascript
class OptimizedEntityManager {
  constructor() {
    this.entities = new Map();
    this.entitiesByComponent = new Map();
    this.dirtyEntities = new Set();
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
    this.dirtyEntities.add(entity);

    // Update component index
    for (const component of entity.getComponents()) {
      const componentType = component.getType();

      if (!this.entitiesByComponent.has(componentType)) {
        this.entitiesByComponent.set(componentType, new Set());
      }

      this.entitiesByComponent.get(componentType).add(entity);
    }
  }

  getEntitiesWithComponents(...componentTypes) {
    if (componentTypes.length === 0) return Array.from(this.entities.values());
    if (componentTypes.length === 1) {
      return Array.from(this.entitiesByComponent.get(componentTypes[0]) || []);
    }

    // Find intersection of entities with all required components
    let result = null;

    for (const componentType of componentTypes) {
      const entitiesWithComponent = this.entitiesByComponent.get(componentType);

      if (!entitiesWithComponent) return [];

      if (result === null) {
        result = new Set(entitiesWithComponent);
      } else {
        // Intersection
        for (const entity of result) {
          if (!entitiesWithComponent.has(entity)) {
            result.delete(entity);
          }
        }
      }
    }

    return Array.from(result);
  }

  updateComponentIndex() {
    // Rebuild component index for dirty entities
    for (const entity of this.dirtyEntities) {
      // Remove from old indices
      for (const [componentType, entities] of this.entitiesByComponent) {
        entities.delete(entity);
      }

      // Add to new indices
      for (const component of entity.getComponents()) {
        const componentType = component.getType();

        if (!this.entitiesByComponent.has(componentType)) {
          this.entitiesByComponent.set(componentType, new Set());
        }

        this.entitiesByComponent.get(componentType).add(entity);
      }
    }

    this.dirtyEntities.clear();
  }
}
```

## 🔧 JavaScript Optimization

### Avoid Object Creation in Loops

```javascript
// ❌ Bad: Creates new object every frame
update(deltaTime) {
  for (const entity of this.entities) {
    const position = { x: entity.x, y: entity.y }; // New object!
    this.processEntity(entity, position);
  }
}

// ✅ Good: Reuse objects
constructor() {
  this.tempPosition = { x: 0, y: 0 };
}

update(deltaTime) {
  for (const entity of this.entities) {
    this.tempPosition.x = entity.x;
    this.tempPosition.y = entity.y;
    this.processEntity(entity, this.tempPosition);
  }
}
```

### Use Typed Arrays for Performance

```javascript
// Use Float32Array for vertex data
class VertexBuffer {
  constructor(size) {
    this.vertices = new Float32Array(size * 3); // x, y, z per vertex
    this.indices = new Uint16Array(size);
    this.vertexCount = 0;
  }

  addVertex(x, y, z) {
    const index = this.vertexCount * 3;
    this.vertices[index] = x;
    this.vertices[index + 1] = y;
    this.vertices[index + 2] = z;
    this.vertexCount++;
  }
}
```

### Optimize Math Operations

```javascript
// Cache expensive calculations
class OptimizedMath {
  constructor() {
    this.sinCache = new Float32Array(360);
    this.cosCache = new Float32Array(360);

    // Pre-calculate sin/cos values
    for (let i = 0; i < 360; i++) {
      const angle = (i * Math.PI) / 180;
      this.sinCache[i] = Math.sin(angle);
      this.cosCache[i] = Math.cos(angle);
    }
  }

  fastSin(angle) {
    const index = Math.round(angle * 180 / Math.PI) % 360;
    return this.sinCache[index < 0 ? index + 360 : index];
  }

  fastCos(angle) {
    const index = Math.round(angle * 180 / Math.PI) % 360;
    return this.cosCache[index < 0 ? index + 360 : index];
  }
}
```

## 📈 Performance Profiling

### Chrome DevTools Profiling

```javascript
// Profile specific functions
console.time('entityUpdate');
this.updateEntities(deltaTime);
console.timeEnd('entityUpdate');

// Profile memory usage
if (performance.memory) {
  console.log('Memory:', performance.memory.usedJSHeapSize / 1048576 + ' MB');
}

// Use Performance API
performance.mark('update-start');
this.update(deltaTime);
performance.mark('update-end');
performance.measure('update', 'update-start', 'update-end');

const measure = performance.getEntriesByName('update')[0];
console.log(`Update took ${measure.duration}ms`);
```

### Custom Performance Benchmarks

```javascript
class PerformanceBenchmark {
  constructor() {
    this.tests = new Map();
  }

  addTest(name, testFunction) {
    this.tests.set(name, testFunction);
  }

  async runTests(iterations = 1000) {
    const results = {};

    for (const [name, testFunction] of this.tests) {
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await testFunction();
        const end = performance.now();
        times.push(end - start);
      }

      results[name] = {
        average: times.reduce((a, b) => a + b) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        median: this.calculateMedian(times)
      };
    }

    return results;
  }

  calculateMedian(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ?
      (values[mid - 1] + values[mid]) / 2 :
      values[mid];
  }
}

// Usage
const benchmark = new PerformanceBenchmark();

benchmark.addTest('entityCreation', async () => {
  const entity = new Entity('Test');
  entity.addComponent(new TransformComponent());
});

benchmark.addTest('componentUpdate', async () => {
  for (const entity of this.entities) {
    entity.update(0.016);
  }
});

const results = await benchmark.runTests(100);
console.log('Benchmark results:', results);
```

## 🎯 Optimization Checklist

### Rendering
- [ ] Use sprite batching
- [ ] Implement texture atlasing
- [ ] Add level-of-detail (LOD)
- [ ] Enable frustum culling
- [ ] Use efficient shaders

### Physics
- [ ] Implement spatial partitioning
- [ ] Use broad-phase collision detection
- [ ] Optimize narrow-phase checks
- [ ] Cache collision results
- [ ] Use simplified collision shapes

### Memory
- [ ] Implement object pooling
- [ ] Use typed arrays
- [ ] Avoid memory leaks
- [ ] Pool components and entities
- [ ] Clean up unused assets

### JavaScript
- [ ] Avoid object creation in loops
- [ ] Cache DOM queries
- [ ] Use efficient data structures
- [ ] Minimize function calls
- [ ] Pre-calculate expensive operations

### General
- [ ] Profile regularly
- [ ] Monitor frame rate
- [ ] Track memory usage
- [ ] Optimize asset loading
- [ ] Implement loading screens

This optimization guide provides comprehensive strategies for maintaining high performance in Rabbit-Raycast games. Regular profiling and optimization are essential for smooth gameplay across different devices and browsers.
