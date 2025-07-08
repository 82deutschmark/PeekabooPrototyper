import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Barn() {
  const woodTexture = useTexture('/textures/wood.jpg');

  return (
    <group position={[0, 8, 0]}>
      {/* Main barn structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 2, 2]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
      
      {/* Barn roof */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.2, 1.5, 4]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Barn door opening */}
      <mesh position={[0, -0.5, 1.01]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshLambertMaterial color="#000000" />
      </mesh>
      
      {/* Barn sides */}
      <mesh position={[-1.5, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 2, 2]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
      
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 2, 2]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
    </group>
  );
}
