/**
 * Entity-Component-System (ECS) Architecture
 *
 * Core classes for modular game engine inspired by Godot.
 * Provides flexible entity management, component-based architecture,
 * and efficient system updates.
 */

/**
 * Base Component Class
 *
 * Components are data containers that can be attached to entities.
 * They define specific behaviors and properties.
 */
export class Component {
  constructor(name = '') {
    this.name = name;
    this.entity = null;
    this.enabled = true;
  }

  /**
   * Called when component is attached to an entity
   */
  onAttach(entity) {
    this.entity = entity;
  }

  /**
   * Called when component is detached from an entity
   */
  onDetach() {
    this.entity = null;
  }

  /**
   * Called when component is enabled
   */
  onEnable() {}

  /**
   * Called when component is disabled
   */
  onDisable() {}

  /**
   * Update component logic
   */
  update(deltaTime) {}

  /**
   * Render component
   */
  render(renderer) {}

  /**
   * Get component type name
   */
  getType() {
    return this.constructor.name;
  }

  /**
   * Check if component is of specific type
   */
  isType(type) {
    return this.constructor.name === type || this.name === type;
  }
}

/**
 * Base Entity Class
 *
 * Entities are containers for components. They represent game objects
 * and manage their components' lifecycle.
 */
export class Entity {
  constructor(name = 'Entity', scene = null) {
    this.name = name;
    this.scene = scene;
    this.components = new Map();
    this.enabled = true;
    this.tags = new Set();
    this.id = Entity.nextId++;
    this.parent = null;
    this.children = new Set();
    this.transform = null; // Will be set when TransformComponent is added
  }

  /**
   * Static ID counter for unique entity IDs
   */
  static nextId = 1;

  /**
   * Add component to entity
   */
  addComponent(component) {
    if (component instanceof Component) {
      component.onAttach(this);
      this.components.set(component.getType(), component);

      // Special handling for TransformComponent
      if (component.getType() === 'TransformComponent') {
        this.transform = component;
      }

      return component;
    }
    return null;
  }

  /**
   * Get component by type
   */
  getComponent(type) {
    return this.components.get(type) || null;
  }

  /**
   * Check if entity has component
   */
  hasComponent(type) {
    return this.components.has(type);
  }

  /**
   * Remove component from entity
   */
  removeComponent(type) {
    const component = this.components.get(type);
    if (component) {
      component.onDetach();
      this.components.delete(type);

      // Special handling for TransformComponent
      if (type === 'TransformComponent') {
        this.transform = null;
      }

      return component;
    }
    return null;
  }

  /**
   * Get all components
   */
  getComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Update all components
   */
  update(deltaTime) {
    if (!this.enabled) return;

    for (const component of this.components.values()) {
      if (component.enabled) {
        component.update(deltaTime);
      }
    }
  }

  /**
   * Render all components
   */
  render(renderer) {
    if (!this.enabled) return;

    for (const component of this.components.values()) {
      if (component.enabled) {
        component.render(renderer);
      }
    }
  }

  /**
   * Add tag to entity
   */
  addTag(tag) {
    this.tags.add(tag);
  }

  /**
   * Remove tag from entity
   */
  removeTag(tag) {
    this.tags.delete(tag);
  }

  /**
   * Check if entity has tag
   */
  hasTag(tag) {
    return this.tags.has(tag);
  }

  /**
   * Set parent entity (for scene tree)
   */
  setParent(parent) {
    if (this.parent) {
      this.parent.children.delete(this);
    }

    this.parent = parent;

    if (parent) {
      parent.children.add(this);
    }
  }

  /**
   * Add child entity
   */
  addChild(child) {
    child.setParent(this);
  }

  /**
   * Remove child entity
   */
  removeChild(child) {
    if (child.parent === this) {
      child.setParent(null);
    }
  }

  /**
   * Get world position (accounting for parent transforms)
   */
  getWorldPosition() {
    if (!this.transform) return { x: 0, y: 0, z: 0 };

    let position = { ...this.transform.position };
    let current = this.parent;

    while (current && current.transform) {
      position.x += current.transform.position.x;
      position.y += current.transform.position.y;
      position.z += current.transform.position.z;
      current = current.parent;
    }

    return position;
  }

  /**
   * Get world rotation (accounting for parent transforms)
   */
  getWorldRotation() {
    if (!this.transform) return 0;

    let rotation = this.transform.rotation;
    let current = this.parent;

    while (current && current.transform) {
      rotation += current.transform.rotation;
      current = current.parent;
    }

    return rotation;
  }

  /**
   * Get world scale (accounting for parent transforms)
   */
  getWorldScale() {
    if (!this.transform) return { x: 1, y: 1, z: 1 };

    let scale = { ...this.transform.scale };
    let current = this.parent;

    while (current && current.transform) {
      scale.x *= current.transform.scale.x;
      scale.y *= current.transform.scale.y;
      scale.z *= current.transform.scale.z;
      current = current.parent;
    }

    return scale;
  }

  /**
   * Destroy entity and cleanup
   */
  destroy() {
    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Destroy children
    for (const child of this.children) {
      child.destroy();
    }

    // Remove from scene
    if (this.scene) {
      this.scene.removeEntity(this);
    }

    // Cleanup components
    for (const component of this.components.values()) {
      component.onDetach();
    }

    this.components.clear();
    this.tags.clear();
    this.children.clear();
  }

  /**
   * Enable entity
   */
  enable() {
    if (!this.enabled) {
      this.enabled = true;
      for (const component of this.components.values()) {
        component.onEnable();
      }
    }
  }

  /**
   * Disable entity
   */
  disable() {
    if (this.enabled) {
      this.enabled = false;
      for (const component of this.components.values()) {
        component.onDisable();
      }
    }
  }

  /**
   * Get entity statistics
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      componentCount: this.components.size,
      childCount: this.children.size,
      hasParent: !!this.parent,
      tags: Array.from(this.tags)
    };
  }
}

/**
 * Base System Class
 *
 * Systems process entities with specific components.
 * They implement game logic and behaviors.
 */
export class System {
  constructor(name = '', priority = 0) {
    this.name = name;
    this.priority = priority;
    this.enabled = true;
    this.entities = new Set();
    this.requiredComponents = [];
  }

  /**
   * Set required components for this system
   */
  setRequiredComponents(...components) {
    this.requiredComponents = components;
  }

  /**
   * Check if entity matches system requirements
   */
  matches(entity) {
    return this.requiredComponents.every(componentType =>
      entity.hasComponent(componentType)
    );
  }

  /**
   * Add entity to system
   */
  addEntity(entity) {
    if (this.matches(entity)) {
      this.entities.add(entity);
      this.onEntityAdded(entity);
    }
  }

  /**
   * Remove entity from system
   */
  removeEntity(entity) {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.onEntityRemoved(entity);
    }
  }

  /**
   * Update system
   */
  update(deltaTime) {
    if (!this.enabled) return;

    for (const entity of this.entities) {
      if (entity.enabled) {
        this.processEntity(entity, deltaTime);
      }
    }
  }

  /**
   * Process individual entity
   */
  processEntity(entity, deltaTime) {
    // Override in subclasses
  }

  /**
   * Render system
   */
  render(renderer) {
    if (!this.enabled) return;

    for (const entity of this.entities) {
      if (entity.enabled) {
        this.renderEntity(entity, renderer);
      }
    }
  }

  /**
   * Render individual entity
   */
  renderEntity(entity, renderer) {
    // Override in subclasses
  }

  /**
   * Called when entity is added to system
   */
  onEntityAdded(entity) {}

  /**
   * Called when entity is removed from system
   */
  onEntityRemoved(entity) {}

  /**
   * Enable system
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable system
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      name: this.name,
      enabled: this.enabled,
      priority: this.priority,
      entityCount: this.entities.size,
      requiredComponents: this.requiredComponents
    };
  }
}

/**
 * System Manager
 *
 * Manages all systems and coordinates entity-system interactions.
 */
export class SystemManager {
  constructor() {
    this.systems = new Map();
    this.systemList = [];
  }

  /**
   * Add system to manager
   */
  addSystem(system) {
    if (system instanceof System) {
      this.systems.set(system.name, system);
      this.systemList.push(system);
      this.systemList.sort((a, b) => a.priority - b.priority);
      return system;
    }
    return null;
  }

  /**
   * Get system by name
   */
  getSystem(name) {
    return this.systems.get(name) || null;
  }

  /**
   * Remove system from manager
   */
  removeSystem(name) {
    const system = this.systems.get(name);
    if (system) {
      this.systems.delete(name);
      const index = this.systemList.indexOf(system);
      if (index > -1) {
        this.systemList.splice(index, 1);
      }
      return system;
    }
    return null;
  }

  /**
   * Add entity to all matching systems
   */
  addEntityToSystems(entity) {
    for (const system of this.systemList) {
      system.addEntity(entity);
    }
  }

  /**
   * Remove entity from all systems
   */
  removeEntityFromSystems(entity) {
    for (const system of this.systemList) {
      system.removeEntity(entity);
    }
  }

  /**
   * Update all systems
   */
  update(deltaTime) {
    for (const system of this.systemList) {
      system.update(deltaTime);
    }
  }

  /**
   * Render all systems
   */
  render(renderer) {
    for (const system of this.systemList) {
      system.render(renderer);
    }
  }

  /**
   * Get system manager statistics
   */
  getStats() {
    return {
      systemCount: this.systems.size,
      systems: Array.from(this.systems.keys()),
      systemList: this.systemList.map(system => ({
        name: system.name,
        priority: system.priority,
        entityCount: system.entities.size
      }))
    };
  }
}
