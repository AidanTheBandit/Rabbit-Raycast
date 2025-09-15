# Input Handling

Comprehensive guide to Rabbit-Raycast's input system for keyboard, mouse, gamepad, and touch controls.

## ⌨️ Keyboard Input

### Basic Keyboard Handling

```javascript
class KeyboardInput {
  constructor() {
    this.keys = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (event) => {
      this.keys.set(event.code, {
        pressed: true,
        justPressed: !this.keys.get(event.code)?.pressed,
        timestamp: performance.now()
      });

      // Prevent default for game keys
      if (this.isGameKey(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.keys.has(event.code)) {
        this.keys.get(event.code).pressed = false;
      }
    });

    // Clear justPressed flags on next frame
    window.addEventListener('blur', () => {
      this.clearJustPressed();
    });
  }

  isPressed(key) {
    return this.keys.get(key)?.pressed || false;
  }

  isJustPressed(key) {
    return this.keys.get(key)?.justPressed || false;
  }

  getKeyTimestamp(key) {
    return this.keys.get(key)?.timestamp || 0;
  }

  isGameKey(key) {
    const gameKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'Enter', 'Escape'
    ];
    return gameKeys.includes(key);
  }

  clearJustPressed() {
    for (const [key, state] of this.keys) {
      state.justPressed = false;
    }
  }

  update() {
    this.clearJustPressed();
  }
}
```

### Input Mapping

```javascript
class InputMapper {
  constructor(keyboardInput) {
    this.keyboardInput = keyboardInput;
    this.mappings = new Map();
  }

  mapAction(action, keys) {
    this.mappings.set(action, {
      keys: Array.isArray(keys) ? keys : [keys],
      lastState: false,
      justActivated: false
    });
  }

  isActionActive(action) {
    const mapping = this.mappings.get(action);
    if (!mapping) return false;

    const currentlyActive = mapping.keys.some(key =>
      this.keyboardInput.isPressed(key)
    );

    mapping.justActivated = currentlyActive && !mapping.lastState;
    mapping.lastState = currentlyActive;

    return currentlyActive;
  }

  isActionJustActivated(action) {
    const mapping = this.mappings.get(action);
    return mapping ? mapping.justActivated : false;
  }

  getActions() {
    return Array.from(this.mappings.keys());
  }

  unmapAction(action) {
    this.mappings.delete(action);
  }

  remapAction(action, newKeys) {
    if (this.mappings.has(action)) {
      this.mappings.get(action).keys = Array.isArray(newKeys) ? newKeys : [newKeys];
    }
  }
}

// Usage
const inputMapper = new InputMapper(keyboardInput);

// Map common actions
inputMapper.mapAction('move_up', ['KeyW', 'ArrowUp']);
inputMapper.mapAction('move_down', ['KeyS', 'ArrowDown']);
inputMapper.mapAction('move_left', ['KeyA', 'ArrowLeft']);
inputMapper.mapAction('move_right', ['KeyD', 'ArrowRight']);
inputMapper.mapAction('jump', 'Space');
inputMapper.mapAction('attack', 'KeyJ');
inputMapper.mapAction('pause', 'Escape');
```

## 🖱️ Mouse Input

### Mouse Handling

```javascript
class MouseInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.position = { x: 0, y: 0 };
    this.worldPosition = { x: 0, y: 0 };
    this.buttons = new Map();
    this.wheel = { deltaX: 0, deltaY: 0 };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.position.x = event.clientX - rect.left;
      this.position.y = event.clientY - rect.top;

      // Convert to world coordinates if camera exists
      if (this.camera) {
        this.worldPosition = this.camera.screenToWorld(
          this.position.x,
          this.position.y
        );
      }
    });

    this.canvas.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.buttons.set(event.button, {
        pressed: true,
        justPressed: !this.buttons.get(event.button)?.pressed,
        timestamp: performance.now()
      });
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (this.buttons.has(event.button)) {
        this.buttons.get(event.button).pressed = false;
      }
    });

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.wheel.deltaX = event.deltaX;
      this.wheel.deltaY = event.deltaY;
    });

    // Handle mouse leaving canvas
    this.canvas.addEventListener('mouseleave', () => {
      this.clearButtons();
    });
  }

  isButtonPressed(button) {
    return this.buttons.get(button)?.pressed || false;
  }

  isButtonJustPressed(button) {
    return this.buttons.get(button)?.justPressed || false;
  }

  getPosition() {
    return { ...this.position };
  }

  getWorldPosition() {
    return { ...this.worldPosition };
  }

  getWheelDelta() {
    const delta = { ...this.wheel };
    this.wheel.deltaX = 0;
    this.wheel.deltaY = 0;
    return delta;
  }

  clearButtons() {
    for (const [button, state] of this.buttons) {
      state.pressed = false;
      state.justPressed = false;
    }
  }

  update() {
    // Clear justPressed flags
    for (const [button, state] of this.buttons) {
      state.justPressed = false;
    }
  }

  setCamera(camera) {
    this.camera = camera;
  }
}
```

### Mouse Interaction

```javascript
class MouseInteractionSystem extends System {
  constructor(mouseInput) {
    super('MouseInteractionSystem');
    this.mouseInput = mouseInput;
    this.hoveredEntities = new Set();
    this.clickedEntities = new Set();
  }

  processEntity(entity, deltaTime) {
    const mousePos = this.mouseInput.getWorldPosition();
    const bounds = entity.getBounds();

    if (this.isPointInBounds(mousePos, bounds)) {
      if (!this.hoveredEntities.has(entity)) {
        // Mouse entered entity
        this.hoveredEntities.add(entity);
        entity.emit('mouse_enter', mousePos);
      }

      // Check for clicks
      if (this.mouseInput.isButtonJustPressed(0)) { // Left click
        this.clickedEntities.add(entity);
        entity.emit('mouse_click', mousePos);
      }
    } else {
      if (this.hoveredEntities.has(entity)) {
        // Mouse left entity
        this.hoveredEntities.delete(entity);
        entity.emit('mouse_leave', mousePos);
      }
    }
  }

  isPointInBounds(point, bounds) {
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  update(deltaTime) {
    // Clear clicked entities after processing
    this.clickedEntities.clear();
  }
}
```

## 🎮 Gamepad Input

### Gamepad Handling

```javascript
class GamepadInput {
  constructor() {
    this.gamepads = new Map();
    this.deadzone = 0.1;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('gamepadconnected', (event) => {
      console.log('Gamepad connected:', event.gamepad.id);
      this.gamepads.set(event.gamepad.index, event.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      console.log('Gamepad disconnected:', event.gamepad.id);
      this.gamepads.delete(event.gamepad.index);
    });
  }

  update() {
    // Update gamepad states
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.gamepads.set(i, gamepads[i]);
      }
    }
  }

  getGamepad(index = 0) {
    return this.gamepads.get(index);
  }

  isButtonPressed(gamepadIndex, buttonIndex) {
    const gamepad = this.getGamepad(gamepadIndex);
    return gamepad?.buttons[buttonIndex]?.pressed || false;
  }

  isButtonJustPressed(gamepadIndex, buttonIndex) {
    const gamepad = this.getGamepad(gamepadIndex);
    const button = gamepad?.buttons[buttonIndex];
    return button?.pressed && button?.value === 1;
  }

  getButtonValue(gamepadIndex, buttonIndex) {
    const gamepad = this.getGamepad(gamepadIndex);
    return gamepad?.buttons[buttonIndex]?.value || 0;
  }

  getAxis(gamepadIndex, axisIndex) {
    const gamepad = this.getGamepad(gamepadIndex);
    const value = gamepad?.axes[axisIndex] || 0;

    // Apply deadzone
    return Math.abs(value) > this.deadzone ? value : 0;
  }

  getLeftStick(gamepadIndex) {
    return {
      x: this.getAxis(gamepadIndex, 0),
      y: this.getAxis(gamepadIndex, 1)
    };
  }

  getRightStick(gamepadIndex) {
    return {
      x: this.getAxis(gamepadIndex, 2),
      y: this.getAxis(gamepadIndex, 3)
    };
  }

  getTriggers(gamepadIndex) {
    return {
      left: this.getButtonValue(gamepadIndex, 6),
      right: this.getButtonValue(gamepadIndex, 7)
    };
  }

  isConnected(gamepadIndex = 0) {
    return this.gamepads.has(gamepadIndex);
  }

  getConnectedGamepads() {
    return Array.from(this.gamepads.values());
  }

  vibrate(gamepadIndex, duration = 200, weakMagnitude = 1, strongMagnitude = 1) {
    const gamepad = this.getGamepad(gamepadIndex);
    if (gamepad?.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        weakMagnitude,
        strongMagnitude
      });
    }
  }
}
```

### Gamepad Mapping

```javascript
class GamepadMapper {
  constructor(gamepadInput) {
    this.gamepadInput = gamepadInput;
    this.mappings = new Map();
    this.setupDefaultMappings();
  }

  setupDefaultMappings() {
    // Xbox-style controller mapping
    this.mapAction('move_horizontal', { axis: 0 });
    this.mapAction('move_vertical', { axis: 1 });
    this.mapAction('look_horizontal', { axis: 2 });
    this.mapAction('look_vertical', { axis: 3 });

    this.mapAction('jump', { button: 0 }); // A
    this.mapAction('attack', { button: 2 }); // X
    this.mapAction('defend', { button: 1 }); // B
    this.mapAction('special', { button: 3 }); // Y

    this.mapAction('pause', { button: 9 }); // Start
    this.mapAction('menu', { button: 8 }); // Select

    this.mapAction('left_trigger', { button: 6 });
    this.mapAction('right_trigger', { button: 7 });

    this.mapAction('left_bumper', { button: 4 });
    this.mapAction('right_bumper', { button: 5 });
  }

  mapAction(action, input) {
    this.mappings.set(action, input);
  }

  getActionValue(action, gamepadIndex = 0) {
    const mapping = this.mappings.get(action);
    if (!mapping) return 0;

    if (mapping.axis !== undefined) {
      return this.gamepadInput.getAxis(gamepadIndex, mapping.axis);
    } else if (mapping.button !== undefined) {
      return this.gamepadInput.getButtonValue(gamepadIndex, mapping.button);
    }

    return 0;
  }

  isActionActive(action, gamepadIndex = 0) {
    const value = this.getActionValue(action, gamepadIndex);
    return Math.abs(value) > 0.1; // Account for deadzone
  }

  isActionJustActivated(action, gamepadIndex = 0) {
    const mapping = this.mappings.get(action);
    if (!mapping || mapping.button === undefined) return false;

    return this.gamepadInput.isButtonJustPressed(gamepadIndex, mapping.button);
  }

  getMovementVector(gamepadIndex = 0) {
    return {
      x: this.getActionValue('move_horizontal', gamepadIndex),
      y: this.getActionValue('move_vertical', gamepadIndex)
    };
  }

  getLookVector(gamepadIndex = 0) {
    return {
      x: this.getActionValue('look_horizontal', gamepadIndex),
      y: this.getActionValue('look_vertical', gamepadIndex)
    };
  }
}
```

## 📱 Touch Input

### Touch Handling

```javascript
class TouchInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.touches = new Map();
    this.maxTouches = 5;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();

      for (let i = 0; i < event.changedTouches.length && this.touches.size < this.maxTouches; i++) {
        const touch = event.changedTouches[i];
        const touchInfo = this.createTouchInfo(touch);
        touchInfo.justStarted = true;
        this.touches.set(touch.identifier, touchInfo);
      }
    });

    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const touchInfo = this.touches.get(touch.identifier);

        if (touchInfo) {
          this.updateTouchInfo(touchInfo, touch);
        }
      }
    });

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const touchInfo = this.touches.get(touch.identifier);

        if (touchInfo) {
          touchInfo.ended = true;
          touchInfo.justEnded = true;
        }
      }
    });

    this.canvas.addEventListener('touchcancel', (event) => {
      event.preventDefault();

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        this.touches.delete(touch.identifier);
      }
    });
  }

  createTouchInfo(touch) {
    const rect = this.canvas.getBoundingClientRect();

    return {
      id: touch.identifier,
      startX: touch.clientX - rect.left,
      startY: touch.clientY - rect.top,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      force: touch.force || 1,
      radiusX: touch.radiusX || 1,
      radiusY: touch.radiusY || 1,
      rotationAngle: touch.rotationAngle || 0,
      justStarted: false,
      ended: false,
      justEnded: false,
      timestamp: performance.now()
    };
  }

  updateTouchInfo(touchInfo, touch) {
    const rect = this.canvas.getBoundingClientRect();

    touchInfo.prevX = touchInfo.x;
    touchInfo.prevY = touchInfo.y;
    touchInfo.x = touch.clientX - rect.left;
    touchInfo.y = touch.clientY - rect.top;
    touchInfo.force = touch.force || 1;
    touchInfo.radiusX = touch.radiusX || 1;
    touchInfo.radiusY = touch.radiusY || 1;
    touchInfo.rotationAngle = touch.rotationAngle || 0;
  }

  getTouches() {
    return Array.from(this.touches.values()).filter(touch => !touch.ended);
  }

  getTouch(id) {
    return this.touches.get(id);
  }

  getActiveTouches() {
    return this.getTouches().filter(touch => !touch.justEnded);
  }

  getTouchVelocity(touchId) {
    const touch = this.touches.get(touchId);
    if (!touch || !touch.prevX) return { x: 0, y: 0 };

    const deltaTime = performance.now() - touch.timestamp;
    if (deltaTime === 0) return { x: 0, y: 0 };

    return {
      x: (touch.x - touch.prevX) / deltaTime,
      y: (touch.y - touch.prevY) / deltaTime
    };
  }

  isTouchJustStarted(touchId) {
    const touch = this.touches.get(touchId);
    return touch ? touch.justStarted : false;
  }

  isTouchJustEnded(touchId) {
    const touch = this.touches.get(touchId);
    return touch ? touch.justEnded : false;
  }

  update() {
    // Clean up ended touches
    for (const [id, touch] of this.touches) {
      if (touch.ended) {
        this.touches.delete(id);
      } else {
        touch.justStarted = false;
        touch.justEnded = false;
      }
    }
  }
}
```

### Touch Gestures

```javascript
class TouchGestureRecognizer {
  constructor(touchInput) {
    this.touchInput = touchInput;
    this.gestures = new Map();
    this.setupGestureRecognizers();
  }

  setupGestureRecognizers() {
    this.addGesture('tap', this.recognizeTap.bind(this));
    this.addGesture('double_tap', this.recognizeDoubleTap.bind(this));
    this.addGesture('swipe', this.recognizeSwipe.bind(this));
    this.addGesture('pinch', this.recognizePinch.bind(this));
    this.addGesture('rotate', this.recognizeRotate.bind(this));
  }

  addGesture(name, recognizer) {
    this.gestures.set(name, recognizer);
  }

  recognizeTap(touches) {
    if (touches.length === 1) {
      const touch = touches[0];

      if (touch.justEnded) {
        const duration = performance.now() - touch.timestamp;
        const movement = Math.sqrt(
          Math.pow(touch.x - touch.startX, 2) +
          Math.pow(touch.y - touch.startY, 2)
        );

        if (duration < 300 && movement < 10) {
          return {
            type: 'tap',
            x: touch.x,
            y: touch.y,
            touch: touch
          };
        }
      }
    }

    return null;
  }

  recognizeDoubleTap(touches) {
    // Implementation for double tap recognition
    // Track timing between taps
  }

  recognizeSwipe(touches) {
    if (touches.length === 1) {
      const touch = touches[0];
      const velocity = this.touchInput.getTouchVelocity(touch.id);

      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (speed > 300) { // Minimum swipe speed
        let direction = 'unknown';

        if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
          direction = velocity.x > 0 ? 'right' : 'left';
        } else {
          direction = velocity.y > 0 ? 'down' : 'up';
        }

        return {
          type: 'swipe',
          direction: direction,
          speed: speed,
          velocity: velocity,
          touch: touch
        };
      }
    }

    return null;
  }

  recognizePinch(touches) {
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];

      const currentDistance = Math.sqrt(
        Math.pow(touch2.x - touch1.x, 2) +
        Math.pow(touch2.y - touch1.y, 2)
      );

      // Calculate previous distance
      const prevDistance = Math.sqrt(
        Math.pow(touch2.prevX - touch1.prevX, 2) +
        Math.pow(touch2.prevY - touch1.prevY, 2)
      );

      const scale = currentDistance / prevDistance;

      if (Math.abs(scale - 1) > 0.1) { // Minimum scale change
        return {
          type: 'pinch',
          scale: scale,
          center: {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
          },
          touches: [touch1, touch2]
        };
      }
    }

    return null;
  }

  recognizeRotate(touches) {
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];

      // Calculate current angle
      const currentAngle = Math.atan2(
        touch2.y - touch1.y,
        touch2.x - touch1.x
      );

      // Calculate previous angle
      const prevAngle = Math.atan2(
        touch2.prevY - touch1.prevY,
        touch2.prevX - touch1.prevX
      );

      const angleDelta = currentAngle - prevAngle;

      if (Math.abs(angleDelta) > 0.1) { // Minimum rotation
        return {
          type: 'rotate',
          angle: angleDelta,
          center: {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
          },
          touches: [touch1, touch2]
        };
      }
    }

    return null;
  }

  update() {
    const touches = this.touchInput.getActiveTouches();
    const recognizedGestures = [];

    for (const [name, recognizer] of this.gestures) {
      const gesture = recognizer(touches);
      if (gesture) {
        recognizedGestures.push(gesture);
      }
    }

    return recognizedGestures;
  }
}
```

## 🎯 Unified Input System

### Input Manager

```javascript
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keyboard = new KeyboardInput();
    this.mouse = new MouseInput(canvas);
    this.gamepad = new GamepadInput();
    this.touch = new TouchInput(canvas);

    this.inputMapper = new InputMapper(this.keyboard);
    this.gamepadMapper = new GamepadMapper(this.gamepad);
    this.touchGestures = new TouchGestureRecognizer(this.touch);

    this.actions = new Map();
  }

  update() {
    this.keyboard.update();
    this.mouse.update();
    this.gamepad.update();
    this.touch.update();

    // Update gestures
    const gestures = this.touchGestures.update();

    // Process gestures
    for (const gesture of gestures) {
      this.handleGesture(gesture);
    }
  }

  mapAction(action, keyboardKeys, mouseButtons, gamepadInputs) {
    this.inputMapper.mapAction(action, keyboardKeys);

    this.actions.set(action, {
      keyboard: keyboardKeys,
      mouse: mouseButtons,
      gamepad: gamepadInputs
    });
  }

  isActionActive(action) {
    // Check keyboard
    if (this.inputMapper.isActionActive(action)) {
      return true;
    }

    // Check mouse
    const actionConfig = this.actions.get(action);
    if (actionConfig?.mouse) {
      for (const button of actionConfig.mouse) {
        if (this.mouse.isButtonPressed(button)) {
          return true;
        }
      }
    }

    // Check gamepad
    if (this.gamepadMapper.isActionActive(action)) {
      return true;
    }

    return false;
  }

  getActionValue(action) {
    // Get analog value from gamepad if available
    if (this.gamepadMapper.isActionActive(action)) {
      return this.gamepadMapper.getActionValue(action);
    }

    // Digital input
    return this.isActionActive(action) ? 1 : 0;
  }

  getMovementVector() {
    // Combine input from all sources
    const keyboardVector = this.getKeyboardMovement();
    const gamepadVector = this.gamepadMapper.getMovementVector();
    const touchVector = this.getTouchMovement();

    return {
      x: keyboardVector.x + gamepadVector.x + touchVector.x,
      y: keyboardVector.y + gamepadVector.y + touchVector.y
    };
  }

  getKeyboardMovement() {
    let x = 0, y = 0;

    if (this.inputMapper.isActionActive('move_left')) x -= 1;
    if (this.inputMapper.isActionActive('move_right')) x += 1;
    if (this.inputMapper.isActionActive('move_up')) y -= 1;
    if (this.inputMapper.isActionActive('move_down')) y += 1;

    return { x, y };
  }

  getTouchMovement() {
    const touches = this.touch.getActiveTouches();

    if (touches.length === 1) {
      const touch = touches[0];
      const velocity = this.touch.getTouchVelocity(touch.id);

      return {
        x: velocity.x * 0.01, // Scale down velocity
        y: velocity.y * 0.01
      };
    }

    return { x: 0, y: 0 };
  }

  handleGesture(gesture) {
    switch (gesture.type) {
      case 'tap':
        this.handleTap(gesture);
        break;
      case 'swipe':
        this.handleSwipe(gesture);
        break;
      case 'pinch':
        this.handlePinch(gesture);
        break;
    }
  }

  handleTap(gesture) {
    // Convert to click action
    this.simulateAction('click', gesture.x, gesture.y);
  }

  handleSwipe(gesture) {
    // Convert to directional action
    this.simulateAction(`swipe_${gesture.direction}`);
  }

  handlePinch(gesture) {
    // Handle zoom gesture
    this.simulateAction('zoom', gesture.scale);
  }

  simulateAction(action, ...args) {
    // Emit input event for game to handle
    this.emit('input_action', { action, args });
  }

  on(event, callback) {
    // Simple event system
    if (!this.listeners) this.listeners = new Map();
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners?.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }
}
```

This input system provides comprehensive support for keyboard, mouse, gamepad, and touch inputs with unified action mapping and gesture recognition.
