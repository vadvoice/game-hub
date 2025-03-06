'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Sky, Stars, KeyboardControls } from '@react-three/drei';
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
  const mouseSensitivity = useGameStore((state) => state.mouseSensitivity);
  const updateMouseSensitivity = useGameStore((state) => state.updateMouseSensitivity);
  const canvasRef = useRef();
  const cameraRef = useRef();
  const [isLocked, setIsLocked] = useState(false);
  
  // Handle pointer lock
  const lockPointer = () => {
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
      console.log("Attempting to lock pointer");
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
    if (isClient && !isPaused && !isLocked) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        lockPointer();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isClient, isPaused, isLocked]);

  // Handle mouse movement for camera rotation
  useEffect(() => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    
    // Initialize camera rotation
    camera.rotation.order = 'YXZ'; // This order is important for FPS controls
    
    const handleMouseMove = (e) => {
      if (isPaused || !isLocked) return;
      
      // Calculate rotation based on mouse movement
      const sensitivity = mouseSensitivity * 0.002;
      
      // Horizontal movement (left/right) changes Y rotation (yaw)
      camera.rotation.y -= e.movementX * sensitivity;
      
      // Vertical movement (up/down) changes X rotation (pitch)
      const newRotationX = camera.rotation.x - e.movementY * sensitivity;
      
      // Limit vertical rotation to prevent flipping
      const safetyMargin = 0.1;
      camera.rotation.x = Math.max(
        -Math.PI / 2 + safetyMargin, 
        Math.min(Math.PI / 2 - safetyMargin, newRotationX)
      );
      
      // Always ensure z-rotation is 0 to keep horizon level
      camera.rotation.z = 0;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPaused, isLocked, mouseSensitivity, cameraRef.current]);

  // Handle mouse wheel for sensitivity adjustment
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) { // Only adjust sensitivity with Ctrl/Cmd key pressed
        e.preventDefault();
        
        // Adjust sensitivity up or down
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newSensitivity = Math.max(0.1, Math.min(2.0, mouseSensitivity + delta));
        
        updateMouseSensitivity(newSensitivity);
        console.log("Mouse sensitivity adjusted to:", newSensitivity);
      }
    };
    
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [mouseSensitivity, updateMouseSensitivity]);

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
          camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.5, 0] }}
          className="w-full h-full"
          onCreated={({ camera }) => {
            cameraRef.current = camera;
            camera.rotation.order = 'YXZ'; // Important for FPS controls
          }}
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
              <Player cameraRef={cameraRef} />
              <Enemies />
              <Weapons />
            </Physics>
            
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.9} luminanceSmoothing={0.9} />
              <Noise opacity={0.02} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      {!isPaused && <HUD />}
      {isPaused && <PauseMenu onResume={lockPointer} />}
    </>
  );
} 