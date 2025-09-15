/**
 * Tweening System
 *
 * Smooth animation and transition system for entities and properties.
 * Supports various easing functions and animation sequences.
 */

/**
 * Easing Functions
 *
 * Mathematical functions for smooth transitions.
 */
export const Easing = {
  // Linear
  linear: (t) => t,

  // Quadratic
  quadIn: (t) => t * t,
  quadOut: (t) => t * (2 - t),
  quadInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  cubicIn: (t) => t * t * t,
  cubicOut: (t) => (--t) * t * t + 1,
  cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic
  quartIn: (t) => t * t * t * t,
  quartOut: (t) => 1 - (--t) * t * t * t,
  quartInOut: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quintic
  quintIn: (t) => t * t * t * t * t,
  quintOut: (t) => 1 + (--t) * t * t * t * t,
  quintInOut: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sine
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  expoIn: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  expoOut: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  expoInOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circular
  circIn: (t) => 1 - Math.sqrt(1 - t * t),
  circOut: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
  circInOut: (t) => {
    if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
    return (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
  },

  // Elastic
  elasticIn: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  elasticOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  elasticInOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    t *= 2;
    if (t < 1) return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  },

  // Back
  backIn: (t) => t * t * (2.70158 * t - 1.70158),
  backOut: (t) => 1 + (--t) * t * (2.70158 * t + 1.70158),
  backInOut: (t) => {
    const s = 2.70158 * 1.525;
    if (t < 0.5) return (t * t * ((s + 1) * 2 * t - s)) / 2;
    return (t -= 2, t * t * ((s + 1) * 2 * t + s) + 2) / 2;
  },

  // Bounce
  bounceIn: (t) => 1 - Easing.bounceOut(1 - t),
  bounceOut: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  bounceInOut: (t) => t < 0.5 ? Easing.bounceIn(t * 2) * 0.5 : Easing.bounceOut(t * 2 - 1) * 0.5 + 0.5
};

/**
 * Tween Class
 *
 * Represents a single tween animation.
 */
export class Tween {
  constructor(target, duration, easing = Easing.linear) {
    this.target = target;
    this.duration = duration;
    this.easing = easing;
    this.elapsed = 0;
    this.progress = 0;
    this.active = false;
    this.paused = false;
    this.completed = false;

    // Properties to animate
    this.properties = new Map();
    this.startValues = new Map();
    this.endValues = new Map();

    // Callbacks
    this.onStart = null;
    this.onUpdate = null;
    this.onComplete = null;
    this.onPause = null;
    this.onResume = null;

    // Chaining
    this.next = null;
    this.parallel = [];

    // Loop
    this.loop = false;
    this.loopCount = 0;
    this.maxLoops = -1; // -1 = infinite

    // Delay
    this.delay = 0;
    this.delayElapsed = 0;
  }

  /**
   * Set target property to animate
   */
  to(property, endValue) {
    this.properties.set(property, property);
    this.endValues.set(property, endValue);
    return this;
  }

  /**
   * Set starting value for property
   */
  from(property, startValue) {
    this.startValues.set(property, startValue);
    return this;
  }

  /**
   * Set easing function
   */
  ease(easing) {
    this.easing = easing;
    return this;
  }

  /**
   * Set delay before starting
   */
  setDelay(delay) {
    this.delay = delay;
    return this;
  }

  /**
   * Set loop mode
   */
  setLoop(loop = true, maxLoops = -1) {
    this.loop = loop;
    this.maxLoops = maxLoops;
    return this;
  }

  /**
   * Chain another tween
   */
  chain(nextTween) {
    this.next = nextTween;
    return this;
  }

  /**
   * Add parallel tween
   */
  parallel(tween) {
    this.parallel.push(tween);
    return this;
  }

  /**
   * Set callback functions
   */
  on(event, callback) {
    switch (event) {
      case 'start':
        this.onStart = callback;
        break;
      case 'update':
        this.onUpdate = callback;
        break;
      case 'complete':
        this.onComplete = callback;
        break;
      case 'pause':
        this.onPause = callback;
        break;
      case 'resume':
        this.onResume = callback;
        break;
    }
    return this;
  }

  /**
   * Start the tween
   */
  start() {
    if (this.active) return this;

    // Capture start values
    for (const [property] of this.properties) {
      if (!this.startValues.has(property)) {
        const value = this.getPropertyValue(property);
        this.startValues.set(property, value);
      }
    }

    this.active = true;
    this.paused = false;
    this.completed = false;
    this.elapsed = 0;
    this.progress = 0;

    if (this.onStart) {
      this.onStart(this);
    }

    return this;
  }

  /**
   * Pause the tween
   */
  pause() {
    if (!this.active || this.paused) return this;

    this.paused = true;

    if (this.onPause) {
      this.onPause(this);
    }

    return this;
  }

  /**
   * Resume the tween
   */
  resume() {
    if (!this.active || !this.paused) return this;

    this.paused = false;

    if (this.onResume) {
      this.onResume(this);
    }

    return this;
  }

  /**
   * Stop the tween
   */
  stop() {
    this.active = false;
    this.paused = false;
    this.completed = true;
    return this;
  }

  /**
   * Reset the tween
   */
  reset() {
    this.elapsed = 0;
    this.progress = 0;
    this.active = false;
    this.paused = false;
    this.completed = false;
    this.delayElapsed = 0;
    return this;
  }

  /**
   * Update the tween
   */
  update(deltaTime) {
    if (!this.active || this.paused || this.completed) return;

    // Handle delay
    if (this.delay > 0 && this.delayElapsed < this.delay) {
      this.delayElapsed += deltaTime;
      return;
    }

    // Update elapsed time
    this.elapsed += deltaTime;
    this.progress = Math.min(this.elapsed / this.duration, 1.0);

    // Apply easing
    const easedProgress = this.easing(this.progress);

    // Update properties
    for (const [property] of this.properties) {
      const startValue = this.startValues.get(property);
      const endValue = this.endValues.get(property);

      const currentValue = this.interpolateValue(startValue, endValue, easedProgress);
      this.setPropertyValue(property, currentValue);
    }

    // Call update callback
    if (this.onUpdate) {
      this.onUpdate(this, this.progress, easedProgress);
    }

    // Check completion
    if (this.progress >= 1.0) {
      // Handle looping
      if (this.loop && (this.maxLoops === -1 || this.loopCount < this.maxLoops)) {
        this.loopCount++;
        this.elapsed = 0;
        this.progress = 0;
        this.delayElapsed = 0;

        // Call complete callback for loop
        if (this.onComplete) {
          this.onComplete(this);
        }
      } else {
        this.completed = true;
        this.active = false;

        // Call completion callback
        if (this.onComplete) {
          this.onComplete(this);
        }

        // Start chained tween
        if (this.next) {
          this.next.start();
        }

        // Start parallel tweens
        for (const tween of this.parallel) {
          tween.start();
        }
      }
    }
  }

  /**
   * Get property value from target
   */
  getPropertyValue(property) {
    const parts = property.split('.');
    let value = this.target;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set property value on target
   */
  setPropertyValue(property, value) {
    const parts = property.split('.');
    let obj = this.target;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!obj[part] || typeof obj[part] !== 'object') {
        obj[part] = {};
      }
      obj = obj[part];
    }

    obj[parts[parts.length - 1]] = value;
  }

  /**
   * Interpolate between two values
   */
  interpolateValue(start, end, t) {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * t;
    }

    if (Array.isArray(start) && Array.isArray(end)) {
      const result = [];
      for (let i = 0; i < Math.min(start.length, end.length); i++) {
        result[i] = this.interpolateValue(start[i], end[i], t);
      }
      return result;
    }

    if (typeof start === 'object' && typeof end === 'object' && start !== null && end !== null) {
      const result = {};
      const keys = new Set([...Object.keys(start), ...Object.keys(end)]);

      for (const key of keys) {
        const startVal = start[key];
        const endVal = end[key];

        if (startVal !== undefined && endVal !== undefined) {
          result[key] = this.interpolateValue(startVal, endVal, t);
        } else if (startVal !== undefined) {
          result[key] = startVal;
        } else {
          result[key] = endVal;
        }
      }

      return result;
    }

    // For non-interpolatable values, use end value
    return end;
  }

  /**
   * Get tween statistics
   */
  getStats() {
    return {
      active: this.active,
      paused: this.paused,
      completed: this.completed,
      progress: this.progress,
      elapsed: this.elapsed,
      duration: this.duration,
      delay: this.delay,
      delayElapsed: this.delayElapsed,
      loop: this.loop,
      loopCount: this.loopCount,
      maxLoops: this.maxLoops,
      propertyCount: this.properties.size,
      hasNext: !!this.next,
      parallelCount: this.parallel.length
    };
  }
}

/**
 * Tween Manager
 *
 * Manages multiple tweens and provides factory methods.
 */
export class TweenManager {
  constructor() {
    this.tweens = new Set();
    this.pools = new Map();
    this.poolSize = 50;
  }

  /**
   * Create a new tween
   */
  create(target, duration = 1000, easing = Easing.linear) {
    let tween;

    // Try to get from pool
    const pool = this.getPool();
    if (pool.length > 0) {
      tween = pool.pop();
      tween.target = target;
      tween.duration = duration;
      tween.easing = easing;
      tween.reset();
    } else {
      tween = new Tween(target, duration, easing);
    }

    this.tweens.add(tween);
    return tween;
  }

  /**
   * Create tween from pool
   */
  getPool() {
    if (!this.pools.has('tween')) {
      this.pools.set('tween', []);
    }
    return this.pools.get('tween');
  }

  /**
   * Update all tweens
   */
  update(deltaTime) {
    for (const tween of this.tweens) {
      tween.update(deltaTime);

      // Remove completed tweens
      if (tween.completed) {
        this.tweens.delete(tween);

        // Return to pool
        const pool = this.getPool();
        if (pool.length < this.poolSize) {
          tween.reset();
          pool.push(tween);
        }
      }
    }
  }

  /**
   * Stop all tweens
   */
  stopAll() {
    for (const tween of this.tweens) {
      tween.stop();
    }
    this.tweens.clear();
  }

  /**
   * Pause all tweens
   */
  pauseAll() {
    for (const tween of this.tweens) {
      tween.pause();
    }
  }

  /**
   * Resume all tweens
   */
  resumeAll() {
    for (const tween of this.tweens) {
      tween.resume();
    }
  }

  /**
   * Get tweens for target
   */
  getTweensFor(target) {
    return Array.from(this.tweens).filter(tween => tween.target === target);
  }

  /**
   * Stop tweens for target
   */
  stopTweensFor(target) {
    const tweens = this.getTweensFor(target);
    for (const tween of tweens) {
      tween.stop();
      this.tweens.delete(tween);
    }
  }

  /**
   * Create common tween patterns
   */
  fadeIn(target, duration = 500, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('alpha', 1)
      .from('alpha', 0);
  }

  fadeOut(target, duration = 500, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('alpha', 0)
      .from('alpha', 1);
  }

  moveTo(target, x, y, z = 0, duration = 1000, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('position.x', x)
      .to('position.y', y)
      .to('position.z', z);
  }

  scaleTo(target, x, y, z = 1, duration = 1000, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('scale.x', x)
      .to('scale.y', y)
      .to('scale.z', z);
  }

  rotateTo(target, rotation, duration = 1000, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('rotation', rotation);
  }

  colorTo(target, color, duration = 1000, easing = Easing.linear) {
    return this.create(target, duration, easing)
      .to('color', color);
  }

  /**
   * Create sequence of tweens
   */
  sequence(...tweens) {
    for (let i = 0; i < tweens.length - 1; i++) {
      tweens[i].chain(tweens[i + 1]);
    }
    return tweens[0];
  }

  /**
   * Create parallel tweens
   */
  parallel(...tweens) {
    const mainTween = tweens[0];
    for (let i = 1; i < tweens.length; i++) {
      mainTween.parallel(tweens[i]);
    }
    return mainTween;
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      activeTweens: this.tweens.size,
      poolSize: this.poolSize,
      pooledTweens: this.getPool().length
    };
  }
}

/**
 * Tween Component
 *
 * Component that manages tweens for an entity.
 */
import { Component } from './ECS.js';

export class TweenComponent extends Component {
  constructor() {
    super('TweenComponent');
    this.tweens = new Set();
    this.tweenManager = new TweenManager();
  }

  /**
   * Create tween for entity
   */
  createTween(duration = 1000, easing = Easing.linear) {
    const tween = this.tweenManager.create(this.entity, duration, easing);
    this.tweens.add(tween);
    return tween;
  }

  /**
   * Update component
   */
  update(deltaTime) {
    this.tweenManager.update(deltaTime);

    // Remove completed tweens
    for (const tween of this.tweens) {
      if (tween.completed) {
        this.tweens.delete(tween);
      }
    }
  }

  /**
   * Stop all tweens
   */
  stopAll() {
    this.tweenManager.stopAll();
    this.tweens.clear();
  }

  /**
   * Get tween statistics
   */
  getStats() {
    return {
      activeTweens: this.tweens.size,
      ...this.tweenManager.getStats()
    };
  }
}
