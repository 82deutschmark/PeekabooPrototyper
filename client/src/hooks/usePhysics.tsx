import { useFrame } from '@react-three/fiber';
import { useRef, useCallback } from 'react';
import { Coin, Platform, Vector3 } from '../types/game';

const GRAVITY = -9.81 * 0.3; // 30% of normal gravity
const BOUNCE_DAMPING = 0.6;
const FRICTION = 0.95;
const ROLL_FRICTION = 0.98;

export function usePhysics(coins: Coin[], platforms: Platform[], onCoinUpdate: (coins: Coin[]) => void) {
  const deltaTimeRef = useRef(0);

  const checkCollision = useCallback((coin: Coin, platform: Platform): boolean => {
    const coinRadius = 0.3;
    const platformHalfWidth = platform.width / 2;
    const platformHalfHeight = platform.height / 2;
    const platformHalfDepth = platform.depth / 2;

    // Simple AABB collision detection
    const distanceX = Math.abs(coin.position.x - platform.position.x);
    const distanceY = Math.abs(coin.position.y - platform.position.y);
    const distanceZ = Math.abs(coin.position.z - platform.position.z);

    return (
      distanceX < (platformHalfWidth + coinRadius) &&
      distanceY < (platformHalfHeight + coinRadius) &&
      distanceZ < (platformHalfDepth + coinRadius)
    );
  }, []);

  const updateCoinPhysics = useCallback((coin: Coin, deltaTime: number): Coin => {
    if (!coin.isActive) return coin;

    // Apply gravity
    coin.velocity.y += GRAVITY * deltaTime;

    // Update position
    coin.position.x += coin.velocity.x * deltaTime;
    coin.position.y += coin.velocity.y * deltaTime;
    coin.position.z += coin.velocity.z * deltaTime;

    // Update rotation (rolling effect)
    coin.rotation += coin.rotationSpeed * deltaTime;

    // Check collisions with platforms
    platforms.forEach(platform => {
      if (checkCollision(coin, platform)) {
        // Simple bounce response
        if (coin.velocity.y < 0) {
          coin.velocity.y = -coin.velocity.y * BOUNCE_DAMPING;
          coin.position.y = platform.position.y + platform.height / 2 + 0.3;
          
          // Apply platform slope effect
          const slopeAngle = platform.rotation.z;
          coin.velocity.x += Math.sin(slopeAngle) * 2;
          
          // Update rotation speed based on velocity
          coin.rotationSpeed = coin.velocity.x * 2;
        }
      }
    });

    // Apply friction
    coin.velocity.x *= ROLL_FRICTION;
    coin.velocity.z *= FRICTION;

    // Age the coin
    coin.age += deltaTime;

    // Fade out at bottom
    if (coin.position.y < -10) {
      coin.opacity = Math.max(0, coin.opacity - deltaTime * 2);
      if (coin.opacity <= 0) {
        coin.isActive = false;
      }
    }

    // Remove old coins
    if (coin.age > 60) {
      coin.isActive = false;
    }

    return coin;
  }, [platforms, checkCollision]);

  useFrame((state, delta) => {
    deltaTimeRef.current = delta;
    
    const updatedCoins = coins.map(coin => updateCoinPhysics(coin, delta));
    onCoinUpdate(updatedCoins);
  });

  const nudgeCoin = useCallback((coinId: string, force: Vector3) => {
    const updatedCoins = coins.map(coin => {
      if (coin.id === coinId) {
        return {
          ...coin,
          velocity: {
            x: coin.velocity.x + force.x,
            y: coin.velocity.y + force.y,
            z: coin.velocity.z + force.z
          }
        };
      }
      return coin;
    });
    onCoinUpdate(updatedCoins);
  }, [coins, onCoinUpdate]);

  return { nudgeCoin };
}
