/**
 * Sprite Component
 *
 * Handles 2D sprite rendering with texture support, animation, and visual effects.
 * Integrates with the asset manager for texture loading and caching.
 */

import { Component } from './ECS.js';

export class SpriteComponent extends Component {
  constructor(texture = null, options = {}) {
    super('SpriteComponent');

    // Sprite properties
    this.texture = texture;
    this.width = options.width || 32;
    this.height = options.height || 32;
    this.pivotX = options.pivotX || 0.5; // 0-1 normalized pivot point
    this.pivotY = options.pivotY || 0.5;
    this.color = options.color || '#ffffff';
    this.alpha = options.alpha || 1.0;
    this.visible = options.visible !== false;

    // Animation properties
    this.animations = new Map();
    this.currentAnimation = null;
    this.animationFrame = 0;
    this.animationTime = 0;
    this.animationSpeed = options.animationSpeed || 1.0;
    this.loop = options.loop !== false;
    this.playing = false;

    // Visual effects
    this.flipX = false;
    this.flipY = false;
    this.tint = null;
    this.blendMode = 'source-over';

    // Rendering properties
    this.layer = options.layer || 0;
    this.sortingOrder = options.sortingOrder || 0;

    // Cached values
    this.lastFrameTime = 0;
  }

  /**
   * Set texture
   */
  setTexture(texture, width = null, height = null) {
    this.texture = texture;
    if (width !== null) this.width = width;
    if (height !== null) this.height = height;

    // Auto-size if texture is loaded
    if (texture && texture.width && texture.height && width === null && height === null) {
      this.width = texture.width;
      this.height = texture.height;
    }
  }

  /**
   * Load texture from asset manager
   */
  async loadTexture(assetKey, engine) {
    if (engine && engine.assetManager) {
      try {
        const texture = await engine.assetManager.loadAsset(assetKey, assetKey, 'image');
        this.setTexture(texture);
        return texture;
      } catch (error) {
        console.warn(`Failed to load sprite texture ${assetKey}:`, error);
      }
    }
    return null;
  }

  /**
   * Set sprite size
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set pivot point (0-1 normalized)
   */
  setPivot(x, y) {
    this.pivotX = Math.max(0, Math.min(1, x));
    this.pivotY = Math.max(0, Math.min(1, y));
  }

  /**
   * Set color tint
   */
  setColor(color) {
    this.color = color;
  }

  /**
   * Set alpha transparency
   */
  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Flip sprite horizontally
   */
  setFlipX(flip) {
    this.flipX = flip;
  }

  /**
   * Flip sprite vertically
   */
  setFlipY(flip) {
    this.flipY = flip;
  }

  /**
   * Set blend mode
   */
  setBlendMode(mode) {
    this.blendMode = mode;
  }

  /**
   * Add animation
   */
  addAnimation(name, frames, frameDuration = 100, options = {}) {
    this.animations.set(name, {
      frames: Array.isArray(frames) ? frames : [frames],
      frameDuration,
      loop: options.loop !== false,
      onComplete: options.onComplete || null,
      onFrame: options.onFrame || null
    });
  }

  /**
   * Play animation
   */
  playAnimation(name, options = {}) {
    const animation = this.animations.get(name);
    if (!animation) {
      console.warn(`Animation '${name}' not found`);
      return false;
    }

    this.currentAnimation = animation;
    this.animationFrame = options.startFrame || 0;
    this.animationTime = 0;
    this.animationSpeed = options.speed || 1.0;
    this.loop = options.loop !== undefined ? options.loop : animation.loop;
    this.playing = true;

    // Set initial frame
    this.setCurrentFrame();

    return true;
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    this.playing = false;
    this.currentAnimation = null;
    this.animationFrame = 0;
    this.animationTime = 0;
  }

  /**
   * Pause animation
   */
  pauseAnimation() {
    this.playing = false;
  }

  /**
   * Resume animation
   */
  resumeAnimation() {
    if (this.currentAnimation) {
      this.playing = true;
    }
  }

  /**
   * Set current animation frame
   */
  setAnimationFrame(frame) {
    if (this.currentAnimation && frame >= 0 && frame < this.currentAnimation.frames.length) {
      this.animationFrame = frame;
      this.setCurrentFrame();
    }
  }

  /**
   * Set current frame texture
   */
  setCurrentFrame() {
    if (this.currentAnimation && this.currentAnimation.frames[this.animationFrame]) {
      this.texture = this.currentAnimation.frames[this.animationFrame];
    }
  }

  /**
   * Get current animation name
   */
  getCurrentAnimation() {
    return this.currentAnimation ? Object.keys(this.animations).find(name =>
      this.animations.get(name) === this.currentAnimation
    ) : null;
  }

  /**
   * Check if animation is playing
   */
  isPlaying() {
    return this.playing;
  }

  /**
   * Get animation progress (0-1)
   */
  getAnimationProgress() {
    if (!this.currentAnimation) return 0;
    return this.animationFrame / (this.currentAnimation.frames.length - 1);
  }

  /**
   * Update animation
   */
  updateAnimation(deltaTime) {
    if (!this.playing || !this.currentAnimation) return;

    this.animationTime += deltaTime * this.animationSpeed;

    const frameDuration = this.currentAnimation.frameDuration;
    const totalFrames = this.currentAnimation.frames.length;

    // Check if it's time to advance frame
    if (this.animationTime >= frameDuration) {
      const framesToAdvance = Math.floor(this.animationTime / frameDuration);
      this.animationTime -= framesToAdvance * frameDuration;

      this.animationFrame += framesToAdvance;

      // Handle animation completion
      if (this.animationFrame >= totalFrames) {
        if (this.loop) {
          this.animationFrame = this.animationFrame % totalFrames;
        } else {
          this.animationFrame = totalFrames - 1;
          this.playing = false;

          // Call completion callback
          if (this.currentAnimation.onComplete) {
            this.currentAnimation.onComplete();
          }
        }
      }

      // Set new frame
      this.setCurrentFrame();

      // Call frame callback
      if (this.currentAnimation.onFrame) {
        this.currentAnimation.onFrame(this.animationFrame);
      }
    }
  }

  /**
   * Update component
   */
  update(deltaTime) {
    this.updateAnimation(deltaTime);
  }

  /**
   * Render sprite
   */
  render(renderer) {
    if (!this.visible || !this.texture || this.alpha <= 0) return;
    if (!this.entity || !this.entity.transform) return;

    const ctx = renderer.ctx;
    const transform = this.entity.transform;

    // Save context
    ctx.save();

    // Apply blend mode
    ctx.globalCompositeOperation = this.blendMode;

    // Get world position
    const worldPos = this.entity.getWorldPosition();
    const worldScale = this.entity.getWorldScale();
    const worldRotation = this.entity.getWorldRotation();

    // Apply transformations
    ctx.translate(worldPos.x, worldPos.y);
    ctx.rotate(worldRotation);
    ctx.scale(worldScale.x * (this.flipX ? -1 : 1), worldScale.y * (this.flipY ? -1 : 1));

    // Calculate draw position with pivot
    const drawX = -this.width * this.pivotX;
    const drawY = -this.height * this.pivotY;

    // Apply color tint and alpha
    ctx.globalAlpha = this.alpha;

    if (this.color !== '#ffffff') {
      // Create temporary canvas for tinting
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;

      // Draw original texture
      tempCtx.drawImage(this.texture, 0, 0, this.width, this.height);

      // Apply tint
      tempCtx.globalCompositeOperation = 'multiply';
      tempCtx.fillStyle = this.color;
      tempCtx.fillRect(0, 0, this.width, this.height);

      // Draw tinted texture
      ctx.drawImage(tempCanvas, drawX, drawY, this.width, this.height);
    } else {
      // Draw texture directly
      ctx.drawImage(this.texture, drawX, drawY, this.width, this.height);
    }

    // Restore context
    ctx.restore();
  }

  /**
   * Get sprite bounds for collision detection
   */
  getBounds() {
    if (!this.entity || !this.entity.transform) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const worldPos = this.entity.getWorldPosition();
    const worldScale = this.entity.getWorldScale();

    return {
      x: worldPos.x - (this.width * this.pivotX) * worldScale.x,
      y: worldPos.y - (this.height * this.pivotY) * worldScale.y,
      width: this.width * worldScale.x,
      height: this.height * worldScale.y
    };
  }

  /**
   * Check if point is inside sprite bounds
   */
  containsPoint(point) {
    const bounds = this.getBounds();
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  /**
   * Get sprite statistics
   */
  getStats() {
    return {
      visible: this.visible,
      hasTexture: !!this.texture,
      size: { width: this.width, height: this.height },
      pivot: { x: this.pivotX, y: this.pivotY },
      alpha: this.alpha,
      color: this.color,
      currentAnimation: this.getCurrentAnimation(),
      animationFrame: this.animationFrame,
      playing: this.playing,
      flipX: this.flipX,
      flipY: this.flipY,
      layer: this.layer,
      sortingOrder: this.sortingOrder
    };
  }
}
