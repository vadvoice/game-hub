'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Physics } from '@react-three/rapier';
import { Sky, Stars, KeyboardControls, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import GameWorld from './shooter/GameWorld';
import Player from './shooter/Player';
import Enemies from './shooter/Enemies';
import Weapons from './shooter/Weapons';
import HUD from './shooter/HUD';
import useGameStore from '@/utils/gameStore';
import PauseMenu from './shooter/PauseMenu';
import assetLoader from '@/utils/assetLoader';

// Define keyboard controls map
const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
];

// Loading manager component
function LoadingManager({ onLoaded }) {
  const { progress, errors } = useProgress();
  
  useEffect(() => {
    if (progress === 100) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        onLoaded();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [progress, onLoaded]);
  
  return null;
}

export default function ShooterGame() {
  const [isClient, setIsClient] = useState(false);
  const isPaused = useGameStore((state) => state.isPaused);
  const togglePause = useGameStore((state) => state.togglePause);
  const mouseSensitivity = useGameStore((state) => state.mouseSensitivity);
  const updateMouseSensitivity = useGameStore((state) => state.updateMouseSensitivity);
  const canvasRef = useRef();
  const cameraRef = useRef();
  const [isLocked, setIsLocked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Handle pointer lock
  const lockPointer = () => {
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
      console.log("Attempting to lock pointer");
    }
  };
  
  // Start game with user interaction
  const startGame = () => {
    if (isLoading) return; // Prevent starting if still loading
    
    setGameStarted(true);
    if (isPaused) {
      togglePause();
    }
    // Request pointer lock after user interaction
    setTimeout(lockPointer, 100);
  };
  
  // Handle loading complete
  const handleLoadingComplete = useCallback(() => {
    console.log("All resources loaded");
    setIsLoading(false);
    setLoadingProgress(100);
  }, []);
  
  // Preload assets when component mounts
  useEffect(() => {
    if (isClient) {
      console.log("Starting asset preloading");
      
      // Start preloading assets
      assetLoader.preloadAssets((progress) => {
        console.log(`Asset loading progress: ${progress.toFixed(1)}%`);
        setLoadingProgress(progress);
      })
      .then(() => {
        console.log("Asset preloading complete");
        handleLoadingComplete();
      })
      .catch((error) => {
        console.error("Error preloading assets:", error);
        // Still mark as complete to allow game to start
        handleLoadingComplete();
      });
    }
  }, [isClient, handleLoadingComplete]);
  
  // Handle escape key for pausing
  useEffect(() => {
    setIsClient(true);
    
    const handleKeyDown = (e) => {
      // Only process Escape key if the game has started
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (gameStarted) {
          console.log("Escape key pressed, toggling pause");
          togglePause();
          
          // Prevent default behavior
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    // Add event listener with capture to ensure it gets the event first
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    console.log("Escape key event listener added");
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      console.log("Escape key event listener removed");
    };
  }, [togglePause, gameStarted]);
  
  // Handle pointer lock changes
  useEffect(() => {
    const handleLockChange = () => {
      const isCurrentlyLocked = document.pointerLockElement === document.body;
      setIsLocked(isCurrentlyLocked);
      console.log("Pointer lock state changed:", isCurrentlyLocked);
      
      // If we lost pointer lock and game is not paused, pause the game
      if (!isCurrentlyLocked && !isPaused && gameStarted) {
        console.log("Lost pointer lock, pausing game");
        togglePause();
      }
    };
    
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [isPaused, togglePause, gameStarted]);
  
  // Auto-lock pointer when game starts or unpauses
  useEffect(() => {
    if (!isClient || !gameStarted) return;
    
    if (!isPaused && !isLocked) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        console.log("Attempting to lock pointer after unpause");
        lockPointer();
      }, 200); // Increased delay for better reliability
      
      return () => clearTimeout(timer);
    }
  }, [isClient, isPaused, isLocked, gameStarted]);

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
      {/* Start Screen with Loading - only shown before game starts */}
      {!gameStarted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">FPS SHOOTER</h1>
            
            {/* Loading progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            <p className="text-gray-300 mb-8">
              {isLoading 
                ? `Loading game resources... ${Math.round(loadingProgress)}%` 
                : "Click the button below to start the game. The game requires mouse control for aiming."}
            </p>
            
            <button
              onClick={startGame}
              disabled={isLoading}
              className={`${
                isLoading 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              } text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors`}
            >
              {isLoading ? "LOADING..." : "START GAME"}
            </button>
            
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="font-bold mb-2">Controls:</h3>
              <ul className="text-left">
                <li>WASD - Move</li>
                <li>Mouse - Look around</li>
                <li>Left Click - Shoot</li>
                <li>E - Pick up weapons</li>
                <li>1,2,3 - Switch weapons</li>
                <li>ESC - Pause/Resume</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Pause Screen - only shown when game is paused after starting */}
      <div 
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{ display: isPaused && !isLocked && gameStarted ? 'flex' : 'none' }}
        onClick={lockPointer}
      >
        <div className="bg-black bg-opacity-50 p-4 rounded text-white text-center pointer-events-auto cursor-pointer">
          Click to resume
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
          <LoadingManager onLoaded={handleLoadingComplete} />
          
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
              <Player cameraRef={cameraRef} gameStarted={gameStarted} />
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
      
      {!isPaused && gameStarted && <HUD />}
      {isPaused && gameStarted && <PauseMenu onResume={lockPointer} />}
    </>
  );
} 