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
    const coinRadius = 0.5;
    const platformHalfWidth = platform.width / 2;
    const platformHalfHeight = platform.height / 2;
    const platformHalfDepth = platform.depth / 2;

    // Check if coin is above the platform (within X and Z bounds)
    const distanceX = Math.abs(coin.position.x - platform.position.x);
    const distanceZ = Math.abs(coin.position.z - platform.position.z);
    
    // Check if coin is within platform bounds horizontally
    const withinPlatformBounds = (
      distanceX < (platformHalfWidth + coinRadius) &&
      distanceZ < (platformHalfDepth + coinRadius)
    );
    
    // Check if coin is at the right height to land on platform
    const platformTop = platform.position.y + platformHalfHeight;
    const coinBottom = coin.position.y - coinRadius;
    const coinAbovePlatform = coin.position.y > platformTop;
    const coinNearPlatform = Math.abs(coinBottom - platformTop) < 0.5;
    
    return withinPlatformBounds && coinNearPlatform && coin.velocity.y <= 0;
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
        console.log('Collision with platform:', platform.id);
        
        // Place coin on top of platform
        const platformTop = platform.position.y + platform.height / 2;
        coin.position.y = platformTop + 0.5;
        
        // Bounce response
        coin.velocity.y = -coin.velocity.y * BOUNCE_DAMPING;
        
        // Apply platform slope effect for rolling
        const slopeAngle = platform.rotation.z;
        coin.velocity.x += Math.sin(slopeAngle) * 3;
        
        // Update rotation speed based on velocity (rolling effect)
        coin.rotationSpeed = coin.velocity.x * 3;
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
