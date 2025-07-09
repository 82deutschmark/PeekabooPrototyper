// src/hooks/useGaltonPhysics.ts
import { useState, useEffect } from 'react';
// Gemini-2.5-Pro: I'm adding ParticleData to create effects when a coin is binned.
import { Coin as CoinType, Peg, Bin, ParticleData } from '../types/game';

// Gemini-2.5-Pro: I've reduced gravity significantly for a calmer, slower fall.
const GRAVITY = 0.00008; 
const FRICTION = 0.997; 
const COIN_RADIUS = 0.3;
const PEG_RADIUS = 0.15;
// Gemini-2.5-Pro: I've added a type for the bin dividers we'll create.
type Divider = {
  position: { x: number; y: number };
  width: number;
  height: number;
};

export function useGaltonPhysics(
  pegs: Peg[],
  bins: Bin[],
  // Gemini-2.5-Pro: We now accept dividers for collision detection.
  dividers: Divider[],
  setCoins: React.Dispatch<React.SetStateAction<CoinType[]>>,
  setBins: React.Dispatch<React.SetStateAction<Bin[]>>,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  // Gemini-2.5-Pro: We need these to create particles and play sounds on success.
  setParticles: React.Dispatch<React.SetStateAction<ParticleData[]>>,
  playSuccess: () => void
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
          newVx *= -0.8;
          newX = coin.position.x; 
        }
        
        // Gemini-2.5-Pro: New collision logic for the bin dividers.
        // This keeps coins from passing through the bin walls.
        for (const divider of dividers) {
          const dx = newX - divider.position.x;
          // Check if the coin is within the horizontal and vertical bounds of the divider.
          if (Math.abs(dx) < (COIN_RADIUS + divider.width / 2) && newY < divider.position.y + divider.height / 2) {
            newVx *= -0.6; // Bounce off the divider
            newX = coin.position.x + newVx; // Apply bounce immediately
          }
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

              // Gemini-2.5-Pro: Play a success sound!
              playSuccess();

              // Gemini-2.5-Pro: Create a burst of particles on collection.
              setParticles(prev => [
                ...prev,
                ...Array.from({ length: 12 }, (_, i) => ({
                  id: `particle-${Date.now()}-${i}`,
                  position: { 
                    x: newX,
                    y: newY,
                    z: 0
                  },
                  velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: Math.random() * 2,
                    z: 0
                  },
                  life: 1,
                  maxLife: 0.6 + Math.random() * 0.4,
                  size: 0.07 + Math.random() * 0.03,
                  color: coin.color
                }))
              ]);
              
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