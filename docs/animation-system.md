# Animation System

Comprehensive guide to Rabbit-Raycast's tweening and animation system.

## 🎭 Tweening Basics

### What is Tweening?

Tweening (short for "in-betweening") is the process of generating intermediate frames between two keyframes to create smooth animation. Rabbit-Raycast provides a powerful tweening system with:

- **Multiple easing functions** for natural motion
- **Chaining and sequencing** for complex animations
- **Object pooling** for performance
- **Callback support** for animation events

### Basic Tween

```javascript
import { TweenManager, Easing } from '../ecs/Tweening.js';

// Create tween manager
const tweenManager = new TweenManager();

// Create a simple tween
const tween = tweenManager.create(
  player.transform,  // Target object
  1000,             // Duration in milliseconds
  Easing.bounceOut   // Easing function
);

// Animate position
tween.to('position.y', 300);

// Start the tween
tween.start();
```

## 🎨 Easing Functions

### Linear
```javascript
tween.ease(Easing.linear); // Constant speed
```

### Quadratic
```javascript
tween.ease(Easing.quadIn);    // Accelerate in
tween.ease(Easing.quadOut);   // Accelerate out
tween.ease(Easing.quadInOut); // Accelerate in and out
```

### Cubic
```javascript
tween.ease(Easing.cubicIn);    // Stronger acceleration
tween.ease(Easing.cubicOut);
tween.ease(Easing.cubicInOut);
```

### Elastic
```javascript
tween.ease(Easing.elasticIn);    // Bouncy start
tween.ease(Easing.elasticOut);   // Bouncy end
tween.ease(Easing.elasticInOut); // Bouncy both ends
```

### Bounce
```javascript
tween.ease(Easing.bounceIn);    // Bounce in
tween.ease(Easing.bounceOut);   // Bounce out
tween.ease(Easing.bounceInOut); // Bounce both
```

### Back
```javascript
tween.ease(Easing.backIn);    // Overshoot start
tween.ease(Easing.backOut);   // Overshoot end
tween.ease(Easing.backInOut); // Overshoot both
```

## 🎯 Tween Properties

### Targeting Properties

```javascript
// Transform properties
tween.to('position.x', 200);
tween.to('position.y', 150);
tween.to('rotation', Math.PI / 2);
tween.to('scale.x', 2.0);
tween.to('scale.y', 2.0);

// Sprite properties
tween.to('alpha', 0.5);
tween.to('color', '#ff0000');

// Custom properties
tween.to('customProperty', 42);
```

### Multiple Properties

```javascript
// Animate multiple properties simultaneously
const tween = tweenManager.create(entity, 2000, Easing.cubicOut);
tween.to('position.x', 400);
tween.to('position.y', 300);
tween.to('scale.x', 1.5);
tween.to('scale.y', 1.5);
tween.to('alpha', 0.8);
tween.start();
```

### From Values

```javascript
// Set starting values explicitly
const tween = tweenManager.create(entity, 1000, Easing.linear);
tween.from('position.x', 0);
tween.to('position.x', 200);
tween.start();

// This will animate from x=0 to x=200, regardless of current position
```

## 🔗 Chaining and Sequencing

### Method Chaining

```javascript
// Chain multiple animations
const tween = tweenManager.create(entity, 1000, Easing.bounceOut);
tween
  .to('position.y', 200)
  .chain(
    tweenManager.create(entity, 500, Easing.linear)
      .to('position.x', 300)
  )
  .start();
```

### Parallel Animations

```javascript
// Run multiple tweens simultaneously
const jumpTween = tweenManager.create(entity, 800, Easing.quadOut);
jumpTween.to('position.y', 150);

const fadeTween = tweenManager.create(entity.sprite, 800, Easing.linear);
fadeTween.to('alpha', 0.5);

// Start both at the same time
jumpTween.parallel(fadeTween);
jumpTween.start();
```

### Sequence Helper

```javascript
// Create a sequence of animations
const sequence = tweenManager.sequence(
  // First animation
  tweenManager.create(entity, 500, Easing.cubicOut)
    .to('scale.x', 1.2)
    .to('scale.y', 1.2),

  // Second animation (starts after first completes)
  tweenManager.create(entity, 300, Easing.bounceOut)
    .to('position.y', 100),

  // Third animation
  tweenManager.create(entity, 800, Easing.elasticOut)
    .to('rotation', Math.PI * 2)
);

sequence.start();
```

## 🎪 Advanced Features

### Callbacks

```javascript
const tween = tweenManager.create(entity, 2000, Easing.cubicOut);
tween.to('position.x', 400);

// Animation lifecycle callbacks
tween.on('start', () => {
  console.log('Animation started!');
  playSound('whoosh');
});

tween.on('update', (tween, progress, easedProgress) => {
  console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
  updateParticles(easedProgress);
});

tween.on('complete', () => {
  console.log('Animation finished!');
  createExplosionEffect();
});

tween.start();
```

### Looping

```javascript
// Simple loop
const bounceTween = tweenManager.create(entity, 1000, Easing.bounceOut);
bounceTween.to('position.y', 200);
bounceTween.setLoop(true); // Loop indefinitely
bounceTween.start();

// Limited loops
const pulseTween = tweenManager.create(entity, 500, Easing.sineInOut);
pulseTween.to('scale.x', 1.5);
pulseTween.to('scale.y', 1.5);
pulseTween.setLoop(true, 3); // Loop 3 times
pulseTween.start();
```

### Time Scale

```javascript
// Slow motion
tween.setTimeScale(0.5); // Half speed

// Fast forward
tween.setTimeScale(2.0); // Double speed

// Reverse
tween.setTimeScale(-1.0); // Play backwards
```

### Delay

```javascript
// Start animation after delay
const tween = tweenManager.create(entity, 1000, Easing.linear);
tween.setDelay(2000); // Wait 2 seconds before starting
tween.to('alpha', 1);
tween.start();
```

## 🎨 Sprite Animation

### Frame Animation

```javascript
// Create sprite with animation frames
const sprite = new SpriteComponent();
sprite.texture = spriteSheet;
sprite.width = 32;
sprite.height = 32;

// Add walking animation
sprite.addAnimation('walk', [0, 1, 2, 3], 0.15); // 15fps
sprite.addAnimation('run', [4, 5, 6, 7], 0.2);   // 20fps
sprite.addAnimation('jump', [8, 9], 0.1);         // 10fps

// Play animations
sprite.playAnimation('walk');
sprite.playAnimation('run');
sprite.playAnimation('jump', false); // Don't loop
```

### Animation States

```javascript
class AnimationController {
  constructor(entity) {
    this.entity = entity;
    this.sprite = entity.getComponent('SpriteComponent');
    this.currentState = 'idle';
    this.states = new Map();
  }

  addState(name, config) {
    this.states.set(name, {
      frames: config.frames,
      frameRate: config.frameRate || 0.1,
      loop: config.loop !== false,
      onComplete: config.onComplete
    });
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
      this.sprite.onAnimationComplete = state.onComplete;
    }
  }

  update() {
    // Update animation state based on entity state
    const velocity = this.entity.getComponent('PhysicsComponent').velocity;

    if (velocity.length() > 100) {
      this.setState('run');
    } else if (velocity.length() > 0) {
      this.setState('walk');
    } else {
      this.setState('idle');
    }
  }
}
```

## 🎪 Particle Systems

### Basic Particle Emitter

```javascript
class ParticleEmitter {
  constructor() {
    this.particles = [];
    this.emissionRate = 10; // particles per second
    this.lifetime = 2.0;    // seconds
    this.speed = 100;
    this.spread = Math.PI / 4; // 45 degrees
  }

  emit(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * this.spread;
      const velocity = {
        x: Math.cos(angle) * this.speed * (0.5 + Math.random()),
        y: Math.sin(angle) * this.speed * (0.5 + Math.random())
      };

      this.particles.push({
        x, y,
        vx: velocity.x,
        vy: velocity.y,
        life: this.lifetime,
        maxLife: this.lifetime,
        size: 5 + Math.random() * 5,
        alpha: 1.0
      });
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Update life
      particle.life -= deltaTime;

      // Update appearance
      particle.alpha = particle.life / particle.maxLife;

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
```

### Advanced Particle System

```javascript
class AdvancedParticleSystem extends Component {
  constructor(options = {}) {
    super('ParticleSystem');
    this.particles = [];
    this.maxParticles = options.maxParticles || 100;
    this.emissionRate = options.emissionRate || 10;
    this.lifetime = options.lifetime || 2.0;
    this.startSize = options.startSize || 10;
    this.endSize = options.endSize || 0;
    this.startColor = options.startColor || '#ffffff';
    this.endColor = options.endColor || '#000000';
    this.gravity = options.gravity || 0;
    this.emitting = false;
    this.timeAccumulator = 0;
  }

  start() {
    this.emitting = true;
  }

  stop() {
    this.emitting = false;
  }

  burst(count) {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      this.createParticle();
    }
  }

  createParticle() {
    const particle = {
      x: this.entity.transform.position.x,
      y: this.entity.transform.position.y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: this.lifetime,
      maxLife: this.lifetime,
      size: this.startSize,
      color: this.startColor,
      gravity: this.gravity
    };

    this.particles.push(particle);
  }

  update(deltaTime) {
    // Emit new particles
    if (this.emitting) {
      this.timeAccumulator += deltaTime;
      const particlesToEmit = Math.floor(this.timeAccumulator * this.emissionRate);

      for (let i = 0; i < particlesToEmit && this.particles.length < this.maxParticles; i++) {
        this.createParticle();
      }

      this.timeAccumulator -= particlesToEmit / this.emissionRate;
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Apply gravity
      particle.vy += particle.gravity * deltaTime;

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Update life
      particle.life -= deltaTime;

      // Interpolate properties
      const t = 1 - (particle.life / particle.maxLife);
      particle.size = this.startSize + (this.endSize - this.startSize) * t;

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;

      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
```

## 🎮 Animation Presets

### UI Animations

```javascript
class UIAnimations {
  static fadeIn(element, duration = 500) {
    return tweenManager.create(element, duration, Easing.sineOut)
      .from('alpha', 0)
      .to('alpha', 1);
  }

  static fadeOut(element, duration = 500) {
    return tweenManager.create(element, duration, Easing.sineOut)
      .from('alpha', 1)
      .to('alpha', 0);
  }

  static slideIn(element, direction = 'up', duration = 500) {
    const startY = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;
    const startX = direction === 'left' ? 50 : direction === 'right' ? -50 : 0;

    return tweenManager.create(element, duration, Easing.cubicOut)
      .from('position.y', element.position.y + startY)
      .from('position.x', element.position.x + startX)
      .from('alpha', 0)
      .to('alpha', 1);
  }

  static bounceIn(element, duration = 800) {
    return tweenManager.create(element, duration, Easing.bounceOut)
      .from('scale.x', 0)
      .from('scale.y', 0)
      .to('scale.x', 1)
      .to('scale.y', 1);
  }

  static shake(element, intensity = 10, duration = 500) {
    const originalX = element.position.x;
    const shakeTween = tweenManager.create(element, duration / 10, Easing.sineInOut);

    // Create shake sequence
    for (let i = 0; i < 10; i++) {
      const offset = (i % 2 === 0 ? 1 : -1) * intensity * (1 - i / 10);
      shakeTween.to('position.x', originalX + offset);
    }

    return shakeTween;
  }
}
```

### Game Object Animations

```javascript
class GameAnimations {
  static jump(entity, height = 100, duration = 600) {
    return tweenManager.create(entity.transform, duration, Easing.quadOut)
      .to('position.y', entity.transform.position.y + height)
      .chain(
        tweenManager.create(entity.transform, duration * 0.6, Easing.quadIn)
          .to('position.y', entity.transform.position.y)
      );
  }

  static teleport(entity, targetX, targetY, duration = 300) {
    return tweenManager.create(entity, duration, Easing.cubicInOut)
      .to('position.x', targetX)
      .to('position.y', targetY)
      .on('start', () => {
        // Play teleport effect
        createTeleportEffect(entity.transform.position);
      })
      .on('complete', () => {
        // Play arrival effect
        createTeleportEffect({ x: targetX, y: targetY });
      });
  }

  static damageFlash(entity, duration = 200) {
    const originalColor = entity.sprite.color;
    return tweenManager.create(entity.sprite, duration, Easing.sineInOut)
      .to('color', '#ff0000')
      .chain(
        tweenManager.create(entity.sprite, duration, Easing.sineInOut)
          .to('color', originalColor)
      );
  }

  static collectItem(item, target, duration = 800) {
    return tweenManager.create(item.transform, duration, Easing.cubicIn)
      .to('position.x', target.x)
      .to('position.y', target.y)
      .to('scale.x', 0)
      .to('scale.y', 0)
      .on('complete', () => {
        // Remove item and add to inventory
        item.destroy();
        inventory.addItem(item.itemData);
      });
  }
}
```

## ⚡ Performance Optimization

### Tween Pooling

```javascript
// Use pooled tweens for better performance
class OptimizedTweenManager extends TweenManager {
  constructor() {
    super();
    this.tweenPool = new ObjectPool(
      () => new Tween(null, 1000),
      (tween) => tween.reset(),
      50
    );
  }

  create(target, duration, easing = Easing.linear) {
    const tween = this.tweenPool.get();
    tween.target = target;
    tween.duration = duration;
    tween.easing = easing;
    return tween;
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Return completed tweens to pool
    for (const tween of this.tweens) {
      if (tween.completed) {
        this.tweenPool.release(tween);
      }
    }
  }
}
```

### Animation Culling

```javascript
class AnimationCullingSystem extends System {
  constructor(camera) {
    super('AnimationCullingSystem');
    this.camera = camera;
    this.cullDistance = 200;
  }

  processEntity(entity, deltaTime) {
    const transform = entity.getComponent('TransformComponent');
    const sprite = entity.getComponent('SpriteComponent');

    if (!transform || !sprite) return;

    // Check if entity is visible to camera
    const distance = this.camera.distanceTo(transform.position);

    if (distance > this.cullDistance) {
      // Pause animation for distant entities
      sprite.pauseAnimation();
    } else {
      // Resume animation for nearby entities
      sprite.resumeAnimation();
    }
  }
}
```

This animation system provides powerful tools for creating smooth, engaging animations in your Rabbit-Raycast games. The combination of tweening, sprite animation, and particle effects enables rich visual experiences with excellent performance.
