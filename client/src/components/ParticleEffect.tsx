import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ParticleData } from '../types/game';

interface ParticleEffectProps {
  particles: ParticleData[];
  onParticleUpdate: (particles: ParticleData[]) => void;
}

export function ParticleEffect({ particles, onParticleUpdate }: ParticleEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particleGeometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), []);
  const particleMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffd700,
    transparent: true,
    opacity: 0.8
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const updatedParticles = particles.map(particle => {
      // Update particle physics
      particle.position.x += particle.velocity.x * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += particle.velocity.z * delta;

      // Apply gravity
      particle.velocity.y -= 9.81 * 0.1 * delta;

      // Fade out over time
      particle.life -= delta;

      return particle;
    }).filter(particle => particle.life > 0);

    // Update instance positions
    updatedParticles.forEach((particle, index) => {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(particle.position.x, particle.position.y, particle.position.z);
      matrix.scale(new THREE.Vector3(particle.size, particle.size, particle.size));
      meshRef.current!.setMatrixAt(index, matrix);
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = updatedParticles.length;
    }

    onParticleUpdate(updatedParticles);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[particleGeometry, particleMaterial, 100]}
      count={particles.length}
    />
  );
}
