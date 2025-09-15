/**
 * 2D Sprite Renderer System
 *
 * Handles 2D sprite rendering with batching, layering, and optimization.
 * Works alongside the 3D raycasting renderer for hybrid 2D/3D games.
 */

import { System } from './ECS.js';

export class SpriteRendererSystem extends System {
  constructor() {
    super('SpriteRendererSystem', 10); // High priority for rendering
    this.setRequiredComponents('SpriteComponent', 'TransformComponent');

    // Rendering batches
    this.spriteBatches = new Map();
    this.maxBatchSize = 100;

    // Rendering options
    this.pixelPerfect = false;
    this.sortByDepth = true;
    this.cullingEnabled = true;
    this.cullingMargin = 50;

    // Statistics
    this.renderedSprites = 0;
    this.batchesUsed = 0;
    this.culledSprites = 0;
  }

  /**
   * Set pixel perfect rendering
   */
  setPixelPerfect(enabled) {
    this.pixelPerfect = enabled;
  }

  /**
   * Set depth sorting
   */
  setDepthSorting(enabled) {
    this.sortByDepth = enabled;
  }

  /**
   * Set culling
   */
  setCulling(enabled, margin = 50) {
    this.cullingEnabled = enabled;
    this.cullingMargin = margin;
  }

  /**
   * Check if sprite is visible in viewport
   */
  isSpriteVisible(sprite, transform, viewport) {
    if (!this.cullingEnabled) return true;

    const bounds = sprite.getBounds();
    const margin = this.cullingMargin;

    return !(bounds.x + bounds.width < -margin ||
             bounds.y + bounds.height < -margin ||
             bounds.x > viewport.width + margin ||
             bounds.y > viewport.height + margin);
  }

  /**
   * Sort sprites by depth/layer
   */
  sortSprites(sprites) {
    if (!this.sortByDepth) return sprites;

    return sprites.sort((a, b) => {
      const spriteA = a.getComponent('SpriteComponent');
      const spriteB = b.getComponent('SpriteComponent');

      // Sort by layer first
      if (spriteA.layer !== spriteB.layer) {
        return spriteA.layer - spriteB.layer;
      }

      // Then by sorting order
      if (spriteA.sortingOrder !== spriteB.sortingOrder) {
        return spriteA.sortingOrder - spriteB.sortingOrder;
      }

      // Finally by Y position for isometric effect
      return a.transform.position.y - b.transform.position.y;
    });
  }

  /**
   * Create render batch
   */
  createBatch(texture, blendMode) {
    const batchKey = `${texture?.src || 'null'}_${blendMode}`;
    if (!this.spriteBatches.has(batchKey)) {
      this.spriteBatches.set(batchKey, {
        texture,
        blendMode,
        sprites: [],
        vertexCount: 0
      });
    }
    return this.spriteBatches.get(batchKey);
  }

  /**
   * Add sprite to batch
   */
  addToBatch(batch, sprite, transform) {
    if (batch.sprites.length >= this.maxBatchSize) {
      return false; // Batch full
    }

    batch.sprites.push({ sprite, transform });
    batch.vertexCount += 4; // 4 vertices per sprite
    return true;
  }

  /**
   * Render sprite batch
   */
  renderBatch(batch, ctx, viewport) {
    if (batch.sprites.length === 0) return;

    // Set blend mode
    ctx.globalCompositeOperation = batch.blendMode;

    // Sort batch sprites
    const sortedSprites = this.sortSprites(batch.sprites);

    // Render each sprite
    for (const { sprite: entity, transform } of sortedSprites) {
      const sprite = entity.getComponent('SpriteComponent');

      if (this.isSpriteVisible(sprite, transform, viewport)) {
        sprite.render(ctx);
        this.renderedSprites++;
      } else {
        this.culledSprites++;
      }
    }
  }

  /**
   * Render all sprite batches
   */
  renderBatches(ctx, viewport) {
    this.renderedSprites = 0;
    this.culledSprites = 0;
    this.batchesUsed = this.spriteBatches.size;

    // Clear batches for next frame
    const batches = Array.from(this.spriteBatches.values());
    this.spriteBatches.clear();

    // Render batches in order
    for (const batch of batches) {
      this.renderBatch(batch, ctx, viewport);
    }
  }

  /**
   * Process entities for rendering
   */
  processEntity(entity, deltaTime) {
    const sprite = entity.getComponent('SpriteComponent');
    const transform = entity.transform;

    if (!sprite || !transform || !sprite.visible) return;

    // Get viewport from renderer
    const viewport = this.getViewport();

    // Frustum culling
    if (!this.isSpriteVisible(sprite, transform, viewport)) {
      this.culledSprites++;
      return;
    }

    // Add to appropriate batch
    const batch = this.createBatch(sprite.texture, sprite.blendMode);
    this.addToBatch(batch, entity, transform);
  }

  /**
   * Get viewport dimensions
   */
  getViewport() {
    // Try to get from scene or engine
    if (this.engine && this.engine.canvas) {
      return {
        width: this.engine.canvas.width,
        height: this.engine.canvas.height,
        x: 0,
        y: 0
      };
    }

    // Default viewport
    return {
      width: 800,
      height: 600,
      x: 0,
      y: 0
    };
  }

  /**
   * Render system
   */
  render(renderer) {
    if (!renderer || !renderer.ctx) return;

    const ctx = renderer.ctx;
    const viewport = this.getViewport();

    // Save context state
    ctx.save();

    // Enable pixel perfect rendering if requested
    if (this.pixelPerfect) {
      ctx.imageSmoothingEnabled = false;
    }

    // Process all sprite entities
    for (const entity of this.entities) {
      this.processEntity(entity, 0);
    }

    // Render all batches
    this.renderBatches(ctx, viewport);

    // Restore context state
    ctx.restore();
  }

  /**
   * Get rendering statistics
   */
  getRenderStats() {
    return {
      renderedSprites: this.renderedSprites,
      culledSprites: this.culledSprites,
      batchesUsed: this.batchesUsed,
      totalBatches: this.spriteBatches.size,
      pixelPerfect: this.pixelPerfect,
      depthSorting: this.sortByDepth,
      cullingEnabled: this.cullingEnabled
    };
  }

  /**
   * Clear all batches
   */
  clearBatches() {
    this.spriteBatches.clear();
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      ...super.getStats(),
      ...this.getRenderStats(),
      maxBatchSize: this.maxBatchSize
    };
  }
}

/**
 * Sprite Batch Renderer
 *
 * Advanced sprite batching for optimal performance.
 */
export class SpriteBatchRenderer {
  constructor(maxSprites = 1000) {
    this.maxSprites = maxSprites;
    this.vertexData = new Float32Array(maxSprites * 4 * 8); // 4 vertices * 8 floats per vertex
    this.indexData = new Uint16Array(maxSprites * 6); // 6 indices per sprite
    this.spriteCount = 0;
    this.currentTexture = null;

    // Initialize index buffer
    this.initIndexBuffer();
  }

  /**
   * Initialize index buffer for quad rendering
   */
  initIndexBuffer() {
    for (let i = 0, j = 0; i < this.maxSprites; i++, j += 4) {
      this.indexData[i * 6] = j;
      this.indexData[i * 6 + 1] = j + 1;
      this.indexData[i * 6 + 2] = j + 2;
      this.indexData[i * 6 + 3] = j + 2;
      this.indexData[i * 6 + 4] = j + 3;
      this.indexData[i * 6 + 5] = j;
    }
  }

  /**
   * Add sprite to batch
   */
  addSprite(sprite, transform, color = { r: 1, g: 1, b: 1, a: 1 }) {
    if (this.spriteCount >= this.maxSprites) return false;
    if (sprite.texture !== this.currentTexture && this.spriteCount > 0) return false;

    this.currentTexture = sprite.texture;
    const vertexOffset = this.spriteCount * 4 * 8;

    // Get sprite bounds
    const bounds = sprite.getBounds();
    const worldPos = transform.getWorldPosition();
    const worldScale = transform.getWorldScale();

    // Calculate vertex positions
    const left = worldPos.x - (sprite.width * sprite.pivotX) * worldScale.x;
    const right = worldPos.x + (sprite.width * (1 - sprite.pivotX)) * worldScale.x;
    const top = worldPos.y - (sprite.height * sprite.pivotY) * worldScale.y;
    const bottom = worldPos.y + (sprite.height * (1 - sprite.pivotY)) * worldScale.y;

    // Texture coordinates
    const u0 = 0, v0 = 0, u1 = 1, v1 = 1;

    // Vertex 0 (top-left)
    this.vertexData[vertexOffset] = left;
    this.vertexData[vertexOffset + 1] = top;
    this.vertexData[vertexOffset + 2] = u0;
    this.vertexData[vertexOffset + 3] = v0;
    this.vertexData[vertexOffset + 4] = color.r;
    this.vertexData[vertexOffset + 5] = color.g;
    this.vertexData[vertexOffset + 6] = color.b;
    this.vertexData[vertexOffset + 7] = color.a;

    // Vertex 1 (top-right)
    this.vertexData[vertexOffset + 8] = right;
    this.vertexData[vertexOffset + 9] = top;
    this.vertexData[vertexOffset + 10] = u1;
    this.vertexData[vertexOffset + 11] = v0;
    this.vertexData[vertexOffset + 12] = color.r;
    this.vertexData[vertexOffset + 13] = color.g;
    this.vertexData[vertexOffset + 14] = color.b;
    this.vertexData[vertexOffset + 15] = color.a;

    // Vertex 2 (bottom-right)
    this.vertexData[vertexOffset + 16] = right;
    this.vertexData[vertexOffset + 17] = bottom;
    this.vertexData[vertexOffset + 18] = u1;
    this.vertexData[vertexOffset + 19] = v1;
    this.vertexData[vertexOffset + 20] = color.r;
    this.vertexData[vertexOffset + 21] = color.g;
    this.vertexData[vertexOffset + 22] = color.b;
    this.vertexData[vertexOffset + 23] = color.a;

    // Vertex 3 (bottom-left)
    this.vertexData[vertexOffset + 24] = left;
    this.vertexData[vertexOffset + 25] = bottom;
    this.vertexData[vertexOffset + 26] = u0;
    this.vertexData[vertexOffset + 27] = v1;
    this.vertexData[vertexOffset + 28] = color.r;
    this.vertexData[vertexOffset + 29] = color.g;
    this.vertexData[vertexOffset + 30] = color.b;
    this.vertexData[vertexOffset + 31] = color.a;

    this.spriteCount++;
    return true;
  }

  /**
   * Render batch
   */
  render(ctx) {
    if (this.spriteCount === 0 || !this.currentTexture) return;

    // For now, render individually (WebGL batching would be more optimal)
    for (let i = 0; i < this.spriteCount; i++) {
      const vertexOffset = i * 4 * 8;

      const x = this.vertexData[vertexOffset];
      const y = this.vertexData[vertexOffset + 1];
      const width = this.vertexData[vertexOffset + 8] - x;
      const height = this.vertexData[vertexOffset + 17] - y;

      ctx.drawImage(this.currentTexture, x, y, width, height);
    }

    this.clear();
  }

  /**
   * Clear batch
   */
  clear() {
    this.spriteCount = 0;
    this.currentTexture = null;
  }

  /**
   * Check if batch is full
   */
  isFull() {
    return this.spriteCount >= this.maxSprites;
  }

  /**
   * Get batch statistics
   */
  getStats() {
    return {
      spriteCount: this.spriteCount,
      maxSprites: this.maxSprites,
      hasTexture: !!this.currentTexture,
      isFull: this.isFull()
    };
  }
}

/**
 * Sprite Layer System
 *
 * Manages sprite rendering layers for complex 2D scenes.
 */
export class SpriteLayerSystem extends System {
  constructor() {
    super('SpriteLayerSystem', 5);
    this.setRequiredComponents('SpriteComponent', 'TransformComponent');

    // Layer management
    this.layers = new Map();
    this.defaultLayer = 0;
    this.maxLayers = 32;

    // Initialize default layer
    this.createLayer(0, 'Default');
  }

  /**
   * Create rendering layer
   */
  createLayer(id, name, options = {}) {
    if (this.layers.has(id)) return this.layers.get(id);

    const layer = {
      id,
      name,
      visible: options.visible !== false,
      opacity: options.opacity || 1.0,
      blendMode: options.blendMode || 'source-over',
      sprites: [],
      zIndex: options.zIndex || id
    };

    this.layers.set(id, layer);
    return layer;
  }

  /**
   * Get layer by ID
   */
  getLayer(id) {
    return this.layers.get(id) || null;
  }

  /**
   * Set layer visibility
   */
  setLayerVisible(id, visible) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(id, opacity) {
    const layer = this.getLayer(id);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * Add sprite to layer
   */
  addSpriteToLayer(entity) {
    const sprite = entity.getComponent('SpriteComponent');
    if (!sprite) return;

    const layerId = sprite.layer;
    let layer = this.getLayer(layerId);

    if (!layer) {
      layer = this.createLayer(layerId, `Layer ${layerId}`);
    }

    if (!layer.sprites.includes(entity)) {
      layer.sprites.push(entity);
    }
  }

  /**
   * Remove sprite from layer
   */
  removeSpriteFromLayer(entity) {
    const sprite = entity.getComponent('SpriteComponent');
    if (!sprite) return;

    const layer = this.getLayer(sprite.layer);
    if (layer) {
      const index = layer.sprites.indexOf(entity);
      if (index !== -1) {
        layer.sprites.splice(index, 1);
      }
    }
  }

  /**
   * Process entity
   */
  processEntity(entity, deltaTime) {
    this.addSpriteToLayer(entity);
  }

  /**
   * Render layers
   */
  render(renderer) {
    if (!renderer || !renderer.ctx) return;

    const ctx = renderer.ctx;

    // Sort layers by z-index
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer
    for (const layer of sortedLayers) {
      if (layer.sprites.length === 0) continue;

      // Set layer properties
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;

      // Sort sprites within layer
      const sortedSprites = layer.sprites.sort((a, b) => {
        const spriteA = a.getComponent('SpriteComponent');
        const spriteB = b.getComponent('SpriteComponent');
        return spriteA.sortingOrder - spriteB.sortingOrder;
      });

      // Render sprites
      for (const entity of sortedSprites) {
        const sprite = entity.getComponent('SpriteComponent');
        if (sprite.visible) {
          sprite.render(ctx);
        }
      }

      ctx.restore();
    }
  }

  /**
   * Get layer statistics
   */
  getLayerStats() {
    const stats = {
      layerCount: this.layers.size,
      layers: {}
    };

    for (const [id, layer] of this.layers) {
      stats.layers[id] = {
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        spriteCount: layer.sprites.length,
        zIndex: layer.zIndex
      };
    }

    return stats;
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      ...super.getStats(),
      ...this.getLayerStats()
    };
  }
}
