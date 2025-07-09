import { useState } from 'react';
import { LavaLamp } from './components/LavaLamp';
import { GaltonBoard } from './components/GaltonBoard';
import './index.css';

function App() {
  const [currentGame, setCurrentGame] = useState<'lava' | 'galton'>('lava');

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* Navigation buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setCurrentGame('lava')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentGame === 'lava' ? '#4ecdc4' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Lava Lamp
        </button>
        <button
          onClick={() => setCurrentGame('galton')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentGame === 'galton' ? '#4ecdc4' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Galton Board
        </button>
      </div>

      {/* Current game */}
      {currentGame === 'lava' ? <LavaLamp /> : <GaltonBoard />}
    </div>
  );
}

export default App;
