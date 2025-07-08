import { useRef } from 'react';
import * as THREE from 'three';
import { Coin as CoinType } from '../types/game';

interface CoinProps {
  coin: CoinType;
}

export function Coin({ coin }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  if (!coin.isActive) return null;

  return (
    <mesh
      ref={meshRef}
      position={[coin.position.x, coin.position.y, coin.position.z]}
      rotation={[0, coin.rotation, 0]}
      scale={[coin.scale, coin.scale, coin.scale]}
    >
      <cylinderGeometry args={[0.5, 0.5, 0.3, 32]} />
      <meshLambertMaterial 
        color="#ffd700" 
        transparent={true}
        opacity={coin.opacity}
      />
    </mesh>
  );
}
