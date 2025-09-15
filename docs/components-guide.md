# Components Guide

Comprehensive guide to all available components in Rabbit-Raycast's ECS system.

## 🧩 Core Components

### TransformComponent

**Purpose**: Handles position, rotation, and scale transformations for entities.

**Required Components**: None

**Common Usage**:
```javascript
// Basic transform
const transform = new TransformComponent({ x: 100, y: 200 }, 0, { x: 1, y: 1 });
entity.addComponent(transform);

// Movement
transform.translate(10, 0);
transform.setPosition(150, 250);

// Rotation
transform.rotate(Math.PI / 4);
transform.lookAt(300, 200);

// Scaling
transform.scaleBy(1.5, 1.5);
transform.setScale(2, 2);
```

**Properties**:
- `position`: `{x, y, z}` - Entity position
- `rotation`: `number` - Rotation in radians
- `scale`: `{x, y, z}` - Scale factors
- `matrixDirty`: `boolean` - Whether matrices need updating

**Methods**:
- `setPosition(x, y, z?)` - Set position
- `translate(dx, dy, dz?)` - Move by offset
- `setRotation(rotation)` - Set rotation
- `rotate(angle)` - Rotate by angle
- `setScale(x, y, z?)` - Set scale
- `scaleBy(factorX, factorY, factorZ?)` - Scale by factor
- `getForward()` - Get forward vector
- `getRight()` - Get right vector
- `getUp()` - Get up vector
- `lookAt(targetX, targetY)` - Face target position
- `distanceTo(other)` - Get distance to another transform
- `interpolate(target, t)` - Interpolate between transforms

---

### SpriteComponent

**Purpose**: Handles 2D sprite rendering and animation.

**Required Components**: `TransformComponent`

**Common Usage**:
```javascript
// Basic sprite
const sprite = new SpriteComponent();
sprite.texture = await loadTexture('/assets/player.png');
sprite.width = 32;
sprite.height = 32;
entity.addComponent(sprite);

// Animation
sprite.addAnimation('walk', [0, 1, 2, 3], 0.1);
sprite.playAnimation('walk');

// Visual properties
sprite.setColor('#ff0000');
sprite.setAlpha(0.8);
sprite.setLayer(1);
```

**Properties**:
- `texture`: `Image|Canvas` - Sprite texture
- `width`: `number` - Sprite width
- `height`: `number` - Sprite height
- `pivotX`: `number` - X pivot point (0-1)
- `pivotY`: `number` - Y pivot point (0-1)
- `color`: `string` - Tint color
- `alpha`: `number` - Opacity (0-1)
- `visible`: `boolean` - Visibility
- `layer`: `number` - Rendering layer
- `sortingOrder`: `number` - Sort order within layer
- `blendMode`: `string` - Canvas blend mode

**Methods**:
- `setTexture(texture)` - Set sprite texture
- `setSize(width, height)` - Set sprite dimensions
- `setPivot(x, y)` - Set pivot point
- `setColor(color)` - Set tint color
- `setAlpha(alpha)` - Set opacity
- `setLayer(layer)` - Set rendering layer
- `setSortingOrder(order)` - Set sort order
- `setBlendMode(mode)` - Set blend mode
- `addAnimation(name, frames, frameRate)` - Add animation
- `playAnimation(name, restart?)` - Play animation
- `stopAnimation()` - Stop current animation
- `pauseAnimation()` - Pause animation
- `resumeAnimation()` - Resume animation

---

### PhysicsComponent

**Purpose**: Handles physics simulation, collision detection, and rigid body dynamics.

**Required Components**: `TransformComponent`

**Common Usage**:
```javascript
// Basic physics body
const physics = new PhysicsComponent({
  mass: 1.0,
  velocity: { x: 0, y: 0 },
  collider: { type: 'circle', radius: 16 }
});
entity.addComponent(physics);

// Apply forces
physics.applyForce({ x: 10, y: 0 }, 100); // Force for 100ms
physics.applyImpulse({ x: 0, y: -5 }); // Instant impulse

// Collision setup
physics.setCollisionLayer('player');
physics.setCollisionMask(['enemy', 'platform']);
physics.setTrigger(false); // Solid collision
```

**Properties**:
- `mass`: `number` - Object mass
- `velocity`: `{x, y, z}` - Current velocity
- `acceleration`: `{x, y, z}` - Current acceleration
- `angularVelocity`: `number` - Rotational velocity
- `drag`: `number` - Linear drag coefficient
- `angularDrag`: `number` - Angular drag coefficient
- `gravity`: `number` - Gravity strength
- `bounce`: `number` - Bounciness (0-1)
- `friction`: `number` - Surface friction
- `collider`: `object` - Collision shape definition
- `collisionLayer`: `string` - Collision layer
- `collisionMask`: `string[]` - Layers this object collides with
- `isTrigger`: `boolean` - Whether this is a trigger volume
- `isStatic`: `boolean` - Whether this object doesn't move
- `isKinematic`: `boolean` - Whether this object is kinematic
- `isGrounded`: `boolean` - Whether object is on ground
- `colliding`: `Set<Entity>` - Currently colliding entities

**Methods**:
- `setVelocity(x, y, z?)` - Set velocity
- `addVelocity(dx, dy, dz?)` - Add to velocity
- `applyForce(force, duration?, name?)` - Apply force
- `applyImpulse(impulse)` - Apply instant impulse
- `setCollider(type, options?)` - Set collision shape
- `setCollisionLayer(layer)` - Set collision layer
- `setCollisionMask(mask)` - Set collision mask
- `setTrigger(isTrigger)` - Set as trigger
- `setStatic(isStatic)` - Set as static
- `setKinematic(isKinematic)` - Set as kinematic
- `stop()` - Stop all movement

---

### AudioComponent

**Purpose**: Handles spatial audio, sound effects, and background music.

**Required Components**: `TransformComponent` (for spatial audio)

**Common Usage**:
```javascript
// Basic audio
const audio = new AudioComponent({
  volume: 0.8,
  spatial: true,
  maxDistance: 100
});
entity.addComponent(audio);

// Load and play sound
await audio.loadSound('jump', '/assets/jump.wav');
audio.play();

// Spatial audio setup
audio.setSpatial(true);
audio.setRange(10, 200); // Min/max distance
audio.setRolloffFactor(1.0);

// Effects
audio.addEffect('lowpass', { frequency: 1000 });
audio.fadeIn(1000); // Fade in over 1 second
```

**Properties**:
- `volume`: `number` - Audio volume (0-1)
- `pitch`: `number` - Audio pitch multiplier
- `loop`: `boolean` - Whether to loop
- `spatial`: `boolean` - Whether to use 3D spatial audio
- `minDistance`: `number` - Minimum spatial distance
- `maxDistance`: `number` - Maximum spatial distance
- `rolloffFactor`: `number` - Distance rolloff factor
- `currentSound`: `string` - Currently playing sound
- `playing`: `boolean` - Whether audio is playing
- `muted`: `boolean` - Whether audio is muted

**Methods**:
- `setSound(soundName, engine)` - Set audio source
- `loadSound(assetKey, engine)` - Load sound from asset manager
- `play(options?)` - Play current sound
- `stop()` - Stop current sound
- `pause()` - Pause current sound
- `resume()` - Resume paused sound
- `setVolume(volume, fadeDuration?)` - Set volume with optional fade
- `setPitch(pitch)` - Set pitch
- `setLoop(loop)` - Set loop mode
- `setMuted(muted)` - Mute/unmute
- `setSpatial(enabled)` - Enable/disable spatial audio
- `setRange(minDistance, maxDistance)` - Set spatial range
- `playSpatial(options?)` - Play with spatial positioning
- `queueSound(soundName, delay?)` - Queue sound for later playback
- `addEffect(type, options?)` - Add audio effect
- `removeEffect(type)` - Remove audio effect
- `fadeIn(duration?)` - Fade audio in
- `fadeOut(duration?)` - Fade audio out

---

## 🎮 Game-Specific Components

### HealthComponent

**Purpose**: Manages entity health, damage, and healing.

**Required Components**: None

**Common Usage**:
```javascript
const health = new HealthComponent(100);
health.maxHealth = 150;
entity.addComponent(health);

// Take damage
health.takeDamage(25);

// Heal
health.heal(10);

// Check status
if (health.isDead()) {
  // Handle death
}
```

**Properties**:
- `maxHealth`: `number` - Maximum health
- `currentHealth`: `number` - Current health
- `invulnerable`: `boolean` - Whether entity is invulnerable
- `invulnerabilityTime`: `number` - Invulnerability duration
- `regenerationRate`: `number` - Health regeneration per second

**Methods**:
- `takeDamage(amount)` - Apply damage
- `heal(amount)` - Restore health
- `setHealth(amount)` - Set health directly
- `isDead()` - Check if health is zero
- `isFullHealth()` - Check if at max health
- `getHealthPercentage()` - Get health as percentage

---

### InventoryComponent

**Purpose**: Manages entity inventory and items.

**Required Components**: None

**Common Usage**:
```javascript
const inventory = new InventoryComponent();
inventory.maxItems = 20;
entity.addComponent(inventory);

// Add items
inventory.addItem({ id: 'sword', name: 'Iron Sword' }, 1);
inventory.addItem({ id: 'potion', name: 'Health Potion' }, 5);

// Use items
const potion = inventory.findItem('potion');
if (potion && inventory.removeItem('potion', 1)) {
  // Use potion
}

// Check inventory
console.log(`Items: ${inventory.getItemCount()}/${inventory.maxItems}`);
```

**Properties**:
- `items`: `Map<string, object>` - Item storage
- `maxItems`: `number` - Maximum item capacity
- `totalWeight`: `number` - Total weight of all items
- `maxWeight`: `number` - Maximum weight capacity

**Methods**:
- `addItem(item, quantity?)` - Add item to inventory
- `removeItem(itemId, quantity?)` - Remove item from inventory
- `findItem(itemId)` - Find item by ID
- `hasItem(itemId, quantity?)` - Check if item exists
- `getItemCount(itemId?)` - Get item count
- `isFull()` - Check if inventory is full
- `clear()` - Clear all items

---

### AIComponent

**Purpose**: Handles AI behavior and decision making.

**Required Components**: `TransformComponent`

**Common Usage**:
```javascript
const ai = new AIComponent();
ai.behavior = 'patrol';
ai.speed = 50;
ai.detectionRange = 100;
ai.attackRange = 20;
entity.addComponent(ai);

// Set patrol points
ai.patrolPoints = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 }
];

// Set target
ai.target = playerEntity;

// Change behavior
ai.setBehavior('chase');
```

**Properties**:
- `behavior`: `string` - Current AI behavior
- `speed`: `number` - Movement speed
- `detectionRange`: `number` - How far AI can detect targets
- `attackRange`: `number` - How close AI needs to be to attack
- `target`: `Entity` - Current target entity
- `state`: `string` - Current AI state
- `lastSeenTarget`: `object` - Last known target position
- `patrolPoints`: `object[]` - Patrol waypoints

**Methods**:
- `setBehavior(behavior)` - Change AI behavior
- `setTarget(target)` - Set target entity
- `clearTarget()` - Clear current target
- `isTargetVisible()` - Check if target is visible
- `getDistanceToTarget()` - Get distance to target
- `moveTo(position)` - Move towards position
- `attack(target)` - Perform attack

---

### WeaponComponent

**Purpose**: Manages weapon functionality and combat.

**Required Components**: None

**Common Usage**:
```javascript
const weapon = new WeaponComponent();
weapon.damage = 25;
weapon.range = 50;
weapon.fireRate = 2; // shots per second
weapon.ammo = 30;
weapon.maxAmmo = 30;
entity.addComponent(weapon);

// Fire weapon
if (weapon.canFire()) {
  weapon.fire(target);
}

// Reload
weapon.reload();

// Check ammo
if (weapon.isOutOfAmmo()) {
  // Handle out of ammo
}
```

**Properties**:
- `damage`: `number` - Base damage
- `range`: `number` - Attack range
- `fireRate`: `number` - Shots per second
- `ammo`: `number` - Current ammo
- `maxAmmo`: `number` - Maximum ammo
- `reloadTime`: `number` - Reload duration
- `accuracy`: `number` - Weapon accuracy (0-1)
- `recoil`: `number` - Weapon recoil
- `type`: `string` - Weapon type ('melee', 'ranged', 'magic')

**Methods**:
- `fire(target?)` - Fire weapon
- `canFire()` - Check if weapon can fire
- `reload()` - Reload weapon
- `isReloading()` - Check if reloading
- `isOutOfAmmo()` - Check if out of ammo
- `addAmmo(amount)` - Add ammo
- `setDamage(damage)` - Set weapon damage

---

## 🎨 Visual Components

### ParticleEmitterComponent

**Purpose**: Creates and manages particle effects.

**Required Components**: `TransformComponent`

**Common Usage**:
```javascript
const emitter = new ParticleEmitterComponent();
emitter.particleCount = 50;
emitter.emissionRate = 10; // particles per second
emitter.lifetime = 2.0; // seconds
emitter.startColor = '#ffffff';
emitter.endColor = '#000000';
emitter.startSize = 5;
emitter.endSize = 0;
entity.addComponent(emitter);

// Configure emission
emitter.setShape('circle', { radius: 10 });
emitter.setVelocity({ x: 0, y: -50 }, 20); // speed variation

// Control emission
emitter.play();
emitter.pause();
emitter.stop();
```

**Properties**:
- `particleCount`: `number` - Maximum particles
- `emissionRate`: `number` - Particles per second
- `lifetime`: `number` - Particle lifetime
- `startColor`: `string` - Initial particle color
- `endColor`: `string` - Final particle color
- `startSize`: `number` - Initial particle size
- `endSize`: `number` - Final particle size
- `gravity`: `number` - Particle gravity
- `playing`: `boolean` - Whether emitter is active

**Methods**:
- `setShape(shape, options?)` - Set emission shape
- `setVelocity(baseVelocity, variation?)` - Set particle velocity
- `setColor(startColor, endColor)` - Set particle colors
- `setSize(startSize, endSize)` - Set particle size
- `play()` - Start emission
- `pause()` - Pause emission
- `stop()` - Stop emission and clear particles
- `burst(count)` - Emit specific number of particles

---

### AnimationComponent

**Purpose**: Handles complex animations and state machines.

**Required Components**: `SpriteComponent`

**Common Usage**:
```javascript
const animation = new AnimationComponent();
entity.addComponent(animation);

// Add animation states
animation.addState('idle', {
  frames: [0, 1, 2],
  frameRate: 0.2,
  loop: true
});

animation.addState('walk', {
  frames: [3, 4, 5, 6],
  frameRate: 0.15,
  loop: true
});

animation.addState('attack', {
  frames: [7, 8, 9],
  frameRate: 0.1,
  loop: false,
  onComplete: () => animation.setState('idle')
});

// Add transitions
animation.addTransition('idle', 'walk', () => entity.velocity.length() > 0);
animation.addTransition('walk', 'idle', () => entity.velocity.length() === 0);
animation.addTransition('any', 'attack', () => input.isActionActive('attack'));

// Set initial state
animation.setState('idle');
```

**Properties**:
- `currentState`: `string` - Current animation state
- `states`: `Map<string, object>` - Animation states
- `transitions`: `Map<string, object>` - State transitions
- `playing`: `boolean` - Whether animation is playing
- `speed`: `number` - Animation speed multiplier

**Methods**:
- `addState(name, config)` - Add animation state
- `removeState(name)` - Remove animation state
- `setState(name)` - Change current state
- `addTransition(fromState, toState, condition)` - Add state transition
- `play()` - Start animation
- `pause()` - Pause animation
- `stop()` - Stop animation
- `setSpeed(speed)` - Set animation speed

---

## 🔧 Utility Components

### TimerComponent

**Purpose**: Provides timer functionality to entities.

**Required Components**: None

**Common Usage**:
```javascript
const timer = new TimerComponent();
entity.addComponent(timer);

// Create timers
timer.createTimer(() => {
  console.log('Timer fired!');
}, 1000, { repeat: true });

// Create countdown
timer.createTimer(() => {
  console.log('Countdown finished!');
}, 5000, {
  onUpdate: (remaining) => console.log(`${remaining}ms remaining`)
});
```

**Properties**:
- `timers`: `Set<Timer>` - Active timers

**Methods**:
- `createTimer(callback, delay, options?)` - Create new timer
- `stopAll()` - Stop all timers

---

### SignalComponent

**Purpose**: Adds event signaling capabilities to entities.

**Required Components**: None

**Common Usage**:
```javascript
const signals = new SignalComponent();
entity.addComponent(signals);

// Listen for signals
signals.connect('damaged', (damage) => {
  console.log(`Took ${damage} damage`);
});

// Emit signals
signals.emit('damaged', 25);
```

**Properties**:
- `signals`: `Map<string, Signal>` - Signal storage

**Methods**:
- `addSignal(name)` - Add new signal
- `emit(name, ...args)` - Emit signal
- `connect(name, listener, context?, priority?)` - Connect listener
- `disconnect(name, id)` - Disconnect listener

---

## 🛠️ Creating Custom Components

### Basic Custom Component

```javascript
import { Component } from '../ecs/ECS.js';

export class CustomComponent extends Component {
  constructor(options = {}) {
    super('CustomComponent');

    // Initialize properties
    this.value = options.value || 0;
    this.enabled = options.enabled !== false;
  }

  // Called when component is added to entity
  onAttach(entity) {
    console.log(`CustomComponent attached to ${entity.name}`);
  }

  // Called when component is removed from entity
  onDetach() {
    console.log(`CustomComponent detached from ${entity.name}`);
  }

  // Called every frame if component is enabled
  update(deltaTime) {
    if (this.enabled) {
      this.value += deltaTime;
    }
  }

  // Called during rendering
  render(renderer) {
    // Custom rendering logic
  }

  // Custom methods
  doSomething() {
    console.log(`Doing something with value: ${this.value}`);
  }

  // Get component statistics
  getStats() {
    return {
      ...super.getStats(),
      value: this.value,
      enabled: this.enabled
    };
  }
}
```

### Advanced Custom Component

```javascript
export class AdvancedComponent extends Component {
  constructor(options = {}) {
    super('AdvancedComponent');

    // Complex initialization
    this.data = new Map();
    this.listeners = new Set();
    this.state = 'idle';

    // Initialize from options
    Object.assign(this, options);
  }

  // Lifecycle methods
  onAttach(entity) {
    // Register with systems
    entity.scene?.registerComponent(this);

    // Set up event listeners
    this.setupEventListeners();
  }

  onDetach() {
    // Clean up
    this.cleanupEventListeners();

    // Unregister from systems
    this.entity.scene?.unregisterComponent(this);
  }

  // State management
  setState(newState) {
    const oldState = this.state;
    this.state = newState;

    // Notify listeners
    this.notifyStateChange(oldState, newState);
  }

  // Event handling
  setupEventListeners() {
    // Listen for entity events
    this.entity.connect('destroyed', () => this.onEntityDestroyed());
  }

  cleanupEventListeners() {
    // Clean up event listeners
    this.listeners.clear();
  }

  // Data management
  setData(key, value) {
    const oldValue = this.data.get(key);
    this.data.set(key, value);

    // Emit change event
    this.emit('dataChanged', { key, oldValue, newValue: value });
  }

  getData(key) {
    return this.data.get(key);
  }

  // Utility methods
  isActive() {
    return this.enabled && this.entity?.enabled;
  }

  reset() {
    this.data.clear();
    this.state = 'idle';
    this.enabled = true;
  }

  // Serialization
  toJSON() {
    return {
      type: this.getType(),
      enabled: this.enabled,
      state: this.state,
      data: Object.fromEntries(this.data)
    };
  }

  fromJSON(json) {
    this.enabled = json.enabled;
    this.state = json.state;
    this.data = new Map(Object.entries(json.data));
  }
}
```

## 📋 Component Best Practices

### Design Principles

1. **Single Responsibility**: Each component should have one clear purpose
2. **Minimal Dependencies**: Avoid tight coupling between components
3. **Data-Driven**: Keep logic in systems, data in components
4. **Serializable**: Design components that can be saved/loaded
5. **Performance Conscious**: Be mindful of memory usage and update frequency

### Naming Conventions

- Use `PascalCase` for component class names
- End with `Component` (e.g., `HealthComponent`, `PhysicsComponent`)
- Use descriptive names that clearly indicate purpose

### Property Guidelines

- Use primitive types when possible (`number`, `string`, `boolean`)
- Prefer objects for related properties (`{x, y, z}` for position)
- Use `Map` and `Set` for collections
- Provide sensible defaults for all properties

### Method Guidelines

- Keep methods focused and single-purpose
- Use descriptive names that indicate action
- Return values when appropriate
- Throw errors for invalid operations
- Document complex logic with comments

### Performance Considerations

- Avoid creating objects in `update()` methods
- Use object pooling for frequently created objects
- Cache expensive calculations when possible
- Minimize DOM manipulation in render methods

This guide covers the core components available in Rabbit-Raycast. The modular ECS architecture makes it easy to create custom components for specific game requirements.
