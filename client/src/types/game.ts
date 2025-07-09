export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Coin {
  id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  isActive: boolean;
  age: number;
  color: string;
}

export interface Platform {
  id: string;
  position: Vector3;
  rotation: Vector3;
  width: number;
  height: number;
  depth: number;
}

export interface ParticleData {
  id: string;
  position: Vector3;
  velocity: Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Peg {
  id: string;
  position: Vector3;
  radius: number;
}

export interface Bin {
  id: string;
  position: Vector3;
  width: number;
  height: number;
  depth: number;
  count: number;
}
