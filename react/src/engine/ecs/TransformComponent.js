/**
 * Transform Component
 *
 * Handles position, rotation, and scale transformations for entities.
 * Supports both 2D and 3D transformations with hierarchical parenting.
 */

import { Component } from './ECS.js';

export class TransformComponent extends Component {
  constructor(position = { x: 0, y: 0, z: 0 }, rotation = 0, scale = { x: 1, y: 1, z: 1 }) {
    super('TransformComponent');
    this.position = { ...position };
    this.rotation = rotation;
    this.scale = { ...scale };

    // Cached transformation matrices
    this.localMatrix = this.createIdentityMatrix();
    this.worldMatrix = this.createIdentityMatrix();
    this.matrixDirty = true;

    // Previous transform for interpolation
    this.previousPosition = { ...this.position };
    this.previousRotation = this.rotation;
    this.previousScale = { ...this.scale };
  }

  /**
   * Create identity matrix
   */
  createIdentityMatrix() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  /**
   * Set position
   */
  setPosition(x, y, z = 0) {
    if (typeof x === 'object') {
      this.position.x = x.x || 0;
      this.position.y = x.y || 0;
      this.position.z = x.z || 0;
    } else {
      this.position.x = x;
      this.position.y = y;
      this.position.z = z;
    }
    this.matrixDirty = true;
  }

  /**
   * Translate position
   */
  translate(dx, dy, dz = 0) {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
    this.matrixDirty = true;
  }

  /**
   * Set rotation (in radians)
   */
  setRotation(rotation) {
    this.rotation = rotation;
    this.matrixDirty = true;
  }

  /**
   * Rotate by angle (in radians)
   */
  rotate(angle) {
    this.rotation += angle;
    this.matrixDirty = true;
  }

  /**
   * Set scale
   */
  setScale(x, y, z = 1) {
    if (typeof x === 'object') {
      this.scale.x = x.x || 1;
      this.scale.y = x.y || 1;
      this.scale.z = x.z || 1;
    } else {
      this.scale.x = x;
      this.scale.y = y;
      this.scale.z = z;
    }
    this.matrixDirty = true;
  }

  /**
   * Scale by factor
   */
  scaleBy(factorX, factorY, factorZ = 1) {
    this.scale.x *= factorX;
    this.scale.y *= factorY;
    this.scale.z *= factorZ;
    this.matrixDirty = true;
  }

  /**
   * Get forward vector
   */
  getForward() {
    return {
      x: Math.cos(this.rotation),
      y: Math.sin(this.rotation),
      z: 0
    };
  }

  /**
   * Get right vector
   */
  getRight() {
    return {
      x: Math.cos(this.rotation + Math.PI / 2),
      y: Math.sin(this.rotation + Math.PI / 2),
      z: 0
    };
  }

  /**
   * Get up vector
   */
  getUp() {
    return { x: 0, y: 0, z: 1 };
  }

  /**
   * Look at target position
   */
  lookAt(targetX, targetY) {
    if (typeof targetX === 'object') {
      const dx = targetX.x - this.position.x;
      const dy = targetX.y - this.position.y;
      this.rotation = Math.atan2(dy, dx);
    } else {
      const dx = targetX - this.position.x;
      const dy = targetY - this.position.y;
      this.rotation = Math.atan2(dy, dx);
    }
    this.matrixDirty = true;
  }

  /**
   * Get distance to another transform
   */
  distanceTo(other) {
    const dx = other.position.x - this.position.x;
    const dy = other.position.y - this.position.y;
    const dz = other.position.z - this.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get squared distance to another transform (faster, no sqrt)
   */
  distanceSquaredTo(other) {
    const dx = other.position.x - this.position.x;
    const dy = other.position.y - this.position.y;
    const dz = other.position.z - this.position.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Check if point is within range
   */
  isWithinRange(point, range) {
    return this.distanceSquaredTo({ position: point }) <= range * range;
  }

  /**
   * Update transformation matrices
   */
  updateMatrices() {
    if (!this.matrixDirty) return;

    // Update local transformation matrix
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    this.localMatrix = [
      this.scale.x * cos, -this.scale.y * sin, 0, this.position.x,
      this.scale.x * sin, this.scale.y * cos, 0, this.position.y,
      0, 0, this.scale.z, this.position.z,
      0, 0, 0, 1
    ];

    // Update world matrix if entity has parent
    if (this.entity && this.entity.parent && this.entity.parent.transform) {
      const parentMatrix = this.entity.parent.transform.worldMatrix;
      this.worldMatrix = this.multiplyMatrices(parentMatrix, this.localMatrix);
    } else {
      this.worldMatrix = [...this.localMatrix];
    }

    this.matrixDirty = false;
  }

  /**
   * Multiply two 4x4 matrices
   */
  multiplyMatrices(a, b) {
    const result = new Array(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 0;
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }

    return result;
  }

  /**
   * Transform point by this transform
   */
  transformPoint(point) {
    this.updateMatrices();

    const x = point.x * this.worldMatrix[0] + point.y * this.worldMatrix[4] + point.z * this.worldMatrix[8] + this.worldMatrix[12];
    const y = point.x * this.worldMatrix[1] + point.y * this.worldMatrix[5] + point.z * this.worldMatrix[9] + this.worldMatrix[13];
    const z = point.x * this.worldMatrix[2] + point.y * this.worldMatrix[6] + point.z * this.worldMatrix[10] + this.worldMatrix[14];

    return { x, y, z };
  }

  /**
   * Inverse transform point
   */
  inverseTransformPoint(point) {
    // For now, simple inverse for 2D transforms
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);

    const localX = point.x - this.position.x;
    const localY = point.y - this.position.y;

    const worldX = localX * cos - localY * sin;
    const worldY = localX * sin + localY * cos;

    return {
      x: worldX / this.scale.x,
      y: worldY / this.scale.y,
      z: point.z - this.position.z
    };
  }

  /**
   * Interpolate between current and target transform
   */
  interpolate(target, t) {
    // Store previous values
    this.previousPosition = { ...this.position };
    this.previousRotation = this.rotation;
    this.previousScale = { ...this.scale };

    // Interpolate position
    this.position.x += (target.position.x - this.position.x) * t;
    this.position.y += (target.position.y - this.position.y) * t;
    this.position.z += (target.position.z - this.position.z) * t;

    // Interpolate rotation (handle angle wrapping)
    let angleDiff = target.rotation - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    this.rotation += angleDiff * t;

    // Interpolate scale
    this.scale.x += (target.scale.x - this.scale.x) * t;
    this.scale.y += (target.scale.y - this.scale.y) * t;
    this.scale.z += (target.scale.z - this.scale.z) * t;

    this.matrixDirty = true;
  }

  /**
   * Copy transform from another transform
   */
  copyFrom(other) {
    this.position = { ...other.position };
    this.rotation = other.rotation;
    this.scale = { ...other.scale };
    this.matrixDirty = true;
  }

  /**
   * Reset to identity transform
   */
  reset() {
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = 0;
    this.scale = { x: 1, y: 1, z: 1 };
    this.matrixDirty = true;
  }

  /**
   * Update component
   */
  update(deltaTime) {
    // Update matrices if needed
    this.updateMatrices();
  }

  /**
   * Get transform statistics
   */
  getStats() {
    return {
      position: { ...this.position },
      rotation: this.rotation,
      scale: { ...this.scale },
      matrixDirty: this.matrixDirty,
      hasParent: !!(this.entity && this.entity.parent)
    };
  }
}
