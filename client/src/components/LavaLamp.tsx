import { Canvas } from '@react-three/fiber';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  const [nextSpawnDelay, setNextSpawnDelay] = useState(8000);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [platformRotations, setPlatformRotations] = useState<{ [key: string]: number }>({});
  
  const { playBackground, playHit, playSuccess } = useAudioManager();

  // Create platforms in a zigzag pattern with dynamic rotations
  const platforms = useMemo<PlatformType[]>(() => [
    { id: '1', position: { x: -2, y: 6, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['1'] || -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '2', position: { x: 2, y: 4, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['2'] || 0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '3', position: { x: -2, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['3'] || -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '4', position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['4'] || 0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '5', position: { x: -2, y: -2, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['5'] || -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '6', position: { x: 2, y: -4, z: 0 }, rotation: { x: 0, y: 0, z: platformRotations['6'] || 0.2 }, width: 3, height: 0.2, depth: 1 },
  ], [platformRotations]);

  // Import usePhysics hook here inside Scene component
  const { nudgeCoin } = usePhysics(coins, platforms, setCoins);

  // Continuous spawning system - spawn every 5 seconds
  useEffect(() => {
    const spawnCoin = () => {
      const now = Date.now();
      const newCoin: CoinType = {
        id: `coin-${now}`,
        position: { x: 0, y: 9, z: 0 },
        velocity: { x: (Math.random() - 0.5) * 0.5, y: 0, z: 0 },
        rotation: 0,
        rotationSpeed: 0,
        scale: 1,
        opacity: 1,
        isActive: true,
        age: 0,
      };
      
      console.log('Spawning coin:', newCoin.id);
      setCoins(prev => [...prev, newCoin]);
      playSuccess();
    };

    // Spawn first coin immediately
    spawnCoin();
    
    // Then spawn every 5 seconds
    const interval = setInterval(spawnCoin, 5000);
    
    return () => clearInterval(interval);
  }, [playSuccess]);

  // Handle touch/click interactions
  const handlePointerDown = useCallback((event: THREE.Event) => {
    if (isFirstInteraction) {
      playBackground();
      setIsFirstInteraction(false);
    }

    const intersectedObject = event.intersections[0];
    if (intersectedObject) {
      // Check if a platform was clicked
      const clickedPlatform = platforms.find(platform => {
        const distanceX = Math.abs(platform.position.x - intersectedObject.point.x);
        const distanceY = Math.abs(platform.position.y - intersectedObject.point.y);
        return distanceX < platform.width / 2 && distanceY < platform.height / 2 + 0.5;
      });

      if (clickedPlatform) {
        // Tilt the platform
        const currentRotation = platformRotations[clickedPlatform.id] || (clickedPlatform.position.x < 0 ? -0.2 : 0.2);
        const newRotation = currentRotation > 0 ? currentRotation - 0.3 : currentRotation + 0.3;
        
        setPlatformRotations(prev => ({
          ...prev,
          [clickedPlatform.id]: Math.max(-0.8, Math.min(0.8, newRotation))
        }));
        
        console.log('Platform tilted:', clickedPlatform.id, 'New rotation:', newRotation);
        playHit();
        return;
      }

      // Find the coin that was clicked
      const clickedCoin = coins.find(coin => 
        coin.isActive && 
        Math.abs(coin.position.x - intersectedObject.point.x) < 0.5 &&
        Math.abs(coin.position.y - intersectedObject.point.y) < 0.5
      );

      if (clickedCoin) {
        // Nudge the coin
        nudgeCoin(clickedCoin.id, { x: (Math.random() - 0.5) * 2, y: 1, z: 0 });
        
        // Create sparkle particles
        const newParticles: ParticleData[] = [];
        for (let i = 0; i < 5; i++) {
          newParticles.push({
            id: `particle-${Date.now()}-${i}`,
            position: { 
              x: clickedCoin.position.x + (Math.random() - 0.5) * 0.5,
              y: clickedCoin.position.y + (Math.random() - 0.5) * 0.5,
              z: clickedCoin.position.z + (Math.random() - 0.5) * 0.5
            },
            velocity: {
              x: (Math.random() - 0.5) * 2,
              y: Math.random() * 3,
              z: (Math.random() - 0.5) * 2
            },
            life: 1,
            maxLife: 1,
            size: 0.1,
            color: '#ffd700'
          });
        }
        
        setParticles(prev => [...prev, ...newParticles]);
        playHit();
      }
    }
  }, [coins, platforms, platformRotations, nudgeCoin, playHit, playBackground, isFirstInteraction]);

  // Clean up inactive coins less frequently to avoid interfering with spawning
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCoins(prev => prev.filter(coin => coin.isActive));
    }, 10000); // Clean up every 10 seconds instead of 5

    return () => clearInterval(cleanup);
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Scene objects */}
      <Barn />
      
      {platforms.map(platform => (
        <Platform key={platform.id} platform={platform} />
      ))}
      
      {coins.map(coin => (
        <Coin key={coin.id} coin={coin} />
      ))}
      
      <ParticleEffect particles={particles} onParticleUpdate={setParticles} />
      
      {/* Invisible mesh for touch detection */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <boxGeometry args={[20, 20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

export function LavaLamp() {
  return (
    <div style={{ width: '100vw', height: '100vh', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
