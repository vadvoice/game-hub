'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import useGameStore from '@/utils/gameStore';
import assetLoader from '@/utils/assetLoader';

// Generate random obstacles function (moved outside component)
function generateObstacles() {
  const obstacleCount = 15;
  const obstacles = [];
  
  for (let i = 0; i < obstacleCount; i++) {
    // Random position within the map bounds
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    
    // Avoid placing obstacles at the center (player spawn)
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    
    // Random size
    const width = 2 + Math.random() * 6;
    const height = 1 + Math.random() * 3;
    const depth = 2 + Math.random() * 6;
    
    // Random color
    const colors = ['#964B00', '#8B4513', '#A0522D', '#CD853F', '#D2691E'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    obstacles.push({
      id: i,
      position: [x, height / 2, z],
      size: [width, height, depth],
      color,
      rotation: Math.random() * Math.PI * 2,
    });
  }
  
  return obstacles;
}

// Simple map layout with floor, walls, and some obstacles
export default function GameWorld() {
  // Create a reference to the floor for potential animations
  const floorRef = useRef();
  
  // Initialize obstacles state
  const [obstacles] = useState(generateObstacles);
  
  // Define colors for materials
  const floorColor = '#555555';
  const wallColor = '#777777';
  
  // Get textures from asset loader
  const floorTexture = assetLoader.getTexture('/textures/floor.jpg');
  const wallTexture = assetLoader.getTexture('/textures/wall.jpg');
  
  // Optional: Animate or update the world
  useFrame((state, delta) => {
    // Remove subtle floor animation to keep horizon level
    // This animation was causing the tilted horizon effect
  });

  return (
    <>
      {/* Floor - using a single larger floor to prevent gaps */}
      <RigidBody type="fixed" colliders={false}>
        {/* Increased collision size to cover the entire floor */}
        <CuboidCollider args={[55, 0.1, 55]} position={[0, -0.1, 0]} />
        
        {/* Main floor with precise alignment */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[110, 110]} /> {/* Increased size to prevent gaps */}
          <meshBasicMaterial 
            color={floorColor}
            map={floorTexture}
          />
        </mesh>
        
        {/* Add a grid to help with orientation */}
        <gridHelper args={[100, 100, "#666666", "#444444"]} position={[0, 0.01, 0]} />
      </RigidBody>

      {/* Corner pieces to fill gaps */}
      <RigidBody type="fixed" position={[50, 0, 50]}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshBasicMaterial 
            color={floorColor}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" position={[-50, 0, 50]}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshBasicMaterial 
            color={floorColor}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" position={[50, 0, -50]}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshBasicMaterial 
            color={floorColor}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" position={[-50, 0, -50]}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshBasicMaterial 
            color={floorColor}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>

      {/* Outer Walls */}
      <RigidBody type="fixed" position={[0, 2, -50]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[100, 4, 1]} />
          <meshBasicMaterial 
            color={wallColor}
            map={wallTexture}
          />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[0, 2, 50]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[100, 4, 1]} />
          <meshBasicMaterial 
            color={wallColor}
            map={wallTexture}
          />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[-50, 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 4, 100]} />
          <meshBasicMaterial 
            color={wallColor}
            map={wallTexture}
          />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[50, 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 4, 100]} />
          <meshBasicMaterial 
            color={wallColor}
            map={wallTexture}
          />
        </mesh>
      </RigidBody>

      {/* Random Obstacles */}
      {obstacles.map((obstacle) => (
        <RigidBody key={obstacle.id} type="fixed" position={obstacle.position}>
          <mesh 
            castShadow 
            receiveShadow 
            rotation={[0, obstacle.rotation, 0]}
          >
            <boxGeometry args={obstacle.size} />
            <meshBasicMaterial color={obstacle.color} />
          </mesh>
        </RigidBody>
      ))}

      {/* Central structure - player spawn area */}
      <RigidBody type="fixed" position={[0, 0.5, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[5, 5, 1, 32]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
      </RigidBody>
      
      {/* Add some decorative elements */}
      <DecorativeElements />
    </>
  );
}

// Decorative elements like lights, particles, etc.
function DecorativeElements() {
  const lightPositions = [
    [20, 5, 20],
    [-20, 5, 20],
    [20, 5, -20],
    [-20, 5, -20],
    [0, 5, 0],
  ];
  
  return (
    <>
      {/* Ambient lights around the map */}
      {lightPositions.map((position, index) => (
        <group key={index} position={position}>
          <pointLight 
            intensity={1} 
            distance={30} 
            color={index % 2 === 0 ? '#ff6600' : '#0066ff'} 
            castShadow
          />
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={index % 2 === 0 ? '#ff6600' : '#0066ff'} />
          </mesh>
        </group>
      ))}
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#111', 30, 100]} />
    </>
  );
} 