/**
 * Physics Component
 *
 * Handles physics simulation, collision detection, and rigid body dynamics for entities.
 * Integrates with the physics system for efficient collision detection and response.
 */

import { Component } from './ECS.js';

export class PhysicsComponent extends Component {
  constructor(options = {}) {
    super('PhysicsComponent');

    // Physics properties
    this.mass = options.mass || 1.0;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.drag = options.drag || 0.1;
    this.angularDrag = options.angularDrag || 0.1;
    this.gravity = options.gravity || 0;
    this.bounce = options.bounce || 0.0;
    this.friction = options.friction || 0.0;

    // Collision properties
    this.collider = {
      type: options.colliderType || 'circle', // 'circle', 'rectangle', 'polygon'
      width: options.width || 32,
      height: options.height || 32,
      radius: options.radius || 16,
      vertices: options.vertices || null
    };

    this.collisionLayer = options.collisionLayer || 'default';
    this.collisionMask = options.collisionMask || ['default'];
    this.isTrigger = options.isTrigger || false;
    this.isStatic = options.isStatic || false;
    this.isKinematic = options.isKinematic || false;

    // Collision state
    this.isGrounded = false;
    this.onGround = false;
    this.colliding = new Set();
    this.collisionNormals = new Map();

    // Forces
    this.forces = new Map();
    this.impulses = [];

    // Cached values
    this.lastPosition = { x: 0, y: 0, z: 0 };
    this.lastRotation = 0;
  }

  /**
   * Set velocity
   */
  setVelocity(x, y, z = 0) {
    if (typeof x === 'object') {
      this.velocity.x = x.x || 0;
      this.velocity.y = x.y || 0;
      this.velocity.z = x.z || 0;
    } else {
      this.velocity.x = x;
      this.velocity.y = y;
      this.velocity.z = z;
    }
  }

  /**
   * Add velocity
   */
  addVelocity(dx, dy, dz = 0) {
    this.velocity.x += dx;
    this.velocity.y += dy;
    this.velocity.z += dz;
  }

  /**
   * Set acceleration
   */
  setAcceleration(x, y, z = 0) {
    if (typeof x === 'object') {
      this.acceleration.x = x.x || 0;
      this.acceleration.y = x.y || 0;
      this.acceleration.z = x.z || 0;
    } else {
      this.acceleration.x = x;
      this.acceleration.y = y;
      this.acceleration.z = z;
    }
  }

  /**
   * Add acceleration
   */
  addAcceleration(dx, dy, dz = 0) {
    this.acceleration.x += dx;
    this.acceleration.y += dy;
    this.acceleration.z += dz;
  }

  /**
   * Set angular velocity
   */
  setAngularVelocity(velocity) {
    this.angularVelocity = velocity;
  }

  /**
   * Add angular velocity
   */
  addAngularVelocity(delta) {
    this.angularVelocity += delta;
  }

  /**
   * Apply force
   */
  applyForce(force, duration = 0, name = null) {
    const forceName = name || `force_${Date.now()}`;
    this.forces.set(forceName, {
      force: { ...force },
      duration: duration,
      appliedTime: Date.now()
    });
  }

  /**
   * Apply impulse
   */
  applyImpulse(impulse) {
    this.impulses.push({ ...impulse });
  }

  /**
   * Remove force
   */
  removeForce(name) {
    this.forces.delete(name);
  }

  /**
   * Clear all forces
   */
  clearForces() {
    this.forces.clear();
  }

  /**
   * Set collider type and size
   */
  setCollider(type, options = {}) {
    this.collider.type = type;

    switch (type) {
      case 'circle':
        this.collider.radius = options.radius || 16;
        break;
      case 'rectangle':
        this.collider.width = options.width || 32;
        this.collider.height = options.height || 32;
        break;
      case 'polygon':
        this.collider.vertices = options.vertices || [];
        break;
    }
  }

  /**
   * Set collision layer
   */
  setCollisionLayer(layer) {
    this.collisionLayer = layer;
  }

  /**
   * Set collision mask
   */
  setCollisionMask(mask) {
    this.collisionMask = Array.isArray(mask) ? mask : [mask];
  }

  /**
   * Set as trigger
   */
  setTrigger(isTrigger) {
    this.isTrigger = isTrigger;
  }

  /**
   * Set as static
   */
  setStatic(isStatic) {
    this.isStatic = isStatic;
    if (isStatic) {
      this.velocity = { x: 0, y: 0, z: 0 };
      this.acceleration = { x: 0, y: 0, z: 0 };
    }
  }

  /**
   * Set as kinematic
   */
  setKinematic(isKinematic) {
    this.isKinematic = isKinematic;
  }

  /**
   * Get collider bounds
   */
  getBounds() {
    if (!this.entity || !this.entity.transform) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const worldPos = this.entity.getWorldPosition();
    const worldScale = this.entity.getWorldScale();

    switch (this.collider.type) {
      case 'circle':
        const radius = this.collider.radius * Math.max(worldScale.x, worldScale.y);
        return {
          x: worldPos.x - radius,
          y: worldPos.y - radius,
          width: radius * 2,
          height: radius * 2
        };
      case 'rectangle':
        return {
          x: worldPos.x - (this.collider.width * worldScale.x) / 2,
          y: worldPos.y - (this.collider.height * worldScale.y) / 2,
          width: this.collider.width * worldScale.x,
          height: this.collider.height * worldScale.y
        };
      default:
        return { x: worldPos.x, y: worldPos.y, width: 0, height: 0 };
    }
  }

  /**
   * Check collision with another physics component
   */
  checkCollision(other) {
    if (!this.entity || !other.entity) return null;

    const thisBounds = this.getBounds();
    const otherBounds = other.getBounds();

    // Quick AABB check
    if (thisBounds.x + thisBounds.width < otherBounds.x ||
        otherBounds.x + otherBounds.width < thisBounds.x ||
        thisBounds.y + thisBounds.height < otherBounds.y ||
        otherBounds.y + otherBounds.height < thisBounds.y) {
      return null;
    }

    // Detailed collision check based on collider types
    switch (this.collider.type + '_' + other.collider.type) {
      case 'circle_circle':
        return this.checkCircleCircleCollision(other);
      case 'circle_rectangle':
        return this.checkCircleRectangleCollision(other);
      case 'rectangle_rectangle':
        return this.checkRectangleRectangleCollision(other);
      default:
        return this.checkRectangleRectangleCollision(other);
    }
  }

  /**
   * Check circle-circle collision
   */
  checkCircleCircleCollision(other) {
    const thisPos = this.entity.getWorldPosition();
    const otherPos = other.entity.getWorldPosition();

    const dx = otherPos.x - thisPos.x;
    const dy = otherPos.y - thisPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const thisRadius = this.collider.radius * Math.max(this.entity.transform.scale.x, this.entity.transform.scale.y);
    const otherRadius = other.collider.radius * Math.max(other.entity.transform.scale.x, other.entity.transform.scale.y);

    if (distance < thisRadius + otherRadius) {
      return {
        collided: true,
        normal: { x: dx / distance, y: dy / distance },
        penetration: (thisRadius + otherRadius) - distance,
        point: {
          x: thisPos.x + (dx / distance) * thisRadius,
          y: thisPos.y + (dy / distance) * thisRadius
        }
      };
    }

    return null;
  }

  /**
   * Check circle-rectangle collision
   */
  checkCircleRectangleCollision(other) {
    const circlePos = this.entity.getWorldPosition();
    const rectBounds = other.getBounds();

    // Find closest point on rectangle to circle
    const closestX = Math.max(rectBounds.x, Math.min(circlePos.x, rectBounds.x + rectBounds.width));
    const closestY = Math.max(rectBounds.y, Math.min(circlePos.y, rectBounds.y + rectBounds.height));

    const dx = circlePos.x - closestX;
    const dy = circlePos.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radius = this.collider.radius * Math.max(this.entity.transform.scale.x, this.entity.transform.scale.y);

    if (distance < radius) {
      return {
        collided: true,
        normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: -1 },
        penetration: radius - distance,
        point: { x: closestX, y: closestY }
      };
    }

    return null;
  }

  /**
   * Check rectangle-rectangle collision
   */
  checkRectangleRectangleCollision(other) {
    const thisBounds = this.getBounds();
    const otherBounds = other.getBounds();

    // AABB collision
    const overlapX = Math.min(thisBounds.x + thisBounds.width, otherBounds.x + otherBounds.width) -
                    Math.max(thisBounds.x, otherBounds.x);
    const overlapY = Math.min(thisBounds.y + thisBounds.height, otherBounds.y + otherBounds.height) -
                    Math.max(thisBounds.y, otherBounds.y);

    if (overlapX > 0 && overlapY > 0) {
      // Determine collision normal based on smallest overlap
      let normal, penetration;
      if (overlapX < overlapY) {
        normal = thisBounds.x < otherBounds.x ? { x: -1, y: 0 } : { x: 1, y: 0 };
        penetration = overlapX;
      } else {
        normal = thisBounds.y < otherBounds.y ? { x: 0, y: -1 } : { x: 0, y: 1 };
        penetration = overlapY;
      }

      return {
        collided: true,
        normal,
        penetration,
        point: {
          x: Math.max(thisBounds.x, otherBounds.x) + overlapX / 2,
          y: Math.max(thisBounds.y, otherBounds.y) + overlapY / 2
        }
      };
    }

    return null;
  }

  /**
   * Resolve collision
   */
  resolveCollision(collision, other) {
    if (this.isStatic || this.isTrigger) return;

    const relativeVelocity = {
      x: this.velocity.x - (other.velocity?.x || 0),
      y: this.velocity.y - (other.velocity?.y || 0)
    };

    const velocityAlongNormal = relativeVelocity.x * collision.normal.x +
                               relativeVelocity.y * collision.normal.y;

    // Don't resolve if velocities are separating
    if (velocityAlongNormal > 0) return;

    // Calculate restitution
    const restitution = Math.min(this.bounce, other.bounce || 0);

    // Calculate impulse scalar
    let impulse = -(1 + restitution) * velocityAlongNormal;
    impulse /= (1 / this.mass) + (1 / (other.mass || 1));

    // Apply impulse
    const impulseVector = {
      x: impulse * collision.normal.x,
      y: impulse * collision.normal.y
    };

    this.velocity.x += impulseVector.x / this.mass;
    this.velocity.y += impulseVector.y / this.mass;

    // Positional correction
    const percent = 0.2; // Penetration percentage to correct
    const slop = 0.01; // Penetration allowance
    const correction = Math.max(collision.penetration - slop, 0) / (1 / this.mass + 1 / (other.mass || 1)) * percent;

    if (this.entity.transform) {
      this.entity.transform.translate(
        -correction * collision.normal.x / this.mass,
        -correction * collision.normal.y / this.mass
      );
    }
  }

  /**
   * Update physics
   */
  update(deltaTime) {
    if (!this.entity || !this.entity.transform || this.isStatic) return;

    const dt = deltaTime / 1000; // Convert to seconds
    const transform = this.entity.transform;

    // Store last position/rotation
    this.lastPosition = { ...transform.position };
    this.lastRotation = transform.rotation;

    // Apply forces
    let totalForce = { x: 0, y: 0, z: 0 };
    const now = Date.now();

    for (const [name, forceData] of this.forces) {
      totalForce.x += forceData.force.x;
      totalForce.y += forceData.force.y;
      totalForce.z += forceData.force.z;

      // Remove expired forces
      if (forceData.duration > 0 && now - forceData.appliedTime >= forceData.duration) {
        this.forces.delete(name);
      }
    }

    // Apply impulses
    for (const impulse of this.impulses) {
      this.velocity.x += impulse.x / this.mass;
      this.velocity.y += impulse.y / this.mass;
      this.velocity.z += impulse.z / this.mass;
    }
    this.impulses = [];

    // Apply gravity
    if (this.gravity !== 0) {
      totalForce.y += this.gravity * this.mass;
    }

    // Update acceleration
    this.acceleration.x = totalForce.x / this.mass;
    this.acceleration.y = totalForce.y / this.mass;
    this.acceleration.z = totalForce.z / this.mass;

    // Update velocity
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;
    this.velocity.z += this.acceleration.z * dt;

    // Apply drag
    this.velocity.x *= (1 - this.drag);
    this.velocity.y *= (1 - this.drag);
    this.velocity.z *= (1 - this.drag);

    // Update angular velocity
    this.angularVelocity += this.angularAcceleration * dt;
    this.angularVelocity *= (1 - this.angularDrag);

    // Update position
    if (!this.isKinematic) {
      transform.translate(
        this.velocity.x * dt,
        this.velocity.y * dt,
        this.velocity.z * dt
      );

      // Update rotation
      if (this.angularVelocity !== 0) {
        transform.rotate(this.angularVelocity * dt);
      }
    }

    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;
    this.angularAcceleration = 0;

    // Update collision state
    this.updateCollisionState();
  }

  /**
   * Update collision state
   */
  updateCollisionState() {
    this.isGrounded = false;
    this.onGround = false;

    // Check ground collision (simple check)
    if (this.entity && this.entity.scene) {
      const scene = this.entity.scene;
      const physicsComponents = scene.findEntitiesWithComponent('PhysicsComponent');

      for (const otherEntity of physicsComponents) {
        if (otherEntity === this.entity) continue;

        const otherPhysics = otherEntity.getComponent('PhysicsComponent');
        if (!otherPhysics) continue;

        const collision = this.checkCollision(otherPhysics);
        if (collision) {
          this.colliding.add(otherEntity);

          // Check if collision is with ground (below entity)
          if (collision.normal.y < -0.5) {
            this.isGrounded = true;
            this.onGround = true;
          }

          // Resolve collision if not a trigger
          if (!this.isTrigger && !otherPhysics.isTrigger) {
            this.resolveCollision(collision, otherPhysics);
          }
        } else {
          this.colliding.delete(otherEntity);
        }
      }
    }
  }

  /**
   * Check if entity is moving
   */
  isMoving() {
    const threshold = 0.01;
    return Math.abs(this.velocity.x) > threshold ||
           Math.abs(this.velocity.y) > threshold ||
           Math.abs(this.velocity.z) > threshold;
  }

  /**
   * Stop movement
   */
  stop() {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.angularVelocity = 0;
  }

  /**
   * Get physics statistics
   */
  getStats() {
    return {
      mass: this.mass,
      velocity: { ...this.velocity },
      acceleration: { ...this.acceleration },
      angularVelocity: this.angularVelocity,
      isStatic: this.isStatic,
      isKinematic: this.isKinematic,
      isTrigger: this.isTrigger,
      isGrounded: this.isGrounded,
      onGround: this.onGround,
      collidingCount: this.colliding.size,
      forcesCount: this.forces.size,
      colliderType: this.collider.type,
      collisionLayer: this.collisionLayer
    };
  }
}
