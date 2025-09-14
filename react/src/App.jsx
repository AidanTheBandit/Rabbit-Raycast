import React from 'react';
import RaycastingEngine from './RaycastingEngine';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Rabbit-Raycast React</h1>
        <p>A React implementation of the classic Doom raycasting engine</p>
      </header>

      <main className="app-main">
        <RaycastingEngine />
      </main>

      <footer className="app-footer">
        <p>Built with React & Canvas API | Optimized for R1 Device</p>
      </footer>
    </div>
  );
}

export default App;
