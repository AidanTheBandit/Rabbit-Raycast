# Physics System

Comprehensive guide to Rabbit-Raycast's physics simulation, collision detection, and rigid body dynamics.

## ⚡ Physics Engine Overview

### Core Components

Rabbit-Raycast's physics system consists of:

- **Rigid Bodies**: Objects with mass, velocity, and physical properties
- **Colliders**: Shapes that define collision boundaries
- **Constraints**: Joints and connections between bodies
- **Forces**: Gravity, friction, and applied forces
- **Collision Detection**: Broad and narrow phase detection
- **Solver**: Resolves collisions and constraints

### Basic Physics Setup

```javascript
import { PhysicsSystem, RigidBodyComponent, BoxColliderComponent } from '../ecs/PhysicsSystem.js';

// Create physics system
const physicsSystem = new PhysicsSystem({
  gravity: { x: 0, y: 9.81 },
  substeps: 8,
  baumgarte: 0.2
});

// Add to engine
engine.addSystem(physicsSystem);

// Create a physics object
const box = new Entity('Box');
box.addComponent(new TransformComponent({ x: 100, y: 100 }));

// Add physics components
box.addComponent(new RigidBodyComponent({
  mass: 1.0,
  velocity: { x: 5, y: 0 },
  angularVelocity: 0.5
}));

box.addComponent(new BoxColliderComponent({
  width: 32,
  height: 32,
  friction: 0.3,
  restitution: 0.8
}));

scene.addEntity(box);
```

## 🏗️ Rigid Body Physics

### RigidBody Component

```javascript
class RigidBodyComponent extends Component {
  constructor(options = {}) {
    super('RigidBodyComponent');

    // Physical properties
    this.mass = options.mass || 1.0;
    this.inverseMass = 1.0 / this.mass;

    // Motion
    this.velocity = { x: 0, y: 0 };
    this.angularVelocity = 0;
    this.force = { x: 0, y: 0 };
    this.torque = 0;

    // Material properties
    this.friction = options.friction || 0.3;
    this.restitution = options.restitution || 0.8;
    this.linearDamping = options.linearDamping || 0.99;
    this.angularDamping = options.angularDamping || 0.99;

    // State
    this.isKinematic = options.isKinematic || false;
    this.isStatic = options.isStatic || false;
    this.sleeping = false;

    // Integration
    this.previousPosition = { x: 0, y: 0 };
    this.previousRotation = 0;
  }

  applyForce(force, point = null) {
    if (this.isStatic) return;

    // Add linear force
    this.force.x += force.x;
    this.force.y += force.y;

    // Add torque if force is applied at a point
    if (point) {
      const r = {
        x: point.x - this.entity.transform.position.x,
        y: point.y - this.entity.transform.position.y
      };

      this.torque += r.x * force.y - r.y * force.x;
    }
  }

  applyImpulse(impulse, point = null) {
    if (this.isStatic) return;

    // Apply instant linear impulse
    this.velocity.x += impulse.x * this.inverseMass;
    this.velocity.y += impulse.y * this.inverseMass;

    // Apply angular impulse
    if (point) {
      const r = {
        x: point.x - this.entity.transform.position.x,
        y: point.y - this.entity.transform.position.y
      };

      const angularImpulse = r.x * impulse.y - r.y * impulse.x;
      this.angularVelocity += angularImpulse * this.inverseMass;
    }
  }

  getKineticEnergy() {
    const linearKE = 0.5 * this.mass * (this.velocity.x ** 2 + this.velocity.y ** 2);
    const angularKE = 0.5 * this.mass * (this.angularVelocity ** 2);
    return linearKE + angularKE;
  }

  update(deltaTime) {
    if (this.isStatic || this.sleeping) return;

    // Store previous state for collision resolution
    this.previousPosition.x = this.entity.transform.position.x;
    this.previousPosition.y = this.entity.transform.position.y;
    this.previousRotation = this.entity.transform.rotation;

    // Apply damping
    this.velocity.x *= this.linearDamping;
    this.velocity.y *= this.linearDamping;
    this.angularVelocity *= this.angularDamping;

    // Wake up if moving
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01) {
      this.sleeping = false;
    }
  }
}
```

### Physics Integration

```javascript
class PhysicsIntegrator {
  static integrate(body, deltaTime) {
    if (body.isStatic) return;

    const transform = body.entity.transform;

    // Verlet integration for stability
    const newPosition = {
      x: 2 * transform.position.x - body.previousPosition.x + body.force.x * deltaTime * deltaTime * body.inverseMass,
      y: 2 * transform.position.y - body.previousPosition.y + body.force.y * deltaTime * deltaTime * body.inverseMass
    };

    const newRotation = 2 * transform.rotation - body.previousRotation + body.torque * deltaTime * deltaTime * body.inverseMass;

    // Update velocity
    body.velocity.x = (newPosition.x - body.previousPosition.x) / (2 * deltaTime);
    body.velocity.y = (newPosition.y - body.previousPosition.y) / (2 * deltaTime);
    body.angularVelocity = (newRotation - body.previousRotation) / (2 * deltaTime);

    // Update transform
    transform.position.x = newPosition.x;
    transform.position.y = newPosition.y;
    transform.rotation = newRotation;

    // Clear forces
    body.force.x = 0;
    body.force.y = 0;
    body.torque = 0;
  }

  static integrateEuler(body, deltaTime) {
    if (body.isStatic) return;

    const transform = body.entity.transform;

    // Simple Euler integration
    transform.position.x += body.velocity.x * deltaTime;
    transform.position.y += body.velocity.y * deltaTime;
    transform.rotation += body.angularVelocity * deltaTime;

    // Update velocity with forces
    body.velocity.x += body.force.x * body.inverseMass * deltaTime;
    body.velocity.y += body.force.y * body.inverseMass * deltaTime;
    body.angularVelocity += body.torque * body.inverseMass * deltaTime;

    // Clear forces
    body.force.x = 0;
    body.force.y = 0;
    body.torque = 0;
  }
}
```

## 🔷 Collision Detection

### Collider Shapes

```javascript
class ColliderComponent extends Component {
  constructor(options = {}) {
    super('ColliderComponent');
    this.isTrigger = options.isTrigger || false;
    this.collisionLayer = options.collisionLayer || 'default';
    this.collisionMask = options.collisionMask || ['default'];
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
  }

  getBounds() {
    // Override in subclasses
    return this.bounds;
  }

  containsPoint(point) {
    // Override in subclasses
    return false;
  }

  raycast(ray) {
    // Override in subclasses
    return null;
  }
}

class CircleColliderComponent extends ColliderComponent {
  constructor(options = {}) {
    super(options);
    this.radius = options.radius || 16;
    this.offset = options.offset || { x: 0, y: 0 };
  }

  getBounds() {
    const transform = this.entity.transform;
    const centerX = transform.position.x + this.offset.x;
    const centerY = transform.position.y + this.offset.y;

    return {
      x: centerX - this.radius,
      y: centerY - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  containsPoint(point) {
    const transform = this.entity.transform;
    const centerX = transform.position.x + this.offset.x;
    const centerY = transform.position.y + this.offset.y;

    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.radius;
  }

  raycast(ray) {
    // Circle-ray intersection
    const transform = this.entity.transform;
    const center = {
      x: transform.position.x + this.offset.x,
      y: transform.position.y + this.offset.y
    };

    const toCenter = {
      x: center.x - ray.origin.x,
      y: center.y - ray.origin.y
    };

    const t = this.dot(toCenter, ray.direction);
    const d = this.dot(toCenter, toCenter) - t * t;

    if (d > this.radius * this.radius) return null;

    const dt = Math.sqrt(this.radius * this.radius - d);
    const t1 = t - dt;
    const t2 = t + dt;

    if (t1 > 0) return t1;
    if (t2 > 0) return t2;
    return null;
  }

  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }
}

class BoxColliderComponent extends ColliderComponent {
  constructor(options = {}) {
    super(options);
    this.width = options.width || 32;
    this.height = options.height || 32;
    this.offset = options.offset || { x: 0, y: 0 };
  }

  getBounds() {
    const transform = this.entity.transform;
    const centerX = transform.position.x + this.offset.x;
    const centerY = transform.position.y + this.offset.y;

    return {
      x: centerX - this.width / 2,
      y: centerY - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  containsPoint(point) {
    const bounds = this.getBounds();
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  raycast(ray) {
    const bounds = this.getBounds();

    // AABB-ray intersection
    const invDir = {
      x: 1 / ray.direction.x,
      y: 1 / ray.direction.y
    };

    const t1 = (bounds.x - ray.origin.x) * invDir.x;
    const t2 = (bounds.x + bounds.width - ray.origin.x) * invDir.x;
    const t3 = (bounds.y - ray.origin.y) * invDir.y;
    const t4 = (bounds.y + bounds.height - ray.origin.y) * invDir.y;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tmax < 0 || tmin > tmax) return null;
    return tmin > 0 ? tmin : tmax;
  }
}

class PolygonColliderComponent extends ColliderComponent {
  constructor(options = {}) {
    super(options);
    this.vertices = options.vertices || this.createBoxVertices(options.width || 32, options.height || 32);
    this.offset = options.offset || { x: 0, y: 0 };
  }

  createBoxVertices(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];
  }

  getWorldVertices() {
    const transform = this.entity.transform;
    const cos = Math.cos(transform.rotation);
    const sin = Math.sin(transform.rotation);

    return this.vertices.map(vertex => {
      // Rotate vertex
      const rotatedX = vertex.x * cos - vertex.y * sin;
      const rotatedY = vertex.x * sin + vertex.y * cos;

      // Translate to world position
      return {
        x: rotatedX + transform.position.x + this.offset.x,
        y: rotatedY + transform.position.y + this.offset.y
      };
    });
  }

  containsPoint(point) {
    const vertices = this.getWorldVertices();
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
          (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) /
           (vertices[j].y - vertices[i].y) + vertices[i].x)) {
        inside = !inside;
      }
    }

    return inside;
  }
}
```

### Broad Phase Collision Detection

```javascript
class BroadPhaseCollisionDetector {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  addCollider(collider) {
    const bounds = collider.getBounds();
    const cells = this.getCellsForBounds(bounds);

    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(collider);
    }
  }

  removeCollider(collider) {
    const bounds = collider.getBounds();
    const cells = this.getCellsForBounds(bounds);

    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(collider);
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    }
  }

  getPotentialCollisions() {
    const pairs = new Set();

    for (const [cellKey, colliders] of this.grid) {
      const colliderArray = Array.from(colliders);

      // Check collisions within cell
      for (let i = 0; i < colliderArray.length; i++) {
        for (let j = i + 1; j < colliderArray.length; j++) {
          const colliderA = colliderArray[i];
          const colliderB = colliderArray[j];

          if (this.shouldCheckCollision(colliderA, colliderB)) {
            pairs.add([colliderA, colliderB]);
          }
        }
      }
    }

    return pairs;
  }

  getCellsForBounds(bounds) {
    const cells = new Set();

    const startX = Math.floor(bounds.x / this.cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const startY = Math.floor(bounds.y / this.cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.add(`${x},${y}`);
      }
    }

    return cells;
  }

  shouldCheckCollision(colliderA, colliderB) {
    // Skip if same entity
    if (colliderA.entity === colliderB.entity) return false;

    // Check collision layers/masks
    return colliderA.collisionMask.includes(colliderB.collisionLayer) &&
           colliderB.collisionMask.includes(colliderA.collisionLayer);
  }

  clear() {
    this.grid.clear();
  }
}
```

### Narrow Phase Collision Detection

```javascript
class NarrowPhaseCollisionDetector {
  static detectCollision(colliderA, colliderB) {
    const typeA = colliderA.constructor.name;
    const typeB = colliderB.constructor.name;

    // Circle vs Circle
    if (typeA === 'CircleColliderComponent' && typeB === 'CircleColliderComponent') {
      return this.circleVsCircle(colliderA, colliderB);
    }

    // Circle vs Box
    if ((typeA === 'CircleColliderComponent' && typeB === 'BoxColliderComponent') ||
        (typeA === 'BoxColliderComponent' && typeB === 'CircleColliderComponent')) {
      const circle = typeA === 'CircleColliderComponent' ? colliderA : colliderB;
      const box = typeA === 'BoxColliderComponent' ? colliderA : colliderB;
      return this.circleVsBox(circle, box);
    }

    // Box vs Box
    if (typeA === 'BoxColliderComponent' && typeB === 'BoxColliderComponent') {
      return this.boxVsBox(colliderA, colliderB);
    }

    // Polygon collisions
    if (typeA === 'PolygonColliderComponent' || typeB === 'PolygonColliderComponent') {
      return this.polygonVsShape(colliderA, colliderB);
    }

    return null;
  }

  static circleVsCircle(circleA, circleB) {
    const transformA = circleA.entity.transform;
    const transformB = circleB.entity.transform;

    const centerA = {
      x: transformA.position.x + circleA.offset.x,
      y: transformA.position.y + circleA.offset.y
    };

    const centerB = {
      x: transformB.position.x + circleB.offset.x,
      y: transformB.position.y + circleB.offset.y
    };

    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const sumRadius = circleA.radius + circleB.radius;

    if (distance >= sumRadius) return null;

    const penetration = sumRadius - distance;
    const normal = {
      x: dx / distance,
      y: dy / distance
    };

    const contactPoint = {
      x: centerA.x + normal.x * circleA.radius,
      y: centerA.y + normal.y * circleA.radius
    };

    return {
      colliderA: circleA,
      colliderB: circleB,
      penetration: penetration,
      normal: normal,
      contactPoint: contactPoint
    };
  }

  static circleVsBox(circle, box) {
    const transform = circle.entity.transform;
    const circleCenter = {
      x: transform.position.x + circle.offset.x,
      y: transform.position.y + circle.offset.y
    };

    const boxBounds = box.getBounds();

    // Find closest point on box to circle
    const closest = {
      x: Math.max(boxBounds.x, Math.min(circleCenter.x, boxBounds.x + boxBounds.width)),
      y: Math.max(boxBounds.y, Math.min(circleCenter.y, boxBounds.y + boxBounds.height))
    };

    const dx = circleCenter.x - closest.x;
    const dy = circleCenter.y - closest.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= circle.radius) return null;

    const penetration = circle.radius - distance;
    const normal = distance > 0 ? {
      x: dx / distance,
      y: dy / distance
    } : { x: 0, y: 1 }; // Default normal if centers coincide

    return {
      colliderA: circle,
      colliderB: box,
      penetration: penetration,
      normal: normal,
      contactPoint: closest
    };
  }

  static boxVsBox(boxA, boxB) {
    const boundsA = boxA.getBounds();
    const boundsB = boxB.getBounds();

    // AABB collision detection
    if (boundsA.x + boundsA.width <= boundsB.x ||
        boundsB.x + boundsB.width <= boundsA.x ||
        boundsA.y + boundsA.height <= boundsB.y ||
        boundsB.y + boundsB.height <= boundsA.y) {
      return null;
    }

    // Calculate overlap
    const overlapX = Math.min(boundsA.x + boundsA.width - boundsB.x, boundsB.x + boundsB.width - boundsA.x);
    const overlapY = Math.min(boundsA.y + boundsA.height - boundsB.y, boundsB.y + boundsB.height - boundsA.y);

    let penetration, normal;

    if (overlapX < overlapY) {
      penetration = overlapX;
      normal = {
        x: boundsA.x < boundsB.x ? -1 : 1,
        y: 0
      };
    } else {
      penetration = overlapY;
      normal = {
        x: 0,
        y: boundsA.y < boundsB.y ? -1 : 1
      };
    }

    const contactPoint = {
      x: Math.max(boundsA.x, boundsB.x) + penetration / 2,
      y: Math.max(boundsA.y, boundsB.y) + penetration / 2
    };

    return {
      colliderA: boxA,
      colliderB: boxB,
      penetration: penetration,
      normal: normal,
      contactPoint: contactPoint
    };
  }

  static polygonVsShape(colliderA, colliderB) {
    // SAT (Separating Axis Theorem) implementation
    const polygon = colliderA.constructor.name === 'PolygonColliderComponent' ? colliderA : colliderB;
    const other = colliderA === polygon ? colliderB : colliderA;

    const verticesA = polygon.getWorldVertices();
    const verticesB = other.constructor.name === 'PolygonColliderComponent' ?
      other.getWorldVertices() : [other.getBounds()];

    // Get all axes to test
    const axes = this.getAxes(verticesA, verticesB);

    let minPenetration = Infinity;
    let minAxis = null;

    for (const axis of axes) {
      const projectionA = this.project(verticesA, axis);
      const projectionB = this.project(verticesB, axis);

      if (!this.overlap(projectionA, projectionB)) {
        return null; // No collision
      }

      const penetration = this.getPenetration(projectionA, projectionB);
      if (penetration < minPenetration) {
        minPenetration = penetration;
        minAxis = axis;
      }
    }

    return {
      colliderA: colliderA,
      colliderB: colliderB,
      penetration: minPenetration,
      normal: minAxis,
      contactPoint: this.findContactPoint(verticesA, verticesB)
    };
  }

  static getAxes(verticesA, verticesB) {
    const axes = [];

    // Add axes from first polygon
    for (let i = 0; i < verticesA.length; i++) {
      const j = (i + 1) % verticesA.length;
      const edge = {
        x: verticesA[j].x - verticesA[i].x,
        y: verticesA[j].y - verticesA[i].y
      };
      axes.push(this.normalize({ x: -edge.y, y: edge.x }));
    }

    // Add axes from second polygon
    for (let i = 0; i < verticesB.length; i++) {
      const j = (i + 1) % verticesB.length;
      const edge = {
        x: verticesB[j].x - verticesB[i].x,
        y: verticesB[j].y - verticesB[i].y
      };
      axes.push(this.normalize({ x: -edge.y, y: edge.x }));
    }

    return axes;
  }

  static normalize(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }

  static project(vertices, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const vertex of vertices) {
      const projection = vertex.x * axis.x + vertex.y * axis.y;
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }

    return { min, max };
  }

  static overlap(projectionA, projectionB) {
    return projectionA.max >= projectionB.min && projectionB.max >= projectionA.min;
  }

  static getPenetration(projectionA, projectionB) {
    if (projectionA.max > projectionB.max) {
      return projectionB.max - projectionA.min;
    } else {
      return projectionA.max - projectionB.min;
    }
  }

  static findContactPoint(verticesA, verticesB) {
    // Find average of intersecting vertices
    let contactX = 0;
    let contactY = 0;
    let count = 0;

    for (const vertex of verticesA) {
      if (this.pointInPolygon(vertex, verticesB)) {
        contactX += vertex.x;
        contactY += vertex.y;
        count++;
      }
    }

    for (const vertex of verticesB) {
      if (this.pointInPolygon(vertex, verticesA)) {
        contactX += vertex.x;
        contactY += vertex.y;
        count++;
      }
    }

    return count > 0 ? {
      x: contactX / count,
      y: contactY / count
    } : { x: 0, y: 0 };
  }

  static pointInPolygon(point, vertices) {
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
          (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) /
           (vertices[j].y - vertices[i].y) + vertices[i].x)) {
        inside = !inside;
      }
    }

    return inside;
  }
}
```

## 🔧 Collision Resolution

### Impulse-Based Resolution

```javascript
class CollisionResolver {
  static resolveCollision(collision, restitution = 0.8) {
    const bodyA = collision.colliderA.entity.getComponent('RigidBodyComponent');
    const bodyB = collision.colliderB.entity.getComponent('RigidBodyComponent');

    if (!bodyA || !bodyB) return;
    if (bodyA.isStatic && bodyB.isStatic) return;

    // Separate bodies
    this.separateBodies(collision, bodyA, bodyB);

    // Calculate relative velocity
    const relativeVelocity = {
      x: bodyB.velocity.x - bodyA.velocity.x,
      y: bodyB.velocity.y - bodyA.velocity.y
    };

    // Calculate relative velocity along collision normal
    const velocityAlongNormal = this.dot(relativeVelocity, collision.normal);

    // Don't resolve if velocities are separating
    if (velocityAlongNormal > 0) return;

    // Calculate restitution
    const e = Math.min(bodyA.restitution, bodyB.restitution);

    // Calculate impulse scalar
    let impulseScalar = -(1 + e) * velocityAlongNormal;
    impulseScalar /= bodyA.inverseMass + bodyB.inverseMass;

    // Apply impulse
    const impulse = {
      x: impulseScalar * collision.normal.x,
      y: impulseScalar * collision.normal.y
    };

    if (!bodyA.isStatic) {
      bodyA.velocity.x -= impulse.x * bodyA.inverseMass;
      bodyA.velocity.y -= impulse.y * bodyA.inverseMass;
    }

    if (!bodyB.isStatic) {
      bodyB.velocity.x += impulse.x * bodyB.inverseMass;
      bodyB.velocity.y += impulse.y * bodyB.inverseMass;
    }

    // Apply friction
    this.applyFriction(collision, bodyA, bodyB, impulseScalar);
  }

  static separateBodies(collision, bodyA, bodyB) {
    const totalInverseMass = bodyA.inverseMass + bodyB.inverseMass;

    if (totalInverseMass === 0) return; // Both static

    const separation = collision.penetration / totalInverseMass;

    const separationVector = {
      x: collision.normal.x * separation,
      y: collision.normal.y * separation
    };

    if (!bodyA.isStatic) {
      bodyA.entity.transform.position.x -= separationVector.x * bodyA.inverseMass;
      bodyA.entity.transform.position.y -= separationVector.y * bodyA.inverseMass;
    }

    if (!bodyB.isStatic) {
      bodyB.entity.transform.position.x += separationVector.x * bodyB.inverseMass;
      bodyB.entity.transform.position.y += separationVector.y * bodyB.inverseMass;
    }
  }

  static applyFriction(collision, bodyA, bodyB, normalImpulse) {
    // Calculate relative velocity
    const relativeVelocity = {
      x: bodyB.velocity.x - bodyA.velocity.x,
      y: bodyB.velocity.y - bodyA.velocity.y
    };

    // Calculate tangent vector
    const tangent = {
      x: relativeVelocity.x - this.dot(relativeVelocity, collision.normal) * collision.normal.x,
      y: relativeVelocity.y - this.dot(relativeVelocity, collision.normal) * collision.normal.y
    };

    const tangentLength = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
    if (tangentLength < 0.001) return; // No tangential velocity

    // Normalize tangent
    tangent.x /= tangentLength;
    tangent.y /= tangentLength;

    // Calculate friction impulse
    const frictionImpulse = this.dot(relativeVelocity, tangent) / (bodyA.inverseMass + bodyB.inverseMass);
    const friction = Math.min(bodyA.friction, bodyB.friction);
    const maxFriction = friction * normalImpulse;

    let frictionScalar = -Math.max(-maxFriction, Math.min(frictionImpulse, maxFriction));

    // Apply friction impulse
    const frictionVector = {
      x: frictionScalar * tangent.x,
      y: frictionScalar * tangent.y
    };

    if (!bodyA.isStatic) {
      bodyA.velocity.x -= frictionVector.x * bodyA.inverseMass;
      bodyA.velocity.y -= frictionVector.y * bodyA.inverseMass;
    }

    if (!bodyB.isStatic) {
      bodyB.velocity.x += frictionVector.x * bodyB.inverseMass;
      bodyB.velocity.y += frictionVector.y * bodyB.inverseMass;
    }
  }

  static dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }
}
```

### Constraint Solver

```javascript
class ConstraintSolver {
  constructor() {
    this.constraints = [];
    this.iterations = 8;
  }

  addConstraint(constraint) {
    this.constraints.push(constraint);
  }

  removeConstraint(constraint) {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) {
      this.constraints.splice(index, 1);
    }
  }

  solve(deltaTime) {
    for (let iteration = 0; iteration < this.iterations; iteration++) {
      for (const constraint of this.constraints) {
        constraint.solve(deltaTime);
      }
    }
  }

  clear() {
    this.constraints.length = 0;
  }
}

class DistanceConstraint {
  constructor(bodyA, bodyB, distance, stiffness = 1.0) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.distance = distance;
    this.stiffness = stiffness;
  }

  solve(deltaTime) {
    const transformA = this.bodyA.entity.transform;
    const transformB = this.bodyB.entity.transform;

    const delta = {
      x: transformB.position.x - transformA.position.x,
      y: transformB.position.y - transformA.position.y
    };

    const currentDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

    if (currentDistance === 0) return; // Avoid division by zero

    const difference = this.distance - currentDistance;
    const percent = difference / currentDistance;
    const offset = {
      x: delta.x * percent * this.stiffness,
      y: delta.y * percent * this.stiffness
    };

    const totalInverseMass = this.bodyA.inverseMass + this.bodyB.inverseMass;

    if (totalInverseMass > 0) {
      if (!this.bodyA.isStatic) {
        transformA.position.x -= offset.x * this.bodyA.inverseMass / totalInverseMass;
        transformA.position.y -= offset.y * this.bodyA.inverseMass / totalInverseMass;
      }

      if (!this.bodyB.isStatic) {
        transformB.position.x += offset.x * this.bodyB.inverseMass / totalInverseMass;
        transformB.position.y += offset.y * this.bodyB.inverseMass / totalInverseMass;
      }
    }
  }
}
```

## 🌊 Advanced Physics Features

### Soft Bodies

```javascript
class SoftBodyComponent extends Component {
  constructor(options = {}) {
    super('SoftBodyComponent');

    this.particles = [];
    this.constraints = [];
    this.pressure = options.pressure || 1.0;
    this.damping = options.damping || 0.99;

    // Create particle grid
    this.createParticles(options.width || 32, options.height || 32, options.spacing || 8);
    this.createConstraints();
  }

  createParticles(width, height, spacing) {
    for (let y = 0; y <= height; y += spacing) {
      for (let x = 0; x <= width; x += spacing) {
        this.particles.push({
          position: { x: x, y: y },
          previousPosition: { x: x, y: y },
          velocity: { x: 0, y: 0 },
          mass: 1.0,
          radius: spacing / 2
        });
      }
    }
  }

  createConstraints() {
    const gridWidth = Math.sqrt(this.particles.length);

    for (let i = 0; i < this.particles.length; i++) {
      const x = i % gridWidth;
      const y = Math.floor(i / gridWidth);

      // Horizontal constraints
      if (x < gridWidth - 1) {
        this.constraints.push(new DistanceConstraint(
          this.particles[i],
          this.particles[i + 1],
          8 // spacing
        ));
      }

      // Vertical constraints
      if (y < gridWidth - 1) {
        this.constraints.push(new DistanceConstraint(
          this.particles[i],
          this.particles[i + gridWidth],
          8
        ));
      }
    }
  }

  update(deltaTime) {
    // Apply gravity
    for (const particle of this.particles) {
      particle.velocity.y += 9.81 * deltaTime;
    }

    // Verlet integration
    for (const particle of this.particles) {
      const temp = { ...particle.position };
      particle.position.x += (particle.position.x - particle.previousPosition.x) * this.damping + particle.velocity.x * deltaTime;
      particle.position.y += (particle.position.y - particle.previousPosition.y) * this.damping + particle.velocity.y * deltaTime;
      particle.previousPosition = temp;
    }

    // Solve constraints
    for (let i = 0; i < 8; i++) { // iterations
      for (const constraint of this.constraints) {
        constraint.solve(deltaTime);
      }
    }

    // Apply pressure
    this.applyPressure();
  }

  applyPressure() {
    const center = this.getCenter();
    const volume = this.getVolume();

    for (const particle of this.particles) {
      const toCenter = {
        x: center.x - particle.position.x,
        y: center.y - particle.position.y
      };

      const distance = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
      if (distance > 0) {
        const pressureForce = this.pressure * (1.0 / volume - 1.0);
        particle.velocity.x += toCenter.x * pressureForce * 0.01;
        particle.velocity.y += toCenter.y * pressureForce * 0.01;
      }
    }
  }

  getCenter() {
    let centerX = 0, centerY = 0;

    for (const particle of this.particles) {
      centerX += particle.position.x;
      centerY += particle.position.y;
    }

    return {
      x: centerX / this.particles.length,
      y: centerY / this.particles.length
    };
  }

  getVolume() {
    // Calculate volume using shoelace formula
    let volume = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const j = (i + 1) % this.particles.length;
      volume += this.particles[i].position.x * this.particles[j].position.y;
      volume -= this.particles[j].position.x * this.particles[i].position.y;
    }

    return Math.abs(volume) / 2;
  }

  render(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    // Draw particles
    ctx.fillStyle = '#ff6b6b';
    for (const particle of this.particles) {
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw constraints
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 1;
    for (const constraint of this.constraints) {
      ctx.beginPath();
      ctx.moveTo(constraint.bodyA.position.x, constraint.bodyA.position.y);
      ctx.lineTo(constraint.bodyB.position.x, constraint.bodyB.position.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
```

This physics system provides comprehensive rigid body simulation, collision detection, and advanced features like soft bodies and constraints.
