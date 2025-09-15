/**
 * Object Pooling System
 *
 * Efficient memory management through object reuse.
 * Prevents garbage collection spikes and improves performance.
 */

/**
 * Generic Object Pool
 *
 * Reusable pool for any object type.
 */
export class ObjectPool {
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

  /**
   * Get object from pool
   */
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

  /**
   * Return object to pool
   */
  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.resetFunc(obj);

      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
  }

  /**
   * Release all active objects
   */
  releaseAll() {
    for (const obj of this.active) {
      this.resetFunc(obj);
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
    this.active.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
      maxSize: this.maxSize,
      utilization: this.active.size / (this.pool.length + this.active.size)
    };
  }

  /**
   * Resize pool
   */
  resize(newSize) {
    this.maxSize = newSize;

    // Remove excess pooled objects
    while (this.pool.length > newSize) {
      this.pool.pop();
    }
  }
}

/**
 * Entity Pool
 *
 * Specialized pool for entities with components.
 */
export class EntityPool {
  constructor(entityClass, initialSize = 20) {
    this.entityClass = entityClass;
    this.pool = new ObjectPool(
      () => new entityClass(),
      (entity) => this.resetEntity(entity),
      initialSize
    );
  }

  /**
   * Get entity from pool
   */
  get() {
    return this.pool.get();
  }

  /**
   * Release entity to pool
   */
  release(entity) {
    // Remove from scene first
    if (entity.scene) {
      entity.scene.removeEntity(entity);
    }

    this.pool.release(entity);
  }

  /**
   * Reset entity for reuse
   */
  resetEntity(entity) {
    // Clear components
    for (const component of entity.getComponents()) {
      entity.removeComponent(component.getType());
    }

    // Reset entity properties
    entity.name = 'PooledEntity';
    entity.enabled = true;
    entity.tags.clear();

    // Reset transform if it exists
    if (entity.transform) {
      entity.transform.reset();
    }

    // Clear parent-child relationships
    if (entity.parent) {
      entity.parent.removeChild(entity);
    }

    for (const child of entity.children) {
      entity.removeChild(child);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return this.pool.getStats();
  }
}

/**
 * Component Pool
 *
 * Pool for reusable components.
 */
export class ComponentPool {
  constructor(componentClass, initialSize = 50) {
    this.componentClass = componentClass;
    this.pool = new ObjectPool(
      () => new componentClass(),
      (component) => this.resetComponent(component),
      initialSize
    );
  }

  /**
   * Get component from pool
   */
  get() {
    return this.pool.get();
  }

  /**
   * Release component to pool
   */
  release(component) {
    this.pool.release(component);
  }

  /**
   * Reset component for reuse
   */
  resetComponent(component) {
    // Reset common properties
    component.enabled = true;

    // Component-specific reset
    if (component.reset) {
      component.reset();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return this.pool.getStats();
  }
}

/**
 * Particle Pool
 *
 * Specialized pool for particle effects.
 */
export class ParticlePool {
  constructor(initialSize = 100) {
    this.pool = new ObjectPool(
      () => ({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0,
        size: 1,
        color: '#ffffff',
        alpha: 1,
        gravity: 0,
        drag: 0.1,
        active: false
      }),
      (particle) => this.resetParticle(particle),
      initialSize
    );
  }

  /**
   * Get particle from pool
   */
  get() {
    return this.pool.get();
  }

  /**
   * Release particle to pool
   */
  release(particle) {
    this.pool.release(particle);
  }

  /**
   * Reset particle for reuse
   */
  resetParticle(particle) {
    particle.x = 0;
    particle.y = 0;
    particle.z = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.vz = 0;
    particle.life = 0;
    particle.maxLife = 0;
    particle.size = 1;
    particle.color = '#ffffff';
    particle.alpha = 1;
    particle.gravity = 0;
    particle.drag = 0.1;
    particle.active = false;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return this.pool.getStats();
  }
}

/**
 * Pool Manager
 *
 * Central manager for all object pools.
 */
export class PoolManager {
  constructor() {
    this.pools = new Map();
    this.entityPools = new Map();
    this.componentPools = new Map();
    this.stats = {
      totalPooled: 0,
      totalActive: 0,
      poolCount: 0
    };
  }

  /**
   * Create generic object pool
   */
  createPool(name, createFunc, resetFunc = null, initialSize = 10) {
    const pool = new ObjectPool(createFunc, resetFunc, initialSize);
    this.pools.set(name, pool);
    this.updateStats();
    return pool;
  }

  /**
   * Get generic pool
   */
  getPool(name) {
    return this.pools.get(name) || null;
  }

  /**
   * Create entity pool
   */
  createEntityPool(name, entityClass, initialSize = 20) {
    const pool = new EntityPool(entityClass, initialSize);
    this.entityPools.set(name, pool);
    this.updateStats();
    return pool;
  }

  /**
   * Get entity pool
   */
  getEntityPool(name) {
    return this.entityPools.get(name) || null;
  }

  /**
   * Create component pool
   */
  createComponentPool(name, componentClass, initialSize = 50) {
    const pool = new ComponentPool(componentClass, initialSize);
    this.componentPools.set(name, pool);
    this.updateStats();
    return pool;
  }

  /**
   * Get component pool
   */
  getComponentPool(name) {
    return this.componentPools.get(name) || null;
  }

  /**
   * Get pooled entity
   */
  getPooledEntity(poolName) {
    const pool = this.getEntityPool(poolName);
    return pool ? pool.get() : null;
  }

  /**
   * Release pooled entity
   */
  releasePooledEntity(poolName, entity) {
    const pool = this.getEntityPool(poolName);
    if (pool) {
      pool.release(entity);
    }
  }

  /**
   * Get pooled component
   */
  getPooledComponent(poolName) {
    const pool = this.getComponentPool(poolName);
    return pool ? pool.get() : null;
  }

  /**
   * Release pooled component
   */
  releasePooledComponent(poolName, component) {
    const pool = this.getComponentPool(poolName);
    if (pool) {
      pool.release(component);
    }
  }

  /**
   * Create particle pool
   */
  createParticlePool(name, initialSize = 100) {
    const pool = new ParticlePool(initialSize);
    this.pools.set(name, pool);
    this.updateStats();
    return pool;
  }

  /**
   * Get particle pool
   */
  getParticlePool(name) {
    return this.pools.get(name) || null;
  }

  /**
   * Preload pools
   */
  preloadPools() {
    // Preload common pools
    console.log('🔄 Preloading object pools...');

    // This would be customized based on game needs
    // Example: preload enemy entities, bullets, particles, etc.
  }

  /**
   * Update statistics
   */
  updateStats() {
    this.stats.totalPooled = 0;
    this.stats.totalActive = 0;
    this.stats.poolCount = this.pools.size + this.entityPools.size + this.componentPools.size;

    // Count generic pools
    for (const pool of this.pools.values()) {
      const stats = pool.getStats();
      this.stats.totalPooled += stats.pooled;
      this.stats.totalActive += stats.active;
    }

    // Count entity pools
    for (const pool of this.entityPools.values()) {
      const stats = pool.getStats();
      this.stats.totalPooled += stats.pooled;
      this.stats.totalActive += stats.active;
    }

    // Count component pools
    for (const pool of this.componentPools.values()) {
      const stats = pool.getStats();
      this.stats.totalPooled += stats.pooled;
      this.stats.totalActive += stats.active;
    }
  }

  /**
   * Get all pool statistics
   */
  getAllStats() {
    const stats = {
      overview: { ...this.stats },
      pools: {},
      entityPools: {},
      componentPools: {}
    };

    // Generic pools
    for (const [name, pool] of this.pools) {
      stats.pools[name] = pool.getStats();
    }

    // Entity pools
    for (const [name, pool] of this.entityPools) {
      stats.entityPools[name] = pool.getStats();
    }

    // Component pools
    for (const [name, pool] of this.componentPools) {
      stats.componentPools[name] = pool.getStats();
    }

    return stats;
  }

  /**
   * Clear all pools
   */
  clearAll() {
    for (const pool of this.pools.values()) {
      pool.releaseAll();
    }

    for (const pool of this.entityPools.values()) {
      pool.releaseAll();
    }

    for (const pool of this.componentPools.values()) {
      pool.releaseAll();
    }

    this.updateStats();
  }

  /**
   * Resize all pools
   */
  resizeAll(maxSize) {
    for (const pool of this.pools.values()) {
      pool.resize(maxSize);
    }

    for (const pool of this.entityPools.values()) {
      pool.pool.resize(maxSize);
    }

    for (const pool of this.componentPools.values()) {
      pool.pool.resize(maxSize);
    }
  }

  /**
   * Auto-resize pools based on usage
   */
  autoResize() {
    const targetUtilization = 0.8; // Target 80% utilization

    for (const [name, pool] of this.pools) {
      const stats = pool.getStats();
      const utilization = stats.utilization;

      if (utilization > targetUtilization && stats.pooled < pool.maxSize) {
        // Increase pool size
        const newSize = Math.min(pool.maxSize, stats.pooled * 2);
        pool.resize(newSize);
        console.log(`📈 Auto-resized pool '${name}' to ${newSize}`);
      }
    }

    // Similar for entity and component pools
    for (const [name, pool] of this.entityPools) {
      const stats = pool.getStats();
      const utilization = stats.utilization;

      if (utilization > targetUtilization && stats.pooled < pool.pool.maxSize) {
        const newSize = Math.min(pool.pool.maxSize, stats.pooled * 2);
        pool.pool.resize(newSize);
        console.log(`📈 Auto-resized entity pool '${name}' to ${newSize}`);
      }
    }

    for (const [name, pool] of this.componentPools) {
      const stats = pool.getStats();
      const utilization = stats.utilization;

      if (utilization > targetUtilization && stats.pooled < pool.pool.maxSize) {
        const newSize = Math.min(pool.pool.maxSize, stats.pooled * 2);
        pool.pool.resize(newSize);
        console.log(`📈 Auto-resized component pool '${name}' to ${newSize}`);
      }
    }
  }
}

/**
 * Pooled Entity Factory
 *
 * Factory for creating pooled entities with common configurations.
 */
export class PooledEntityFactory {
  constructor(poolManager) {
    this.poolManager = poolManager;
    this.templates = new Map();
  }

  /**
   * Register entity template
   */
  registerTemplate(name, template) {
    this.templates.set(name, template);

    // Create pool for this template
    const poolName = `${name}Pool`;
    this.poolManager.createEntityPool(poolName, template.entityClass, template.poolSize || 20);
  }

  /**
   * Create entity from template
   */
  createFromTemplate(templateName, overrides = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      console.warn(`Template '${templateName}' not found`);
      return null;
    }

    const poolName = `${templateName}Pool`;
    const entity = this.poolManager.getPooledEntity(poolName);

    if (!entity) return null;

    // Apply template configuration
    entity.name = overrides.name || template.name || templateName;

    // Add components
    for (const componentConfig of template.components || []) {
      const componentPoolName = `${componentConfig.type}Pool`;
      let component = this.poolManager.getPooledComponent(componentPoolName);

      if (!component) {
        // Create component if pool doesn't exist
        const ComponentClass = this.getComponentClass(componentConfig.type);
        if (ComponentClass) {
          component = new ComponentClass();
        }
      }

      if (component) {
        // Apply component configuration
        Object.assign(component, componentConfig.properties || {});
        entity.addComponent(component);
      }
    }

    // Apply overrides
    if (overrides.transform) {
      Object.assign(entity.transform, overrides.transform);
    }

    if (overrides.components) {
      for (const [type, properties] of Object.entries(overrides.components)) {
        const component = entity.getComponent(type);
        if (component) {
          Object.assign(component, properties);
        }
      }
    }

    return entity;
  }

  /**
   * Get component class by name
   */
  getComponentClass(type) {
    // This would need to be populated with available component classes
    const componentClasses = {
      'TransformComponent': require('./TransformComponent.js').TransformComponent,
      'SpriteComponent': require('./SpriteComponent.js').SpriteComponent,
      'PhysicsComponent': require('./PhysicsComponent.js').PhysicsComponent,
      'AudioComponent': require('./AudioComponent.js').AudioComponent
    };

    return componentClasses[type] || null;
  }

  /**
   * Release entity back to pool
   */
  releaseEntity(templateName, entity) {
    const poolName = `${templateName}Pool`;
    this.poolManager.releasePooledEntity(poolName, entity);
  }

  /**
   * Get template statistics
   */
  getTemplateStats() {
    const stats = {
      templateCount: this.templates.size,
      templates: {}
    };

    for (const [name, template] of this.templates) {
      const poolName = `${name}Pool`;
      const pool = this.poolManager.getEntityPool(poolName);

      stats.templates[name] = {
        poolSize: pool ? pool.getStats() : null,
        componentCount: template.components ? template.components.length : 0
      };
    }

    return stats;
  }
}
