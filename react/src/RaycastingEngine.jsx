import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';
import { Engine } from './engine/core/Engine.js';
import { DoomDemoScene } from './engine/demos/DoomDemo.js';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState({ health: 100, ammo: 50, level: 1, enemies: 0, score: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Create the advanced 3D game engine
      engineRef.current = new Engine(canvas, {
        targetFPS: 60,
        enablePhysics: true,
        debug: false
      });

      // Register and load the Doom demo scene
      engineRef.current.sceneManager.registerScene('DoomDemo', DoomDemoScene);
      engineRef.current.sceneManager.loadScene('DoomDemo');

      // Start the engine
      engineRef.current.start();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const handleTouch = (action, isStart) => {
    if (engineRef.current) {
      engineRef.current.input.handleTouch(action, isStart);
    }
  };

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="touch-controls">
        <div className="dpad">
          <button className="up" onTouchStart={() => handleTouch('move_forward', true)} onTouchEnd={() => handleTouch('move_forward', false)}
                  onMouseDown={() => handleTouch('move_forward', true)} onMouseUp={() => handleTouch('move_forward', false)}>↑</button>
          <button className="left" onTouchStart={() => handleTouch('turn_left', true)} onTouchEnd={() => handleTouch('turn_left', false)}
                  onMouseDown={() => handleTouch('turn_left', true)} onMouseUp={() => handleTouch('turn_left', false)}>←</button>
          <button className="right" onTouchStart={() => handleTouch('turn_right', true)} onTouchEnd={() => handleTouch('turn_right', false)}
                  onMouseDown={() => handleTouch('turn_right', true)} onMouseUp={() => handleTouch('turn_right', false)}>→</button>
          <button className="down" onTouchStart={() => handleTouch('move_backward', true)} onTouchEnd={() => handleTouch('move_backward', false)}
                  onMouseDown={() => handleTouch('move_backward', true)} onMouseUp={() => handleTouch('move_backward', false)}>↓</button>
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
