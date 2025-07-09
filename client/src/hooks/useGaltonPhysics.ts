// src/hooks/useGaltonPhysics.ts
import { useState, useEffect } from 'react';
import { Coin as CoinType, Peg, Bin } from '../types/game';

const GRAVITY = 0.0001; // Even slower gravity
const FRICTION = 0.996; // Slightly less friction for smoother movement
const COIN_RADIUS = 0.3;
const PEG_RADIUS = 0.15;

export function useGaltonPhysics(
  pegs: Peg[],
  bins: Bin[],
  setCoins: React.Dispatch<React.SetStateAction<CoinType[]>>,
  setBins: React.Dispatch<React.SetStateAction<Bin[]>>,
  setScore: React.Dispatch<React.SetStateAction<number>>
) {
  const updatePhysics = () => {
    setCoins(prevCoins => {
      if (prevCoins.length === 0) return prevCoins;
      
      const nextCoins = [...prevCoins];
      let scoreIncrement = 0;
      
      for (let i = 0; i < nextCoins.length; i++) {
        const coin = nextCoins[i];
        if (!coin.isActive) continue;
        
        // Apply gravity
        let newVx = coin.velocity.x * FRICTION;
        let newVy = coin.velocity.y - GRAVITY;
        
        // Calculate new position
        let newX = coin.position.x + newVx;
        let newY = coin.position.y + newVy;
        
        // Boundary collision (left/right walls)
        if (Math.abs(newX) > 4.8) {
          newVx *= -0.8; // Bounce with energy loss
          newX = coin.position.x; // Prevent moving through wall
        }
        
        // Peg collisions
        for (const peg of pegs) {
          const dx = newX - peg.position.x;
          const dy = newY - peg.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < COIN_RADIUS + PEG_RADIUS) {
            // Collision response
            const angle = Math.atan2(dy, dx);
            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            
            // Bounce off peg
            const dot = newVx * normalX + newVy * normalY;
            newVx = newVx - 2 * dot * normalX;
            newVy = newVy - 2 * dot * normalY;
            
            // Add randomness to bounce
            newVx += (Math.random() - 0.5) * 0.1;
            
            // Move coin outside collision
            const overlap = COIN_RADIUS + PEG_RADIUS - distance;
            newX += overlap * normalX;
            newY += overlap * normalY;
          }
        }
        
        // Bin collection - check when coin reaches bin level
        if (newY <= -6) {
          for (const bin of bins) {
            if (Math.abs(newX - bin.position.x) < bin.width / 2) {
              // Add to bin
              setBins(prev => prev.map(b => 
                b.id === bin.id ? { ...b, count: b.count + 1 } : b
              ));
              
              // Score points based on bin position
              const binScore = 10 + Math.floor(Math.random() * 20);
              scoreIncrement += binScore;
              
              // Mark coin as inactive
              nextCoins[i] = { ...coin, isActive: false };
              break;
            }
          }
          
          // If no bin caught it, deactivate anyway to prevent endless falling
          if (coin.isActive) {
            nextCoins[i] = { ...coin, isActive: false };
          }
        }
        
        // Update coin state
        if (coin.isActive) {
          nextCoins[i] = {
            ...coin,
            position: { x: newX, y: newY, z: 0 },
            velocity: { x: newVx, y: newVy, z: 0 },
            rotation: coin.rotation + coin.rotationSpeed,
            age: coin.age + 1
          };
        }
      }
      
      // Update score
      if (scoreIncrement > 0) {
        setScore(prev => prev + scoreIncrement);
      }
      
      return nextCoins;
    });
  };

  return { updatePhysics };
}