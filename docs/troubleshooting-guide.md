# Troubleshooting Guide

Common issues and solutions for Rabbit-Raycast development.

## 🚀 Getting Started Issues

### Engine Won't Start

**Problem:** Engine fails to initialize or start.

**Solutions:**
1. **Check Canvas Element:**
   ```javascript
   const canvas = document.getElementById('game-canvas');
   if (!canvas) {
     console.error('Canvas element not found!');
     return;
   }
   ```

2. **Verify Engine Options:**
   ```javascript
   const engine = new Engine(canvas, {
     targetFPS: 60,
     enablePhysics: true,
     enableAudio: true,
     debug: true
   });
   ```

3. **Check Browser Console:**
   - Open browser dev tools (F12)
   - Look for JavaScript errors
   - Check network tab for failed asset loads

### Assets Not Loading

**Problem:** Textures, sounds, or other assets fail to load.

**Solutions:**
1. **Verify File Paths:**
   ```javascript
   // Correct
   await engine.assetManager.loadTexture('player', '/assets/player.png');

   // Incorrect
   await engine.assetManager.loadTexture('player', 'player.png');
   ```

2. **Check File Extensions:**
   ```javascript
   // Images
   '.png', '.jpg', '.jpeg', '.gif', '.webp'

   // Audio
   '.mp3', '.wav', '.ogg', '.m4a'

   // Data
   '.json', '.txt'
   ```

3. **Handle Loading Errors:**
   ```javascript
   try {
     await engine.assetManager.loadAssets(assets);
   } catch (error) {
     console.error('Failed to load assets:', error);
     // Show loading error screen
   }
   ```

## 🎯 Entity-Component-System Issues

### Component Not Working

**Problem:** Component methods aren't being called.

**Solutions:**
1. **Check Component Registration:**
   ```javascript
   class MyComponent extends Component {
     constructor() {
       super('MyComponent'); // Correct name
     }
   }
   ```

2. **Verify Component Attachment:**
   ```javascript
   const entity = new Entity('Test');
   entity.addComponent(new MyComponent()); // Don't forget this!
   scene.addEntity(entity);
   ```

3. **Check System Requirements:**
   ```javascript
   class MySystem extends System {
     constructor() {
       super('MySystem');
       this.setRequiredComponents('MyComponent'); // Required!
     }
   }
   ```

### Entity Not Updating/Rendering

**Problem:** Entity exists but isn't updating or rendering.

**Solutions:**
1. **Check Entity Enabled State:**
   ```javascript
   entity.enabled = true; // Make sure it's enabled
   ```

2. **Verify Scene Addition:**
   ```javascript
   scene.addEntity(entity); // Don't forget this!
   ```

3. **Check Component Enable States:**
   ```javascript
   component.enabled = true; // Components can be disabled too
   ```

## 🎨 Rendering Issues

### Sprites Not Appearing

**Problem:** Sprite components exist but sprites don't render.

**Solutions:**
1. **Check Texture Loading:**
   ```javascript
   const texture = engine.assetManager.getAsset('player');
   if (!texture) {
     console.error('Texture not loaded!');
   }
   ```

2. **Verify Sprite Component Setup:**
   ```javascript
   const sprite = new SpriteComponent(texture, {
     width: 32,
     height: 32,
     visible: true // Make sure it's visible!
   });
   ```

3. **Check Layer and Sorting:**
   ```javascript
   sprite.layer = 0; // Default layer
   sprite.sortingOrder = 0; // Render order
   ```

4. **Verify Transform Position:**
   ```javascript
   const transform = entity.getComponent('TransformComponent');
   console.log(transform.position); // Check if position is reasonable
   ```

### Performance Issues

**Problem:** Game runs slowly or stutters.

**Solutions:**
1. **Check Frame Rate:**
   ```javascript
   console.log(engine.getStats().fps); // Should be close to targetFPS
   ```

2. **Profile Update Loop:**
   ```javascript
   // Add timing to systems
   const startTime = performance.now();
   // ... system update code ...
   const endTime = performance.now();
   console.log(`System update took: ${endTime - startTime}ms`);
   ```

3. **Optimize Rendering:**
   ```javascript
   // Use sprite batching
   engine.renderer.enableBatching = true;

   // Reduce texture swaps
   // Group sprites by texture
   ```

4. **Check Entity Count:**
   ```javascript
   console.log(scene.entities.size); // Too many entities?
   ```

## ⚡ Physics Issues

### Objects Not Colliding

**Problem:** Physics objects pass through each other.

**Solutions:**
1. **Check Collider Components:**
   ```javascript
   entity.addComponent(new BoxColliderComponent({
     width: 32,
     height: 32
   })); // Don't forget colliders!
   ```

2. **Verify Collision Layers:**
   ```javascript
   collider.collisionLayer = 'player';
   collider.collisionMask = ['enemy', 'platform']; // Can collide with these
   ```

3. **Check Physics World Setup:**
   ```javascript
   const physicsWorld = new PhysicsWorld({
     gravity: { x: 0, y: 9.81 }
   });
   ```

4. **Debug Collision Shapes:**
   ```javascript
   // Enable debug rendering
   physicsWorld.debugDraw = true;
   ```

### Objects Falling Through Platforms

**Problem:** Dynamic objects fall through static platforms.

**Solutions:**
1. **Check Platform Setup:**
   ```javascript
   platform.addComponent(new RigidBodyComponent({
     isStatic: true // Platforms should be static!
   }));
   ```

2. **Verify Collision Detection:**
   ```javascript
   // Test collision manually
   const collision = physicsWorld.testCollision(entityA, entityB);
   console.log(collision); // Should not be null
   ```

3. **Check Timestep:**
   ```javascript
   physicsWorld.substeps = 8; // Increase for stability
   ```

## 🎮 Input Issues

### Input Not Working

**Problem:** Keyboard/mouse/gamepad input isn't registering.

**Solutions:**
1. **Check Input Manager Setup:**
   ```javascript
   const input = new InputManager(canvas);
   engine.input = input; // Make sure it's assigned to engine
   ```

2. **Verify Event Listeners:**
   ```javascript
   // Check if canvas has focus
   canvas.focus();
   canvas.tabIndex = 0;
   ```

3. **Test Input Detection:**
   ```javascript
   // Debug input
   console.log('Keyboard pressed:', input.isPressed('KeyW'));
   console.log('Mouse position:', input.getMousePosition());
   ```

4. **Check Browser Permissions:**
   - Gamepad input requires user interaction first
   - Some browsers block certain inputs

### Gamepad Not Detected

**Problem:** Gamepad input isn't working.

**Solutions:**
1. **Check Gamepad Connection:**
   ```javascript
   console.log(navigator.getGamepads()); // Should show connected gamepads
   ```

2. **Handle Connection Events:**
   ```javascript
   window.addEventListener('gamepadconnected', (e) => {
     console.log('Gamepad connected:', e.gamepad.id);
   });
   ```

3. **Test Gamepad Input:**
   ```javascript
   const gamepad = input.getGamepad(0);
   if (gamepad) {
     console.log('Button 0:', gamepad.buttons[0].pressed);
     console.log('Axis 0:', gamepad.axes[0]);
   }
   ```

## 🎵 Audio Issues

### Sounds Not Playing

**Problem:** Audio files don't play or are silent.

**Solutions:**
1. **Check Audio Context:**
   ```javascript
   console.log(audioContext.state); // Should be 'running'
   ```

2. **Resume Audio Context:**
   ```javascript
   // Audio context must be resumed after user interaction
   document.addEventListener('click', async () => {
     await audioContext.resume();
   });
   ```

3. **Verify Audio Loading:**
   ```javascript
   const buffer = audioManager.sounds.get('mySound');
   if (!buffer) {
     console.error('Audio not loaded!');
   }
   ```

4. **Check Volume Settings:**
   ```javascript
   audioManager.setMasterVolume(1.0);
   audioManager.setSFXVolume(1.0);
   ```

### Audio Crackling/Distortion

**Problem:** Audio playback has artifacts or distortion.

**Solutions:**
1. **Check Sample Rate:**
   ```javascript
   console.log(audioContext.sampleRate); // Should be 44100 or 48000
   ```

2. **Use Appropriate Buffer Size:**
   ```javascript
   // For low latency
   audioContext.createBuffer(2, 256, audioContext.sampleRate);
   ```

3. **Avoid Overlapping Sounds:**
   ```javascript
   // Limit concurrent sounds
   if (activeSounds.size < maxSounds) {
     playSound();
   }
   ```

## 🌐 Browser Compatibility Issues

### WebGL Not Supported

**Problem:** Game fails to start on older browsers.

**Solutions:**
1. **Check WebGL Support:**
   ```javascript
   const canvas = document.createElement('canvas');
   const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

   if (!gl) {
     console.error('WebGL not supported!');
     // Fallback to Canvas2D
   }
   ```

2. **Provide Canvas2D Fallback:**
   ```javascript
   // Detect WebGL support
   const webglSupported = (() => {
     try {
       const canvas = document.createElement('canvas');
       return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
     } catch (e) {
       return false;
     }
   })();

   if (!webglSupported) {
     // Use Canvas2D renderer
     engine.renderer = new Canvas2DRenderer(canvas);
   }
   ```

### Mobile Touch Issues

**Problem:** Touch input doesn't work properly on mobile.

**Solutions:**
1. **Prevent Default Touch Behavior:**
   ```javascript
   canvas.addEventListener('touchstart', (e) => {
     e.preventDefault(); // Prevent scrolling/zooming
   });
   ```

2. **Handle Touch Events Correctly:**
   ```javascript
   canvas.addEventListener('touchmove', (e) => {
     e.preventDefault();
     // Handle touch movement
   });
   ```

3. **Scale for Different Screen Sizes:**
   ```javascript
   const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
   canvas.style.transform = `scale(${scale})`;
   ```

## 🔧 Performance Optimization

### Memory Leaks

**Problem:** Memory usage grows over time.

**Solutions:**
1. **Check for Object Pool Usage:**
   ```javascript
   // Use object pools for frequently created objects
   const entityPool = new EntityPool(MyEntityClass, 50);
   const pooledEntity = entityPool.get();
   // ... use entity ...
   entityPool.release(pooledEntity);
   ```

2. **Clean Up Event Listeners:**
   ```javascript
   // Remove event listeners when objects are destroyed
   entity.on('destroy', () => {
     // Clean up listeners
   });
   ```

3. **Monitor Memory Usage:**
   ```javascript
   if (performance.memory) {
     console.log('Memory usage:', performance.memory.usedJSHeapSize);
   }
   ```

### Garbage Collection Spikes

**Problem:** Periodic frame rate drops due to GC.

**Solutions:**
1. **Reduce Object Creation:**
   ```javascript
   // Reuse objects instead of creating new ones
   const tempVector = { x: 0, y: 0 };
   // Use tempVector instead of new Vector2()
   ```

2. **Use Object Pools:**
   ```javascript
   // Pool vectors, entities, components
   const vectorPool = new ObjectPool(Vector2, (v) => v.set(0, 0), 100);
   ```

3. **Avoid String Concatenation:**
   ```javascript
   // Bad
   const message = 'Score: ' + score + ' Time: ' + time;

   // Good
   const message = `Score: ${score} Time: ${time}`;
   ```

## 🐛 Debugging Tools

### Console Logging

```javascript
// Entity debugging
console.log(entity.getStats());

// System debugging
console.log(system.getStats());

// Engine debugging
console.log(engine.getStats());
```

### Visual Debugging

```javascript
// Enable debug rendering
engine.debug = true;
physicsWorld.debugDraw = true;

// Draw collision shapes
physicsWorld.debugDrawColliders = true;

// Show FPS counter
engine.showFPS = true;
```

### Performance Profiling

```javascript
// Profile a function
console.time('update');
engine.update(deltaTime);
console.timeEnd('update');

// Profile rendering
console.time('render');
engine.render();
console.timeEnd('render');
```

### Breakpoint Debugging

```javascript
// Add conditional breakpoints
if (entity.name === 'Player') {
  debugger; // Execution will pause here
}

// Debug physics collisions
entity.on('collision_enter', (collision) => {
  debugger;
});
```

## 📞 Getting Help

### Community Resources

1. **GitHub Issues:** Report bugs and request features
2. **Documentation:** Check the full API reference
3. **Examples:** Look at the examples in `/examples/`
4. **Discord:** Join the community Discord server

### Before Reporting Issues

1. **Update to Latest Version:**
   ```bash
   npm update rabbit-raycast
   ```

2. **Check Browser Console:** Look for JavaScript errors

3. **Simplify the Problem:**
   - Create a minimal reproduction case
   - Remove unnecessary code
   - Test with default settings

4. **Provide System Information:**
   ```javascript
   console.log({
     userAgent: navigator.userAgent,
     webglSupport: !!document.createElement('canvas').getContext('webgl'),
     audioSupport: !!window.AudioContext || !!window.webkitAudioContext,
     gamepads: navigator.getGamepads().length
   });
   ```

### Issue Report Template

```
**Title:** [Clear, descriptive title]

**Description:**
[What happens vs. what should happen]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/macOS/Linux]
- Rabbit-Raycast Version: [1.0.0]
- Hardware: [CPU, GPU, RAM]

**Code Sample:**
```javascript
// Minimal code to reproduce the issue
```

**Additional Context:**
[Any other relevant information]
```

This troubleshooting guide covers the most common issues developers encounter with Rabbit-Raycast. If you encounter an issue not covered here, please check the GitHub repository for similar issues or create a new issue with detailed information.
