import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';
import { Engine } from './engine/core/Engine.js';
import { DoomDemoScene } from './engine/demos/DoomDemo.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import VirtualJoystick from './components/VirtualJoystick.jsx';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState({ health: 100, ammo: 50, level: 1, enemies: 0, score: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [joystickMovement, setJoystickMovement] = useState({ x: 0, y: 0, magnitude: 0 });

  useEffect(() => {
    const initEngine = async () => {
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
        console.log('RaycastingEngine: Scene registered, loading...');
        await engineRef.current.sceneManager.loadScene('DoomDemo');
        console.log('RaycastingEngine: Scene loaded successfully');

        // Start the engine
        engineRef.current.start();
        console.log('RaycastingEngine: Engine started');

        // Hide loading screen
        setIsLoading(false);
      }
    };

    initEngine();

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

  const handleJoystickMove = (movement) => {
    setJoystickMovement(movement);
    if (engineRef.current && engineRef.current.sceneManager.currentScene) {
      engineRef.current.sceneManager.currentScene.setJoystickMovement(movement);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" tabIndex="0" width="240" height="320" onClick={() => canvasRef.current?.focus()} />
        <div className="touch-controls">
          <div className="movement-controls">
            <VirtualJoystick onMove={handleJoystickMove} />
          </div>
          <div className="action-buttons">
            <button tabIndex="0" className="action-btn shoot" onTouchStart={(e) => { e.preventDefault(); handleTouch('shoot', true); }} onTouchEnd={(e) => { e.preventDefault(); handleTouch('shoot', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleTouch('shoot', true); }} onMouseUp={(e) => { e.preventDefault(); handleTouch('shoot', false); }}>FIRE</button>
            <button tabIndex="0" className="action-btn use" onTouchStart={(e) => { e.preventDefault(); handleTouch('use', true); }} onTouchEnd={(e) => { e.preventDefault(); handleTouch('use', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleTouch('use', true); }} onMouseUp={(e) => { e.preventDefault(); handleTouch('use', false); }}>USE</button>
            <button tabIndex="0" className="action-btn strafe" onTouchStart={(e) => { e.preventDefault(); handleTouch('strafe', true); }} onTouchEnd={(e) => { e.preventDefault(); handleTouch('strafe', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleTouch('strafe', true); }} onMouseUp={(e) => { e.preventDefault(); handleTouch('strafe', false); }}>STRAFE</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RaycastingEngine;
