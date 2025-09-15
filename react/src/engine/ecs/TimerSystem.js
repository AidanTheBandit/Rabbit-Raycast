/**
 * Timer System
 *
 * Manages scheduled events, delays, and timed callbacks.
 * Supports one-time and repeating timers with various timing modes.
 */

/**
 * Timer Class
 *
 * Represents a single timer instance.
 */
export class Timer {
  constructor(callback, delay, options = {}) {
    this.callback = callback;
    this.delay = delay;
    this.elapsed = 0;
    this.active = false;
    this.paused = false;
    this.completed = false;

    // Options
    this.repeat = options.repeat || false;
    this.repeatCount = 0;
    this.maxRepeats = options.maxRepeats || -1; // -1 = infinite
    this.userData = options.userData || null;
    this.timeScale = options.timeScale || 1.0;
    this.onStart = options.onStart || null;
    this.onComplete = options.onComplete || null;
    this.onRepeat = options.onRepeat || null;

    // Internal
    this.id = Timer.nextId++;
    this.startTime = 0;
    this.pauseTime = 0;
  }

  /**
   * Static ID counter
   */
  static nextId = 1;

  /**
   * Start the timer
   */
  start() {
    if (this.active) return this;

    this.active = true;
    this.paused = false;
    this.completed = false;
    this.elapsed = 0;
    this.repeatCount = 0;
    this.startTime = Date.now();

    if (this.onStart) {
      this.onStart(this);
    }

    return this;
  }

  /**
   * Stop the timer
   */
  stop() {
    this.active = false;
    this.paused = false;
    this.completed = true;
    return this;
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.active || this.paused) return this;
    this.paused = true;
    this.pauseTime = Date.now();
    return this;
  }

  /**
   * Resume the timer
   */
  resume() {
    if (!this.active || !this.paused) return this;
    this.paused = false;
    this.startTime += (Date.now() - this.pauseTime);
    return this;
  }

  /**
   * Reset the timer
   */
  reset() {
    this.elapsed = 0;
    this.repeatCount = 0;
    this.startTime = Date.now();
    this.pauseTime = 0;
    this.active = false;
    this.paused = false;
    this.completed = false;
    return this;
  }

  /**
   * Update the timer
   */
  update(deltaTime) {
    if (!this.active || this.paused || this.completed) return;

    this.elapsed += deltaTime * this.timeScale;

    if (this.elapsed >= this.delay) {
      // Execute callback
      try {
        this.callback(this);
      } catch (error) {
        console.warn('Timer callback error:', error);
      }

      // Handle repeats
      if (this.repeat && (this.maxRepeats === -1 || this.repeatCount < this.maxRepeats)) {
        this.repeatCount++;
        this.elapsed -= this.delay;

        if (this.onRepeat) {
          this.onRepeat(this);
        }
      } else {
        this.completed = true;
        this.active = false;

        if (this.onComplete) {
          this.onComplete(this);
        }
      }
    }
  }

  /**
   * Get progress (0-1)
   */
  getProgress() {
    return Math.min(this.elapsed / this.delay, 1.0);
  }

  /**
   * Get remaining time
   */
  getRemainingTime() {
    return Math.max(this.delay - this.elapsed, 0);
  }

  /**
   * Set time scale
   */
  setTimeScale(scale) {
    this.timeScale = scale;
  }

  /**
   * Get timer statistics
   */
  getStats() {
    return {
      id: this.id,
      active: this.active,
      paused: this.paused,
      completed: this.completed,
      elapsed: this.elapsed,
      delay: this.delay,
      progress: this.getProgress(),
      remaining: this.getRemainingTime(),
      repeat: this.repeat,
      repeatCount: this.repeatCount,
      maxRepeats: this.maxRepeats,
      timeScale: this.timeScale
    };
  }
}

/**
 * Timer Manager
 *
 * Manages multiple timers and provides factory methods.
 */
export class TimerManager {
  constructor() {
    this.timers = new Map();
    this.groups = new Map();
    this.pools = new Map();
    this.poolSize = 100;
  }

  /**
   * Create a new timer
   */
  create(callback, delay, options = {}) {
    let timer;

    // Try to get from pool
    const pool = this.getPool();
    if (pool.length > 0) {
      timer = pool.pop();
      timer.callback = callback;
      timer.delay = delay;
      timer.elapsed = 0;
      timer.active = false;
      timer.paused = false;
      timer.completed = false;
      timer.repeat = options.repeat || false;
      timer.repeatCount = 0;
      timer.maxRepeats = options.maxRepeats || -1;
      timer.userData = options.userData || null;
      timer.timeScale = options.timeScale || 1.0;
      timer.onStart = options.onStart || null;
      timer.onComplete = options.onComplete || null;
      timer.onRepeat = options.onRepeat || null;
    } else {
      timer = new Timer(callback, delay, options);
    }

    this.timers.set(timer.id, timer);

    // Add to group if specified
    if (options.group) {
      this.addToGroup(options.group, timer);
    }

    return timer;
  }

  /**
   * Get timer pool
   */
  getPool() {
    if (!this.pools.has('timer')) {
      this.pools.set('timer', []);
    }
    return this.pools.get('timer');
  }

  /**
   * Add timer to group
   */
  addToGroup(groupName, timer) {
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, new Set());
    }
    this.groups.get(groupName).add(timer);
  }

  /**
   * Remove timer from group
   */
  removeFromGroup(groupName, timer) {
    const group = this.groups.get(groupName);
    if (group) {
      group.delete(timer);
    }
  }

  /**
   * Get timers in group
   */
  getGroup(groupName) {
    return this.groups.get(groupName) || new Set();
  }

  /**
   * Update all timers
   */
  update(deltaTime) {
    for (const [id, timer] of this.timers) {
      timer.update(deltaTime);

      // Remove completed timers
      if (timer.completed) {
        this.timers.delete(id);

        // Remove from groups
        for (const [groupName, group] of this.groups) {
          group.delete(timer);
        }

        // Return to pool
        const pool = this.getPool();
        if (pool.length < this.poolSize) {
          timer.reset();
          pool.push(timer);
        }
      }
    }
  }

  /**
   * Stop timer by ID
   */
  stop(id) {
    const timer = this.timers.get(id);
    if (timer) {
      timer.stop();
    }
  }

  /**
   * Stop all timers
   */
  stopAll() {
    for (const timer of this.timers.values()) {
      timer.stop();
    }
    this.timers.clear();
    this.groups.clear();
  }

  /**
   * Pause all timers
   */
  pauseAll() {
    for (const timer of this.timers.values()) {
      timer.pause();
    }
  }

  /**
   * Resume all timers
   */
  resumeAll() {
    for (const timer of this.timers.values()) {
      timer.resume();
    }
  }

  /**
   * Stop timers in group
   */
  stopGroup(groupName) {
    const group = this.groups.get(groupName);
    if (group) {
      for (const timer of group) {
        timer.stop();
      }
      this.groups.delete(groupName);
    }
  }

  /**
   * Pause timers in group
   */
  pauseGroup(groupName) {
    const group = this.groups.get(groupName);
    if (group) {
      for (const timer of group) {
        timer.pause();
      }
    }
  }

  /**
   * Resume timers in group
   */
  resumeGroup(groupName) {
    const group = this.groups.get(groupName);
    if (group) {
      for (const timer of group) {
        timer.resume();
      }
    }
  }

  /**
   * Set time scale for all timers
   */
  setTimeScale(scale) {
    for (const timer of this.timers.values()) {
      timer.setTimeScale(scale);
    }
  }

  /**
   * Set time scale for group
   */
  setGroupTimeScale(groupName, scale) {
    const group = this.groups.get(groupName);
    if (group) {
      for (const timer of group) {
        timer.setTimeScale(scale);
      }
    }
  }

  /**
   * Create one-time timer
   */
  setTimeout(callback, delay, options = {}) {
    return this.create(callback, delay, { ...options, repeat: false });
  }

  /**
   * Create repeating timer
   */
  setInterval(callback, delay, options = {}) {
    return this.create(callback, delay, { ...options, repeat: true });
  }

  /**
   * Create timer that executes after a number of frames
   */
  waitFrames(callback, frames, options = {}) {
    let frameCount = 0;
    return this.create(() => {
      frameCount++;
      if (frameCount >= frames) {
        callback();
        return true; // Stop timer
      }
    }, 16.67, { ...options, repeat: true }); // ~60 FPS
  }

  /**
   * Create timer that executes at specific intervals
   */
  every(callback, interval, options = {}) {
    return this.create(callback, interval, { ...options, repeat: true });
  }

  /**
   * Create countdown timer
   */
  countdown(callback, duration, tickCallback = null, options = {}) {
    let remaining = duration;

    return this.create(() => {
      remaining -= 1000; // Assuming 1 second intervals

      if (tickCallback) {
        tickCallback(remaining);
      }

      if (remaining <= 0) {
        callback();
        return true; // Stop timer
      }
    }, 1000, { ...options, repeat: true });
  }

  /**
   * Get timer by ID
   */
  getTimer(id) {
    return this.timers.get(id) || null;
  }

  /**
   * Get all active timers
   */
  getActiveTimers() {
    return Array.from(this.timers.values()).filter(timer => timer.active);
  }

  /**
   * Get manager statistics
   */
  getStats() {
    const stats = {
      activeTimers: this.timers.size,
      groups: this.groups.size,
      poolSize: this.poolSize,
      pooledTimers: this.getPool().length,
      groupStats: {}
    };

    // Group statistics
    for (const [groupName, group] of this.groups) {
      stats.groupStats[groupName] = {
        timerCount: group.size,
        activeCount: Array.from(group).filter(timer => timer.active).length
      };
    }

    return stats;
  }
}

/**
 * Timer Component
 *
 * Component that manages timers for an entity.
 */
import { Component } from './ECS.js';

export class TimerComponent extends Component {
  constructor() {
    super('TimerComponent');
    this.timerManager = new TimerManager();
  }

  /**
   * Create timer for entity
   */
  createTimer(callback, delay, options = {}) {
    return this.timerManager.create(callback, delay, options);
  }

  /**
   * Update component
   */
  update(deltaTime) {
    this.timerManager.update(deltaTime);
  }

  /**
   * Stop all timers
   */
  stopAll() {
    this.timerManager.stopAll();
  }

  /**
   * Get timer statistics
   */
  getStats() {
    return this.timerManager.getStats();
  }
}

/**
 * Global Timer Utilities
 *
 * Static methods for common timer operations.
 */
export class TimerUtils {
  static setTimeout(callback, delay, options = {}) {
    return new Timer(callback, delay, { ...options, repeat: false }).start();
  }

  static setInterval(callback, delay, options = {}) {
    return new Timer(callback, delay, { ...options, repeat: true }).start();
  }

  static waitFrames(callback, frames, options = {}) {
    let frameCount = 0;
    return new Timer(() => {
      frameCount++;
      if (frameCount >= frames) {
        callback();
        return true;
      }
    }, 16.67, { ...options, repeat: true }).start();
  }

  static countdown(callback, duration, tickCallback = null, options = {}) {
    let remaining = duration;

    return new Timer(() => {
      remaining -= 1000;

      if (tickCallback) {
        tickCallback(remaining);
      }

      if (remaining <= 0) {
        callback();
        return true;
      }
    }, 1000, { ...options, repeat: true }).start();
  }

  static sequence(callbacks, delays) {
    let index = 0;

    const executeNext = () => {
      if (index < callbacks.length) {
        callbacks[index]();
        index++;

        if (index < callbacks.length) {
          const delay = delays[index - 1] || 0;
          TimerUtils.setTimeout(executeNext, delay);
        }
      }
    };

    executeNext();
  }

  static parallel(callbacks, delay = 0) {
    TimerUtils.setTimeout(() => {
      callbacks.forEach(callback => callback());
    }, delay);
  }
}
