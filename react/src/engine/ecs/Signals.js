/**
 * Signals System
 *
 * Event-driven communication system inspired by Godot's signals.
 * Allows entities and components to emit and listen to events.
 */

export class Signal {
  constructor(name) {
    this.name = name;
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.listenerId = 0;
  }

  /**
   * Connect a listener to this signal
   */
  connect(listener, context = null, priority = 0) {
    const id = ++this.listenerId;
    this.listeners.set(id, {
      listener,
      context,
      priority,
      id
    });

    // Sort by priority (higher priority first)
    this.sortListeners();

    return id;
  }

  /**
   * Connect a one-time listener
   */
  connectOnce(listener, context = null, priority = 0) {
    const id = ++this.listenerId;
    this.onceListeners.set(id, {
      listener,
      context,
      priority,
      id
    });

    // Sort by priority
    this.sortOnceListeners();

    return id;
  }

  /**
   * Disconnect a listener
   */
  disconnect(id) {
    this.listeners.delete(id);
    this.onceListeners.delete(id);
  }

  /**
   * Disconnect all listeners
   */
  disconnectAll() {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /**
   * Emit signal with arguments
   */
  emit(...args) {
    // Call regular listeners
    for (const [id, listenerData] of this.listeners) {
      try {
        if (listenerData.context) {
          listenerData.listener.call(listenerData.context, ...args);
        } else {
          listenerData.listener(...args);
        }
      } catch (error) {
        console.warn(`Signal '${this.name}' listener error:`, error);
      }
    }

    // Call one-time listeners and remove them
    for (const [id, listenerData] of this.onceListeners) {
      try {
        if (listenerData.context) {
          listenerData.listener.call(listenerData.context, ...args);
        } else {
          listenerData.listener(...args);
        }
      } catch (error) {
        console.warn(`Signal '${this.name}' once-listener error:`, error);
      }
    }
    this.onceListeners.clear();
  }

  /**
   * Get number of listeners
   */
  getListenerCount() {
    return this.listeners.size + this.onceListeners.size;
  }

  /**
   * Check if signal has listeners
   */
  hasListeners() {
    return this.listeners.size > 0 || this.onceListeners.size > 0;
  }

  /**
   * Sort listeners by priority
   */
  sortListeners() {
    const sorted = Array.from(this.listeners.values()).sort((a, b) => b.priority - a.priority);
    this.listeners.clear();
    sorted.forEach(data => this.listeners.set(data.id, data));
  }

  /**
   * Sort one-time listeners by priority
   */
  sortOnceListeners() {
    const sorted = Array.from(this.onceListeners.values()).sort((a, b) => b.priority - a.priority);
    this.onceListeners.clear();
    sorted.forEach(data => this.onceListeners.set(data.id, data));
  }
}

/**
 * Signal Manager
 *
 * Global signal management system.
 */
export class SignalManager {
  constructor() {
    this.signals = new Map();
  }

  /**
   * Get or create a signal
   */
  getSignal(name) {
    if (!this.signals.has(name)) {
      this.signals.set(name, new Signal(name));
    }
    return this.signals.get(name);
  }

  /**
   * Connect to a signal
   */
  connect(signalName, listener, context = null, priority = 0) {
    return this.getSignal(signalName).connect(listener, context, priority);
  }

  /**
   * Connect to a signal once
   */
  connectOnce(signalName, listener, context = null, priority = 0) {
    return this.getSignal(signalName).connectOnce(listener, context, priority);
  }

  /**
   * Disconnect from a signal
   */
  disconnect(signalName, id) {
    const signal = this.signals.get(signalName);
    if (signal) {
      signal.disconnect(id);
    }
  }

  /**
   * Emit a signal
   */
  emit(signalName, ...args) {
    const signal = this.signals.get(signalName);
    if (signal) {
      signal.emit(...args);
    }
  }

  /**
   * Check if signal exists
   */
  hasSignal(signalName) {
    return this.signals.has(signalName);
  }

  /**
   * Remove a signal
   */
  removeSignal(signalName) {
    this.signals.delete(signalName);
  }

  /**
   * Clear all signals
   */
  clear() {
    this.signals.clear();
  }

  /**
   * Get signal statistics
   */
  getStats() {
    const stats = {
      signalCount: this.signals.size,
      signals: {}
    };

    for (const [name, signal] of this.signals) {
      stats.signals[name] = {
        listeners: signal.listeners.size,
        onceListeners: signal.onceListeners.size,
        totalListeners: signal.getListenerCount()
      };
    }

    return stats;
  }
}

/**
 * Event Emitter Mixin
 *
 * Can be mixed into any class to add signal capabilities.
 */
export const EventEmitter = {
  init() {
    this._signals = new Map();
  },

  /**
   * Add a signal to this emitter
   */
  addSignal(name) {
    if (!this._signals) this.init();
    this._signals.set(name, new Signal(name));
  },

  /**
   * Emit a signal
   */
  emit(name, ...args) {
    if (!this._signals) return;
    const signal = this._signals.get(name);
    if (signal) {
      signal.emit(...args);
    }
  },

  /**
   * Connect to a signal
   */
  connect(name, listener, context = null, priority = 0) {
    if (!this._signals) this.init();
    if (!this._signals.has(name)) {
      this.addSignal(name);
    }
    return this._signals.get(name).connect(listener, context, priority);
  },

  /**
   * Connect to a signal once
   */
  connectOnce(name, listener, context = null, priority = 0) {
    if (!this._signals) this.init();
    if (!this._signals.has(name)) {
      this.addSignal(name);
    }
    return this._signals.get(name).connectOnce(listener, context, priority);
  },

  /**
   * Disconnect from a signal
   */
  disconnect(name, id) {
    if (!this._signals) return;
    const signal = this._signals.get(name);
    if (signal) {
      signal.disconnect(id);
    }
  },

  /**
   * Check if signal exists
   */
  hasSignal(name) {
    return this._signals && this._signals.has(name);
  },

  /**
   * Get signal
   */
  getSignal(name) {
    if (!this._signals) return null;
    return this._signals.get(name);
  }
};

/**
 * Common Signal Names
 *
 * Predefined signal names for consistency across the engine.
 */
export const Signals = {
  // Entity lifecycle
  ENTITY_CREATED: 'entity_created',
  ENTITY_DESTROYED: 'entity_destroyed',
  ENTITY_ENABLED: 'entity_enabled',
  ENTITY_DISABLED: 'entity_disabled',

  // Component lifecycle
  COMPONENT_ADDED: 'component_added',
  COMPONENT_REMOVED: 'component_removed',

  // Physics
  COLLISION_ENTER: 'collision_enter',
  COLLISION_STAY: 'collision_stay',
  COLLISION_EXIT: 'collision_exit',
  TRIGGER_ENTER: 'trigger_enter',
  TRIGGER_EXIT: 'trigger_exit',

  // Input
  INPUT_ACTION: 'input_action',
  KEY_PRESSED: 'key_pressed',
  KEY_RELEASED: 'key_released',
  MOUSE_CLICKED: 'mouse_clicked',
  TOUCH_STARTED: 'touch_started',

  // Game events
  LEVEL_START: 'level_start',
  LEVEL_COMPLETE: 'level_complete',
  LEVEL_FAILED: 'level_failed',
  SCORE_CHANGED: 'score_changed',
  HEALTH_CHANGED: 'health_changed',
  AMMO_CHANGED: 'ammo_changed',

  // Audio
  SOUND_STARTED: 'sound_started',
  SOUND_FINISHED: 'sound_finished',
  MUSIC_CHANGED: 'music_changed',

  // Animation
  ANIMATION_STARTED: 'animation_started',
  ANIMATION_FINISHED: 'animation_finished',
  ANIMATION_FRAME: 'animation_frame',

  // Scene
  SCENE_LOADED: 'scene_loaded',
  SCENE_UNLOADED: 'scene_unloaded',

  // Custom events
  CUSTOM: 'custom'
};

/**
 * Signal Component
 *
 * Component that adds signal capabilities to entities.
 */
import { Component } from './ECS.js';

export class SignalComponent extends Component {
  constructor() {
    super('SignalComponent');
    this.signals = new Map();
  }

  /**
   * Add a signal
   */
  addSignal(name) {
    this.signals.set(name, new Signal(name));
  }

  /**
   * Emit a signal
   */
  emit(name, ...args) {
    const signal = this.signals.get(name);
    if (signal) {
      signal.emit(...args);
    }
  }

  /**
   * Connect to a signal
   */
  connect(name, listener, context = null, priority = 0) {
    if (!this.signals.has(name)) {
      this.addSignal(name);
    }
    return this.signals.get(name).connect(listener, context, priority);
  }

  /**
   * Connect to a signal once
   */
  connectOnce(name, listener, context = null, priority = 0) {
    if (!this.signals.has(name)) {
      this.addSignal(name);
    }
    return this.signals.get(name).connectOnce(listener, context, priority);
  }

  /**
   * Disconnect from a signal
   */
  disconnect(name, id) {
    const signal = this.signals.get(name);
    if (signal) {
      signal.disconnect(id);
    }
  }

  /**
   * Check if signal exists
   */
  hasSignal(name) {
    return this.signals.has(name);
  }

  /**
   * Get signal statistics
   */
  getStats() {
    const stats = {
      signalCount: this.signals.size,
      signals: {}
    };

    for (const [name, signal] of this.signals) {
      stats.signals[name] = {
        listeners: signal.listeners.size,
        onceListeners: signal.onceListeners.size
      };
    }

    return stats;
  }
}
