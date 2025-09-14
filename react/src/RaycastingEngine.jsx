import React, { useRef, useEffect, useState, useCallback } from 'react';
import './RaycastingEngine.css';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animationRef = useRef(null);

  // Game state
  const [gameState, setGameState] = useState({
    health: 100,
    ammo: 50,
    isRunning: false
  });

  // Game engine class
  class DoomEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = 240;
      this.height = 320;

      // Set canvas resolution for R1 device
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      // Game state
      this.player = {
        x: 5,
        y: 5,
        angle: 0,
        health: 100,
        ammo: 50
      };

      // Input state
      this.keys = {};
      this.touching = {};

      // Game settings optimized for R1
      this.fov = Math.PI / 3;
      this.rayCount = 120; // Reduced for performance
      this.maxDepth = 20;
      this.moveSpeed = 0.1;
      this.turnSpeed = 0.05;

      // Simple level map (1 = wall, 0 = empty)
      this.map = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
        [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],
        [1,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
        [1,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
      ];

      this.mapWidth = this.map[0].length;
      this.mapHeight = this.map.length;

      // Performance optimization
      this.lastTime = 0;
      this.targetFPS = 30; // Reduced for R1 performance
      this.frameInterval = 1000 / this.targetFPS;

      this.running = false;
      this.shooting = false;
      this.muzzleFlash = 0;
    }

    // Raycasting engine
    castRay(angle) {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      let x = this.player.x;
      let y = this.player.y;

      for (let depth = 0; depth < this.maxDepth; depth += 0.1) {
        const testX = Math.floor(x);
        const testY = Math.floor(y);

        if (testX < 0 || testX >= this.mapWidth ||
            testY < 0 || testY >= this.mapHeight ||
            this.map[testY][testX] === 1) {
          return depth;
        }

        x += cos * 0.1;
        y += sin * 0.1;
      }

      return this.maxDepth;
    }

    // Render 3D view using raycasting
    render() {
      // Clear screen
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Draw ceiling and floor
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(0, 0, this.width, this.height / 2);
      this.ctx.fillStyle = '#666';
      this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

      // Cast rays for 3D view
      for (let x = 0; x < this.rayCount; x++) {
        const rayAngle = this.player.angle - this.fov / 2 + (x / this.rayCount) * this.fov;
        const distance = this.castRay(rayAngle);

        // Calculate wall height
        const wallHeight = (this.height / 2) / distance;
        const wallTop = (this.height / 2) - wallHeight;
        const wallBottom = (this.height / 2) + wallHeight;

        // Wall shading based on distance
        const shade = Math.max(0, 1 - distance / this.maxDepth);
        const color = Math.floor(255 * shade);

        this.ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.5)}, 0)`;
        this.ctx.fillRect(
          (x / this.rayCount) * this.width,
          wallTop,
          this.width / this.rayCount + 1,
          wallBottom - wallTop
        );
      }

      // Muzzle flash effect
      if (this.muzzleFlash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 0, ${this.muzzleFlash})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.muzzleFlash -= 0.1;
      }

      // Draw crosshair
      this.ctx.strokeStyle = '#FE5F00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.width / 2 - 10, this.height / 2);
      this.ctx.lineTo(this.width / 2 + 10, this.height / 2);
      this.ctx.moveTo(this.width / 2, this.height / 2 - 10);
      this.ctx.lineTo(this.width / 2, this.height / 2 + 10);
      this.ctx.stroke();
    }

    // Update game logic
    update(deltaTime) {
      const dt = deltaTime / 16.67; // Normalize to 60fps

      // Movement
      if (this.keys.up || this.touching.up) {
        const newX = this.player.x + Math.cos(this.player.angle) * this.moveSpeed * dt;
        const newY = this.player.y + Math.sin(this.player.angle) * this.moveSpeed * dt;

        if (this.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        }
      }

      if (this.keys.down || this.touching.down) {
        const newX = this.player.x - Math.cos(this.player.angle) * this.moveSpeed * dt;
        const newY = this.player.y - Math.sin(this.player.angle) * this.moveSpeed * dt;

        if (this.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        }
      }

      // Turning
      if (this.keys.left || this.touching.left) {
        this.player.angle -= this.turnSpeed * dt;
      }

      if (this.keys.right || this.touching.right) {
        this.player.angle += this.turnSpeed * dt;
      }

      // Strafing
      if (this.keys.strafe || this.touching.strafe) {
        const strafeAngle = this.player.angle + Math.PI / 2;
        const newX = this.player.x + Math.cos(strafeAngle) * this.moveSpeed * dt;
        const newY = this.player.y + Math.sin(strafeAngle) * this.moveSpeed * dt;

        if (this.isValidPosition(newX, newY)) {
          this.player.x = newX;
          this.player.y = newY;
        }
      }
    }

    isValidPosition(x, y) {
      const mapX = Math.floor(x);
      const mapY = Math.floor(y);

      if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
        return false;
      }

      return this.map[mapY][mapX] === 0;
    }

    shoot() {
      if (this.player.ammo > 0) {
        this.player.ammo--;
        this.muzzleFlash = 0.5;
        this.shooting = true;

        setTimeout(() => {
          this.shooting = false;
        }, 100);
      }
    }

    // Game loop
    gameLoop(currentTime) {
      if (!this.running) return;

      const deltaTime = currentTime - this.lastTime;

      if (deltaTime >= this.frameInterval) {
        this.update(deltaTime);
        this.render();
        this.lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
      this.running = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }

    stop() {
      this.running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      gameRef.current = new DoomEngine(canvas);
      setGameState(prev => ({ ...prev, isRunning: true }));
      gameRef.current.start();
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameRef.current) return;

      switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
          gameRef.current.keys.up = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          gameRef.current.keys.down = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          gameRef.current.keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameRef.current.keys.right = true;
          break;
        case 'Space':
          event.preventDefault();
          gameRef.current.shoot();
          setGameState(prev => ({ ...prev, ammo: gameRef.current.player.ammo }));
          break;
        case 'ShiftLeft':
          gameRef.current.keys.strafe = true;
          break;
      }
    };

    const handleKeyUp = (event) => {
      if (!gameRef.current) return;

      switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
          gameRef.current.keys.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          gameRef.current.keys.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          gameRef.current.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameRef.current.keys.right = false;
          break;
        case 'ShiftLeft':
          gameRef.current.keys.strafe = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls
  const handleTouchStart = useCallback((action) => {
    if (gameRef.current) {
      gameRef.current.touching[action] = true;
      if (action === 'shoot') {
        gameRef.current.shoot();
        setGameState(prev => ({ ...prev, ammo: gameRef.current.player.ammo }));
      }
    }
  }, []);

  const handleTouchEnd = useCallback((action) => {
    if (gameRef.current) {
      gameRef.current.touching[action] = false;
    }
  }, []);

  return (
    <div className="raycasting-container">
      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          className="game-canvas"
        />
        <div className="touch-controls">
          <div className="movement-pad">
            <div className="dpad">
              <button
                className="dpad-btn up"
                onTouchStart={() => handleTouchStart('up')}
                onTouchEnd={() => handleTouchEnd('up')}
                onMouseDown={() => handleTouchStart('up')}
                onMouseUp={() => handleTouchEnd('up')}
              >↑</button>
              <button
                className="dpad-btn left"
                onTouchStart={() => handleTouchStart('left')}
                onTouchEnd={() => handleTouchEnd('left')}
                onMouseDown={() => handleTouchStart('left')}
                onMouseUp={() => handleTouchEnd('left')}
              >←</button>
              <button
                className="dpad-btn right"
                onTouchStart={() => handleTouchStart('right')}
                onTouchEnd={() => handleTouchEnd('right')}
                onMouseDown={() => handleTouchStart('right')}
                onMouseUp={() => handleTouchEnd('right')}
              >→</button>
              <button
                className="dpad-btn down"
                onTouchStart={() => handleTouchStart('down')}
                onTouchEnd={() => handleTouchEnd('down')}
                onMouseDown={() => handleTouchStart('down')}
                onMouseUp={() => handleTouchEnd('down')}
              >↓</button>
            </div>
          </div>
          <div className="action-buttons">
            <button
              className="action-btn shoot"
              onTouchStart={() => handleTouchStart('shoot')}
              onMouseDown={() => handleTouchStart('shoot')}
            >FIRE</button>
            <button
              className="action-btn strafe"
              onTouchStart={() => handleTouchStart('strafe')}
              onTouchEnd={() => handleTouchEnd('strafe')}
              onMouseDown={() => handleTouchStart('strafe')}
              onMouseUp={() => handleTouchEnd('strafe')}
            >STRAFE</button>
          </div>
        </div>
        <div className="hud">
          <div className="health">Health: <span>{gameState.health}</span></div>
          <div className="ammo">Ammo: <span>{gameState.ammo}</span></div>
        </div>
      </div>
      <div className="controls-info">
        <h3>Controls</h3>
        <div className="controls-grid">
          <div className="control-group">
            <h4>Keyboard</h4>
            <ul>
              <li><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> - Move</li>
              <li><kbd>Space</kbd> - Shoot</li>
              <li><kbd>Shift</kbd> - Strafe</li>
            </ul>
          </div>
          <div className="control-group">
            <h4>Touch</h4>
            <ul>
              <li>D-pad - Movement</li>
              <li>FIRE - Shoot</li>
              <li>STRAFE - Strafe mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaycastingEngine;
