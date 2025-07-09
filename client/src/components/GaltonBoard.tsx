// GaltonBoard.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Coin } from './Coin';
import { useGaltonPhysics } from '../hooks/useGaltonPhysics';
import { Coin as CoinType, Peg, Bin } from '../types/game';

// Constants for the Galton board
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 15;
const PEG_ROWS = 10;
const PEG_COLS = 7;
const PEG_SPACING = 1.2;
const BIN_COUNT = 9;
const COIN_RADIUS = 0.4;
const PEG_RADIUS = 0.15;

// Scene component for the Galton board
function GaltonScene() {
  const [coins, setCoins] = useState<CoinType[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [score, setScore] = useState(0);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  // Generate pegs in a triangular pattern
  const pegs = useMemo<Peg[]>(() => {
    const pegsArray: Peg[] = [];
    for (let row = 0; row < PEG_ROWS; row++) {
      const rowOffset = row % 2 === 0 ? 0 : PEG_SPACING / 2;
      const pegsInRow = row % 2 === 0 ? PEG_COLS : PEG_COLS - 1;

      for (let col = 0; col < pegsInRow; col++) {
        const x = -BOARD_WIDTH/2 + rowOffset + col * PEG_SPACING;
        const y = BOARD_HEIGHT/2 - row * PEG_SPACING;

        pegsArray.push({
          id: peg-${row}-${col},
          position: { x, y, z: 0 },
          radius: PEG_RADIUS
        });
      }
    }
    return pegsArray;
  }, []);

  // Generate bins at the bottom
  useEffect(() => {
    const binWidth = BOARD_WIDTH / BIN_COUNT;
    const newBins: Bin[] = [];

    for (let i = 0; i < BIN_COUNT; i++) {
      newBins.push({
        id: bin-${i},
        position: { 
          x: -BOARD_WIDTH/2 + i * binWidth + binWidth/2,
          y: -BOARD_HEIGHT/2 + 0.5,
          z: 0
        },
        width: binWidth,
        height: 1,
        depth: 1,
        count: 0
      });
    }

    setBins(newBins);
  }, []);

  // Physics hook for the Galton board
  const { updatePhysics } = useGaltonPhysics(pegs, bins, setCoins, setBins, setScore);

  // Physics update loop
  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      updatePhysics();
      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [updatePhysics]);

  // Spawn coins at the top
  const spawnCoin = useCallback(() => {
    setCoins(prev => {
      if (prev.length >= 20) return prev;

      const newCoin: CoinType = {
        id: coin-${Date.now()},
        position: { 
          x: (Math.random() - 0.5) * BOARD_WIDTH * 0.8,
          y: BOARD_HEIGHT/2 - 1,
          z: 0 
        },
        velocity: { x: 0, y: -0.05, z: 0 },
        rotation: 0,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        scale: 1,
        opacity: 1,
        isActive: true,
        age: 0,
      };

      return [...prev, newCoin];
    });
  }, []);

  // Auto-spawn coins periodically
  useEffect(() => {
    const interval = setInterval(spawnCoin, 2000);
    return () => clearInterval(interval);
  }, [spawnCoin]);

  // Clean up inactive coins
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCoins(prev => prev.filter(coin => coin.isActive));
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  // Manual coin spawn on click
  const handleBoardClick = useCallback(() => {
    spawnCoin();
  }, [spawnCoin]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffd700" />

      {/* Board background */}
      <mesh position={[0, 0, -1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshStandardMaterial color="#3498db" transparent opacity={0.8} />
      </mesh>

      {/* Board frame */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[BOARD_WIDTH + 0.5, BOARD_HEIGHT + 0.5, 0.5]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Pegs */}
      {pegs.map(peg => (
        <mesh 
          key={peg.id}
          position={[peg.position.x, peg.position.y, 0]}
        >
          <cylinderGeometry args={[peg.radius, peg.radius, 0.5, 16]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
      ))}

      {/* Bins */}
      {bins.map(bin => (
        <mesh 
          key={bin.id}
          position={[bin.position.x, bin.position.y, 0]}
        >
          <boxGeometry args={[bin.width * 0.9, bin.height, bin.depth]} />
          <meshStandardMaterial color={bin.count > 0 ? "#27ae60" : "#7f8c8d"} />
        </mesh>
      ))}

      {/* Coins */}
      {coins.map(coin => (
        <Coin key={coin.id} coin={coin} />
      ))}

      {/* Score display */}
      <mesh position={[0, BOARD_HEIGHT/2 + 1, 0]}>
        <textGeometry args={[Score: ${score}, { font: new THREE.Font(), size: 0.5, height: 0.1 }]} />
        <meshStandardMaterial color="#f1c40f" />
      </mesh>

      {/* Interaction plane */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleBoardClick}
        visible={false}
      >
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export function GaltonBoard() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#1a1a2e',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '80vmin', 
        height: '90vmin',
        border: '4px solid #f1c40f',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Canvas
          camera={{ position: [0, 0, 25], fov: 60 }}
          style={{ background: '#16213e' }}
        >
          <GaltonScene />
        </Canvas>
      </div>
    </div>
  );
}