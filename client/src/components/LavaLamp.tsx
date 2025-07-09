import { Canvas, ThreeEvent } from '@react-three/fiber';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Barn } from './Barn';
import { Platform } from './Platform';
import { Coin } from './Coin';
import { ParticleEffect } from './ParticleEffect';
import { usePhysics } from '../hooks/usePhysics';
import { useAudioManager } from '../hooks/useAudioManager';
import { Coin as CoinType, Platform as PlatformType, ParticleData } from '../types/game';

// Scene component that goes inside Canvas
function Scene() {
  const [coins, setCoins] = useState<CoinType[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [platformRotations, setPlatformRotations] = useState<Record<string, number>>({});

  const { playBackground, playHit, playSuccess } = useAudioManager();
  const coinCountRef = useRef(0); // Track coin count without re-renders
  const platformsRef = useRef<PlatformType[]>([]); // Reference to current platforms
  
  // Beautiful color palette for coins
  const coinColors = [
    '#ff6b6b', // Coral red
    '#4ecdc4', // Turquoise
    '#45b7d1', // Sky blue
    '#f9ca24', // Golden yellow
    '#f0932b', // Orange
    '#eb4d4b', // Red
    '#6c5ce7', // Purple
    '#a29bfe', // Light purple
    '#fd79a8', // Pink
    '#00b894', // Green
    '#00cec9', // Cyan
    '#fdcb6e', // Light orange
    '#e17055', // Salmon
    '#81ecec', // Light cyan
    '#fab1a0', // Peach
    '#ff7675', // Light red
    '#74b9ff', // Light blue
    '#55a3ff', // Medium blue
    '#fd79a8', // Rose
    '#fdcb6e'  // Amber
  ];

  // Create platforms in a zigzag pattern with dynamic rotations and side barriers
  const platforms = useMemo<PlatformType[]>(() => {
    const plats = [
      // Main zigzag platforms
      { id: '1', position: { x: -2, y: 6, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['1'] ?? -0.2 }, width: 3, height: 0.2, depth: 1 },
      { id: '2', position: { x: 2, y: 4, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['2'] ?? 0.2 }, width: 3, height: 0.2, depth: 1 },
      { id: '3', position: { x: -2, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['3'] ?? -0.2 }, width: 3, height: 0.2, depth: 1 },
      { id: '4', position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['4'] ?? 0.2 }, width: 3, height: 0.2, depth: 1 },
      { id: '5', position: { x: -2, y: -2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['5'] ?? -0.2 }, width: 3, height: 0.2, depth: 1 },
      { id: '6', position: { x: 2, y: -4, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['6'] ?? 0.2 }, width: 3, height: 0.2, depth: 1 },
      // Side barriers
      { id: 'left-wall', position: { x: -5, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['left-wall'] ?? 0 }, width: 0.5, height: 12, depth: 1 },
      { id: 'right-wall', position: { x: 5, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['right-wall'] ?? 0 }, width: 0.5, height: 12, depth: 1 },
    ];
    platformsRef.current = plats;
    return plats;
  }, [platformRotations]);

  // Physics hook with optimized coin handling
  const { nudgeCoin } = usePhysics(coins, platformsRef.current, setCoins);

  // Coin spawning system
  useEffect(() => {
    const spawnCoin = () => {
      setCoins(prev => {
        if (coinCountRef.current >= 30) return prev;

        const newCoin: CoinType = {
          id: `coin-${Date.now()}`,
          position: { x: (Math.random() - 0.5) * 3, y: 9, z: 0 },
          velocity: { x: (Math.random() - 0.5) * 0.5, y: 0, z: 0 },
          rotation: 0,
          rotationSpeed: 0.05 + Math.random() * 0.05,
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
    };

    spawnCoin(); // Initial coin
    const interval = setInterval(spawnCoin, 3000);
    return () => clearInterval(interval);
  }, [playSuccess]);

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

  // Handle interactions
  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    // Check if this is the first interaction
    if (isFirstInteraction) {
      playBackground(); // Start playing background music
      setIsFirstInteraction(false); // Mark that the first interaction has occurred
    }

    const intersection = event.intersections[0];
    if (!intersection) return;

    // Check platform clicks
    for (const platform of platformsRef.current) {
      const dx = Math.abs(platform.position.x - intersection.point.x);
      const dy = Math.abs(platform.position.y - intersection.point.y);

      if (dx < platform.width / 2 + 0.3 && dy < platform.height / 2 + 0.3) {
        const currentRotation = platformRotations[platform.id] ?? 
          (platform.id.includes('wall') ? 0 : platform.position.x < 0 ? -0.2 : 0.2);

        const newRotation = currentRotation > 0 ? 
          Math.max(-0.8, currentRotation - 0.3) : 
          Math.min(0.8, currentRotation + 0.3);

        setPlatformRotations(prev => ({ ...prev, [platform.id]: newRotation }));
        playHit();
        return;
      }
    }

    // Check coin clicks
    const clickedCoin = coins.find(coin => 
      coin.isActive &&
      Math.abs(coin.position.x - intersection.point.x) < 0.5 &&
      Math.abs(coin.position.y - intersection.point.y) < 0.5
    );

    if (clickedCoin) {
      nudgeCoin(clickedCoin.id, { 
        x: (Math.random() - 0.5) * 3, 
        y: 1.5 + Math.random() * 1, 
        z: 0 
      });

      // Generate particles
      setParticles(prev => [
        ...prev,
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `particle-${Date.now()}-${i}`,
          position: { 
            x: clickedCoin.position.x + (Math.random() - 0.5) * 0.3,
            y: clickedCoin.position.y + (Math.random() - 0.5) * 0.3,
            z: clickedCoin.position.z
          },
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: Math.random() * 3,
            z: (Math.random() - 0.5) * 0.2
          },
          life: 1,
          maxLife: 0.8 + Math.random() * 0.4,
          size: 0.08 + Math.random() * 0.04,
          color: clickedCoin.color
        }))
      ]);

      playHit();
    }
  }, [coins, nudgeCoin, playHit, playBackground, isFirstInteraction, platformRotations]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 10, 2]} intensity={0.5} />

      <Barn />

      {platforms.map(platform => (
        <Platform key={platform.id} platform={platform} />
      ))}

      {coins.map(coin => (
        <Coin key={coin.id} coin={coin} />
      ))}

      <ParticleEffect particles={particles} onParticleUpdate={setParticles} />

      {/* Interaction plane */}
      <mesh
        position={[0, 0, -1]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export function LavaLamp() {
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
        <Scene />
      </Canvas>
    </div>
  );
}