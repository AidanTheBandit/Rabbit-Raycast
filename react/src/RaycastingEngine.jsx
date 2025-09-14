import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';
import { GameEngine } from './engine/GameEngine.js';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState({ health: 100, ammo: 50, level: 1, enemies: 0, score: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      gameRef.current = new GameEngine(canvas, setGameState);
      gameRef.current.start();
    }
    return () => {
      if (gameRef.current) gameRef.current.stop();
    };
  }, []);

  const handleTouch = (action, isStart) => {
    if (gameRef.current) {
      gameRef.current.inputHandler.handleTouch(action, isStart);
    }
  };

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="touch-controls">
        <div className="dpad">
          <button className="up" onTouchStart={() => handleTouch('up', true)} onTouchEnd={() => handleTouch('up', false)}
                  onMouseDown={() => handleTouch('up', true)} onMouseUp={() => handleTouch('up', false)}>↑</button>
          <button className="left" onTouchStart={() => handleTouch('left', true)} onTouchEnd={() => handleTouch('left', false)}
                  onMouseDown={() => handleTouch('left', true)} onMouseUp={() => handleTouch('left', false)}>←</button>
          <button className="right" onTouchStart={() => handleTouch('right', true)} onTouchEnd={() => handleTouch('right', false)}
                  onMouseDown={() => handleTouch('right', true)} onMouseUp={() => handleTouch('right', false)}>→</button>
          <button className="down" onTouchStart={() => handleTouch('down', true)} onTouchEnd={() => handleTouch('down', false)}
                  onMouseDown={() => handleTouch('down', true)} onMouseUp={() => handleTouch('down', false)}>↓</button>
        </div>
        <div className="action-buttons">
          <button className="shoot" onTouchStart={() => handleTouch('shoot', true)} onMouseDown={() => handleTouch('shoot', true)}>FIRE</button>
          <button className="use" onTouchStart={() => handleTouch('use', true)} onTouchEnd={() => handleTouch('use', false)}
                  onMouseDown={() => handleTouch('use', true)} onMouseUp={() => handleTouch('use', false)}>USE</button>
          <button className="strafe" onTouchStart={() => handleTouch('strafe', true)} onTouchEnd={() => handleTouch('strafe', false)}
                  onMouseDown={() => handleTouch('strafe', true)} onMouseUp={() => handleTouch('strafe', false)}>STRAFE</button>
        </div>
      </div>
      <div className="hud">
        <span>Health: {gameState.health}</span>
        <span>Ammo: {gameState.ammo}</span>
        <span>Level: {gameState.level}</span>
        <span>Enemies: {gameState.enemies}</span>
        <span>Score: {gameState.score}</span>
      </div>
    </div>
  );
};

export default RaycastingEngine;
