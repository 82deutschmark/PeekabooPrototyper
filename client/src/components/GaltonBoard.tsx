// GaltonBoard.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
// Gemini-2.5-Pro: I'm importing ThreeEvent to fix the click handler type.
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Coin } from './Coin';
import { ParticleEffect } from './ParticleEffect';
import { Barn } from './Barn';
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
const COIN_RADIUS = 0.3;
const PEG_RADIUS = 0.15;

// Scene component for the Galton board
function GaltonScene() {
  const [coins, setCoins] = useState<CoinType[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [score, setScore] = useState(0);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  // Gemini-2.5-Pro: This new state will help us animate the score.
  const [scoreJustUpdated, setScoreJustUpdated] = useState(false);
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

  // Gemini-2.5-Pro: I'm creating the vertical dividers for the bins.
  const binDividers = useMemo(() => {
    const dividers = [];
    const binWidth = BOARD_WIDTH / BIN_COUNT;
    const dividerHeight = 4; // Make them tall enough.
    const dividerY = -BOARD_HEIGHT / 2 + dividerHeight / 2 - 0.5;

    for (let i = 0; i <= BIN_COUNT; i++) {
      dividers.push({
        id: `divider-${i}`,
        position: {
          x: -BOARD_WIDTH / 2 + i * binWidth,
          y: dividerY,
        },
        width: 0.1,
        height: dividerHeight,
      });
    }
    return dividers;
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
  // Gemini-2.5-Pro: I'm passing the new dividers, particle setter, and sound player to the hook.
  const { updatePhysics } = useGaltonPhysics(pegs, bins, binDividers, setCoins, setBins, setScore, setParticles, playSuccess);

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
      if (coinCountRef.current >= 10) return prev;

      const newCoin: CoinType = {
        id: `coin-${Date.now()}`,
        position: { 
          x: (Math.random() - 0.5) * 0.8, // Spawn from barn area
          y: BOARD_HEIGHT/2 + 1, // Spawn above barn
          z: 0 
        },
        // Gemini-2.5-Pro: A gentler drop. Changed y-velocity from -0.002 to 0.
        velocity: { x: (Math.random() - 0.5) * 0.02, y: 0, z: 0 },
        rotation: 0,
        rotationSpeed: 0.01 + Math.random() * 0.02, // Slower rotation
        scale: 0.8,
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

  // Auto-spawn coins periodically - slower than lava lamp
  useEffect(() => {
    spawnCoin(); // Initial coin
    const interval = setInterval(spawnCoin, 8000); // Much slower spawning
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

  // Gemini-2.5-Pro: This effect will animate the score when it changes.
  useEffect(() => {
    if (score > 0) {
      setScoreJustUpdated(true);
      const timer = setTimeout(() => setScoreJustUpdated(false), 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [score]);

  // Handle interactions - matching lava lamp style
  // Gemini-2.5-Pro: I've fixed the event type here from THREE.Event to the correct ThreeEvent.
  const handlePointerDown = useCallback((event: ThreeEvent) => {
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
      {/* Gemini-2.5-Pro: I'm adding a score display overlay. */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '2.5em',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        zIndex: 100,
        transition: 'transform 0.2s ease-out, color 0.2s',
        ...(scoreJustUpdated && { 
          transform: 'translateX(-50%) scale(1.2)',
          color: '#f9ca24'
        })
      }}>
        Score: {score}
      </div>

      {/* Lighting matching lava lamp */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 10, 2]} intensity={0.5} />

      {/* Barn for spawning coins */}
      <group position={[0, BOARD_HEIGHT/2 + 2, 0]}>
        <Barn />
      </group>

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

      {/* Gemini-2.5-Pro: Rendering the new bin dividers. */}
      {binDividers.map(divider => (
        <mesh
          key={divider.id}
          position={[divider.position.x, divider.position.y, 0]}
        >
          <boxGeometry args={[divider.width, divider.height, 1]} />
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