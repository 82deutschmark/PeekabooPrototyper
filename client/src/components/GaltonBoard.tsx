// GaltonBoard.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Coin } from './Coin';
import { ParticleEffect } from './ParticleEffect';
import { useGaltonPhysics } from '../hooks/useGaltonPhysics';
import { useAudioManager } from '../hooks/useAudioManager';
import { Coin as CoinType, Peg, Bin, ParticleData } from '../types/game';

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
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [score, setScore] = useState(0);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const coinCountRef = useRef(0);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;
  
  const { playBackground, playHit, playSuccess } = useAudioManager();
  
  // Beautiful color palette matching lava lamp
  const coinColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b',
    '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#00cec9', '#fdcb6e',
    '#e17055', '#81ecec', '#fab1a0', '#ff7675', '#74b9ff', '#55a3ff'
  ];

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
          id: `peg-${row}-${col}`,
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
        id: `bin-${i}`,
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
      if (coinCountRef.current >= 30) return prev;

      const newCoin: CoinType = {
        id: `coin-${Date.now()}`,
        position: { 
          x: (Math.random() - 0.5) * 2, // Narrower spawn area
          y: BOARD_HEIGHT/2 - 1,
          z: 0 
        },
        velocity: { x: (Math.random() - 0.5) * 0.02, y: -0.002, z: 0 }, // Very slow initial velocity
        rotation: 0,
        rotationSpeed: 0.01 + Math.random() * 0.02, // Slower rotation
        scale: 1,
        opacity: 1,
        isActive: true,
        age: 0,
        color: coinColors[Math.floor(Math.random() * coinColors.length)],
      };

      coinCountRef.current = prev.length + 1;
      playSuccess();
      return [...prev, newCoin];
    });
  }, [coinColors, playSuccess]);

  // Auto-spawn coins periodically - matching lava lamp timing
  useEffect(() => {
    spawnCoin(); // Initial coin
    const interval = setInterval(spawnCoin, 3000); // Match lava lamp timing
    return () => clearInterval(interval);
  }, [spawnCoin]);

  // Clean up inactive coins
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCoins(prev => {
        const activeCoins = prev.filter(coin => coin.isActive);
        coinCountRef.current = activeCoins.length;
        return activeCoins;
      });
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  // Handle interactions - matching lava lamp style
  const handlePointerDown = useCallback((event: THREE.Event) => {
    if (isFirstInteraction) {
      playBackground();
      setIsFirstInteraction(false);
    }

    const intersection = event.intersections[0];
    if (!intersection) return;

    // Check coin clicks for nudging
    const clickedCoin = coins.find(coin => 
      coin.isActive &&
      Math.abs(coin.position.x - intersection.point.x) < 0.8 &&
      Math.abs(coin.position.y - intersection.point.y) < 0.8
    );

    if (clickedCoin) {
      // Create sparkle particles
      setParticles(prev => [
        ...prev,
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `particle-${Date.now()}-${i}`,
          position: { 
            x: clickedCoin.position.x + (Math.random() - 0.5) * 0.4,
            y: clickedCoin.position.y + (Math.random() - 0.5) * 0.4,
            z: clickedCoin.position.z
          },
          velocity: {
            x: (Math.random() - 0.5) * 1.5,
            y: Math.random() * 2,
            z: (Math.random() - 0.5) * 0.2
          },
          life: 1,
          maxLife: 0.8 + Math.random() * 0.4,
          size: 0.06 + Math.random() * 0.03,
          color: clickedCoin.color
        }))
      ]);
      
      playHit();
    } else {
      // Spawn coin on empty click
      spawnCoin();
    }
  }, [coins, spawnCoin, playHit, playBackground, isFirstInteraction]);

  return (
    <>
      {/* Lighting matching lava lamp */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 10, 2]} intensity={0.5} />

      {/* Wooden pegs with warm colors */}
      {pegs.map(peg => (
        <mesh 
          key={peg.id}
          position={[peg.position.x, peg.position.y, 0]}
        >
          <cylinderGeometry args={[peg.radius, peg.radius, 0.5, 16]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
      ))}

      {/* Wooden bins with warm colors */}
      {bins.map(bin => (
        <mesh 
          key={bin.id}
          position={[bin.position.x, bin.position.y, 0]}
        >
          <boxGeometry args={[bin.width * 0.9, bin.height, bin.depth]} />
          <meshLambertMaterial color={bin.count > 0 ? "#D2691E" : "#CD853F"} />
        </mesh>
      ))}

      {/* Coins */}
      {coins.map(coin => (
        <Coin key={coin.id} coin={coin} />
      ))}

      {/* Particle effects matching lava lamp */}
      <ParticleEffect particles={particles} onParticleUpdate={setParticles} />

      {/* Interaction plane */}
      <mesh
        position={[0, 0, -1]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[BOARD_WIDTH * 2, BOARD_HEIGHT * 2]} />
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
      touchAction: 'none',
      overflow: 'hidden'
    }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #1a2a6c, #b21f1f, #fdbb2d)' }}
      >
        <GaltonScene />
      </Canvas>
    </div>
  );
}