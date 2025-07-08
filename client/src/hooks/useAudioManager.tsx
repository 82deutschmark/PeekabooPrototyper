import { useEffect, useRef } from 'react';

export function useAudioManager() {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    backgroundAudioRef.current = new Audio('/sounds/background.mp3');
    hitAudioRef.current = new Audio('/sounds/hit.mp3');
    successAudioRef.current = new Audio('/sounds/success.mp3');

    // Set up background music
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.1;
    }

    // Set up hit sound
    if (hitAudioRef.current) {
      hitAudioRef.current.volume = 0.2;
    }

    // Set up success sound
    if (successAudioRef.current) {
      successAudioRef.current.volume = 0.3;
    }

    return () => {
      // Cleanup
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    };
  }, []);

  const playBackground = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Background audio play prevented');
      });
    }
  };

  const playHit = () => {
    if (hitAudioRef.current) {
      hitAudioRef.current.currentTime = 0;
      hitAudioRef.current.play().catch(() => {
        console.log('Hit audio play prevented');
      });
    }
  };

  const playSuccess = () => {
    if (successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {
        console.log('Success audio play prevented');
      });
    }
  };

  return { playBackground, playHit, playSuccess };
}
