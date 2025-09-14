import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState({ health: 100, ammo: 50 });

  // Doom Engine - R1 Optimized
  class DoomEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = 240;
      this.height = 320;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      this.player = { x: 5, y: 5, angle: 0, health: 100, ammo: 50 };
      this.keys = {};
      this.touching = {};

      this.fov = Math.PI / 3;
      this.rayCount = 120;
      this.maxDepth = 20;
      this.moveSpeed = 0.1;
      this.turnSpeed = 0.05;

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
      this.lastTime = 0;
      this.targetFPS = 30;
      this.frameInterval = 1000 / this.targetFPS;
      this.running = false;
      this.shooting = false;
      this.muzzleFlash = 0;

      // R1 Hardware support
      this.setupHardwareListeners();
    }

    setupHardwareListeners() {
      // R1 Device hardware events
      window.addEventListener('scrollUp', () => {
        this.player.angle -= this.turnSpeed * 2;
      });

      window.addEventListener('scrollDown', () => {
        this.player.angle += this.turnSpeed * 2;
      });

      window.addEventListener('sideClick', () => {
        this.shoot();
        setGameState(prev => ({ ...prev, ammo: this.player.ammo }));
      });

      // Orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.handleOrientationChange(), 100);
      });

      window.addEventListener('resize', () => {
        this.handleOrientationChange();
      });
    }

    handleOrientationChange() {
      const isLandscape = window.innerWidth > window.innerHeight;
      this.width = isLandscape ? 320 : 240;
      this.height = isLandscape ? 240 : 320;
      this.rayCount = isLandscape ? 160 : 120;

      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

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

    render() {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(0, 0, this.width, this.height / 2);
      this.ctx.fillStyle = '#666';
      this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

      for (let x = 0; x < this.rayCount; x++) {
        const rayAngle = this.player.angle - this.fov / 2 + (x / this.rayCount) * this.fov;
        const distance = this.castRay(rayAngle);
        const wallHeight = (this.height / 2) / distance;
        const wallTop = (this.height / 2) - wallHeight;
        const wallBottom = (this.height / 2) + wallHeight;
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

      if (this.muzzleFlash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 0, ${this.muzzleFlash})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.muzzleFlash -= 0.1;
      }

      this.ctx.strokeStyle = '#FE5F00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.width / 2 - 10, this.height / 2);
      this.ctx.lineTo(this.width / 2 + 10, this.height / 2);
      this.ctx.moveTo(this.width / 2, this.height / 2 - 10);
      this.ctx.lineTo(this.width / 2, this.height / 2 + 10);
      this.ctx.stroke();
    }

    update(deltaTime) {
      const dt = deltaTime / 16.67;

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

      if (this.keys.left || this.touching.left) {
        this.player.angle -= this.turnSpeed * dt;
      }

      if (this.keys.right || this.touching.right) {
        this.player.angle += this.turnSpeed * dt;
      }

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
        setTimeout(() => this.shooting = false, 100);
      }
    }

    gameLoop(currentTime) {
      if (!this.running) return;
      const deltaTime = currentTime - this.lastTime;
      if (deltaTime >= this.frameInterval) {
        this.update(deltaTime);
        this.render();
        this.lastTime = currentTime;
      }
      requestAnimationFrame(time => this.gameLoop(time));
    }

    start() {
      this.running = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }

    stop() {
      this.running = false;
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      gameRef.current = new DoomEngine(canvas);
      gameRef.current.start();
    }
    return () => {
      if (gameRef.current) gameRef.current.stop();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameRef.current) return;
      switch(event.code) {
        case 'ArrowUp': case 'KeyW': gameRef.current.keys.up = true; break;
        case 'ArrowDown': case 'KeyS': gameRef.current.keys.down = true; break;
        case 'ArrowLeft': case 'KeyA': gameRef.current.keys.left = true; break;
        case 'ArrowRight': case 'KeyD': gameRef.current.keys.right = true; break;
        case 'Space': event.preventDefault(); gameRef.current.shoot();
          setGameState(prev => ({ ...prev, ammo: gameRef.current.player.ammo })); break;
        case 'ShiftLeft': gameRef.current.keys.strafe = true; break;
      }
    };

    const handleKeyUp = (event) => {
      if (!gameRef.current) return;
      switch(event.code) {
        case 'ArrowUp': case 'KeyW': gameRef.current.keys.up = false; break;
        case 'ArrowDown': case 'KeyS': gameRef.current.keys.down = false; break;
        case 'ArrowLeft': case 'KeyA': gameRef.current.keys.left = false; break;
        case 'ArrowRight': case 'KeyD': gameRef.current.keys.right = false; break;
        case 'ShiftLeft': gameRef.current.keys.strafe = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTouch = (action, isStart) => {
    if (gameRef.current) {
      gameRef.current.touching[action] = isStart;
      if (action === 'shoot' && isStart) {
        gameRef.current.shoot();
        setGameState(prev => ({ ...prev, ammo: gameRef.current.player.ammo }));
      }
    }
  };

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="touch-controls">
        <div className="dpad">
          <button onTouchStart={() => handleTouch('up', true)} onTouchEnd={() => handleTouch('up', false)}
                  onMouseDown={() => handleTouch('up', true)} onMouseUp={() => handleTouch('up', false)}>↑</button>
          <button onTouchStart={() => handleTouch('left', true)} onTouchEnd={() => handleTouch('left', false)}
                  onMouseDown={() => handleTouch('left', true)} onMouseUp={() => handleTouch('left', false)}>←</button>
          <button onTouchStart={() => handleTouch('right', true)} onTouchEnd={() => handleTouch('right', false)}
                  onMouseDown={() => handleTouch('right', true)} onMouseUp={() => handleTouch('right', false)}>→</button>
          <button onTouchStart={() => handleTouch('down', true)} onTouchEnd={() => handleTouch('down', false)}
                  onMouseDown={() => handleTouch('down', true)} onMouseUp={() => handleTouch('down', false)}>↓</button>
        </div>
        <div className="action-buttons">
          <button onTouchStart={() => handleTouch('shoot', true)} onMouseDown={() => handleTouch('shoot', true)}>FIRE</button>
          <button onTouchStart={() => handleTouch('strafe', true)} onTouchEnd={() => handleTouch('strafe', false)}
                  onMouseDown={() => handleTouch('strafe', true)} onMouseUp={() => handleTouch('strafe', false)}>STRAFE</button>
        </div>
      </div>
      <div className="hud">
        <span>Health: {gameState.health}</span>
        <span>Ammo: {gameState.ammo}</span>
      </div>
    </div>
  );
};

export default RaycastingEngine;
