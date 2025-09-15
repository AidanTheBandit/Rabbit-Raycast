# API Reference

Complete API documentation for Rabbit-Raycast's modular game engine.

## 🏗️ Core Classes

### Engine

The main engine class that manages all systems and game loop.

```javascript
class Engine {
  constructor(canvas, options = {})

  // Properties
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  targetFPS: number
  debug: boolean

  // Systems
  sceneManager: SceneManager
  renderer: Renderer
  physics: PhysicsSystem
  audio: AudioSystem
  input: InputSystem
  particles: ParticleSystem

  // Methods
  start(): void
  stop(): void
  update(deltaTime: number): void
  render(): void
  getStats(): object
}
```

#### Engine Options
```javascript
{
  targetFPS: 60,           // Target frames per second
  enablePhysics: true,     // Enable physics system
  enableAudio: true,       // Enable audio system
  debug: false,            // Enable debug mode
  pixelPerfect: false      // Enable pixel-perfect rendering
}
```

### SceneManager

Manages scene loading, transitions, and lifecycle.

```javascript
class SceneManager {
  constructor(engine)

  // Properties
  currentScene: Scene
  scenes: Map<string, Scene>
  loadingScene: Scene

  // Methods
  registerScene(name: string, sceneClass: Function): void
  loadScene(name: string, transitionData?: object): Promise<void>
  unloadScene(): Promise<void>
  getScene(name: string): Scene
  getStats(): object
}
```

## 🎯 ECS Architecture

### Entity

Base entity class for game objects.

```javascript
class Entity {
  constructor(name = 'Entity', scene = null)

  // Properties
  name: string
  scene: Scene
  enabled: boolean
  id: number
  tags: Set<string>
  components: Map<string, Component>

  // Methods
  addComponent(component: Component): Component
  getComponent(type: string): Component | null
  hasComponent(type: string): boolean
  removeComponent(type: string): Component | null
  update(deltaTime: number): void
  render(renderer: Renderer): void
  destroy(): void
  addTag(tag: string): void
  removeTag(tag: string): void
  hasTag(tag: string): boolean
  getStats(): object
}
```

### Component

Base component class.

```javascript
class Component {
  constructor(name = '')

  // Properties
  name: string
  entity: Entity
  enabled: boolean

  // Methods
  onAttach(entity: Entity): void
  onDetach(): void
  onEnable(): void
  onDisable(): void
  update(deltaTime: number): void
  render(renderer: Renderer): void
  getType(): string
  isType(type: string): boolean
}
```

### System

Base system class for processing entities.

```javascript
class System {
  constructor(name = '', priority = 0)

  // Properties
  name: string
  priority: number
  enabled: boolean
  entities: Set<Entity>
  requiredComponents: string[]

  // Methods
  setRequiredComponents(...components: string[]): void
  matches(entity: Entity): boolean
  addEntity(entity: Entity): void
  removeEntity(entity: Entity): void
  update(deltaTime: number): void
  processEntity(entity: Entity, deltaTime: number): void
  render(renderer: Renderer): void
  renderEntity(entity: Entity, renderer: Renderer): void
  getStats(): object
}
```

## 📐 Transform Component

Handles position, rotation, and scale transformations.

```javascript
class TransformComponent extends Component {
  constructor(position = {x:0,y:0,z:0}, rotation = 0, scale = {x:1,y:1,z:1})

  // Properties
  position: {x: number, y: number, z: number}
  rotation: number
  scale: {x: number, y: number, z: number}
  localMatrix: number[]
  worldMatrix: number[]
  matrixDirty: boolean

  // Methods
  setPosition(x: number, y: number, z?: number): void
  translate(dx: number, dy: number, dz?: number): void
  setRotation(rotation: number): void
  rotate(angle: number): void
  setScale(x: number, y: number, z?: number): void
  scaleBy(factorX: number, factorY: number, factorZ?: number): void
  getForward(): {x: number, y: number, z: number}
  getRight(): {x: number, y: number, z: number}
  getUp(): {x: number, y: number, z: number}
  lookAt(targetX: number, targetY: number): void
  distanceTo(other: TransformComponent): number
  distanceSquaredTo(other: TransformComponent): number
  isWithinRange(point: object, range: number): boolean
  updateMatrices(): void
  transformPoint(point: object): object
  inverseTransformPoint(point: object): object
  interpolate(target: object, t: number): void
  copyFrom(other: TransformComponent): void
  reset(): void
  getStats(): object
}
```

## 🖼️ Sprite Component

Handles 2D sprite rendering and animation.

```javascript
class SpriteComponent extends Component {
  constructor(texture = null, options = {})

  // Properties
  texture: Image | HTMLCanvasElement
  width: number
  height: number
  pivotX: number
  pivotY: number
  color: string
  alpha: number
  visible: boolean
  layer: number
  sortingOrder: number
  blendMode: string
  animations: Map<string, object>
  currentAnimation: string
  animationFrame: number
  animationTime: number
  animationSpeed: number
  loop: boolean
  flipX: boolean
  flipY: boolean

  // Methods
  setTexture(texture: Image): void
  setSize(width: number, height: number): void
  setPivot(x: number, y: number): void
  setColor(color: string): void
  setAlpha(alpha: number): void
  setLayer(layer: number): void
  setSortingOrder(order: number): void
  setBlendMode(mode: string): void
  addAnimation(name: string, frames: number[], frameRate: number): void
  removeAnimation(name: string): void
  playAnimation(name: string, restart = true): void
  stopAnimation(): void
  pauseAnimation(): void
  resumeAnimation(): void
  getBounds(): object
  isVisible(): boolean
  getStats(): object
}
```

## ⚡ Physics Component

Handles physics simulation and collision detection.

```javascript
class PhysicsComponent extends Component {
  constructor(options = {})

  // Properties
  mass: number
  velocity: {x: number, y: number, z: number}
  acceleration: {x: number, y: number, z: number}
  angularVelocity: number
  angularAcceleration: number
  drag: number
  angularDrag: number
  gravity: number
  bounce: number
  friction: number
  collider: object
  collisionLayer: string
  collisionMask: string[]
  isTrigger: boolean
  isStatic: boolean
  isKinematic: boolean
  isGrounded: boolean
  onGround: boolean
  colliding: Set<Entity>
  collisionNormals: Map<Entity, object>
  forces: Map<string, object>
  impulses: object[]

  // Methods
  setVelocity(x: number, y: number, z?: number): void
  addVelocity(dx: number, dy: number, dz?: number): void
  setAcceleration(x: number, y: number, z?: number): void
  addAcceleration(dx: number, dy: number, dz?: number): void
  setAngularVelocity(velocity: number): void
  addAngularVelocity(delta: number): void
  applyForce(force: object, duration?: number, name?: string): void
  applyImpulse(impulse: object): void
  removeForce(name: string): void
  clearForces(): void
  setCollider(type: string, options?: object): void
  setCollisionLayer(layer: string): void
  setCollisionMask(mask: string[] | string): void
  setTrigger(isTrigger: boolean): void
  setStatic(isStatic: boolean): void
  setKinematic(isKinematic: boolean): void
  getBounds(): object
  checkCollision(other: PhysicsComponent): object | null
  resolveCollision(collision: object, other: PhysicsComponent): void
  isMoving(): boolean
  stop(): void
  getStats(): object
}
```

## 🔊 Audio Component

Handles spatial audio and sound effects.

```javascript
class AudioComponent extends Component {
  constructor(options = {})

  // Properties
  volume: number
  pitch: number
  loop: boolean
  spatial: boolean
  minDistance: number
  maxDistance: number
  rolloffFactor: number
  currentSound: string
  soundQueue: object[]
  playing: boolean
  paused: boolean
  muted: boolean
  fadeTime: number
  fadeDuration: number
  targetVolume: number
  spatialVolume: number

  // Methods
  setSound(soundName: string, engine: Engine): boolean
  loadSound(assetKey: string, engine: Engine): Promise<boolean>
  play(options?: object): boolean
  stop(): void
  pause(): void
  resume(): void
  setVolume(volume: number, fadeDuration?: number): void
  setPitch(pitch: number): void
  setLoop(loop: boolean): void
  setMuted(muted: boolean): void
  setSpatial(enabled: boolean): void
  setRange(minDistance: number, maxDistance: number): void
  setRolloffFactor(factor: number): void
  playSpatial(options?: object): boolean
  updateSpatialAudio(): void
  getListenerPosition(): object
  queueSound(soundName: string, delay?: number): void
  clearQueue(): void
  playProcedural(frequency: number, duration: number, type?: string, options?: object): boolean
  addEffect(type: string, options?: object): void
  removeEffect(type: string): void
  fadeIn(duration?: number): void
  fadeOut(duration?: number): void
  getStats(): object
}
```

## 📡 Signals System

Event-driven communication system.

```javascript
class Signal {
  constructor(name)

  // Properties
  name: string
  listeners: Map<number, object>
  onceListeners: Map<number, object>
  listenerId: number

  // Methods
  connect(listener: Function, context?: object, priority?: number): number
  connectOnce(listener: Function, context?: object, priority?: number): number
  disconnect(id: number): void
  disconnectAll(): void
  emit(...args: any[]): void
  getListenerCount(): number
  hasListeners(): boolean
}

class SignalManager {
  constructor()

  // Properties
  signals: Map<string, Signal>

  // Methods
  getSignal(name: string): Signal
  connect(signalName: string, listener: Function, context?: object, priority?: number): number
  connectOnce(signalName: string, listener: Function, context?: object, priority?: number): number
  disconnect(signalName: string, id: number): void
  emit(signalName: string, ...args: any[]): void
  hasSignal(signalName: string): boolean
  removeSignal(signalName: string): void
  clear(): void
  getStats(): object
}
```

## 🌳 Node Tree System

Godot-inspired scene hierarchy.

```javascript
class Node extends Entity {
  constructor(name = 'Node', scene = null)

  // Properties
  parent: Node
  children: Node[]
  treeIndex: number
  pauseMode: string
  processMode: string
  visible: boolean
  modulate: object
  groups: Set<string>
  owner: Node
  _path: string
  _pathDirty: boolean

  // Methods
  addChild(child: Node, legibleUniqueName?: boolean): void
  removeChild(child: Node): void
  getChild(name: string): Node | null
  getChildByIndex(index: number): Node | null
  getChildCount(): number
  moveChild(child: Node, toIndex: number): void
  getPath(): string
  getPathTo(node: Node): string
  findNode(path: string): Node | null
  getAllDescendants(includeSelf?: boolean): Node[]
  getNodesInGroup(group: string): Node[]
  addToGroup(group: string): void
  removeFromGroup(group: string): void
  isInGroup(group: string): boolean
  getGroups(): string[]
  setOwner(owner: Node): void
  getOwner(): Node
  setPauseMode(mode: string): void
  getEffectivePauseMode(): string
  setProcessMode(mode: string): void
  getEffectiveProcessMode(): string
  canProcess(): boolean
  setVisible(visible: boolean): void
  getEffectiveVisibility(): boolean
  setModulate(r: number, g: number, b: number, a?: number): void
  getEffectiveModulate(): object
  queueFree(): void
  free(): void
  duplicate(): Node
  copyPropertiesFrom(other: Node): void
  printTree(indent?: number): void
  onTreeEntered(): void
  onTreeExited(): void
  onReady(): void
  getStats(): object
}
```

## 🎭 Tweening System

Smooth animation and transitions.

```javascript
class Tween {
  constructor(target, duration, easing = Easing.linear)

  // Properties
  target: object
  duration: number
  easing: Function
  elapsed: number
  progress: number
  active: boolean
  paused: boolean
  completed: boolean
  properties: Map<string, string>
  startValues: Map<string, any>
  endValues: Map<string, any>
  onStart: Function
  onUpdate: Function
  onComplete: Function
  onPause: Function
  onResume: Function
  next: Tween
  parallel: Tween[]
  loop: boolean
  loopCount: number
  maxLoops: number
  delay: number
  delayElapsed: number

  // Methods
  to(property: string, endValue: any): Tween
  from(property: string, startValue: any): Tween
  ease(easing: Function): Tween
  setDelay(delay: number): Tween
  setLoop(loop?: boolean, maxLoops?: number): Tween
  chain(nextTween: Tween): Tween
  parallel(tween: Tween): Tween
  on(event: string, callback: Function): Tween
  start(): Tween
  pause(): Tween
  resume(): Tween
  stop(): Tween
  reset(): Tween
  update(deltaTime: number): void
  getProgress(): number
  getRemainingTime(): number
  setTimeScale(scale: number): void
  getStats(): object
}

class TweenManager {
  constructor()

  // Properties
  tweens: Set<Tween>
  pools: Map<string, Tween[]>
  poolSize: number

  // Methods
  create(target: object, duration?: number, easing?: Function): Tween
  update(deltaTime: number): void
  stopAll(): void
  pauseAll(): void
  resumeAll(): void
  getTweensFor(target: object): Tween[]
  stopTweensFor(target: object): void
  fadeIn(target: object, duration?: number, easing?: Function): Tween
  fadeOut(target: object, duration?: number, easing?: Function): Tween
  moveTo(target: object, x: number, y: number, z?: number, duration?: number, easing?: Function): Tween
  scaleTo(target: object, x: number, y: number, z?: number, duration?: number, easing?: Function): Tween
  rotateTo(target: object, rotation: number, duration?: number, easing?: Function): Tween
  colorTo(target: object, color: string, duration?: number, easing?: Function): Tween
  sequence(...tweens: Tween[]): Tween
  parallel(...tweens: Tween[]): Tween
  getStats(): object
}
```

## ⏰ Timer System

Scheduled events and time-based callbacks.

```javascript
class Timer {
  constructor(callback, delay, options = {})

  // Properties
  callback: Function
  delay: number
  elapsed: number
  active: boolean
  paused: boolean
  completed: boolean
  repeat: boolean
  repeatCount: number
  maxRepeats: number
  userData: any
  timeScale: number
  onStart: Function
  onComplete: Function
  onRepeat: Function
  id: number

  // Methods
  start(): Timer
  stop(): Timer
  pause(): Timer
  resume(): Timer
  reset(): Timer
  update(deltaTime: number): void
  getProgress(): number
  getRemainingTime(): number
  setTimeScale(scale: number): void
  getStats(): object
}

class TimerManager {
  constructor()

  // Properties
  timers: Map<number, Timer>
  groups: Map<string, Set<Timer>>
  pools: Map<string, Timer[]>
  poolSize: number

  // Methods
  create(callback: Function, delay: number, options?: object): Timer
  update(deltaTime: number): void
  stop(id: number): void
  stopAll(): void
  pauseAll(): void
  resumeAll(): void
  stopGroup(groupName: string): void
  pauseGroup(groupName: string): void
  resumeGroup(groupName: string): void
  setTimeScale(scale: number): void
  setGroupTimeScale(groupName: string, scale: number): void
  setTimeout(callback: Function, delay: number, options?: object): Timer
  setInterval(callback: Function, delay: number, options?: object): Timer
  waitFrames(callback: Function, frames: number, options?: object): Timer
  every(callback: Function, interval: number, options?: object): Timer
  countdown(callback: Function, duration: number, tickCallback?: Function, options?: object): Timer
  getTimer(id: number): Timer | null
  getActiveTimers(): Timer[]
  getStats(): object
}
```

## 🎨 Rendering Systems

### SpriteRendererSystem

Efficient 2D sprite rendering with batching.

```javascript
class SpriteRendererSystem extends System {
  constructor()

  // Properties
  spriteBatches: Map<string, object>
  maxBatchSize: number
  pixelPerfect: boolean
  sortByDepth: boolean
  cullingEnabled: boolean
  cullingMargin: number
  renderedSprites: number
  batchesUsed: number
  culledSprites: number

  // Methods
  setPixelPerfect(enabled: boolean): void
  setDepthSorting(enabled: boolean): void
  setCulling(enabled: boolean, margin?: number): void
  isSpriteVisible(sprite: SpriteComponent, transform: TransformComponent, viewport: object): boolean
  sortSprites(sprites: Entity[]): Entity[]
  createBatch(texture: Image, blendMode: string): object
  addToBatch(batch: object, entity: Entity, transform: TransformComponent): boolean
  renderBatch(batch: object, ctx: CanvasRenderingContext2D, viewport: object): void
  renderBatches(ctx: CanvasRenderingContext2D, viewport: object): void
  getViewport(): object
  getRenderStats(): object
  clearBatches(): void
  getStats(): object
}
```

## 🔄 Object Pooling

Memory optimization through object reuse.

```javascript
class ObjectPool {
  constructor(createFunc, resetFunc?, initialSize?)

  // Properties
  pool: any[]
  active: Set<any>
  maxSize: number

  // Methods
  get(): any
  release(obj: any): void
  releaseAll(): void
  getStats(): object
  resize(newSize: number): void
}

class EntityPool extends ObjectPool {
  constructor(entityClass, initialSize?)

  // Methods
  get(): Entity
  release(entity: Entity): void
  resetEntity(entity: Entity): void
}

class ComponentPool extends ObjectPool {
  constructor(componentClass, initialSize?)

  // Methods
  get(): Component
  release(component: Component): void
  resetComponent(component: Component): void
}

class PoolManager {
  constructor()

  // Properties
  pools: Map<string, ObjectPool>
  entityPools: Map<string, EntityPool>
  componentPools: Map<string, ComponentPool>

  // Methods
  createPool(name: string, createFunc: Function, resetFunc?: Function, initialSize?: number): ObjectPool
  getPool(name: string): ObjectPool | null
  createEntityPool(name: string, entityClass: Function, initialSize?: number): EntityPool
  getEntityPool(name: string): EntityPool | null
  createComponentPool(name: string, componentClass: Function, initialSize?: number): ComponentPool
  getComponentPool(name: string): ComponentPool | null
  getPooledEntity(poolName: string): Entity | null
  releasePooledEntity(poolName: string, entity: Entity): void
  getPooledComponent(poolName: string): Component | null
  releasePooledComponent(poolName: string, component: Component): void
  preloadPools(): void
  updateStats(): void
  getAllStats(): object
  clearAll(): void
  resizeAll(maxSize: number): void
  autoResize(): void
}
```

## 🎯 Utility Classes

### Easing Functions

```javascript
const Easing = {
  // Linear
  linear: (t: number) => number,

  // Quadratic
  quadIn: (t: number) => number,
  quadOut: (t: number) => number,
  quadInOut: (t: number) => number,

  // And many more easing functions...
}
```

### Signals Constants

```javascript
const Signals = {
  // Entity lifecycle
  ENTITY_CREATED: 'entity_created',
  ENTITY_DESTROYED: 'entity_destroyed',

  // Component lifecycle
  COMPONENT_ADDED: 'component_added',
  COMPONENT_REMOVED: 'component_removed',

  // Physics
  COLLISION_ENTER: 'collision_enter',
  COLLISION_STAY: 'collision_stay',
  COLLISION_EXIT: 'collision_exit',

  // And many more signal constants...
}
```

## 📊 Statistics and Debugging

Most classes provide a `getStats()` method that returns performance and debugging information:

```javascript
const engineStats = engine.getStats();
// Returns: { fps: 60, frameTime: 16.67, memoryUsage: 1024, ... }

const entityStats = entity.getStats();
// Returns: { id: 1, name: 'Player', componentCount: 3, ... }

const systemStats = system.getStats();
// Returns: { name: 'PhysicsSystem', entityCount: 25, ... }
```

## 🔧 Type Definitions

### Vector Types
```typescript
type Vector2 = { x: number; y: number };
type Vector3 = { x: number; y: number; z: number };
type Color = { r: number; g: number; b: number; a?: number };
```

### Common Options
```typescript
type EngineOptions = {
  targetFPS?: number;
  enablePhysics?: boolean;
  enableAudio?: boolean;
  debug?: boolean;
  pixelPerfect?: boolean;
};

type ComponentOptions = {
  enabled?: boolean;
  [key: string]: any;
};
```

This API reference covers the core classes and methods available in Rabbit-Raycast. For more detailed examples and usage patterns, see the individual guide documents.
