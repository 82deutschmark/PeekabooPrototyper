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
  
  const { playBackground, playHit, playSuccess } = useAudioManager();

  // Create platforms in a zigzag pattern
  const platforms = useMemo<PlatformType[]>(() => [
    { id: '1', position: { x: -2, y: 6, z: 0 }, rotation: { x: 0, y: 0, z: -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '2', position: { x: 2, y: 4, z: 0 }, rotation: { x: 0, y: 0, z: 0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '3', position: { x: -2, y: 2, z: 0 }, rotation: { x: 0, y: 0, z: -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '4', position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '5', position: { x: -2, y: -2, z: 0 }, rotation: { x: 0, y: 0, z: -0.2 }, width: 3, height: 0.2, depth: 1 },
    { id: '6', position: { x: 2, y: -4, z: 0 }, rotation: { x: 0, y: 0, z: 0.2 }, width: 3, height: 0.2, depth: 1 },
  ], []);

  // Import usePhysics hook here inside Scene component
  const { nudgeCoin } = usePhysics(coins, platforms, setCoins);

  // Spawn the first coin immediately on start
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
      
      setCoins(prev => [...prev, newCoin]);
      setLastSpawnTime(now);
      console.log('Coin spawned:', newCoin.id);
      playSuccess();
    };

    // Spawn first coin after 2 seconds
    const firstSpawn = setTimeout(spawnCoin, 2000);
    
    return () => clearTimeout(firstSpawn);
  }, [playSuccess]);

  // Spawn coins periodically after the first one
  useEffect(() => {
    if (lastSpawnTime === 0) return; // Wait for first spawn
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSpawnTime > nextSpawnDelay) {
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
        
        setCoins(prev => [...prev, newCoin]);
        setLastSpawnTime(now);
        setNextSpawnDelay(8000 + Math.random() * 4000); // 8-12 seconds
        console.log('Coin spawned:', newCoin.id);
        playSuccess();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSpawnTime, nextSpawnDelay, playSuccess]);

  // Handle touch/click interactions
  const handlePointerDown = useCallback((event: THREE.Event) => {
    if (isFirstInteraction) {
      playBackground();
      setIsFirstInteraction(false);
    }

    const intersectedObject = event.intersections[0];
    if (intersectedObject) {
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
  }, [coins, nudgeCoin, playHit, playBackground, isFirstInteraction]);

  // Clean up inactive coins
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCoins(prev => prev.filter(coin => coin.isActive));
    }, 5000);

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
      
      {coins.map(coin => {
        console.log('Rendering coin:', coin.id, 'Active:', coin.isActive, 'Position:', coin.position);
        return <Coin key={coin.id} coin={coin} />;
      })}
      
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
