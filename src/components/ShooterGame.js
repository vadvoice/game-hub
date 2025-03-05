'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { PointerLockControls, Sky, Stars, KeyboardControls } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import GameWorld from './shooter/GameWorld';
import Player from './shooter/Player';
import Enemies from './shooter/Enemies';
import Weapons from './shooter/Weapons';
import HUD from './shooter/HUD';
import useGameStore from '@/utils/gameStore';
import PauseMenu from './shooter/PauseMenu';

// Define keyboard controls map
const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
];

export default function ShooterGame() {
  const [isClient, setIsClient] = useState(false);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const controlsRef = useRef();
  const canvasRef = useRef();
  const [isLocked, setIsLocked] = useState(false);
  
  // Handle pointer lock
  const lockPointer = () => {
    if (controlsRef.current) {
      console.log("Attempting to lock pointer");
      controlsRef.current.lock();
    }
  };
  
  // Handle escape key for pausing
  useEffect(() => {
    setIsClient(true);
    
    const handleKeyDown = (e) => {
      console.log("Key pressed:", e.key, e.code);
      if (e.key === 'Escape' || e.code === 'Escape') {
        console.log("Escape key pressed, toggling pause");
        togglePause();
        
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Add event listener with capture to ensure it gets the event first
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    console.log("Escape key event listener added");
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      console.log("Escape key event listener removed");
    };
  }, [togglePause]);
  
  // Handle pointer lock changes
  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(document.pointerLockElement === document.body);
      console.log("Pointer lock state changed:", document.pointerLockElement === document.body);
      
      // If we lost pointer lock and game is not paused, pause the game
      if (!document.pointerLockElement && !isPaused) {
        togglePause();
      }
    };
    
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [isPaused, togglePause]);
  
  // Auto-lock pointer when game starts or unpauses
  useEffect(() => {
    if (isClient && !isPaused && controlsRef.current && !isLocked) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        lockPointer();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isClient, isPaused, isLocked]);

  // Fix camera rotation to ensure horizon is level
  useEffect(() => {
    if (controlsRef.current) {
      // Reset any camera roll to ensure horizon is flat
      controlsRef.current.camera.rotation.z = 0;
      
      // Lock the z-rotation to prevent tilting
      const originalUpdate = controlsRef.current.update;
      controlsRef.current.update = function() {
        originalUpdate.call(this);
        this.camera.rotation.z = 0; // Keep horizon level
      };
      
      console.log("Camera roll locked to keep horizon level");
    }
  }, [controlsRef.current]);

  if (!isClient) return null;

  return (
    <>
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{ display: isPaused && !isLocked ? 'flex' : 'none' }}
        onClick={lockPointer}
      >
        <div className="bg-black bg-opacity-50 p-4 rounded text-white text-center pointer-events-auto cursor-pointer">
          Click to play
        </div>
      </div>
      
      <KeyboardControls map={keyboardMap}>
        <Canvas 
          ref={canvasRef}
          shadows 
          camera={{ fov: 75, near: 0.1, far: 1000 }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={200} depth={50} count={5000} factor={4} />
            <ambientLight intensity={0.3} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize-width={2048} 
              shadow-mapSize-height={2048}
            />
            
            <Physics gravity={[0, -9.81, 0]}>
              <GameWorld />
              <Player />
              <Enemies />
              <Weapons />
            </Physics>
            
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.9} luminanceSmoothing={0.9} />
              <Noise opacity={0.02} />
            </EffectComposer>
            
            <PointerLockControls ref={controlsRef} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      {!isPaused && <HUD />}
      {isPaused && <PauseMenu onResume={lockPointer} />}
    </>
  );
} 