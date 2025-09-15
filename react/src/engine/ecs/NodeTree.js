/**
 * Node Tree System
 *
 * Godot-inspired scene tree system with hierarchical node management.
 * Provides parent-child relationships, scene traversal, and node lifecycle.
 */

import { Entity } from './ECS.js';
import { TransformComponent } from './TransformComponent.js';

/**
 * Node Class
 *
 * Extends Entity with advanced tree management and Godot-like features.
 */
export class Node extends Entity {
  constructor(name = 'Node', scene = null) {
    super(name, scene);

    // Tree structure
    this.parent = null;
    this.children = [];
    this.treeIndex = -1;

    // Node properties
    this.pauseMode = 'inherit'; // 'inherit', 'stop', 'process'
    this.processMode = 'inherit'; // 'inherit', 'disabled', 'idle', 'physics'
    this.visible = true;
    this.modulate = { r: 1, g: 1, b: 1, a: 1 };

    // Groups and ownership
    this.groups = new Set();
    this.owner = null;

    // Node path (cached)
    this._path = null;
    this._pathDirty = true;

    // Ensure transform component
    if (!this.transform) {
      this.addComponent(new TransformComponent());
    }
  }

  /**
   * Add child node
   */
  addChild(child, legibleUniqueName = false) {
    if (!(child instanceof Node)) {
      console.warn('addChild: Child must be a Node instance');
      return;
    }

    if (child.parent) {
      child.parent.removeChild(child);
    }

    // Handle unique naming
    if (legibleUniqueName) {
      child.name = this._getUniqueName(child.name);
    }

    this.children.push(child);
    child.parent = this;
    child.scene = this.scene;
    child._pathDirty = true;

    // Set owner if this node has one
    if (this.owner && !child.owner) {
      child.owner = this.owner;
    }

    // Notify child of scene change
    child._onTreeEntered();

    // Update tree indices
    this._updateTreeIndices();
  }

  /**
   * Remove child node
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child._pathDirty = true;

      // Notify child of scene exit
      child._onTreeExited();

      // Update tree indices
      this._updateTreeIndices();
    }
  }

  /**
   * Get child by name
   */
  getChild(name) {
    return this.children.find(child => child.name === name) || null;
  }

  /**
   * Get child by index
   */
  getChildByIndex(index) {
    return this.children[index] || null;
  }

  /**
   * Get child count
   */
  getChildCount() {
    return this.children.length;
  }

  /**
   * Move child to new position
   */
  moveChild(child, toIndex) {
    const fromIndex = this.children.indexOf(child);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= this.children.length) return;

    this.children.splice(fromIndex, 1);
    this.children.splice(toIndex, 0, child);
    this._updateTreeIndices();
  }

  /**
   * Get node path
   */
  getPath() {
    if (this._pathDirty) {
      this._updatePath();
    }
    return this._path;
  }

  /**
   * Get node path to another node
   */
  getPathTo(node) {
    const thisPath = this.getPath().split('/');
    const nodePath = node.getPath().split('/');

    // Find common ancestor
    let commonLength = 0;
    for (let i = 0; i < Math.min(thisPath.length, nodePath.length); i++) {
      if (thisPath[i] === nodePath[i]) {
        commonLength = i + 1;
      } else {
        break;
      }
    }

    // Build relative path
    const upLevels = thisPath.length - commonLength;
    const downPath = nodePath.slice(commonLength);

    let relativePath = '';
    for (let i = 0; i < upLevels; i++) {
      relativePath += '../';
    }
    relativePath += downPath.join('/');

    return relativePath || '.';
  }

  /**
   * Find node by path
   */
  findNode(path) {
    if (!path || path === '.') return this;
    if (path === '..') return this.parent;
    if (path.startsWith('/')) return this.scene?.findNode(path.substring(1));

    const parts = path.split('/');
    let current = this;

    for (const part of parts) {
      if (part === '..') {
        current = current.parent;
      } else if (part === '.') {
        // Stay at current
      } else {
        current = current.getChild(part);
      }

      if (!current) return null;
    }

    return current;
  }

  /**
   * Get all descendants
   */
  getAllDescendants(includeSelf = false) {
    const descendants = includeSelf ? [this] : [];

    for (const child of this.children) {
      descendants.push(child);
      descendants.push(...child.getAllDescendants(false));
    }

    return descendants;
  }

  /**
   * Get nodes in group
   */
  getNodesInGroup(group) {
    return this.getAllDescendants(true).filter(node => node.isInGroup(group));
  }

  /**
   * Add to group
   */
  addToGroup(group) {
    this.groups.add(group);
    this.scene?.emitSignal('node_added_to_group', this, group);
  }

  /**
   * Remove from group
   */
  removeFromGroup(group) {
    this.groups.delete(group);
    this.scene?.emitSignal('node_removed_from_group', this, group);
  }

  /**
   * Check if in group
   */
  isInGroup(group) {
    return this.groups.has(group);
  }

  /**
   * Get groups
   */
  getGroups() {
    return Array.from(this.groups);
  }

  /**
   * Set owner
   */
  setOwner(owner) {
    this.owner = owner;
  }

  /**
   * Get owner
   */
  getOwner() {
    return this.owner;
  }

  /**
   * Set pause mode
   */
  setPauseMode(mode) {
    this.pauseMode = mode;
  }

  /**
   * Get effective pause mode
   */
  getEffectivePauseMode() {
    if (this.pauseMode !== 'inherit') return this.pauseMode;

    let current = this.parent;
    while (current) {
      if (current.pauseMode !== 'inherit') return current.pauseMode;
      current = current.parent;
    }

    return 'process'; // Default
  }

  /**
   * Set process mode
   */
  setProcessMode(mode) {
    this.processMode = mode;
  }

  /**
   * Get effective process mode
   */
  getEffectiveProcessMode() {
    if (this.processMode !== 'inherit') return this.processMode;

    let current = this.parent;
    while (current) {
      if (current.processMode !== 'inherit') return current.processMode;
      current = current.parent;
    }

    return 'idle'; // Default
  }

  /**
   * Check if node can process
   */
  canProcess() {
    const pauseMode = this.getEffectivePauseMode();
    const processMode = this.getEffectiveProcessMode();

    if (pauseMode === 'stop') return false;
    if (processMode === 'disabled') return false;

    return true;
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.visible = visible;
    this._propagateVisibility();
  }

  /**
   * Get effective visibility
   */
  getEffectiveVisibility() {
    if (!this.visible) return false;

    let current = this.parent;
    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }

    return true;
  }

  /**
   * Set modulate
   */
  setModulate(r, g, b, a = 1) {
    if (typeof r === 'object') {
      this.modulate = { ...r };
    } else {
      this.modulate = { r, g, b, a };
    }
    this._propagateModulate();
  }

  /**
   * Get effective modulate
   */
  getEffectiveModulate() {
    let modulate = { ...this.modulate };

    let current = this.parent;
    while (current) {
      modulate.r *= current.modulate.r;
      modulate.g *= current.modulate.g;
      modulate.b *= current.modulate.b;
      modulate.a *= current.modulate.a;
      current = current.parent;
    }

    return modulate;
  }

  /**
   * Queue free (deferred deletion)
   */
  queueFree() {
    if (this.scene) {
      this.scene.queueNodeForDeletion(this);
    }
  }

  /**
   * Free node immediately
   */
  free() {
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Free children first
    for (const child of [...this.children]) {
      child.free();
    }

    this.destroy();
  }

  /**
   * Duplicate node
   */
  duplicate() {
    const duplicate = new this.constructor(this.name + '_duplicate');
    duplicate.copyPropertiesFrom(this);

    // Duplicate children
    for (const child of this.children) {
      const childDuplicate = child.duplicate();
      duplicate.addChild(childDuplicate);
    }

    return duplicate;
  }

  /**
   * Copy properties from another node
   */
  copyPropertiesFrom(other) {
    this.enabled = other.enabled;
    this.visible = other.visible;
    this.modulate = { ...other.modulate };
    this.pauseMode = other.pauseMode;
    this.processMode = other.processMode;
    this.groups = new Set(other.groups);

    // Copy transform
    if (other.transform && this.transform) {
      this.transform.copyFrom(other.transform);
    }

    // Copy components
    for (const component of other.getComponents()) {
      if (component.getType() !== 'TransformComponent') {
        // Create new instance of component
        const ComponentClass = component.constructor;
        const newComponent = new ComponentClass();
        Object.assign(newComponent, component);
        this.addComponent(newComponent);
      }
    }
  }

  /**
   * Print tree structure
   */
  printTree(indent = 0) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}${this.name} (${this.constructor.name})`);

    for (const child of this.children) {
      child.printTree(indent + 1);
    }
  }

  /**
   * Update node
   */
  update(deltaTime) {
    if (!this.canProcess()) return;

    super.update(deltaTime);

    // Update children
    for (const child of this.children) {
      child.update(deltaTime);
    }
  }

  /**
   * Render node
   */
  render(renderer) {
    if (!this.getEffectiveVisibility()) return;

    super.render(renderer);

    // Render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Called when node enters tree
   */
  _onTreeEntered() {
    this.onTreeEntered();

    // Notify children
    for (const child of this.children) {
      child._onTreeEntered();
    }
  }

  /**
   * Called when node exits tree
   */
  _onTreeExited() {
    this.onTreeExited();

    // Notify children
    for (const child of this.children) {
      child._onTreeExited();
    }
  }

  /**
   * Update path cache
   */
  _updatePath() {
    if (!this.scene) {
      this._path = this.name;
      this._pathDirty = false;
      return;
    }

    const pathParts = [];
    let current = this;

    while (current) {
      pathParts.unshift(current.name);
      current = current.parent;
    }

    this._path = pathParts.join('/');
    this._pathDirty = false;
  }

  /**
   * Update tree indices
   */
  _updateTreeIndices() {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].treeIndex = i;
    }
  }

  /**
   * Get unique name for child
   */
  _getUniqueName(baseName) {
    let name = baseName;
    let counter = 1;

    while (this.getChild(name)) {
      name = `${baseName}_${counter}`;
      counter++;
    }

    return name;
  }

  /**
   * Propagate visibility to children
   */
  _propagateVisibility() {
    // Force re-evaluation of effective visibility for children
    for (const child of this.children) {
      child._propagateVisibility();
    }
  }

  /**
   * Propagate modulate to children
   */
  _propagateModulate() {
    // Force re-evaluation of effective modulate for children
    for (const child of this.children) {
      child._propagateModulate();
    }
  }

  /**
   * Lifecycle methods to override
   */
  onTreeEntered() {}
  onTreeExited() {}
  onReady() {}

  /**
   * Get node statistics
   */
  getStats() {
    return {
      ...super.getStats(),
      path: this.getPath(),
      childCount: this.children.length,
      descendantCount: this.getAllDescendants().length,
      groups: Array.from(this.groups),
      visible: this.visible,
      effectiveVisibility: this.getEffectiveVisibility(),
      pauseMode: this.pauseMode,
      effectivePauseMode: this.getEffectivePauseMode(),
      processMode: this.processMode,
      effectiveProcessMode: this.getEffectiveProcessMode(),
      canProcess: this.canProcess()
    };
  }
}

/**
 * Scene Tree
 *
 * Root node that manages the entire scene hierarchy.
 */
export class SceneTree extends Node {
  constructor(name = 'SceneTree') {
    super(name, null);
    this.scene = this; // Self-reference for root
    this.deletionQueue = [];
    this.groups = new Map();
    this.nodesByPath = new Map();
  }

  /**
   * Add node to tree
   */
  addNode(node, parent = null) {
    const targetParent = parent || this;
    targetParent.addChild(node);

    // Update path cache
    this._updateNodePathCache();
  }

  /**
   * Find node by path
   */
  findNode(path) {
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    return this.nodesByPath.get(path) || null;
  }

  /**
   * Get nodes in group
   */
  getNodesInGroup(group) {
    return this.groups.get(group) || [];
  }

  /**
   * Queue node for deletion
   */
  queueNodeForDeletion(node) {
    if (!this.deletionQueue.includes(node)) {
      this.deletionQueue.push(node);
    }
  }

  /**
   * Process deletion queue
   */
  processDeletionQueue() {
    for (const node of this.deletionQueue) {
      if (node.parent) {
        node.free();
      }
    }
    this.deletionQueue = [];
  }

  /**
   * Update tree
   */
  update(deltaTime) {
    super.update(deltaTime);
    this.processDeletionQueue();
  }

  /**
   * Emit signal to all nodes
   */
  emitSignal(signalName, ...args) {
    const descendants = this.getAllDescendants(true);
    for (const node of descendants) {
      if (node.emit) {
        node.emit(signalName, ...args);
      }
    }
  }

  /**
   * Update node path cache
   */
  _updateNodePathCache() {
    this.nodesByPath.clear();
    const allNodes = this.getAllDescendants(true);

    for (const node of allNodes) {
      const path = node.getPath();
      if (path) {
        this.nodesByPath.set(path, node);
      }
    }

    // Update groups
    this.groups.clear();
    for (const node of allNodes) {
      for (const group of node.groups) {
        if (!this.groups.has(group)) {
          this.groups.set(group, []);
        }
        this.groups.get(group).push(node);
      }
    }
  }

  /**
   * Get tree statistics
   */
  getTreeStats() {
    const allNodes = this.getAllDescendants(true);
    const stats = {
      totalNodes: allNodes.length,
      groups: {},
      nodeTypes: {}
    };

    for (const node of allNodes) {
      // Count node types
      const type = node.constructor.name;
      stats.nodeTypes[type] = (stats.nodeTypes[type] || 0) + 1;

      // Count groups
      for (const group of node.groups) {
        stats.groups[group] = (stats.groups[group] || 0) + 1;
      }
    }

    return stats;
  }
}
