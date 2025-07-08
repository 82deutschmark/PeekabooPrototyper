import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Platform as PlatformType } from '../types/game';

interface PlatformProps {
  platform: PlatformType;
}

export function Platform({ platform }: PlatformProps) {
  const woodTexture = useTexture('/textures/wood.jpg');

  return (
    <mesh
      position={[platform.position.x, platform.position.y, platform.position.z]}
      rotation={[platform.rotation.x, platform.rotation.y, platform.rotation.z]}
    >
      <boxGeometry args={[platform.width, platform.height, platform.depth]} />
      <meshLambertMaterial map={woodTexture} />
    </mesh>
  );
}
